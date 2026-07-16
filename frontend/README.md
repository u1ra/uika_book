# Frontend

初华的书 前端基于 Vue 3 + Vite + TypeScript，负责登录、书架、书籍详情、阅读页和目录规则管理。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- Shadcn Vue
- Tailwind CSS
- Lucide Icons

## 启动前准备

1. 先启动 backend，默认接口地址是 `http://localhost:8000`
2. 确认 Node.js 版本建议为 18+
3. 进入 `frontend/` 目录安装依赖

```bash
npm install
```

## 本地开发

```bash
npm run dev
```

默认会在 `http://localhost:24412` 启动 Vite 开发服务。

浏览器始终使用同源 `/api`、`/media/covers` 和 `/health`。开发环境由 Vite 将 API 请求代理到 `http://127.0.0.1:8000`，生产环境由 Nginx 转发到后端容器。

## 常用命令

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

## 目录说明

- `src/api/`: 接口请求封装
- `src/components/`: 通用前端组件
- `src/layouts/`: 页面布局
- `src/pages/`: 业务页面
- `src/router/`: 路由与鉴权
- `src/stores/`: Pinia 状态管理
- `src/utils/`: 通用工具函数
- `src/types/`: API 类型定义

## 当前能力

- 登录态恢复与路由鉴权
- 书架搜索、上传、删除与继续阅读
- 书籍详情、目录重解析
- 规则管理、规则测试、规则应用到书籍
- 阅读设置本地保存与阅读进度自动同步

## 联调说明

- 若登录时报“无法连接到同源后端”，请检查 backend 是否启动，以及 Vite / Nginx 代理是否正常
- 阅读页会优先读取服务端进度，并按 `chapter_index + char_offset` 恢复位置
- 阅读设置以服务端用户偏好为主，浏览器 `localStorage` 作为兼容兜底
