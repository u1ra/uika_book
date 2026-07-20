from contextlib import contextmanager

from fastapi.testclient import TestClient

from app.core import database
from app.core.config import settings
from app.main import create_application


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


def test_book_upload_over_size_limit_returns_413(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "max_upload_size_mb", 0)

    with authenticated_client(monkeypatch, tmp_path) as client:
        response = client.post(
            "/api/books/upload",
            files={"file": ("big.txt", "正文内容".encode("utf-8"), "text/plain")},
        )
        books_response = client.get("/api/books")

    assert response.status_code == 413
    assert "maximum allowed size" in response.json()["detail"]
    assert books_response.json() == []


def test_book_upload_within_size_limit_still_works(monkeypatch, tmp_path):
    with authenticated_client(monkeypatch, tmp_path) as client:
        response = client.post(
            "/api/books/upload",
            files={"file": ("small.txt", "第1章 开始\n内容".encode("utf-8"), "text/plain")},
        )

    assert response.status_code == 201


def test_cover_upload_over_size_limit_returns_413(monkeypatch, tmp_path):
    with authenticated_client(monkeypatch, tmp_path) as client:
        book_response = client.post(
            "/api/books/upload",
            files={"file": ("small.txt", "第1章 开始\n内容".encode("utf-8"), "text/plain")},
        )
        book_id = book_response.json()["id"]

        monkeypatch.setattr(settings, "max_cover_size_mb", 0)
        response = client.post(
            f"/api/books/{book_id}/cover",
            files={"file": ("cover.png", b"fake-png-bytes", "image/png")},
        )

    assert response.status_code == 413
    assert "maximum allowed size" in response.json()["detail"]
