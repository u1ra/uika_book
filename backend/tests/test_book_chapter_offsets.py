from contextlib import contextmanager
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core import database
from app.core.config import settings
from app.main import create_application


CHAPTER_TITLES = ("第1章 标题", "第2章 标题", "第3章 标题")
CHAPTER_LINES = (
    ("第1章 标题", "第一章正文", "第一章第二行"),
    ("第2章 标题", "第二章正文"),
    ("第3章 标题", "第三章正文"),
)
DEFAULT_RULE_CHAPTER_LINES = (
    ("第1章 标题", "开篇正文", "正文第二行"),
    ("第2章 标题", "中篇正文"),
    ("第3章 标题", "末篇正文"),
)


@contextmanager
def authenticated_client(monkeypatch, tmp_path):
    db_path = tmp_path / "reader.db"
    data_dir = tmp_path / "data"
    upload_dir = tmp_path / "uploads"

    monkeypatch.setattr(settings, "data_dir", data_dir)
    monkeypatch.setattr(settings, "upload_dir", upload_dir)
    monkeypatch.setattr(settings, "database_url", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setattr(settings, "default_admin_username", "admin")
    monkeypatch.setattr(settings, "default_admin_password", "admin123")
    monkeypatch.setattr(settings, "secret_key", "test-secret-key")
    monkeypatch.setattr(database, "engine", database.build_engine(settings.database_url))

    with TestClient(create_application()) as client:
        login_response = client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        access_token = login_response.json()["access_token"]
        client.headers.update({"Authorization": f"Bearer {access_token}"})
        yield client


def build_book_text(newline: str, chapter_lines=CHAPTER_LINES) -> str:
    return newline.join(line for chapter in chapter_lines for line in chapter) + newline


def create_exact_chapter_rule(client: TestClient) -> int:
    response = client.post(
        "/api/chapter-rules",
        json={
            "rule_name": "精确章节边界测试规则",
            # \r? makes this rule usable against both the old raw-CRLF upload
            # representation and the new canonical LF representation.
            "regex_pattern": r"^第\d+章 标题\r?$",
            "flags": "MULTILINE",
            "is_default": False,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def upload_book(client: TestClient, source_text: str, encoding: str) -> dict:
    rule_id = create_exact_chapter_rule(client)
    response = client.post(
        "/api/books/upload",
        data={"chapter_rule_id": str(rule_id)},
        files={"file": ("newline-regression.txt", source_text.encode(encoding), "text/plain")},
    )
    assert response.status_code == 201
    return response.json()


def get_chapter_snapshot(client: TestClient, book_id: int) -> list[dict[str, object]]:
    toc_response = client.get(f"/api/books/{book_id}/chapters")
    assert toc_response.status_code == 200

    snapshot: list[dict[str, object]] = []
    for chapter in toc_response.json():
        content_response = client.get(f"/api/books/{book_id}/chapters/{chapter['chapter_index']}")
        assert content_response.status_code == 200
        snapshot.append(
            {
                "title": chapter["chapter_title"],
                "start_offset": chapter["start_offset"],
                "end_offset": chapter["end_offset"],
                "content": content_response.json()["content"],
            }
        )
    return snapshot


def expected_chapter_snapshot(canonical_text: str) -> list[dict[str, object]]:
    starts = [canonical_text.index(title) for title in CHAPTER_TITLES]
    ends = [*starts[1:], len(canonical_text)]
    return [
        {
            "title": title,
            "start_offset": start,
            "end_offset": end,
            "content": canonical_text[start:end],
        }
        for title, start, end in zip(CHAPTER_TITLES, starts, ends, strict=True)
    ]


def assert_uploaded_chapters_match_canonical_text(client: TestClient, book: dict, canonical_text: str) -> None:
    assert book["total_chapters"] == len(CHAPTER_TITLES)
    assert get_chapter_snapshot(client, book["id"]) == expected_chapter_snapshot(canonical_text)

    stored_bytes = Path(book["file_path"]).read_bytes()
    assert b"\r" not in stored_bytes
    assert stored_bytes.decode("utf-8") == canonical_text


def test_lf_upload_has_exact_chapter_boundaries(monkeypatch, tmp_path):
    source_text = build_book_text("\n")

    with authenticated_client(monkeypatch, tmp_path) as client:
        book = upload_book(client, source_text, "utf-8")
        assert_uploaded_chapters_match_canonical_text(client, book, source_text)


def test_crlf_upload_is_correct_before_any_reparse(monkeypatch, tmp_path):
    source_text = build_book_text("\r\n")
    canonical_text = build_book_text("\n")

    with authenticated_client(monkeypatch, tmp_path) as client:
        book = upload_book(client, source_text, "utf-8")
        assert_uploaded_chapters_match_canonical_text(client, book, canonical_text)


def test_default_rule_crlf_upload_is_correct_before_any_reparse(monkeypatch, tmp_path):
    source_text = build_book_text("\r\n", DEFAULT_RULE_CHAPTER_LINES)
    canonical_text = build_book_text("\n", DEFAULT_RULE_CHAPTER_LINES)

    with authenticated_client(monkeypatch, tmp_path) as client:
        response = client.post(
            "/api/books/upload",
            files={"file": ("default-rule-crlf.txt", source_text.encode("utf-8"), "text/plain")},
        )
        assert response.status_code == 201
        assert_uploaded_chapters_match_canonical_text(client, response.json(), canonical_text)


def test_crlf_upload_and_same_rule_reparse_are_identical(monkeypatch, tmp_path):
    source_text = build_book_text("\r\n")

    with authenticated_client(monkeypatch, tmp_path) as client:
        book = upload_book(client, source_text, "utf-8")
        before_reparse = get_chapter_snapshot(client, book["id"])

        response = client.post(
            f"/api/books/{book['id']}/reparse",
            json={"chapter_rule_id": book["chapter_rule_id"]},
        )
        assert response.status_code == 200
        after_reparse = get_chapter_snapshot(client, book["id"])

    assert len(before_reparse) == len(after_reparse) == len(CHAPTER_TITLES)
    assert before_reparse == after_reparse


@pytest.mark.parametrize("encoding", ["gbk", "utf-16"])
def test_crlf_upload_offsets_are_encoding_independent(monkeypatch, tmp_path, encoding):
    source_text = build_book_text("\r\n")
    canonical_text = build_book_text("\n")

    with authenticated_client(monkeypatch, tmp_path) as client:
        book = upload_book(client, source_text, encoding)
        assert_uploaded_chapters_match_canonical_text(client, book, canonical_text)


@pytest.mark.parametrize(
    ("newline", "encoding"),
    [
        ("\r\n", "utf-8-sig"),
        ("\r", "utf-8"),
    ],
)
def test_bom_and_legacy_cr_newlines_use_canonical_offsets(monkeypatch, tmp_path, newline, encoding):
    source_text = build_book_text(newline)
    canonical_text = build_book_text("\n")

    with authenticated_client(monkeypatch, tmp_path) as client:
        book = upload_book(client, source_text, encoding)
        assert_uploaded_chapters_match_canonical_text(client, book, canonical_text)
