from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]

# 默认值仅用于本地开发兜底；生产部署必须通过环境变量覆盖（见 init_data 启动告警）。
DEFAULT_SECRET_KEY = "change-this-in-production"
DEFAULT_ADMIN_PASSWORD = "admin123"


class Settings(BaseSettings):
    app_name: str = "初华的书 API"
    app_version: str = "0.1.0"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    data_dir: Path = BACKEND_DIR / "data"
    upload_dir: Path = BACKEND_DIR / "uploads"
    database_url: str | None = None
    secret_key: str = DEFAULT_SECRET_KEY
    access_token_expire_minutes: int = 60 * 24 * 7
    default_admin_username: str = "admin"
    default_admin_password: str = DEFAULT_ADMIN_PASSWORD
    default_txt_encoding: str = "utf-8"
    max_upload_size_mb: int = 100
    max_cover_size_mb: int = 10

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("data_dir", "upload_dir", mode="before")
    @classmethod
    def normalize_path(cls, value: object) -> Path:
        if isinstance(value, Path):
            return value
        return Path(str(value))

    @model_validator(mode="after")
    def finalize_paths(self) -> "Settings":
        self.data_dir = self._to_absolute_path(self.data_dir)
        self.upload_dir = self._to_absolute_path(self.upload_dir)
        if not self.database_url:
            self.database_url = f"sqlite:///{(self.data_dir / 'app.db').as_posix()}"
        return self

    @staticmethod
    def _to_absolute_path(path: Path) -> Path:
        return path if path.is_absolute() else (BACKEND_DIR / path).resolve()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
