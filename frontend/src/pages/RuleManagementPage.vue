<template>
  <div class="rule-page">
    <PageHeader
      eyebrow="Chapter Rules"
      title="目录规则"
      subtitle="统一管理内置规则与自定义规则：验证章节识别效果、切换默认规则，并把规则应用到具体书籍。"
    >
      <template #actions>
        <Button variant="outline" :disabled="loading" @click="loadInitialData">刷新页面</Button>
        <Button @click="openCreateModal">新增自定义规则</Button>
      </template>
    </PageHeader>

    <div class="rule-page__stats">
      <div class="rule-page__stat">
        <span class="rule-page__stat-label">规则总数</span>
        <strong class="rule-page__stat-value">{{ rules.length }}</strong>
      </div>
      <div class="rule-page__stat">
        <span class="rule-page__stat-label">内置规则</span>
        <strong class="rule-page__stat-value">{{ builtInRules.length }}</strong>
      </div>
      <div class="rule-page__stat">
        <span class="rule-page__stat-label">自定义规则</span>
        <strong class="rule-page__stat-value">{{ customRules.length }}</strong>
      </div>
      <div class="rule-page__stat">
        <span class="rule-page__stat-label">默认规则</span>
        <strong class="rule-page__stat-value rule-page__stat-value--text">{{ defaultRuleName }}</strong>
      </div>
    </div>

    <Alert v-if="pageError" variant="destructive" class="rule-page__alert">
      {{ pageError }}
    </Alert>

    <!-- 规则列表 -->
    <section class="rule-page__card">
      <header class="rule-page__card-header">
        <span class="rule-page__card-title">规则列表</span>
        <span class="rule-page__card-subtitle">内置与自定义规则，可设为默认或带入下方测试</span>
      </header>

      <div class="rule-page__card-body">
        <div v-if="loading" class="rule-list" aria-label="规则加载中">
          <Skeleton v-for="i in 3" :key="i" class="h-32 w-full" />
        </div>

        <PageStatusPanel
          v-else-if="rules.length === 0"
          variant="empty"
          title="还没有可展示的规则"
          description="点击右上角“新增自定义规则”创建第一条规则，或刷新页面重试。"
        />

        <template v-else>
          <div class="rule-list">
            <article
              v-for="rule in paginatedRules"
              :key="rule.id"
              class="rule-item"
            >
              <div class="rule-item__head">
                <div class="rule-item__title-block">
                  <strong class="rule-item__title">{{ rule.rule_name }}</strong>
                  <div class="rule-item__badges">
                    <Badge variant="secondary">{{ rule.is_builtin ? "内置" : "自定义" }}</Badge>
                    <Badge v-if="rule.is_default" variant="default">当前默认</Badge>
                  </div>
                </div>
                <span class="rule-item__time">{{ formatDateTime(rule.updated_at) }}</span>
              </div>

              <code class="rule-code-block">{{ rule.regex_pattern }}</code>

              <div class="rule-item__meta">
                <span class="rule-item__flags">Flags：{{ rule.flags || "无 flags" }}</span>
                <p class="rule-item__description">{{ rule.description || "暂无说明" }}</p>
              </div>

              <div
                class="rule-item__actions"
                :class="{ 'rule-item__actions--stack': isMobileViewport }"
              >
                <Button size="sm" variant="outline" @click="loadRuleIntoTest(rule)">带入测试</Button>
                <Button size="sm" variant="ghost" @click="loadRuleIntoApply(rule)">应用到书</Button>
                <Button
                  size="sm"
                  :variant="rule.is_default ? 'default' : 'outline'"
                  :disabled="rule.is_default"
                  @click="void handleSetDefault(rule)"
                >
                  {{ rule.is_default ? "默认中" : "设为默认" }}
                </Button>
                <Button
                  v-if="!rule.is_builtin"
                  size="sm"
                  variant="ghost"
                  @click="openEditModal(rule)"
                >
                  编辑
                </Button>
                <Button
                  v-if="!rule.is_builtin"
                  size="sm"
                  variant="ghost"
                  class="rule-action--danger"
                  @click="confirmDelete(rule)"
                >
                  删除
                </Button>
              </div>
            </article>
          </div>

          <div v-if="totalPages > 1" class="rule-page__pagination">
            <Button
              variant="ghost"
              size="sm"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              上一页
            </Button>
            <span class="rule-page__page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
            <Button
              variant="ghost"
              size="sm"
              :disabled="currentPage >= totalPages"
              @click="goToPage(currentPage + 1)"
            >
              下一页
            </Button>
          </div>
        </template>
      </div>
    </section>

    <!-- 应用到书籍 -->
    <section class="rule-page__card">
      <header class="rule-page__card-header">
        <span class="rule-page__card-title">将规则应用到书籍</span>
        <span class="rule-page__card-subtitle">选择规则与目标书籍，立即触发重新解析</span>
      </header>

      <div class="rule-page__card-body rule-apply">
        <div class="rule-apply__form">
          <div class="rule-form__fields">
            <div class="rule-form__field">
              <label>当前应用规则</label>
              <Input :model-value="currentApplyRuleName || '未指定，请先选择一条规则'" readonly />
            </div>

            <div class="rule-form__field">
              <label>目录规则</label>
              <Select v-model="quickApplyState.rule_id" :disabled="loading || ruleOptions.length === 0 || applyPending">
                <SelectTrigger>
                  <SelectValue placeholder="选择要应用的目录规则" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in ruleOptions" :key="opt.value" :value="String(opt.value)">{{ opt.label }}</SelectItem>
                </SelectContent>
              </Select>
              <div class="rule-field__hint">
                <span>建议先在下方测试区验证命中效果，再应用到真实书籍。</span>
              </div>
            </div>

            <div class="rule-form__field">
              <label>目标书籍</label>
              <Select v-model="quickApplyState.book_id" :disabled="booksLoading || bookOptions.length === 0 || applyPending">
                <SelectTrigger>
                  <SelectValue placeholder="选择要重新解析目录的书" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in bookOptions" :key="opt.value" :value="String(opt.value)">{{ opt.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="rule-pane__actions">
              <Button :disabled="applyPending" @click="runQuickApply">
                应用规则并重解析
              </Button>
              <Button variant="outline" :disabled="applyPending" @click="clearApplyResult">
                清空结果
              </Button>
            </div>
          </div>
        </div>

        <div class="rule-apply__result">
          <Alert v-if="booksError" variant="warning" class="rule-pane__alert">
            {{ booksError }}
          </Alert>

          <Alert v-if="applyErrorMessage" variant="destructive" class="rule-pane__alert">
            {{ applyErrorMessage }}
          </Alert>

          <template v-if="applyResult">
            <div class="rule-summary">
              <div class="rule-summary__item">
                <span>书籍</span>
                <strong>{{ applyResultBookTitle }}</strong>
              </div>
              <div class="rule-summary__item">
                <span>规则</span>
                <strong>{{ applyResultRuleName }}</strong>
              </div>
              <div class="rule-summary__item">
                <span>总章节</span>
                <strong>{{ applyResult.total_chapters }}</strong>
              </div>
            </div>

            <div v-if="applyResult.chapters.length === 0" class="rule-pane__empty">
              <p>这次重解析没有识别出目录</p>
              <p class="rule-pane__empty-sub">可先回到测试区继续调整规则。</p>
            </div>

            <template v-else>
              <div class="rule-result-list">
                <article
                  v-for="chapter in applyPreviewChapters"
                  :key="`${chapter.chapter_index}-${chapter.start_offset}`"
                  class="rule-result-item"
                >
                  <div class="rule-result-item__meta">
                    <span class="rule-result-item__index"># {{ chapter.chapter_index }}</span>
                    <span class="rule-result-item__range">{{ chapter.start_offset }} - {{ chapter.end_offset }}</span>
                  </div>
                  <code class="rule-code-block">{{ chapter.chapter_title }}</code>
                </article>
              </div>
              <p class="rule-pane__note">
                当前展示前 {{ applyPreviewChapters.length }} 条目录预览，完整目录可到书籍详情页继续查看。
              </p>
            </template>
          </template>

          <div v-else class="rule-pane__placeholder">
            <strong>这里会显示应用结果</strong>
            <p>成功后会返回重新解析后的章节数和目录预览，便于你马上判断这条规则是否适合这本书。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 规则测试 -->
    <section class="rule-page__card">
      <header class="rule-page__card-header">
        <span class="rule-page__card-title">规则测试与预览</span>
        <span class="rule-page__card-subtitle">{{ testModeLabel }}</span>
      </header>

      <div class="rule-page__card-body rule-test">
        <div class="rule-test__form">
          <div class="rule-form__fields">
            <div class="rule-form__field">
              <label>当前测试规则</label>
              <Input :model-value="testState.loadedRuleName || '未指定，支持直接手动输入'" readonly />
            </div>

            <div class="rule-form__field">
              <label>regex_pattern</label>
              <textarea
                v-model="testState.regex_pattern"
                rows="4"
                placeholder="例如：^\s*第\s*\d+\s*[章节回].*$"
                class="rule-form__textarea rule-form__textarea--code"
              ></textarea>
              <div class="rule-field__hint">
                <span>示例提示：</span>
                <div class="rule-examples">
                  <Button
                    v-for="example in regexExamples"
                    :key="example.label"
                    size="sm"
                    variant="outline"
                    @click="applyExampleToTest(example)"
                  >
                    {{ example.label }}
                  </Button>
                </div>
              </div>
            </div>

            <div class="rule-form__field">
              <div class="rule-form__label-row">
                <label>Flags</label>
                <Button type="button" variant="ghost" size="sm" class="rule-form__help-btn" @click="testFlagsHelpVisible = !testFlagsHelpVisible">
                  ?
                </Button>
              </div>
              <div class="rule-flags-group">
                <button
                  v-for="opt in FLAG_OPTIONS"
                  :key="opt.key"
                  type="button"
                  class="rule-flag-chip"
                  :class="{ 'rule-flag-chip--active': isFlagActive(testState.flags, opt.key) }"
                  @click="toggleFlag(testState, opt.key)"
                >
                  <Check v-if="isFlagActive(testState.flags, opt.key)" :size="13" />
                  {{ opt.label }}
                </button>
              </div>
              <div v-show="testFlagsHelpVisible" class="rule-flags-help">
                <div v-for="opt in FLAG_OPTIONS" :key="opt.key" class="rule-flags-help__item">
                  <code>{{ opt.label }}</code>
                  <span>{{ opt.description }}</span>
                </div>
              </div>
            </div>

            <div class="rule-form__field">
              <label>测试方式</label>
              <div class="rule-radio-group">
                <label class="rule-form__radio" :class="{ 'rule-form__radio--active': testState.mode === 'book' }">
                  <input v-model="testState.mode" type="radio" value="book" class="sr-only" />
                  <span>选择一本已上传的书</span>
                </label>
                <label class="rule-form__radio" :class="{ 'rule-form__radio--active': testState.mode === 'text' }">
                  <input v-model="testState.mode" type="radio" value="text" class="sr-only" />
                  <span>输入原始文本片段</span>
                </label>
              </div>
            </div>

            <div v-if="testState.mode === 'book'" class="rule-form__field">
              <label>测试书籍</label>
              <Select v-model="testState.book_id" :disabled="booksLoading || bookOptions.length === 0">
                <SelectTrigger>
                  <SelectValue placeholder="选择一本已上传的书" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in bookOptions" :key="opt.value" :value="String(opt.value)">{{ opt.label }}</SelectItem>
                </SelectContent>
              </Select>
              <div class="rule-field__hint">
                <span>适合验证“整本书真实目录是否能被匹配出来”。</span>
              </div>
            </div>

            <div v-else class="rule-form__field">
              <label>原始文本片段</label>
              <textarea
                v-model="testState.text"
                rows="8"
                placeholder="粘贴一段章节标题附近的原始文本，例如：&#10;第1章 初始之夜&#10;风吹过旧城区……"
                class="rule-form__textarea"
              ></textarea>
              <div class="rule-field__hint">
                <span>适合快速验证某个标题样式是否能命中，不必依赖整本书。</span>
              </div>
            </div>

            <div class="rule-pane__actions">
              <Button :disabled="testPending" @click="runRuleTest">
                开始测试
              </Button>
              <Button variant="outline" :disabled="testPending" @click="clearTestResult">
                清空结果
              </Button>
            </div>
          </div>
        </div>

        <div class="rule-test__result">
          <Alert v-if="booksError" variant="warning" class="rule-pane__alert">
            {{ booksError }}
          </Alert>

          <Alert v-if="testErrorMessage" variant="destructive" class="rule-pane__alert">
            {{ testErrorMessage }}
          </Alert>

          <template v-if="testResult">
            <div class="rule-summary">
              <div class="rule-summary__item">
                <span>matched</span>
                <strong>{{ testResult.matched ? "true" : "false" }}</strong>
              </div>
              <div class="rule-summary__item">
                <span>count</span>
                <strong>{{ testResult.count }}</strong>
              </div>
              <div class="rule-summary__item">
                <span>来源</span>
                <strong>{{ testModeLabel }}</strong>
              </div>
            </div>

            <div v-if="testResult.items.length === 0" class="rule-pane__empty">
              <p>这次测试没有找到匹配项</p>
              <p class="rule-pane__empty-sub">可以调整正则或 flags 后再试。</p>
            </div>

            <div v-else class="rule-result-list">
              <article
                v-for="(item, index) in testResult.items"
                :key="`${item.start}-${item.end}-${index}`"
                class="rule-result-item"
              >
                <code class="rule-code-block">{{ item.text }}</code>
                <div class="rule-result-item__meta">
                  <span>start <strong>{{ item.start }}</strong></span>
                  <span>end <strong>{{ item.end }}</strong></span>
                </div>
              </article>
            </div>
          </template>

          <div v-else class="rule-pane__placeholder">
            <strong>这里会显示测试结果</strong>
            <p>你可以先从上面的规则列表里点击“带入测试”，也可以直接手动输入 regex 与 flags。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 新增 / 编辑规则 -->
    <Dialog :open="modalVisible" @update:open="modalVisible = $event">
      <DialogContent class="rule-editor-dialog w-[calc(100%-2rem)] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ modalTitle }}</DialogTitle>
        </DialogHeader>

        <div class="rule-form__body">
          <div class="rule-form__intro">
            <p>自定义规则支持常见正则 flags，例如 <code>IGNORECASE|MULTILINE</code>。</p>
          </div>

          <div class="rule-form__fields">
            <div class="rule-form__field">
              <label>规则名称</label>
              <Input v-model="formModel.rule_name" maxlength="100" placeholder="例如：轻小说章节规则" />
            </div>

            <div class="rule-form__field">
              <label>正则表达式</label>
              <textarea
                v-model="formModel.regex_pattern"
                rows="4"
                placeholder="例如：^\s*第\s*\d+\s*[章节回].*$"
                class="rule-form__textarea rule-form__textarea--code"
              ></textarea>
              <div class="rule-field__hint">
                <span>示例提示：</span>
                <div class="rule-examples">
                  <Button
                    v-for="example in regexExamples"
                    :key="`form-${example.label}`"
                    type="button"
                    size="sm"
                    variant="outline"
                    @click="applyExampleToForm(example)"
                  >
                    {{ example.label }}
                  </Button>
                </div>
              </div>
            </div>

            <div class="rule-form__field">
              <div class="rule-form__label-row">
                <label>Flags</label>
                <Button type="button" variant="ghost" size="sm" class="rule-form__help-btn" @click="formFlagsHelpVisible = !formFlagsHelpVisible">
                  ?
                </Button>
              </div>
              <div class="rule-flags-group">
                <button
                  v-for="opt in FLAG_OPTIONS"
                  :key="opt.key"
                  type="button"
                  class="rule-flag-chip"
                  :class="{ 'rule-flag-chip--active': isFlagActive(formModel.flags, opt.key) }"
                  @click="toggleFlag(formModel, opt.key)"
                >
                  <Check v-if="isFlagActive(formModel.flags, opt.key)" :size="13" />
                  {{ opt.label }}
                </button>
              </div>
              <div v-show="formFlagsHelpVisible" class="rule-flags-help">
                <div v-for="opt in FLAG_OPTIONS" :key="opt.key" class="rule-flags-help__item">
                  <code>{{ opt.label }}</code>
                  <span>{{ opt.description }}</span>
                </div>
              </div>
            </div>

            <div class="rule-form__field">
              <label>说明</label>
              <textarea
                v-model="formModel.description"
                rows="3"
                placeholder="简要说明这个规则适合匹配什么样的章节标题"
                class="rule-form__textarea"
              ></textarea>
            </div>

            <div class="rule-form__field">
              <label class="rule-form__checkbox-label">
                <input v-model="formModel.is_default" type="checkbox" class="rule-form__checkbox" />
                <span>保存后设为默认规则</span>
              </label>
            </div>
          </div>
        </div>

        <div class="rule-form__footer">
          <Button type="button" variant="ghost" :disabled="submitting" @click="closeModal">取消</Button>
          <Button type="button" :disabled="submitting" @click="submitForm">保存规则</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useMediaQuery } from "@vueuse/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-vue-next";
import { notify } from "@/utils/notify";

import { booksApi } from "../api/books";
import { chapterRulesApi } from "../api/chapter-rules";
import { getErrorMessage } from "../api/client";
import PageHeader from "../components/PageHeader.vue";
import PageStatusPanel from "../components/PageStatusPanel.vue";
import { formatDateTime } from "../utils/format";
import type {
  BookReparseResponse,
  BookShelfItem,
  ChapterRule,
  ChapterRuleTestResponse,
} from "../types/api";

interface RuleFormModel {
  rule_name: string;
  regex_pattern: string;
  flags: string;
  description: string;
  is_default: boolean;
}

interface RegexExample {
  label: string;
  pattern: string;
  flags: string;
}

interface RuleTestState {
  mode: "book" | "text";
  book_id: number | null;
  text: string;
  regex_pattern: string;
  flags: string;
  loadedRuleName: string | null;
}

interface QuickApplyState {
  rule_id: number | null;
  book_id: number | null;
}

const MOBILE_BREAKPOINT = 720;

const regexExamples: RegexExample[] = [
  {
    label: "中文章节",
    pattern: "^\\s*第\\s*[0-9零〇一二两三四五六七八九十百千万]+\\s*[章节回篇]\\s*.*$",
    flags: "MULTILINE",
  },
  {
    label: "英文章节",
    pattern: "^\\s*chapter\\s+\\d+\\s*.*$",
    flags: "IGNORECASE|MULTILINE",
  },
  {
    label: "卷章混合",
    pattern: "^\\s*第\\s*[0-9零〇一二两三四五六七八九十百千万]+\\s*卷\\s+第\\s*[0-9零〇一二两三四五六七八九十百千万]+\\s*[章节回]\\s*.*$",
    flags: "MULTILINE",
  },
];

const FLAG_OPTIONS = [
  { key: "IGNORECASE", label: "IGNORECASE", description: "忽略大小写匹配" },
  { key: "MULTILINE", label: "MULTILINE", description: "^ 和 $ 匹配每行的开头和结尾" },
  { key: "DOTALL", label: "DOTALL", description: ". 匹配包括换行符在内的所有字符" },
  { key: "VERBOSE", label: "VERBOSE", description: "允许在正则中插入注释和空白" },
  { key: "FULL_TEXT", label: "FULL_TEXT", description: "不解析章节，整本书作为一个章节" },
] as const;


const rules = ref<ChapterRule[]>([]);
const books = ref<BookShelfItem[]>([]);
const loading = ref(false);
const booksLoading = ref(false);
const submitting = ref(false);
const testPending = ref(false);
const applyPending = ref(false);
const isMobileViewport = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
const pageError = ref<string | null>(null);
const booksError = ref<string | null>(null);
const testErrorMessage = ref<string | null>(null);
const applyErrorMessage = ref<string | null>(null);
const testResult = ref<ChapterRuleTestResponse | null>(null);
const applyResult = ref<BookReparseResponse | null>(null);
const modalVisible = ref(false);
const editingRuleId = ref<number | null>(null);
const formFlagsHelpVisible = ref(false);
const testFlagsHelpVisible = ref(false);
const formModel = reactive<RuleFormModel>(createEmptyForm());
const testState = reactive<RuleTestState>({
  mode: "book",
  book_id: null,
  text: "",
  regex_pattern: "",
  flags: "",
  loadedRuleName: null,
});
const quickApplyState = reactive<QuickApplyState>({
  rule_id: null,
  book_id: null,
});

const pageSize = 8;
const currentPage = ref(1);

const paginatedRules = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return rules.value.slice(start, start + pageSize);
});

const totalPages = computed(() => Math.ceil(rules.value.length / pageSize));

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
}



const builtInRules = computed(() => rules.value.filter((rule) => rule.is_builtin));
const customRules = computed(() => rules.value.filter((rule) => !rule.is_builtin));
const defaultRuleName = computed(() => {
  return rules.value.find((rule) => rule.is_default)?.rule_name || "未设置";
});
const modalTitle = computed(() => {
  return editingRuleId.value ? "编辑自定义规则" : "新增自定义规则";
});
const bookOptions = computed(() => {
  return books.value.map((book) => ({
    label: book.title,
    value: book.id,
  }));
});
const ruleOptions = computed(() => {
  return rules.value.map((rule) => ({
    label: rule.is_default ? `${rule.rule_name} · 当前默认` : rule.rule_name,
    value: rule.id,
  }));
});
const testModeLabel = computed(() => {
  return testState.mode === "book" ? "书籍测试" : "原始文本片段测试";
});
const currentApplyRuleName = computed(() => {
  return rules.value.find((rule) => rule.id === quickApplyState.rule_id)?.rule_name || "";
});
const applyResultBookTitle = computed(() => {
  return books.value.find((book) => book.id === applyResult.value?.book_id)?.title || "目标书籍";
});
const applyResultRuleName = computed(() => {
  return rules.value.find((rule) => rule.id === applyResult.value?.chapter_rule_id)?.rule_name || "目录规则";
});
const applyPreviewChapters = computed(() => {
  return (applyResult.value?.chapters || []).slice(0, 6);
});

function createEmptyForm(): RuleFormModel {
  return {
    rule_name: "",
    regex_pattern: "",
    flags: "",
    description: "",
    is_default: false,
  };
}

function parseFlagsString(flagsStr: string): string[] {
  if (!flagsStr.trim()) return [];
  return flagsStr.split(/[|,\s]+/).filter(Boolean);
}

function isFlagActive(flagsStr: string, key: string): boolean {
  return parseFlagsString(flagsStr).includes(key);
}

function toggleFlag(target: { flags: string }, key: string) {
  const keys = parseFlagsString(target.flags);
  const index = keys.indexOf(key);
  if (index >= 0) {
    keys.splice(index, 1);
  } else {
    keys.push(key);
  }
  target.flags = keys.join("|");
}

function resetForm() {
  Object.assign(formModel, createEmptyForm());
}

function getFallbackRule() {
  return rules.value.find((rule) => rule.is_default) || rules.value[0] || null;
}

function applyExampleToForm(example: RegexExample) {
  formModel.regex_pattern = example.pattern;
  formModel.flags = example.flags;
}

function applyExampleToTest(example: RegexExample) {
  testState.regex_pattern = example.pattern;
  testState.flags = example.flags;
  testState.loadedRuleName = `${example.label} 示例`;
  clearTestResult();
}

function loadRuleIntoTest(rule: ChapterRule, shouldNotify = true) {
  testState.regex_pattern = rule.regex_pattern;
  testState.flags = rule.flags;
  testState.loadedRuleName = rule.rule_name;
  clearTestResult();

  if (shouldNotify) {
    notify.success(`已将“${rule.rule_name}”带入测试区`);
  }
}

function loadRuleIntoApply(rule: ChapterRule, shouldNotify = true) {
  quickApplyState.rule_id = rule.id;
  clearApplyResult();

  if (shouldNotify) {
    notify.success(`已选中“${rule.rule_name}”，现在可以直接应用到书籍`);
  }
}

function hydrateDefaultRuleToTest() {
  if (testState.regex_pattern.trim()) {
    return;
  }

  const fallbackRule = getFallbackRule();
  if (!fallbackRule) {
    return;
  }

  loadRuleIntoTest(fallbackRule, false);
}

function hydrateDefaultRuleToApply() {
  if (quickApplyState.rule_id && rules.value.some((rule) => rule.id === quickApplyState.rule_id)) {
    return;
  }

  const fallbackRule = getFallbackRule();
  if (!fallbackRule) {
    quickApplyState.rule_id = null;
    return;
  }

  loadRuleIntoApply(fallbackRule, false);
}

function openCreateModal() {
  editingRuleId.value = null;
  resetForm();
  modalVisible.value = true;
}

function openEditModal(rule: ChapterRule) {
  editingRuleId.value = rule.id;
  Object.assign(formModel, {
    rule_name: rule.rule_name,
    regex_pattern: rule.regex_pattern,
    flags: rule.flags,
    description: rule.description || "",
    is_default: rule.is_default,
  });
  modalVisible.value = true;
}

function resetAndCloseModal() {
  modalVisible.value = false;
  editingRuleId.value = null;
  resetForm();
}

function closeModal() {
  if (submitting.value) {
    return;
  }

  resetAndCloseModal();
}

async function loadRules() {
  currentPage.value = 1;
  loading.value = true;
  pageError.value = null;

  try {
    rules.value = await chapterRulesApi.list();
    hydrateDefaultRuleToTest();
    hydrateDefaultRuleToApply();
  } catch (error) {
    rules.value = [];
    pageError.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function loadBooks() {
  booksLoading.value = true;
  booksError.value = null;

  try {
    books.value = await booksApi.list();

    const firstBookId = books.value[0]?.id ?? null;
    const hasTestBook = !!books.value.find((book) => book.id === testState.book_id);
    const hasApplyBook = !!books.value.find((book) => book.id === quickApplyState.book_id);

    if (!hasTestBook) {
      testState.book_id = firstBookId;
    }

    if (!hasApplyBook) {
      quickApplyState.book_id = firstBookId;
    }
  } catch (error) {
    books.value = [];
    booksError.value = getErrorMessage(error);
  } finally {
    booksLoading.value = false;
  }
}

async function loadInitialData() {
  await Promise.all([loadRules(), loadBooks()]);
}

async function submitForm() {
  const ruleName = formModel.rule_name.trim();
  const regexPattern = formModel.regex_pattern.trim();

  if (!ruleName) {
    notify.info("请先填写规则名称");
    return;
  }

  if (!regexPattern) {
    notify.info("请先填写正则表达式");
    return;
  }

  submitting.value = true;

  try {
    const payload = {
      rule_name: ruleName,
      regex_pattern: regexPattern,
      flags: formModel.flags.trim(),
      description: formModel.description.trim() || null,
      is_default: formModel.is_default,
    };

    if (editingRuleId.value) {
      await chapterRulesApi.update(editingRuleId.value, payload);
      notify.success("规则已更新");
    } else {
      await chapterRulesApi.create(payload);
      notify.success("规则已创建");
    }

    resetAndCloseModal();
    await loadRules();
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function handleSetDefault(rule: ChapterRule) {
  if (rule.is_default) {
    return;
  }

  try {
    await chapterRulesApi.update(rule.id, { is_default: true });
    notify.success(`已将“${rule.rule_name}”设为默认规则`);
    await loadRules();
  } catch (error) {
    notify.error(getErrorMessage(error));
  }
}

async function confirmDelete(rule: ChapterRule) {
  const confirmed = await notify.confirm(`删除后无法恢复，确认删除「${rule.rule_name}」吗？`, {
    title: "删除目录规则",
    confirmLabel: "确认删除",
    destructive: true,
  });
  if (confirmed) {
    void handleDelete(rule);
  }
}

async function handleDelete(rule: ChapterRule) {
  try {
    await chapterRulesApi.remove(rule.id);
    notify.success(`已删除“${rule.rule_name}”`);
    await loadRules();
  } catch (error) {
    notify.error(getErrorMessage(error));
  }
}

function clearTestResult() {
  testResult.value = null;
  testErrorMessage.value = null;
}

function clearApplyResult() {
  applyResult.value = null;
  applyErrorMessage.value = null;
}

function getFriendlyTestError(error: unknown) {
  const raw = getErrorMessage(error);
  const normalized = raw.toLowerCase();

  if (raw.includes("Either book_id or text is required")) {
    return "请选择一本书或输入一段原始文本后再开始测试。";
  }

  if (normalized.includes("regex") || normalized.includes("pattern") || normalized.includes("unterminated") || normalized.includes("nothing to repeat") || normalized.includes("bad escape") || normalized.includes("missing")) {
    return `正则表达式有误：${raw}`;
  }

  if (normalized.includes("book not found")) {
    return "找不到你选中的书籍，请刷新列表后重试。";
  }

  return raw;
}

function getFriendlyApplyError(error: unknown) {
  const raw = getErrorMessage(error);
  const normalized = raw.toLowerCase();

  if (normalized.includes("book not found")) {
    return "找不到你选中的书籍，请刷新书架列表后重试。";
  }

  if (normalized.includes("rule not found") || normalized.includes("chapter rule")) {
    return "找不到你选中的目录规则，请刷新规则列表后重试。";
  }

  return raw;
}

async function runRuleTest() {
  clearTestResult();

  const regexPattern = testState.regex_pattern.trim();
  const flags = testState.flags.trim();

  if (!regexPattern) {
    testErrorMessage.value = "请先输入要测试的正则表达式。";
    return;
  }

  if (testState.mode === "book" && !testState.book_id) {
    testErrorMessage.value = "请先选择一本已上传的书。";
    return;
  }

  if (testState.mode === "text" && !testState.text.trim()) {
    testErrorMessage.value = "请先输入原始文本片段。";
    return;
  }

  testPending.value = true;

  try {
    testResult.value = await chapterRulesApi.test(
      testState.mode === "book"
        ? {
            book_id: testState.book_id || undefined,
            regex_pattern: regexPattern,
            flags,
          }
        : {
            text: testState.text.trim(),
            regex_pattern: regexPattern,
            flags,
          },
    );

    notify.success("规则测试已完成");
  } catch (error) {
    testErrorMessage.value = getFriendlyTestError(error);
  } finally {
    testPending.value = false;
  }
}

async function runQuickApply() {
  clearApplyResult();

  if (!quickApplyState.rule_id) {
    applyErrorMessage.value = "请先选择要应用的目录规则。";
    return;
  }

  if (!quickApplyState.book_id) {
    applyErrorMessage.value = "请先选择一本要重新解析目录的书。";
    return;
  }

  applyPending.value = true;

  try {
    applyResult.value = await booksApi.reparse(quickApplyState.book_id, quickApplyState.rule_id);

    const bookTitle = books.value.find((book) => book.id === quickApplyState.book_id)?.title || "目标书籍";
    const ruleName = rules.value.find((rule) => rule.id === quickApplyState.rule_id)?.rule_name || "目录规则";

    notify.success(`已将“${ruleName}”应用到《${bookTitle}》，共识别 ${applyResult.value.total_chapters} 个章节`);
  } catch (error) {
    applyErrorMessage.value = getFriendlyApplyError(error);
  } finally {
    applyPending.value = false;
  }
}

onMounted(() => {
  void loadInitialData();
});
</script>

<style scoped>
.rule-page {
  width: min(100%, 1200px);
  margin: 0 auto;
  display: grid;
  gap: var(--space-5);
}

.rule-page,
.rule-list,
.rule-item,
.rule-test,
.rule-apply,
.rule-test__form,
.rule-test__result,
.rule-apply__form,
.rule-apply__result,
.rule-result-list,
.rule-result-item {
  min-width: 0;
}

/* 统计行：轻量 stat 块 */
.rule-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
}

.rule-page__stat {
  padding: 14px 16px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-stat-bg);
}

.rule-page__stat-label {
  display: block;
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.rule-page__stat-value {
  display: block;
  margin-top: 6px;
  font-family: var(--font-display);
  font-size: 22px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.rule-page__stat-value--text {
  font-size: 16px;
  line-height: 1.5;
}

.rule-page__alert {
  border-radius: var(--radius-md);
}

/* 分区卡片：1px 细边框 + 柔和圆角 + 卡片底色 */
.rule-page__card {
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-md);
  background: var(--surface-card-bg);
  overflow: hidden;
}

.rule-page__card-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color-soft);
}

.rule-page__card-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.rule-page__card-subtitle {
  color: var(--text-secondary);
  font-size: 13px;
}

.rule-page__card-body {
  padding: 18px 20px;
}

/* 规则列表：统一卡片式列表，桌面移动共用一份模板 */
.rule-list {
  display: grid;
  gap: var(--space-3);
}

.rule-item {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-md);
}

.rule-item__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px 16px;
}

.rule-item__title-block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.rule-item__title {
  font-size: 15px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.rule-item__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-item__time {
  color: var(--text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.rule-item__meta {
  display: grid;
  gap: 6px;
}

.rule-item__flags {
  color: var(--text-secondary);
  font-size: 12px;
}

.rule-item__description {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.75;
}

.rule-item__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-item__actions--stack {
  display: grid;
  grid-template-columns: 1fr;
}

.rule-action--danger {
  color: var(--alert-destructive-text);
}

.rule-page__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: var(--space-4);
}

.rule-page__page-info {
  color: var(--text-secondary);
  font-size: 13px;
}

/* 等宽代码块：正则 / 匹配文本 */
.rule-code-block {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 12px 14px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-code-bg);
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre;
  overflow-x: auto;
  overflow-y: hidden;
  box-sizing: border-box;
}

/* 测试 / 应用双栏布局 */
.rule-test,
.rule-apply {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: var(--space-5);
  align-items: start;
}

.rule-apply__result,
.rule-test__result {
  display: grid;
  gap: var(--space-3);
  align-content: start;
  padding: 16px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-panel-soft-bg);
}

.rule-pane__alert {
  border-radius: var(--radius-sm);
}

.rule-pane__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.rule-pane__placeholder {
  display: grid;
  gap: 8px;
  align-content: center;
  min-height: 180px;
  text-align: center;
  justify-items: center;
  padding: 12px;
}

.rule-pane__placeholder strong {
  font-family: var(--font-display);
  font-size: 17px;
}

.rule-pane__placeholder p,
.rule-pane__note {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.rule-pane__empty {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 24px 0 8px;
  color: var(--text-secondary);
  text-align: center;
}

.rule-pane__empty p {
  margin: 0;
}

.rule-pane__empty-sub {
  font-size: 13px;
}

/* 结果摘要 */
.rule-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.rule-summary__item {
  padding: 12px 14px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-stat-bg);
}

.rule-summary__item span {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
}

.rule-summary__item strong {
  display: block;
  margin-top: 6px;
  font-size: 16px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

/* 结果列表：数据驱动的自适应网格，桌面多列、移动单列 */
.rule-result-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-3);
}

.rule-result-item {
  display: grid;
  gap: 10px;
  align-content: start;
  padding: 12px 14px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-card-bg);
}

.rule-result-item__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

.rule-result-item__meta strong {
  color: var(--text-primary);
  font-weight: 600;
}

.rule-result-item__index {
  font-weight: 600;
}

/* 表单 */
.rule-form__fields {
  display: grid;
  gap: 16px;
}

.rule-form__field {
  display: grid;
  gap: 8px;
}

.rule-form__field label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.rule-form__label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-form__help-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-secondary);
}

.rule-form__textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-input-bg);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
  outline: none;
  transition: border-color 160ms ease;
  box-sizing: border-box;
}

.rule-form__textarea:focus {
  border-color: var(--primary-color);
}

.rule-form__textarea--code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 13px;
}

.rule-field__hint {
  display: grid;
  gap: 10px;
  width: 100%;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.7;
}

.rule-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* flags 选择 chip */
.rule-flags-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-flag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--border-color-soft);
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.rule-flag-chip:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.rule-flag-chip--active {
  border-color: var(--primary-color);
  background: var(--primary-soft);
  color: var(--primary-color);
}

.rule-flags-help {
  margin-top: 4px;
  padding: 12px 16px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-panel-soft-bg);
  display: grid;
  gap: 8px;
}

.rule-flags-help__item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 13px;
}

.rule-flags-help__item code {
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--surface-code-bg);
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.rule-flags-help__item span {
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 单选（测试方式） */
.rule-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-form__radio {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.rule-form__radio:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.rule-form__radio--active {
  border-color: var(--primary-color);
  background: var(--primary-soft);
  color: var(--primary-color);
  font-weight: 600;
}

.rule-form__radio input {
  position: absolute;
  opacity: 0;
}

/* 编辑 Dialog */
.rule-editor-dialog {
  max-height: calc(100dvh - 32px);
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.rule-form__body {
  min-height: 0;
  margin: 0 -8px;
  padding: 0 8px;
  overflow-y: auto;
}

.rule-form__intro {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-panel-soft-bg);
}

.rule-form__intro p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.rule-form__intro code {
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--surface-code-bg);
  color: var(--primary-color);
  font-size: 12px;
}

.rule-form__checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.rule-form__checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.rule-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-soft);
  background: var(--dialog-bg);
}

@media (max-width: 960px) {
  .rule-test,
  .rule-apply {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .rule-page {
    gap: var(--space-4);
  }

  .rule-page__card-header,
  .rule-page__card-body {
    padding: 14px 16px;
  }

  .rule-page__card-subtitle {
    display: none;
  }

  .rule-page__stat {
    padding: 12px 12px;
  }

  .rule-page__stat-value {
    font-size: 18px;
  }

  .rule-page__stat-value--text {
    font-size: 14px;
  }

  .rule-item {
    padding: 14px;
  }

  .rule-item__time {
    white-space: normal;
  }

  .rule-summary {
    grid-template-columns: 1fr;
  }

  .rule-result-list {
    grid-template-columns: 1fr;
  }

  .rule-pane__actions,
  .rule-form__footer {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
