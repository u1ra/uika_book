from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent


def _parse_env_file(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", maxsplit=1)
        result[key] = value
    return result


def test_env_example_uses_runtime_relative_storage_paths():
    env_values = _parse_env_file(BACKEND_DIR / ".env.example")

    assert env_values["DATA_DIR"] == "data"
    assert env_values["UPLOAD_DIR"] == "uploads"


def test_root_env_example_exposes_only_the_frontend_port():
    env_values = _parse_env_file(ROOT_DIR / ".env.example")

    assert env_values["FRONTEND_PORT"] == "7234"
    assert "BACKEND_PORT" not in env_values
    assert "VITE_API_BASE_URL" not in env_values
    assert "CORS_ORIGINS" not in env_values


def test_dockerfile_exists_with_expected_runtime_command():
    dockerfile = BACKEND_DIR / "Dockerfile"
    assert dockerfile.exists(), "Dockerfile should exist for deployment"

    content = dockerfile.read_text(encoding="utf-8")
    assert "WORKDIR /app" in content
    assert "COPY requirements.txt ./" in content
    assert 'CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]' in content


def test_root_docker_compose_uses_a_single_same_origin_entrypoint():
    compose_file = ROOT_DIR / "docker-compose.yml"
    assert compose_file.exists(), "docker-compose.yml should exist at the repository root"

    content = compose_file.read_text(encoding="utf-8")
    assert "PORT: 8000" in content
    assert '${FRONTEND_PORT:-7234}:80' in content
    assert 'expose:\n      - "8000"' in content
    assert "BACKEND_PORT" not in content
    assert "VITE_API_BASE_URL" not in content
    assert "CORS_ORIGINS" not in content


def test_frontend_nginx_proxies_all_backend_paths():
    nginx_file = ROOT_DIR / "frontend" / "nginx.conf"
    content = nginx_file.read_text(encoding="utf-8")

    assert "location /api/" in content
    assert "location /media/covers/" in content
    assert "location = /health" in content
    assert "proxy_pass http://uika_book-backend:8000" in content


def test_vite_dev_server_proxies_all_backend_paths():
    vite_config = ROOT_DIR / "frontend" / "vite.config.ts"
    content = vite_config.read_text(encoding="utf-8")

    assert '"/api"' in content
    assert '"/media/covers"' in content
    assert '"/health"' in content
    assert 'target: "http://127.0.0.1:8000"' in content


def test_backend_does_not_enable_browser_cors_middleware():
    main_file = BACKEND_DIR / "app" / "main.py"
    content = main_file.read_text(encoding="utf-8")

    assert "CORSMiddleware" not in content
    assert "ReflectCORSMiddleware" not in content


def test_dockerignore_excludes_local_runtime_artifacts():
    dockerignore = BACKEND_DIR / ".dockerignore"
    assert dockerignore.exists(), ".dockerignore should exist for a clean Docker build context"

    content = dockerignore.read_text(encoding="utf-8")
    assert ".venv" in content
    assert "__pycache__" in content
    assert "data" in content
    assert "uploads" in content
