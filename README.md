# 初华的书

一个面向个人自托管场景的 TXT 在线阅读器。上传本地 TXT 后，系统会检测编码、解析章节并保存到书架；阅读时只按当前章节加载正文，并以 `chapter_index + char_offset` 同步阅读位置。

当前文档版本：`v1.15`

更新记录：[UPDATE.md](./UPDATE.md)

## 核心能力

- TXT 上传，兼容 UTF-8、GBK、UTF-16，并统一保存为 UTF-8
- 内置中文章节、英文章节、卷章混合和全文模式规则
- 自定义章节正则、flags、规则测试、默认规则和整书重解析
- 规则应用前预览：展示预计章节数、前 10 个标题和全文降级提示
- 书架搜索、排序、分组、封面、元数据编辑和继续阅读
- 按章节获取正文，支持上一章、下一章、目录快速跳转和长目录虚拟滚动
- 字号、行高、字间距、段间距、阅读宽度和明暗主题设置
- 以账号为主数据源同步阅读进度、阅读偏好和书架筛选状态
- 沉浸阅读风界面：暖纸/暖灰黑低饱和配色、窄栏排版，全局明暗主题一键切换
- 浏览器统一通过同源 `/api` 访问后端，无需跨域配置
- PC、移动端响应式界面和可安装的 PWA
- 应用内统一提示及危险操作确认对话框

如果正则没有匹配到章节，后端会自动降级为“全文”单章节，保证书籍仍可阅读。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vite、TypeScript、Vue Router、Pinia |
| UI | Shadcn Vue 风格组件、Reka UI、Tailwind CSS、Lucide Icons |
| PWA | vite-plugin-pwa、Workbox |
| 后端 | FastAPI、SQLAlchemy 2、Pydantic 2 |
| 存储 | SQLite、本地文件系统 |
| 部署 | Docker Compose、Nginx、Uvicorn |

## 快速开始：Docker Compose

这是当前最省事的运行方式。

### 1. 准备环境

- Docker Engine 或 Docker Desktop
- Docker Compose v2

### 2. 获取源码并准备配置

```bash
git clone https://github.com/u1ra/uika_book.git
cd uika_book
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

首次启动前至少应修改 `.env` 中的以下值：

- `SECRET_KEY`
- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_PASSWORD`

生产模式下如果这三项仍为默认值，后端启动日志会打印告警。书籍/封面上传大小上限默认为 100MB / 10MB，可通过 `MAX_UPLOAD_SIZE_MB`、`MAX_COVER_SIZE_MB` 调整。

浏览器始终请求当前站点的同源 `/api`，由前端 Nginx 转发到后端容器，不需要配置 API Base URL。

### 3. 构建并启动

```bash
docker compose up --build -d
```

默认访问地址：

| 服务 | 地址 |
| --- | --- |
| 前端 | `http://localhost:7234` |
| 健康检查 | `http://localhost:7234/health` |

当前 [docker-compose.yml](./docker-compose.yml) 只向宿主机开放前端 Nginx。后端 `8000` 端口仅在 Compose 网络内可见，所有浏览器请求都通过前端同源转发。可在 `.env` 中修改 `FRONTEND_PORT`，默认值为 `7234`。

Compose 把后端 `DEBUG` 固定为 `false`，默认不开放 `/docs`、`/redoc` 和 `/openapi.json`。需要 Swagger 时建议使用后文的本地开发方式启动后端。

### 4. 常用命令

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 更新代码或依赖后重建
docker compose up --build -d

# 停止并移除容器；不会删除挂载的数据目录
docker compose down
```

## 首次启动与数据目录

后端启动时会自动：

1. 创建数据、上传和封面目录。
2. 创建或连接 SQLite 数据库。
3. 创建数据表，并为旧库补充 `cover_path`、`preferences_json` 字段。
4. 写入内置章节规则。
5. 在目标用户名不存在时创建默认管理员。
6. 为没有分组的存量书籍补齐默认分组。

Docker 下的数据持久化位置：

```text
backend/data/app.db           # SQLite 数据库
backend/uploads/raw/          # 原始上传文件
backend/uploads/books/        # UTF-8 标准化正文
backend/uploads/covers/       # 自定义封面
```

默认账号来自 `.env`。示例配置为 `admin / admin123`，只适合首次本地体验，请勿直接用于公网部署。

管理员只会在数据库中不存在目标用户名时创建。已有数据库不会因修改 `.env` 自动改名或重置密码，可使用维护脚本：

```bash
# 按当前 DEFAULT_ADMIN_* 配置维护账号
docker compose exec backend python scripts/manage_admin_user.py

# 重置当前默认管理员密码
docker compose exec backend python scripts/manage_admin_user.py --password "new-password"

# 显式改名并更新密码
docker compose exec backend python scripts/manage_admin_user.py \
  --old-username admin \
  --new-username reader \
  --password "new-password"
```

也可以登录后从右上角用户菜单修改当前密码；成功后会退出登录。

## 备份与恢复

全部业务数据只有两部分：SQLite 数据库（`backend/data/app.db`）和上传文件（`backend/uploads/`）。使用内置脚本打成单个 tar.gz：

```bash
# Compose 部署（推荐）：备份写入宿主机 ./backend/backups/
docker compose exec backend python scripts/backup.py

# 本地开发：在 backend/ 目录的虚拟环境中运行
python scripts/backup.py
```

脚本使用 SQLite 在线备份 API，服务运行期间执行也是安全的。可用 `--output-dir`、`--db-path`、`--upload-dir` 覆盖默认路径。建议用 cron 定期执行，例如每天凌晨 3 点：

```cron
0 3 * * * cd /path/to/uika_book && docker compose exec -T backend python scripts/backup.py
```

恢复流程（会覆盖现有数据，操作前先自行留存当前 `backend/data` 与 `backend/uploads`）：

```bash
docker compose down
mkdir -p /tmp/uika_book-restore
tar -xzf backend/backups/uika_book-backup-<时间戳>.tar.gz -C /tmp/uika_book-restore
cp /tmp/uika_book-restore/app.db backend/data/app.db
rsync -a --delete /tmp/uika_book-restore/uploads/ backend/uploads/
docker compose up -d
```

## 本地开发

### 后端

要求 Python 3.11+。

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Windows PowerShell 使用 `.\.venv\Scripts\Activate.ps1` 激活虚拟环境。

本地 `backend/.env.example` 默认 `DEBUG=true`，因此开发服务器可访问：

- API：`http://localhost:8000`
- 健康检查：`http://localhost:8000/health`
- Swagger：`http://localhost:8000/docs`

### 前端

要求 Node.js 22+；Dockerfile 当前使用 Node 22 Alpine。

```bash
cd frontend
npm ci
npm run dev
```

Vite 开发服务器默认运行在 `http://localhost:24412`，并将 `/api`、`/media/covers`、`/health` 代理到 `http://127.0.0.1:8000`。

常用前端命令：

```bash
npm run typecheck   # TypeScript 类型检查
npm run test        # Vitest 单元测试
npm run build       # 生产构建（含 PWA 产物）
npm run preview
```

后端测试：

```bash
cd backend
pytest -q
```

push 或 PR 时 GitHub Actions 会自动执行后端 pytest 与前端 typecheck/单测/构建（见 `.github/workflows/ci.yml`）。

项目还提供两个前端静态回归脚本，覆盖书架响应式、阅读正文布局和目录抽屉单滚动约束：

```bash
node frontend/scripts/verify-ui-fixes.mjs
node frontend/scripts/verify-reader-page-layout.mjs
```

## 使用流程

1. 登录后进入书架，上传 `.txt` 文件。
2. 系统使用默认章节规则解析正文，并将书放入默认分组。
3. 可在书架中搜索、排序、分组，或进入详情页补充书名、作者、简介和封面。
4. 如果目录不理想，在“目录规则”页测试或创建正则规则。
5. 在详情页选择规则时先查看应用后预览，确认后再重新解析目录。
6. 从详情页或目录进入阅读器，系统按章节加载正文并自动同步进度。

### 目录规则

支持的 flags：

- `IGNORECASE` / `i`
- `MULTILINE` / `m`
- `DOTALL` / `s`
- `VERBOSE` / `x`
- `FULL_TEXT`：跳过正则，将整本书作为一个章节

规则测试可使用已上传书籍或直接输入文本片段，返回总匹配数和前 20 个匹配项。详情页的规则预览会展示前 10 个标题；没有匹配时明确提示将降级为“全文”。

新增和编辑自定义规则共用同一个响应式弹窗。弹窗高度超过当前视口时，仅表单主体滚动，“取消”和“保存规则”操作区保持可见；保存成功后弹窗会关闭并自动刷新规则列表。

### 阅读与同步

- 章节正文通过 `/api/books/{book_id}/chapters/{chapter_index}` 单章获取。
- 阅读位置以 `chapter_index + char_offset` 为准，`percent` 只用于显示。
- 页面滚动时节流同步；切章、隐藏页面、离开阅读页和关闭页面前会再次尝试保存。
- 服务端以 `updated_at` 处理进度冲突，较旧的提交不会覆盖较新的位置。
- 阅读偏好和书架筛选状态保存在用户的 `preferences_json` 中，浏览器本地存储仅作为兼容与恢复兜底。
- 章节目录抽屉固定显示进度与快速跳转，长目录只在章节列表内部滚动。
- 长目录使用虚拟滚动，条目为固定高度；调整目录条目样式时必须同步 `CATALOG_ITEM_ESTIMATED_HEIGHT`。

## 同源访问

前端只使用相对路径访问后端：

- `/api/`：认证、书架、章节、规则、进度与偏好接口
- `/media/covers/`：书籍封面
- `/health`：健康检查

本地开发由 Vite proxy 转发到 `127.0.0.1:8000`；Docker 部署由前端 Nginx 转发到 `uika_book-backend:8000`。REST API 边界保持不变，前后端仍可独立开发和构建，只是不再允许浏览器运行时选择其他后端。

从旧版本升级时，前端会把当前 Origin 对应的旧作用域 Token 自动迁移到固定存储键，并清理废弃的后端选择配置。

## PWA

生产构建会生成 Web App Manifest 和 Service Worker，应用以 `standalone` 模式运行。安装通常要求 HTTPS 安全上下文；`localhost` 是浏览器允许的开发例外。

- Android Chrome：浏览器菜单中选择“安装应用”或“添加到主屏幕”。
- iOS Safari：分享菜单中选择“添加到主屏幕”。

Service Worker 只预缓存前端应用壳和本地静态资源，不缓存 API 响应。离线时可能仍能打开界面，但无法重新获取书架、章节或同步进度。

前端更新后如果仍看到旧界面，可先强制刷新；仍未更新时，在浏览器开发者工具中注销旧 Service Worker 后重新加载。

## 反向代理

前端 Nginx 已将以下路径转发到后端容器：

- `/api/`
- `/media/covers/`
- `/health`

对公网、局域网或隧道部署时，只需把域名反向代理到前端端口。不要让浏览器直接访问后端容器，也不要把 `/api` 指向另一个 Origin。若接口返回前端 HTML 或 404，优先检查上述三个路径是否完整转发。

后端不再启用 CORS 中间件；这是同源部署的预期行为，不影响 curl、服务端程序或同源 Nginx 访问 API。

## API 概览

除系统健康检查、登录和封面静态文件外，业务接口均需要 `Authorization: Bearer <token>`。

| 模块 | 主要接口 |
| --- | --- |
| 系统 | `GET /`、`GET /health` |
| 认证 | `POST /api/auth/login`、`GET /api/auth/me`、`POST /api/auth/change-password` |
| 书架 | `GET /api/books`、`POST /api/books/upload`、`GET/PUT/PATCH/DELETE /api/books/{id}` |
| 封面 | `POST/DELETE /api/books/{id}/cover`、`GET /media/covers/...` |
| 分组 | `GET/POST /api/book-groups`、`PUT/DELETE /api/book-groups/{id}`、`GET/PUT /api/books/{id}/groups` |
| 章节 | `GET /api/books/{id}/chapters`、`GET /api/books/{id}/chapters/{index}`、`POST /api/books/{id}/reparse` |
| 进度 | `GET/PUT /api/books/{id}/progress` |
| 规则 | `GET/POST /api/chapter-rules`、`PUT/DELETE /api/chapter-rules/{id}`、`POST /api/chapter-rules/test` |
| 偏好 | `GET/PATCH /api/preferences` |

错误响应采用统一结构：

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

## 项目结构

```text
.
├── backend/
│   ├── app/
│   │   ├── core/          # 配置、数据库、鉴权和异常处理
│   │   ├── models/        # SQLAlchemy 模型
│   │   ├── routers/       # REST API
│   │   ├── schemas/       # Pydantic 请求/响应模型
│   │   ├── services/      # 书籍、章节、规则、进度、偏好业务
│   │   ├── utils/         # 编码、文件、正则、响应工具
│   │   ├── init_data.py   # 建库、兼容迁移和种子数据
│   │   └── main.py        # FastAPI 入口
│   ├── scripts/           # 管理员维护与备份脚本
│   ├── tests/             # 后端测试
│   ├── data/              # 运行期 SQLite 数据（Git 忽略）
│   ├── uploads/           # 运行期书籍与封面（Git 忽略）
│   └── backups/           # 备份产物（Git 忽略）
├── frontend/
│   ├── public/            # PWA 图标
│   ├── scripts/           # 前端静态回归脚本
│   └── src/
│       ├── api/           # API 客户端
│       ├── components/    # 业务组件与 UI 基础组件
│       ├── composables/   # 跨页复用的组合式函数
│       ├── layouts/       # 应用布局
│       ├── pages/         # 登录、书架、详情、阅读、规则页
│       ├── router/        # 路由和鉴权守卫
│       ├── stores/        # Pinia 状态
│       ├── styles/        # 全局主题样式
│       ├── types/         # TypeScript API 类型
│       └── utils/         # token、通知和格式化等工具
├── docs/IMPLEMENTATION_STEPS.md   # 历史需求记录（归档）
├── development-process.md         # 历史流程记录（归档）
├── .github/workflows/ci.yml       # GitHub Actions CI
├── docker-compose.yml
├── UPDATE.md
└── README.md
```

## 常见问题

### 上传后只有“全文”一章

当前规则没有匹配到章节标题。到“目录规则”页用真实书籍测试正则，或在详情页选择其他规则查看预览，再执行重新解析。

### 修改 `.env` 后账号仍未变化

默认管理员只在目标用户名不存在时创建。已有账号请使用页面内“更改密码”或 `scripts/manage_admin_user.py`；不要通过删除数据库处理生产数据。

### Docker 中访问不了 `/docs`

Compose 当前固定 `DEBUG=false`，这是预期行为。按本文 Docker 章节调整 Compose 并重建后端后才能开放文档。

### 如何修改 Docker 对外端口

修改 `.env` 中的 `FRONTEND_PORT` 后重新创建容器。后端不再直接映射宿主机端口；本地调试 API 请使用 Uvicorn 开发服务器。

### 封面显示失败

确认反向代理同时转发 `/media/covers/`。封面接口只接受 JPG、JPEG、PNG 和 WebP。

### 分组无法删除

如果删除会让某些书失去最后一个分组，后端会返回冲突错误。先把这些书加入其他分组，再删除目标分组。

## 相关文档

- [更新日志](./UPDATE.md)
- [后端快速启动](./backend/README.md)
- [前端开发说明](./frontend/README.md)
- [前端 UI 迁移记录](./frontend/MIGRATION.md)
- [v1.15 系统性修复全过程记录](./docs/FIX.md)
- [实施步骤（历史归档）](./docs/IMPLEMENTATION_STEPS.md)
- [开发过程（历史归档）](./development-process.md)

本项目定位为轻量个人阅读器：保持单体后端、SQLite 和本地文件存储，不引入 Redis、消息队列、微服务或 Kubernetes。
