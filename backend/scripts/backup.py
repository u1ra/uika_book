"""备份 SQLite 数据库与上传文件。

用法：
    python scripts/backup.py [--output-dir PATH] [--db-path PATH] [--upload-dir PATH]

- 默认从应用配置读取数据库与上传目录（与 docker-compose 卷一致）。
- 使用 SQLite 在线备份 API（Connection.backup），服务运行期间也可安全执行。
- 产物为单个 tar.gz：内含 app.db（一致性备份副本）与 uploads/ 目录。

恢复步骤见根目录 README「备份与恢复」一节。
"""

import argparse
import sqlite3
import sys
import tarfile
import tempfile
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings  # noqa: E402


def resolve_database_path() -> Path:
    database_url = settings.database_url or ""
    prefix = "sqlite:///"
    if not database_url.startswith(prefix):
        raise SystemExit(f"仅支持 SQLite 备份，当前 DATABASE_URL: {database_url!r}")
    return Path(database_url[len(prefix):])


def backup_database(source: Path, target: Path) -> None:
    """使用 SQLite 在线备份 API 生成一致性副本（WAL 模式下同样安全）。"""
    src = sqlite3.connect(f"file:{source.as_posix()}?mode=ro", uri=True)
    try:
        dst = sqlite3.connect(target)
        try:
            with dst:
                src.backup(dst)
        finally:
            dst.close()
    finally:
        src.close()


def create_backup(db_path: Path, upload_dir: Path, output_dir: Path) -> Path:
    if not db_path.exists():
        raise SystemExit(f"数据库文件不存在: {db_path}")
    if not upload_dir.exists():
        raise SystemExit(f"上传目录不存在: {upload_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    archive_path = output_dir / f"uika_book-backup-{timestamp}.tar.gz"

    with tempfile.TemporaryDirectory(prefix="uika_book-backup-") as tmp:
        db_copy = Path(tmp) / "app.db"
        backup_database(db_path, db_copy)

        with tarfile.open(archive_path, "w:gz") as archive:
            archive.add(db_copy, arcname="app.db")
            archive.add(upload_dir, arcname="uploads")

    return archive_path


def main() -> None:
    parser = argparse.ArgumentParser(description="备份 SQLite 数据库与 uploads 目录为单个 tar.gz")
    parser.add_argument("--db-path", type=Path, default=resolve_database_path(), help="SQLite 数据库文件路径")
    parser.add_argument("--upload-dir", type=Path, default=settings.upload_dir, help="上传文件目录")
    parser.add_argument("--output-dir", type=Path, default=BACKEND_DIR / "backups", help="备份输出目录")
    args = parser.parse_args()

    archive_path = create_backup(args.db_path, args.upload_dir, args.output_dir)
    print(f"备份完成: {archive_path}")


if __name__ == "__main__":
    main()
