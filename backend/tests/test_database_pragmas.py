import threading

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import Base, build_engine
from app.models import User


def test_sqlite_engine_enables_wal_and_busy_timeout(tmp_path):
    engine = build_engine(f"sqlite:///{(tmp_path / 'wal.db').as_posix()}")
    try:
        with engine.connect() as connection:
            journal_mode = connection.execute(text("PRAGMA journal_mode")).scalar()
            busy_timeout = connection.execute(text("PRAGMA busy_timeout")).scalar()
    finally:
        engine.dispose()

    assert str(journal_mode).lower() == "wal"
    assert busy_timeout == 5000


def test_sqlite_engine_supports_concurrent_writes_without_lock_errors(tmp_path):
    db_path = tmp_path / "concurrent.db"
    engine = build_engine(f"sqlite:///{db_path.as_posix()}")
    Base.metadata.create_all(bind=engine)

    errors: list[Exception] = []

    def write_users(prefix: str) -> None:
        try:
            for index in range(30):
                session = Session(bind=engine)
                try:
                    session.add(User(username=f"{prefix}-{index}", password_hash="x"))
                    session.commit()
                except Exception:
                    session.rollback()
                    raise
                finally:
                    session.close()
        except Exception as exc:  # noqa: BLE001 - 测试需要收集后统一断言为空
            errors.append(exc)

    threads = [threading.Thread(target=write_users, args=(f"t{n}",)) for n in range(4)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert errors == []

    session = Session(bind=engine)
    try:
        count = session.query(User).count()
    finally:
        session.close()
        engine.dispose()

    assert count == 30 * len(threads)
