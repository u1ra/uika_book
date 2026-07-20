# Backend Quick Start

## 1. Prepare Python

Install Python 3.11 or newer first.

## 2. Create a virtual environment

### Windows PowerShell

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### macOS / Linux

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

## 4. Prepare environment variables

```bash
cp .env.example .env
```

On Windows PowerShell you can use:

```powershell
Copy-Item .env.example .env
```

Adjust values in `.env` if needed. For local development, the defaults are enough.

## 5. Start the API locally

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 6. Run with Docker

> 本节命令仅用于脱离 Compose 的独立调试。常规部署请使用根目录 `docker-compose.yml`：
> Compose 部署中后端不直接映射宿主机端口，所有浏览器请求经前端 Nginx 同源转发。

Build the image from the `backend` directory:

```bash
docker build -t uika_book-backend .
```

Start the container:

```bash
docker run --rm -p 8000:8000 uika_book-backend
```

If you want persistent local data on the host:

```bash
docker run --rm -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  uika_book-backend
```

## 7. Default bootstrap behavior

On first startup, the backend will automatically:

- create `backend/data/` for local runs or `/app/data/` in Docker
- create `backend/uploads/` for local runs or `/app/uploads/` in Docker
- create the SQLite database file if it does not exist
- create all SQLite tables
- seed built-in chapter rules
- seed the default admin user

Default login credentials:

- username: `admin`
- password: `admin123`

## 8. Useful endpoints

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /docs`

## 9. Error response format

Business and framework errors return a unified structure:

```json
{
  "success": false,
  "detail": "Request validation failed",
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": []
  }
}
```
