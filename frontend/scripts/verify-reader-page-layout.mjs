import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = resolve(process.cwd());
const frontendRoot = cwd.endsWith(`${process.platform === "win32" ? "\\" : "/"}frontend`)
  ? cwd
  : resolve(cwd, "frontend");
const readerPagePath = resolve(frontendRoot, "src/pages/ReaderPage.vue");

const source = readFileSync(readerPagePath, "utf8");
const failures = [];

function expectMatch(pattern, message) {
  if (!pattern.test(source)) {
    failures.push(message);
  }
}

function expectNoMatch(pattern, message) {
  if (pattern.test(source)) {
    failures.push(message);
  }
}

expectMatch(
  /function buildReaderParagraphs\(content: string\)\s*\{[\s\S]*?split\(\/\\n\+\/\)[\s\S]*?trim\(\)/,
  "正文分段仍未按单换行拆分并清理段首缩进，段间距和统一首行缩进都无法可靠生效。",
);

expectMatch(
  /\.reader-content__paragraph\s*\{[^}]*text-indent:\s*(?:var\(--reader-paragraph-indent\)|2em);[^}]*\}/,
  "正文段落仍未通过 CSS 统一设置首行缩进。",
);

expectMatch(
  /"--reader-content-width-mobile":\s*[^,]+,/,
  "阅读页还没有为手机端提供单独的阅读宽度映射变量。",
);

expectMatch(
  /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.reader-content\s*\{[^}]*width:\s*var\(--reader-content-width-mobile\);[^}]*\}/,
  "手机端正文容器还没有使用移动端阅读宽度变量。",
);

expectNoMatch(
  /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.reader-content\s*\{[^}]*max-width:\s*none;[^}]*\}/,
  "手机端仍在用 max-width: none 覆盖阅读宽度设置。",
);

expectMatch(
  /:class="\{\s*'reader-drawer__panel--catalog':\s*activeDrawer\s*===\s*'catalog'\s*\}"/,
  "目录抽屉面板缺少独立的 catalog 状态类，无法与设置抽屉区分滚动策略。",
);

expectMatch(
  /\.reader-drawer__panel--catalog\s*\{[^}]*overflow:\s*hidden;[^}]*\}/,
  "目录抽屉外层仍可滚动，会与章节列表形成双滚动条。",
);

expectMatch(
  /\.reader-drawer__surface--catalog\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*height:\s*100%;[^}]*min-height:\s*0;[^}]*overflow:\s*hidden;[^}]*\}/,
  "目录抽屉内容区没有固定为单列弹性布局，章节列表无法稳定占用剩余高度。",
);

expectMatch(
  /\.reader-catalog__list--drawer\s*\{[^}]*flex:\s*1\s+1\s+auto;[^}]*max-height:\s*none;[^}]*\}/,
  "目录列表没有使用剩余高度作为唯一滚动区。",
);

expectNoMatch(
  /\.reader-catalog__list--drawer\s*\{[^}]*max-height:\s*calc\(100dvh\s*-\s*\d+px\);[^}]*\}/,
  "目录列表仍依赖脆弱的视口高度减常量计算，顶部内容变化后会再次产生双滚动条。",
);

if (failures.length > 0) {
  console.error("Reader page layout verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Reader page layout verification passed.");
