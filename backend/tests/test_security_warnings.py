import logging

from app.core.config import DEFAULT_ADMIN_PASSWORD, DEFAULT_SECRET_KEY, Settings
from app.init_data import warn_if_insecure_production_settings


def _build_settings(**overrides) -> Settings:
    base = {
        "debug": False,
        "secret_key": "a-secure-random-secret",
        "default_admin_password": "a-secure-admin-password",
    }
    base.update(overrides)
    return Settings(**base)


def test_warns_when_production_uses_default_secret_key(caplog):
    config = _build_settings(secret_key=DEFAULT_SECRET_KEY)

    with caplog.at_level(logging.WARNING):
        warn_if_insecure_production_settings(config)

    assert "SECRET_KEY" in caplog.text
    assert "DEFAULT_ADMIN_PASSWORD" not in caplog.text


def test_warns_when_production_uses_default_admin_password(caplog):
    config = _build_settings(default_admin_password=DEFAULT_ADMIN_PASSWORD)

    with caplog.at_level(logging.WARNING):
        warn_if_insecure_production_settings(config)

    assert "DEFAULT_ADMIN_PASSWORD" in caplog.text
    assert "SECRET_KEY" not in caplog.text


def test_no_warning_when_production_settings_are_secure(caplog):
    config = _build_settings()

    with caplog.at_level(logging.WARNING):
        warn_if_insecure_production_settings(config)

    assert caplog.text == ""


def test_no_warning_in_debug_mode(caplog):
    config = _build_settings(
        debug=True,
        secret_key=DEFAULT_SECRET_KEY,
        default_admin_password=DEFAULT_ADMIN_PASSWORD,
    )

    with caplog.at_level(logging.WARNING):
        warn_if_insecure_production_settings(config)

    assert caplog.text == ""
