# Naive UI → Shadcn Vue + Tailwind CSS 迁移文档

## 概述

本项目已从 Naive UI 完全迁移到 Shadcn Vue + Tailwind CSS + Lucide Icons 技术栈。

**迁移完成日期**: 2026-04-22
**最终构建产物**: JS 384KB (gzip: 125KB)

## 新组件目录结构

```
src/components/ui/
├── alert/
│   ├── index.ts
│   └── Alert.vue
├── badge/
│   ├── index.ts
│   └── Badge.vue
├── button/
│   ├── index.ts
│   └── Button.vue
├── card/
│   ├── index.ts
│   ├── Card.vue
│   ├── CardContent.vue
│   ├── CardFooter.vue
│   ├── CardHeader.vue
│   └── CardTitle.vue
├── dialog/
│   ├── index.ts
│   ├── Dialog.vue
│   ├── DialogClose.vue
│   ├── DialogContent.vue
│   ├── DialogDescription.vue
│   ├── DialogHeader.vue
│   ├── DialogTitle.vue
│   └── DialogTrigger.vue
├── input/
│   ├── index.ts
│   └── Input.vue
├── select/
│   ├── index.ts
│   ├── Select.vue
│   ├── SelectContent.vue
│   ├── SelectItem.vue
│   ├── SelectTrigger.vue
│   └── SelectValue.vue
├── separator/
│   ├── index.ts
│   └── Separator.vue
├── skeleton/
│   ├── index.ts
│   └── Skeleton.vue
├── slider/
│   ├── index.ts
│   └── Slider.vue
├── sonner/
│   ├── index.ts
│   └── Sonner.vue
└── tabs/
    ├── index.ts
    ├── Tabs.vue
    ├── TabsContent.vue
    ├── TabsList.vue
    └── TabsTrigger.vue
```

## 组件映射表

| Naive UI 组件 | 新方案 | 状态 |
|--------------|--------|------|
| `n-button` | `Button` (Shadcn) | ✅ 已迁移 |
| `n-input` | `Input` (Shadcn) / 原生 textarea | ✅ 已迁移 |
| `n-select` | `Select` (Reka UI) | ✅ 已迁移 |
| `n-card` | 原生 div + Tailwind | ✅ 已迁移 |
| `n-alert` | `Alert` (自定义) | ✅ 已迁移 |
| `n-badge` | `Badge` (Shadcn) | ✅ 已迁移 |
| `n-dialog` | `Dialog` (Reka UI) | ✅ 已迁移 |
| `n-modal` | `Dialog` (Reka UI) | ✅ 已迁移 |
| `n-drawer` | 自定义 CSS Drawer | ✅ 已迁移 |
| `n-tabs` | `Tabs` (Reka UI) | ✅ 已迁移 |
| `n-slider` | `Slider` (Reka UI) | ✅ 已迁移 |
| `n-sonner` | `Sonner` (vue-sonner) | ✅ 已迁移 |
| `n-separator` | `Separator` (自定义) | ✅ 已迁移 |
| `n-skeleton` | `Skeleton` (自定义) | ✅ 已迁移 |
| `n-message` | `notify` (适配层) | ✅ 已迁移 |
| `n-tag` | `Badge` (Shadcn) | ✅ 已迁移 |
| `n-empty` | 自定义空状态 div | ✅ 已迁移 |
| `n-form` / `n-form-item` | 原生 div/label | ✅ 已迁移 |
| `n-checkbox` | 原生 checkbox | ✅ 已迁移 |
| `n-radio-group` / `n-radio-button` | 自定义 radio | ✅ 已迁移 |
| `n-popconfirm` | `confirm()` / 自定义 Dialog | ✅ 已迁移 |
| `n-space` | `div` + flex gap | ✅ 已迁移 |
| `n-spin` | 原生 SVG + animate-spin | ✅ 已迁移 |
| `n-data-table` | 原生 HTML table + 分页 | ✅ 已迁移 |
| `n-table` | 原生 HTML table | ✅ 已迁移 |
| `n-upload` | 原生 `<input type="file">` | ✅ 已迁移 |
| `n-progress` | 自定义 CSS progress bar | ✅ 已迁移 |

## 已迁移页面与组件

### 页面

| 页面 | 状态 |
|------|------|
| `App.vue` | ✅ 移除所有 Provider，使用 AppProvider |
| `AppLayout.vue` | ✅ 移除 n-layout/n-button，使用 Tailwind + Button |
| `LoginPage.vue` | ✅ 完全迁移 |
| `BookshelfPage.vue` | ✅ 完全迁移 |
| `BookDetailPage.vue` | ✅ 完全迁移 |
| `RuleManagementPage.vue` | ✅ 完全迁移（原生 table + 分页） |
| `ReaderPage.vue` | ✅ 完全迁移（自定义 Drawer + CSS progress） |

### 组件

| 组件 | 状态 |
|------|------|
| `AppProvider.vue` | ✅ 注入应用内通知对话框 |
| `PagePlaceholder.vue` | ✅ 完全迁移 |
| `BookGroupManagerModal.vue` | ✅ 完全迁移 |
| `BookGroupSelectorModal.vue` | ✅ 完全迁移 |
| `ChapterCatalogModalDrawer.vue` | ✅ 完全迁移（Dialog + 自定义 Drawer） |

> `BackendSwitchModal.vue` 已在后续同源访问重构中移除，不再属于当前组件结构。

## 工具函数

### `cn()` —— 类名合并

位于 `src/lib/utils.ts`：

```ts
import { cn } from "@/lib/utils";
```

基于 `clsx` + `tailwind-merge`，用于安全地合并 Tailwind 类名。

### `notify` —— 通知适配层

位于 `src/utils/notify.ts`：

```ts
import { notify } from "@/utils/notify";

notify.success("操作成功");
notify.error("操作失败");
notify.info("提示信息");
```

替代了 Naive UI 的 `useMessage()` 和 `createDiscreteApi(['message'])`。

## 设计规范（2026-07 沉浸阅读风重设计后已更新，见文末）

- **背景**：`bg-white` (卡片), `bg-gray-50` (页面底色)
- **文字**：`text-gray-900` (主标题), `text-gray-600` (正文), `text-gray-400` (次要)
- **边框**：`border-gray-200` (极细分割线)
- **阴影**：全局禁用默认阴影，仅 Dialog 使用极淡阴影
- **圆角**：`rounded-md` (6px) 或 `rounded-lg` (8px)
- **间距**：4px 倍数体系，卡片内边距至少 `p-6`

## 构建体积变化

| 阶段 | JS 体积 | 说明 |
|------|---------|------|
| 迁移前 | ~1036 KB | Naive UI 完整打包 |
| 书架/登录迁移后 | ~1036 KB | 树摇有限 |
| BookDetail/Rule 迁移后 | ~1003 KB | 开始见效 |
| Reader + 组件迁移后 | ~890 KB | 大量移除 |
| n-data-table 替换后 | ~610 KB | 重大突破 |
| n-upload/progress 替换后 | **~384 KB** | naive-ui 完全移除 |

---

# 2026-07 沉浸阅读风 UI 重设计（refactor 分支）

## 概述

全部页面（登录、书架、书籍详情、阅读页、规则管理）已重设计为**沉浸阅读风**（参考微信读书 / Apple Books）。后端接口、API 字段语义、业务层（api 封装、stores、路由守卫、notify）均未改动。

## 新设计规范

- **浅色**：暖纸白底（`#F7F4ED` → `#F1ECE2` 渐变），暖白卡片 `#FDFBF6`，墨色文字 `#2E2921` / `#6F675B`，主色陶棕 `#9A6238`，点缀灰绿 `#6E8577`
- **深色**：暖灰黑底（`#1C1915` → `#14120F`），文字 `#EDE5D8` / `#A79B8A`，主色暖檀 `#D29B6C`
- **形状**：1px `--border-color-soft` 细边框、`--radius-*`（10/16/22/28px）柔和圆角、极淡暖棕阴影
- **排版**：标题 `var(--font-display)`（霞鹜文楷衬线），大面积留白，窄栏居中
- **token 唯一来源**：`src/styles/index.css` 的 `:root` + `body.app-theme--dark`；页面一律使用 CSS 变量，不写死颜色、不写暗色特例
- **暗色策略**：`tailwind.config.js` 的 `darkMode` 指向 `body.app-theme--dark`（由 `stores/app-theme.ts` 维护），圆角/颜色 fallback 已与 index.css 对齐

## 主题色同步点（改主色时必须全改）

1. `index.html` 的 `theme-color` meta 与内联兜底背景
2. `vite.config.ts` manifest 的 `theme_color` / `background_color`
3. `stores/app-theme.ts` 中 `applyThemeToDocument` 的两处硬编码
4. `styles/index.css` 的 `html` / `body` 兜底背景色
5. `stores/preferences.ts` 的 `DEFAULT_READER_PREFERENCES.themeColor`（用户主题色默认值，会内联覆盖 `--primary-color`）

## 新增共享组件与 composables

- `components/BookCover.vue`：封面图 / TXT 首字母兜底（替代书架、详情页两处重复实现）
- `components/ProgressBar.vue`：统一细进度条
- `components/PageHeader.vue`：页头（eyebrow/title/subtitle + actions 插槽）
- `components/PageStatusPanel.vue`：扩展为 empty / error / loading 三态
- `composables/useContinueReading.ts`：继续阅读跳转（取进度 → reader，404 降级第 0 章）
- `composables/useAsyncAction.ts`：CRUD pending → try → notify 模板

## 移除的死代码

- `components/PagePlaceholder.vue`（无使用方）
- `components/ui/tabs/`、`components/ui/separator/`（无使用方）
- `components/ui/card/`（登录页重设计后无使用方）
- `index.css` 中失效的暗色覆盖（`.book-detail-page__content`、`login-page__card`、`rule-table`、`rule-mobile-card`、`bookshelf-page__empty` 等）

## 阅读页特别说明

- 阅读页仅做视觉与 chrome 重设计，**进度定位几何零改动**：window 级滚动、`contentRef` 单一长容器、`trimmedPrefixLength` 标题裁剪换算、`READER_SCROLL_ANCHOR`、节流/keepalive/本地备份/进度合并策略全部保留
- 目录虚拟滚动常量 `CATALOG_ITEM_ESTIMATED_HEIGHT = 82` 未变（条目 padding 未改）；今后改目录条目样式时必须同步该常量
- 阅读页 `.reader-page--light/dark` 两套 `--reader-*` 变量已换为新配色，但 `preferences.reader.theme` 仍只有 light/dark 两档（API 语义未变）
