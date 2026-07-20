<template>
  <div class="book-detail-page">
    <div class="book-detail-page__container">
      <!-- Topbar -->
      <div class="book-detail-page__topbar">
        <Button variant="outline" size="sm" @click="goBack">返回书架</Button>
        <span class="book-detail-page__crumb">Book ID: {{ bookId }}</span>
      </div>

      <!-- Loading -->
      <template v-if="loading">
        <div class="detail-hero">
          <Skeleton class="detail-hero__cover" />
          <div class="detail-hero__body">
            <Skeleton class="h-6 w-24 rounded-full" />
            <Skeleton class="h-10 w-3/4" />
            <Skeleton class="h-5 w-1/3" />
            <Skeleton class="h-16 w-full" />
            <div class="flex flex-wrap gap-2">
              <Skeleton v-for="i in 4" :key="i" class="h-7 w-24 rounded-full" />
            </div>
            <div class="flex flex-wrap gap-3 pt-2">
              <Skeleton class="h-11 w-32" />
              <Skeleton class="h-11 w-28" />
              <Skeleton class="h-11 w-28" />
            </div>
          </div>
        </div>
        <div class="detail-grid">
          <Skeleton v-for="i in 2" :key="i" class="h-64 w-full" />
          <Skeleton class="detail-card--full h-72 w-full" />
        </div>
      </template>

      <!-- Error -->
      <page-status-panel
        v-else-if="pageError"
        variant="error"
        title="书籍详情暂时无法加载"
        :description="pageError"
      >
        <template #action>
          <Button @click="reloadPage">重新加载</Button>
        </template>
      </page-status-panel>

      <!-- Content -->
      <template v-else-if="book">
        <!-- Hero -->
        <div class="detail-hero">
          <BookCover
            class="detail-hero__cover"
            :title="book.title"
            :cover-url="book.cover_url"
          />

          <div class="detail-hero__body">
            <div class="detail-hero__eyebrow">Book Detail</div>
            <h1 class="detail-hero__title">{{ book.title }}</h1>
            <p class="detail-hero__author">{{ book.author || "作者未填写" }}</p>
            <p class="detail-hero__description">
              {{ book.description || "这本书还没有补充简介，你可以先查看目录、继续阅读，或切换目录规则后重新解析。" }}
            </p>

            <div class="detail-hero__tags">
              <Badge variant="secondary">总章节 {{ formatNumber(book.total_chapters) }}</Badge>
              <Badge variant="secondary">总字数 {{ formatWordCount(book.total_words) }}</Badge>
              <Badge variant="secondary">当前规则 {{ currentRuleName }}</Badge>
              <Badge variant="secondary">{{ progressTagLabel }}</Badge>
              <Badge variant="secondary">{{ progressPercentLabel }}</Badge>
            </div>

            <div class="detail-hero__progress">
              <ProgressBar :percent="progressPercentValue" />
              <div class="detail-hero__progress-text">
                <span>{{ progressTagLabel }}</span>
                <span>{{ progressPercentLabel }}</span>
              </div>
            </div>

            <div class="detail-hero__actions">
              <Button size="lg" :disabled="readingPending" @click="handleReadAction">
                {{ readActionLabel }}
              </Button>
              <Button variant="outline" size="lg" @click="openCatalog">查看目录</Button>
              <Button variant="outline" size="lg" @click="openEditor">编辑信息</Button>
            </div>
          </div>
        </div>

        <!-- Cards Grid -->
        <div class="detail-grid">
          <!-- 阅读信息 -->
          <div class="detail-card">
            <div class="detail-card__header">
              <span class="detail-card__heading">阅读信息</span>
            </div>
            <div class="detail-card__body">
              <div class="detail-info-grid">
                <div class="detail-info-item">
                  <span class="detail-info-item__label">作者</span>
                  <strong class="detail-info-item__value">{{ book.author || "未填写" }}</strong>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-item__label">阅读进度</span>
                  <strong class="detail-info-item__value">{{ progressPercentLabel }}</strong>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-item__label">最近阅读</span>
                  <strong class="detail-info-item__value">{{ formatOptionalDate(book.recent_read_at) }}</strong>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-item__label">阅读定位</span>
                  <strong class="detail-info-item__value">{{ progressTagLabel }}</strong>
                </div>
                <div class="detail-info-item detail-info-item--wide">
                  <span class="detail-info-item__label">简介</span>
                  <strong class="detail-info-item__value detail-info-item__value--pre">{{ book.description || "暂无简介" }}</strong>
                </div>
              </div>

              <div class="detail-group-list" v-if="book.groups?.length">
                <span class="detail-group-list__label">分组</span>
                <div class="detail-group-list__tags">
                  <Badge v-for="group in book.groups" :key="group.id" variant="secondary">
                    {{ group.name }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <!-- 文件信息 -->
          <div class="detail-card">
            <div class="detail-card__header">
              <span class="detail-card__heading">文件信息</span>
            </div>
            <div class="detail-card__body">
              <div class="detail-info-grid">
                <div class="detail-info-item">
                  <span class="detail-info-item__label">文件名</span>
                  <strong class="detail-info-item__value">{{ book.file_name }}</strong>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-item__label">编码</span>
                  <strong class="detail-info-item__value">{{ book.encoding }}</strong>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-item__label">收录时间</span>
                  <strong class="detail-info-item__value">{{ formatDate(book.created_at) }}</strong>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-item__label">更新时间</span>
                  <strong class="detail-info-item__value">{{ formatDate(book.updated_at) }}</strong>
                </div>
              </div>

              <div class="detail-file-path">
                <span class="detail-file-path__label">本地文件</span>
                <code>{{ book.file_path }}</code>
              </div>
            </div>
          </div>

          <!-- 目录规则 -->
          <div class="detail-card detail-card--full">
            <div class="detail-card__header">
              <span class="detail-card__heading">目录规则</span>
            </div>
            <div class="detail-card__body">
              <div class="detail-rule-card">
                <div class="detail-rule-card__current">
                  <span>当前使用</span>
                  <strong>{{ currentRuleName }}</strong>
                  <p>{{ currentRuleDescription }}</p>
                </div>

                <Alert v-if="rulesError" variant="warning" class="detail-rule-card__alert">
                  {{ rulesError }}
                </Alert>

                <div class="detail-rule-card__actions">
                  <Select v-model="selectedRuleId" :disabled="reparsePending || ruleOptions.length === 0">
                    <SelectTrigger>
                      <SelectValue placeholder="选择目录规则" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="opt in ruleOptions" :key="opt.value" :value="String(opt.value)">
                        {{ opt.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    :disabled="reparsePending || !selectedRuleId"
                    @click="handleReparse"
                  >
                    {{ reparsePending ? "解析中..." : "重新解析目录" }}
                  </Button>
                </div>

                <section v-if="selectedRule" class="detail-rule-preview" aria-live="polite">
                  <div class="detail-rule-preview__header">
                    <div>
                      <span>应用后预览</span>
                      <strong>{{ selectedRule.rule_name }}</strong>
                    </div>
                    <Badge v-if="rulePreview" variant="secondary">
                      共 {{ formatNumber(rulePreview.totalChapters) }} 章
                    </Badge>
                  </div>

                  <p class="detail-rule-preview__description">
                    {{ selectedRule.description || "该规则暂无说明。" }}
                  </p>

                  <div v-if="rulePreviewPending" class="detail-rule-preview__loading">
                    <Skeleton v-for="index in 4" :key="index" class="h-8 w-full" />
                  </div>

                  <Alert v-else-if="rulePreviewError" variant="destructive" class="detail-rule-card__alert">
                    {{ rulePreviewError }}
                  </Alert>

                  <template v-else-if="rulePreview">
                    <Alert v-if="rulePreview.usedFallback" variant="warning" class="detail-rule-card__alert">
                      该规则没有匹配到章节标题，应用后将按“全文”单章节模式展示。
                    </Alert>
                    <ol class="detail-rule-preview__list">
                      <li v-for="(title, index) in rulePreview.titles" :key="`${index}-${title}`">
                        <span>{{ formatNumber(index + 1) }}</span>
                        <strong>{{ title }}</strong>
                      </li>
                    </ol>
                    <p class="detail-rule-preview__note">
                      当前展示前 {{ Math.min(rulePreview.totalChapters, 10) }} 章，共匹配
                      {{ formatNumber(rulePreview.totalChapters) }} 章。
                    </p>
                  </template>
                </section>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Catalog Drawer -->
      <chapter-catalog-modal-drawer
        v-model:show="catalogVisible"
        :book-title="book?.title ?? ''"
        :chapter-count="book?.total_chapters ?? 0"
        :chapters="chapters"
        @select="handleCatalogSelect"
      />

      <!-- Editor Dialog -->
      <Dialog :open="editorVisible" @update:open="editorVisible = $event">
        <DialogContent class="metadata-modal max-w-3xl">
          <div class="metadata-modal__layout">
            <div class="metadata-modal__cover-panel">
              <BookCover
                class="metadata-modal__cover"
                :title="book?.title ?? ''"
                :cover-url="book?.cover_url"
                fallback-text="点击上传封面"
                @click="coverInputRef?.click()"
              />
              <div class="metadata-modal__cover-actions">
                <Button variant="outline" size="sm" :disabled="coverUploading" @click="coverInputRef?.click()">
                  {{ coverUploading ? "上传中..." : "上传封面" }}
                </Button>
                <Button
                  v-if="book?.cover_url"
                  variant="ghost"
                  size="sm"
                  :disabled="coverDeleting"
                  @click="handleRemoveCover"
                >
                  {{ coverDeleting ? "删除中..." : "删除封面" }}
                </Button>
              </div>
              <input
                ref="coverInputRef"
                type="file"
                accept="image/*"
                class="sr-only"
                @change="handleCoverUpload"
              />
            </div>

            <div class="metadata-modal__form">
              <div class="metadata-modal__field">
                <span>书名</span>
                <Input v-model="editableTitle" placeholder="输入书名" />
              </div>
              <div class="metadata-modal__field">
                <span>作者</span>
                <Input v-model="editableAuthor" placeholder="输入作者" />
              </div>
              <div class="metadata-modal__field">
                <span>简介</span>
                <textarea
                  v-model="editableDescription"
                  class="metadata-modal__textarea"
                  placeholder="输入简介"
                />
              </div>
              <div class="metadata-modal__footer">
                <Button variant="ghost" @click="editorVisible = false">取消</Button>
                <Button :disabled="metadataSaving" @click="handleSaveMetadata">
                  {{ metadataSaving ? "保存中..." : "保存" }}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Dialog,
  DialogContent,
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
import { notify } from "@/utils/notify";

import { booksApi } from "../api/books";
import { ApiError, getErrorMessage } from "../api/client";
import { chapterRulesApi } from "../api/chapter-rules";
import BookCover from "../components/BookCover.vue";
import ProgressBar from "../components/ProgressBar.vue";
import ChapterCatalogModalDrawer from "../components/ChapterCatalogModalDrawer.vue";
import PageStatusPanel from "../components/PageStatusPanel.vue";
import type { BookChapter, BookDetail, ChapterRule, ReadingProgress } from "../types/api";
import { formatDateTime, formatNumber, formatPercent, formatWordCount } from "../utils/format";
import { useBooksCacheStore } from "../stores/booksCache";

const props = defineProps<{
  bookId: number;
}>();

const router = useRouter();
const booksCacheStore = useBooksCacheStore();

const BOOK_METADATA_UPDATED_EVENT = "books:metadata-updated";
const book = ref<BookDetail | null>(null);
const chapters = ref<BookChapter[]>([]);
const rules = ref<ChapterRule[]>([]);
const progress = ref<ReadingProgress | null>(null);
const selectedRuleId = ref<number | null>(null);
const loading = ref(true);
const pageError = ref<string | null>(null);
const rulesError = ref<string | null>(null);
const readingPending = ref(false);
const reparsePending = ref(false);
const editorVisible = ref(false);
const metadataSaving = ref(false);
const coverUploading = ref(false);
const coverDeleting = ref(false);
const catalogVisible = ref(false);
const editableTitle = ref("");
const editableAuthor = ref("");
const editableDescription = ref("");
const rulePreviewPending = ref(false);
const rulePreviewError = ref<string | null>(null);
const rulePreview = ref<RulePreview | null>(null);
let rulePreviewRequestId = 0;

interface RulePreview {
  totalChapters: number;
  titles: string[];
  usedFallback: boolean;
}

const ruleOptions = computed(() => {
  return rules.value.map((rule) => ({
    label: rule.is_builtin ? `${rule.rule_name}（内置）` : rule.rule_name,
    value: rule.id,
  }));
});

const selectedRule = computed(() => {
  const ruleId = Number(selectedRuleId.value);
  return rules.value.find((rule) => rule.id === ruleId) ?? null;
});

const currentRuleName = computed(() => {
  if (book.value?.chapter_rule?.rule_name) {
    return book.value.chapter_rule.rule_name;
  }
  const selectedRule = rules.value.find((rule) => rule.id === selectedRuleId.value);
  return selectedRule?.rule_name || "未指定";
});

const currentRuleDescription = computed(() => {
  if (book.value?.chapter_rule?.description) {
    return book.value.chapter_rule.description;
  }
  const selectedRule = rules.value.find((rule) => rule.id === selectedRuleId.value);
  return selectedRule?.description || "你可以在这里切换规则，并重新解析当前书籍的目录。";
});

const readActionLabel = computed(() => {
  return progress.value ? "继续阅读" : "开始阅读";
});

const progressTagLabel = computed(() => {
  if (!progress.value) {
    return "尚未开始";
  }
  return `上次读到第 ${formatNumber(progress.value.chapter_index + 1)} 章`;
});

const progressPercentValue = computed(() => {
  return book.value?.progress_percent ?? progress.value?.percent ?? 0;
});

const progressPercentLabel = computed(() => {
  return `进度 ${formatPercent(progressPercentValue.value)}`;
});

function formatDate(value: string) {
  return formatDateTime(value, "时间未知");
}

function formatOptionalDate(value: string | null | undefined) {
  return formatDateTime(value, "未开始");
}

function syncEditorFields(bookDetail: BookDetail) {
  editableTitle.value = bookDetail.title;
  editableAuthor.value = bookDetail.author || "";
  editableDescription.value = bookDetail.description || "";
}

async function loadBookAndChapters() {
  const [bookDetail, chapterList] = await Promise.all([
    booksApi.detail(props.bookId),
    booksApi.chapters(props.bookId),
  ]);
  book.value = bookDetail;
  chapters.value = chapterList;
  selectedRuleId.value = bookDetail.chapter_rule_id;
  syncEditorFields(bookDetail);
  booksCacheStore.set(props.bookId, { bookDetail, chapters: chapterList });
}

async function loadRules() {
  rulesError.value = null;
  try {
    rules.value = await chapterRulesApi.list();
    if (!selectedRuleId.value) {
      selectedRuleId.value =
        book.value?.chapter_rule_id ??
        rules.value.find((rule) => rule.is_default)?.id ??
        rules.value[0]?.id ??
        null;
    }
  } catch (error) {
    rules.value = [];
    rulesError.value = getErrorMessage(error);
  }
}

async function loadProgress() {
  try {
    progress.value = await booksApi.getProgress(props.bookId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      progress.value = null;
      return;
    }
    progress.value = null;
  }
}

async function loadPage() {
  loading.value = true;
  pageError.value = null;
  try {
    await loadBookAndChapters();
    await Promise.all([loadRules(), loadProgress()]);
  } catch (error) {
    book.value = null;
    chapters.value = [];
    progress.value = null;
    pageError.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function reloadPage() {
  void loadPage();
}

function goBack() {
  void router.push({ name: "books" });
}

function goToChapter(chapterIndex: number) {
  void router.push({
    name: "reader",
    params: { bookId: props.bookId, chapterIndex },
  });
}

function openCatalog() {
  catalogVisible.value = true;
}

function openEditor() {
  if (!book.value) return;
  syncEditorFields(book.value);
  editorVisible.value = true;
}

function handleCatalogSelect(chapterIndex: number) {
  catalogVisible.value = false;
  goToChapter(chapterIndex);
}

async function handleReadAction() {
  readingPending.value = true;
  try {
    if (!progress.value) {
      goToChapter(0);
      return;
    }
    goToChapter(progress.value.chapter_index);
  } finally {
    readingPending.value = false;
  }
}

async function handleSaveMetadata() {
  if (!book.value) return;
  metadataSaving.value = true;
  try {
    await booksApi.updateMetadata(book.value.id, {
      title: editableTitle.value.trim() || null,
      author: editableAuthor.value.trim() || null,
      description: editableDescription.value.trim() || null,
    });
    const refreshed = await booksApi.detail(book.value.id);
    book.value = refreshed;
    syncEditorFields(refreshed);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(BOOK_METADATA_UPDATED_EVENT, { detail: { bookId: book.value.id } }));
    }
    editorVisible.value = false;
    notify.success("书籍信息已保存");
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    metadataSaving.value = false;
  }
}

const coverInputRef = ref<HTMLInputElement | null>(null);

async function handleCoverUpload(event: Event) {
  if (!book.value) return;
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!(file instanceof File)) {
    notify.error("未找到可上传的封面文件");
    return;
  }
  coverUploading.value = true;
  try {
    const updated = await booksApi.uploadCover(book.value.id, file);
    book.value = updated;
    notify.success("封面已更新");
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    coverUploading.value = false;
    if (coverInputRef.value) {
      coverInputRef.value.value = "";
    }
  }
}

async function handleRemoveCover() {
  if (!book.value) return;
  coverDeleting.value = true;
  try {
    await booksApi.deleteCover(book.value.id);
    const refreshed = await booksApi.detail(book.value.id);
    book.value = refreshed;
    notify.success("封面已删除");
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    coverDeleting.value = false;
  }
}

async function handleReparse() {
  if (!selectedRuleId.value) {
    notify.error("请先选择一个目录规则。", { title: "无法应用目录规则" });
    return;
  }
  reparsePending.value = true;
  try {
    const result = await booksApi.reparse(props.bookId, Number(selectedRuleId.value));
    booksCacheStore.invalidate(props.bookId);
    await loadBookAndChapters();
    notify.success(
      `已应用“${selectedRule.value?.rule_name || "所选规则"}”，共解析出 ${formatNumber(result.total_chapters)} 个章节。`,
      { title: "目录规则应用成功" },
    );
  } catch (error) {
    notify.error(getErrorMessage(error), { title: "目录规则应用失败" });
  } finally {
    reparsePending.value = false;
  }
}

function isFullTextRule(rule: ChapterRule) {
  const flags = rule.flags.split(/[|,\s]+/).map((flag) => flag.toUpperCase());
  return rule.regex_pattern === "__FULL_TEXT__" || flags.includes("FULL_TEXT");
}

async function loadRulePreview(rule: ChapterRule | null) {
  const requestId = ++rulePreviewRequestId;
  rulePreview.value = null;
  rulePreviewError.value = null;

  if (!rule) {
    rulePreviewPending.value = false;
    return;
  }

  if (isFullTextRule(rule)) {
    rulePreviewPending.value = false;
    rulePreview.value = {
      totalChapters: 1,
      titles: ["全文"],
      usedFallback: false,
    };
    return;
  }

  rulePreviewPending.value = true;
  try {
    const result = await chapterRulesApi.test({
      book_id: props.bookId,
      regex_pattern: rule.regex_pattern,
      flags: rule.flags,
    });
    if (requestId !== rulePreviewRequestId) return;

    if (result.count === 0) {
      rulePreview.value = {
        totalChapters: 1,
        titles: ["全文"],
        usedFallback: true,
      };
      return;
    }

    rulePreview.value = {
      totalChapters: result.count,
      titles: result.items.slice(0, 10).map((item) => item.text.trim() || "未命名章节"),
      usedFallback: false,
    };
  } catch (error) {
    if (requestId !== rulePreviewRequestId) return;
    rulePreviewError.value = `目录预览失败：${getErrorMessage(error)}`;
  } finally {
    if (requestId === rulePreviewRequestId) {
      rulePreviewPending.value = false;
    }
  }
}

watch(
  selectedRule,
  (rule) => {
    void loadRulePreview(rule);
  },
  { immediate: true },
);

watch(
  () => props.bookId,
  () => {
    catalogVisible.value = false;
    editorVisible.value = false;
    void loadPage();
  },
  { immediate: true },
);
</script>

<style scoped>
/* Page wrapper: sits inside AppLayout padding, adds its own breathing room */
.book-detail-page {
  padding: 24px 32px;
}

/* Content container: centered with max-width */
.book-detail-page__container {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  gap: 32px;
}

/* Topbar */
.book-detail-page__topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.book-detail-page__crumb {
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: 0.04em;
}

/* Hero: 纯排版，无卡片边框，左封面右信息 */
.detail-hero {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: clamp(24px, 4vw, 40px);
  align-items: start;
}

.detail-hero__cover {
  width: 140px;
  height: 190px;
  border-radius: var(--radius-sm);
}

.detail-hero__body {
  display: grid;
  gap: 16px;
  align-content: start;
}

.detail-hero__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 5px 12px;
  border: 1px solid var(--border-color-soft);
  border-radius: 999px;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.detail-hero__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-wrap: balance;
}

.detail-hero__author {
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
}

.detail-hero__description {
  margin: 0;
  max-width: 64ch;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.detail-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-hero__progress {
  display: grid;
  gap: 8px;
  max-width: 420px;
}

.detail-hero__progress-text {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

.detail-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 4px;
}

/* Cards grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

/* Card base: 1px 细边框 + 柔和圆角 + 卡片底色 */
.detail-card {
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-md);
  background: var(--surface-card-bg);
  overflow: hidden;
}

.detail-card--full {
  grid-column: 1 / -1;
}

/* Card header: block-level container with full-width border */
.detail-card__header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color-soft);
}

.detail-card__heading {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* Card body */
.detail-card__body {
  padding: 18px 20px;
}

/* Info grid inside cards */
.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-info-item {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--surface-panel-soft-bg);
}

.detail-info-item--wide {
  grid-column: 1 / -1;
}

.detail-info-item__label {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 4px;
}

.detail-info-item__value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.7;
  word-break: break-word;
}

.detail-info-item__value--pre {
  white-space: pre-wrap;
}

/* Group list */
.detail-group-list {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--surface-panel-soft-bg);
}

.detail-group-list__label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.detail-group-list__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* File path */
.detail-file-path {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--surface-panel-soft-bg);
}

.detail-file-path__label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.detail-file-path code {
  display: block;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface-code-bg);
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-primary);
  font-size: 13px;
}

/* Rule card */
.detail-rule-card {
  display: grid;
  gap: 16px;
}

.detail-rule-card__current span {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 4px;
}

.detail-rule-card__current strong {
  display: block;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}

.detail-rule-card__current p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-rule-card__alert {
  border-radius: var(--radius-sm);
}

.detail-rule-card__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.detail-rule-preview {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
}

.detail-rule-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-rule-preview__header > div {
  min-width: 0;
}

.detail-rule-preview__header span,
.detail-rule-preview__description,
.detail-rule-preview__note {
  color: var(--text-secondary);
}

.detail-rule-preview__header span {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
}

.detail-rule-preview__header strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-rule-preview__description,
.detail-rule-preview__note {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
}

.detail-rule-preview__loading {
  display: grid;
  gap: 8px;
}

/* 规则预览列表：等宽字体显示匹配标题 */
.detail-rule-preview__list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.detail-rule-preview__list li {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: baseline;
  gap: 10px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
}

.detail-rule-preview__list li:nth-child(odd) {
  background: var(--surface-panel-soft-bg);
}

.detail-rule-preview__list li > span {
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.detail-rule-preview__list li > strong {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.8;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Metadata modal */
.metadata-modal {
  border-radius: var(--radius-lg);
}

.metadata-modal__layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 20px;
}

.metadata-modal__cover-panel {
  display: grid;
  gap: 12px;
  align-content: start;
}

.metadata-modal__cover {
  width: 100%;
  aspect-ratio: 3 / 4;
  cursor: pointer;
}

.metadata-modal__cover-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.metadata-modal__form {
  display: grid;
  gap: 14px;
  align-content: start;
}

.metadata-modal__field {
  display: grid;
  gap: 6px;
}

.metadata-modal__field span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.metadata-modal__textarea {
  width: 100%;
  min-height: 120px;
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
}

.metadata-modal__textarea:focus {
  border-color: var(--primary-color);
}

.metadata-modal__footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Responsive */
@media (max-width: 960px) {
  .book-detail-page {
    padding: 20px 24px;
  }

  .book-detail-page__container {
    gap: 24px;
  }

  .detail-grid,
  .metadata-modal__layout {
    grid-template-columns: 1fr;
  }

  .metadata-modal__cover {
    max-width: 200px;
  }
}

@media (max-width: 720px) {
  .book-detail-page {
    padding: 16px;
  }

  .book-detail-page__container {
    gap: 20px;
  }

  .detail-hero {
    grid-template-columns: 1fr;
  }

  .book-detail-page__topbar,
  .detail-hero__actions,
  .detail-rule-card__actions,
  .detail-info-grid,
  .metadata-modal__footer {
    display: grid;
    grid-template-columns: 1fr;
  }

  .detail-info-item--wide {
    grid-column: auto;
  }

  .detail-card__header,
  .detail-card__body {
    padding: 14px 16px;
  }

  .detail-rule-preview {
    padding: 14px;
  }

  .detail-rule-preview__header {
    align-items: flex-start;
  }

}
</style>
