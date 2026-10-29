<template>
  <div class="bookshelf-page">
    <PageHeader
      eyebrow="Starlight Bookshelf"
      title="我的书架"
      :subtitle="`共 ${displayedBooks.length} 本藏书 · 按分组、排序和关键词找到下一次继续阅读的位置。`"
    >
      <template #actions>
        <div class="bookshelf-page__header-actions">
          <Button variant="ghost" size="sm" :disabled="loading" @click="handleRefresh">刷新</Button>
          <Button variant="ghost" size="sm" :disabled="groupMutationPending" @click="groupManagerVisible = true">
            分组管理
          </Button>
          <Button variant="outline" size="sm" @click="toggleEditMode">
            {{ isEditMode ? "完成" : "编辑" }}
          </Button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".txt,text/plain"
            class="sr-only"
            @change="handleFileUpload"
          />
          <Button variant="default" size="sm" :disabled="uploading" @click="fileInputRef?.click()">
            {{ uploading ? "上传中…" : "上传 TXT ✦" }}
          </Button>
        </div>
      </template>
    </PageHeader>

    <nav class="bookshelf-page__tabs" role="tablist" aria-label="书架分组筛选">
      <button
        v-for="filter in filterOptions"
        :key="filter.key"
        type="button"
        role="tab"
        class="bookshelf-page__tab"
        :class="{ 'bookshelf-page__tab--active': activeFilter === filter.key }"
        :aria-selected="activeFilter === filter.key"
        @click="activeFilter = filter.key"
      >
        <span v-if="activeFilter === filter.key" class="bookshelf-page__tab-sparkle" aria-hidden="true">✦</span>
        <span>{{ filter.label }}</span>
      </button>
    </nav>

    <div class="bookshelf-page__toolbar">
      <div class="bookshelf-page__toolbar-left">
        <Select v-model="sortKey">
          <SelectTrigger class="bookshelf-page__sort">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div class="bookshelf-page__view-switch" role="group" aria-label="视图模式切换">
          <button
            type="button"
            class="bookshelf-page__view-btn"
            :class="{ 'bookshelf-page__view-btn--active': viewMode === 'grid' }"
            title="海报网格视图"
            aria-label="海报网格视图"
            @click="setViewMode('grid')"
          >
            <LayoutGrid :size="16" />
            <span>海报</span>
          </button>
          <button
            type="button"
            class="bookshelf-page__view-btn"
            :class="{ 'bookshelf-page__view-btn--active': viewMode === 'list' }"
            title="详细列表视图"
            aria-label="详细列表视图"
            @click="setViewMode('list')"
          >
            <LayoutList :size="16" />
            <span>列表</span>
          </button>
        </div>
      </div>

      <div class="bookshelf-page__search">
        <Input
          v-model="searchKeyword"
          placeholder="搜索书名或作者..."
          @keydown.enter.prevent="handleSearch"
        />
        <Button variant="secondary" size="sm" :disabled="loading" @click="handleSearch">搜索</Button>
      </div>
    </div>

    <Alert v-if="errorMessage" variant="destructive" class="bookshelf-page__alert">
      {{ errorMessage }}
    </Alert>

    <Alert v-if="groupWarningMessage" variant="warning" class="bookshelf-page__alert">
      {{ groupWarningMessage }}
    </Alert>

    <!-- Loading Skeleton -->
    <section
      v-if="loading"
      :class="viewMode === 'grid' ? 'bookshelf-grid' : 'bookshelf-list'"
      aria-label="加载中的书架"
    >
      <template v-if="viewMode === 'grid'">
        <article v-for="index in 8" :key="index" class="bookshelf-poster bookshelf-poster--loading">
          <Skeleton class="bookshelf-poster__cover-skeleton" />
          <div class="bookshelf-poster__body">
            <Skeleton class="h-5 w-3/4" />
            <Skeleton class="h-3.5 w-1/2" />
            <Skeleton class="h-2 w-full rounded-full" />
            <Skeleton class="h-8 w-full rounded-xl" />
          </div>
        </article>
      </template>
      <template v-else>
        <article v-for="index in 6" :key="index" class="bookshelf-item bookshelf-item--loading">
          <Skeleton class="bookshelf-item__cover" />
          <div class="bookshelf-item__body">
            <Skeleton class="h-5 w-2/3" />
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-3/4" />
          </div>
        </article>
      </template>
    </section>

    <!-- Empty State -->
    <PageStatusPanel
      v-else-if="displayedBooks.length === 0"
      variant="empty"
      :title="emptyTitle"
      :description="emptyDescription"
    >
      <template #action>
        <Button variant="default" :disabled="uploading" @click="fileInputRef?.click()">上传 TXT ✦</Button>
      </template>
    </PageStatusPanel>

    <!-- Poster Grid View (Default) -->
    <section
      v-else-if="viewMode === 'grid'"
      class="bookshelf-grid"
      aria-label="书籍海报网格"
    >
      <article
        v-for="book in displayedBooks"
        :key="book.id"
        class="bookshelf-poster"
        @click="goToDetail(book.id)"
      >
        <div class="bookshelf-poster__cover-wrap">
          <BookCover
            class="bookshelf-poster__cover"
            :title="book.title"
            :cover-url="book.cover_url"
            fallback-text="无封面"
          />

          <div class="bookshelf-poster__progress-badge">
            <span class="bookshelf-poster__sparkle" aria-hidden="true">✦</span>
            <span>{{ formatProgress(book.progress_percent) }}</span>
          </div>

          <div v-if="book.groups.length" class="bookshelf-poster__groups">
            <span
              v-for="group in book.groups.slice(0, 2)"
              :key="`grid-${book.id}-${group.id}`"
              class="bookshelf-poster__group-pill"
            >
              {{ group.name }}
            </span>
            <span v-if="book.groups.length > 2" class="bookshelf-poster__group-pill">
              +{{ book.groups.length - 2 }}
            </span>
          </div>
        </div>

        <div class="bookshelf-poster__body">
          <div class="bookshelf-poster__header">
            <h2 class="bookshelf-poster__title" :title="book.title">{{ book.title }}</h2>
            <p class="bookshelf-poster__author">{{ book.author || "作者未填写" }}</p>
          </div>

          <div class="bookshelf-poster__meta">
            <span>{{ formatNumber(book.total_chapters) }} 章</span>
            <span>·</span>
            <span>{{ formatWordCount(book.total_words) }}</span>
          </div>

          <ProgressBar :percent="book.progress_percent" />

          <div class="bookshelf-poster__actions" @click.stop>
            <Button
              size="sm"
              class="bookshelf-poster__primary-btn"
              :disabled="continuingBookId === book.id"
              @click.stop="continueReading(book.id)"
            >
              {{ continueLabel(book) }}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="bookshelf-poster__sub-btn"
              @click.stop="openBookGroupSelector(book)"
            >
              分组
            </Button>
            <Button
              v-if="isEditMode"
              variant="ghost"
              size="sm"
              class="bookshelf-poster__sub-btn bookshelf-item__action--danger"
              :disabled="deletingBookId === book.id"
              @click.stop="confirmDelete(book)"
            >
              删除
            </Button>
          </div>
        </div>
      </article>
    </section>

    <!-- Detailed List View -->
    <section v-else class="bookshelf-list" aria-label="书籍列表">
      <article
        v-for="book in displayedBooks"
        :key="book.id"
        class="bookshelf-item"
        @click="goToDetail(book.id)"
      >
        <BookCover
          class="bookshelf-item__cover"
          :title="book.title"
          :cover-url="book.cover_url"
          fallback-text="无封面"
        />

        <div class="bookshelf-item__body">
          <div class="bookshelf-item__header-block">
            <h2 class="bookshelf-item__title">{{ book.title }}</h2>
            <p class="bookshelf-item__author">{{ book.author || "作者未填写" }}</p>
          </div>

          <div class="bookshelf-item__status-row">
            <span>{{ formatReadingLabel(book) }}</span>
            <span>{{ formatRecentLabel(book.recent_read_at ?? book.last_read_at) }}</span>
          </div>

          <div class="bookshelf-item__facts">
            <span>共 {{ formatNumber(book.total_chapters) }} 章</span>
            <span>{{ formatWordCount(book.total_words) }}</span>
            <span>收录于 {{ formatDate(book.created_at) }}</span>
          </div>

          <div v-if="book.groups.length" class="bookshelf-item__groups">
            <Badge
              v-for="group in book.groups"
              :key="`${book.id}-${group.id}`"
              variant="secondary"
            >
              {{ group.name }}
            </Badge>
          </div>

          <div class="bookshelf-item__footer">
            <div class="bookshelf-item__progress">
              <div class="bookshelf-item__progress-head">
                <span>阅读进度</span>
                <strong>{{ formatProgress(book.progress_percent) }}</strong>
              </div>
              <ProgressBar :percent="book.progress_percent" />
            </div>

            <div class="bookshelf-item__actions">
              <Button
                variant="link"
                size="sm"
                class="bookshelf-item__action bookshelf-item__action--primary"
                :disabled="continuingBookId === book.id"
                @click.stop="continueReading(book.id)"
              >
                {{ continueLabel(book) }}
              </Button>
              <Button variant="ghost" size="sm" class="bookshelf-item__action" @click.stop="goToDetail(book.id)">
                详情
              </Button>
              <Button variant="ghost" size="sm" class="bookshelf-item__action" @click.stop="openBookGroupSelector(book)">
                管理分组
              </Button>
              <Button
                v-if="isEditMode"
                variant="ghost"
                size="sm"
                class="bookshelf-item__action bookshelf-item__action--danger"
                :disabled="deletingBookId === book.id"
                @click.stop="confirmDelete(book)"
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      </article>
    </section>

    <book-group-manager-modal
      v-model:show="groupManagerVisible"
      :groups="groups"
      :busy="groupMutationPending"
      @create="handleCreateGroup"
      @rename="handleRenameGroup"
      @delete="handleDeleteGroup"
    />

    <book-group-selector-modal
      v-model:show="groupSelectorVisible"
      :book-title="managingBook?.title || ''"
      :groups="groups"
      :selected-group-ids="selectedGroupIds"
      :submitting="bookGroupsSubmitting"
      @submit="handleSubmitBookGroups"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { LayoutGrid, LayoutList } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { notify } from "@/utils/notify";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "vue-router";

import { bookGroupsApi } from "../api/book-groups";
import { booksApi } from "../api/books";
import { getErrorMessage } from "../api/client";
import BookCover from "../components/BookCover.vue";
import BookGroupManagerModal from "../components/BookGroupManagerModal.vue";
import BookGroupSelectorModal from "../components/BookGroupSelectorModal.vue";
import PageHeader from "../components/PageHeader.vue";
import PageStatusPanel from "../components/PageStatusPanel.vue";
import ProgressBar from "../components/ProgressBar.vue";
import { useContinueReading } from "../composables/useContinueReading";
import type { BookGroup, BookShelfItem, BookSortKey } from "../types/api";
import { usePreferencesStore } from "../stores/preferences";
import { clampPercentage, formatDateTime, formatNumber, formatPercent, formatWordCount } from "../utils/format";

type BookshelfViewMode = "grid" | "list";
const VIEW_MODE_STORAGE_KEY = "uika_book.bookshelf-view";

function loadInitialViewMode(): BookshelfViewMode {
  if (typeof window === "undefined") {
    return "grid";
  }
  try {
    const saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return saved === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

const router = useRouter();

const preferencesStore = usePreferencesStore();
const { continuingBookId, continueReading } = useContinueReading();
const BOOK_METADATA_UPDATED_EVENT = "books:metadata-updated";
const books = ref<BookShelfItem[]>([]);
const groups = ref<BookGroup[]>([]);
const viewMode = ref<BookshelfViewMode>(loadInitialViewMode());
const searchKeyword = ref(preferencesStore.bookshelf.search);
const appliedSearch = ref(preferencesStore.bookshelf.search);
const loading = ref(false);
const uploading = ref(false);
const errorMessage = ref<string | null>(null);
const groupWarningMessage = ref<string | null>(null);
const deletingBookId = ref<number | null>(null);
const isEditMode = ref(false);
const activeFilter = ref(getFilterKeyFromGroupId(preferencesStore.bookshelf.groupId));
const sortKey = ref<BookSortKey>(preferencesStore.bookshelf.sort);
const groupManagerVisible = ref(false);
const groupSelectorVisible = ref(false);
const managingBook = ref<BookShelfItem | null>(null);
const selectedGroupIds = ref<number[]>([]);
const groupMutationPending = ref(false);
const bookGroupsSubmitting = ref(false);

function setViewMode(mode: BookshelfViewMode) {
  viewMode.value = mode;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore localStorage write errors
    }
  }
}

const sortOptions = [
  { label: "按收录时间", value: "created_at" },
  { label: "按最近阅读", value: "recent_read" },
  { label: "按书名", value: "title" },
] satisfies Array<{ label: string; value: BookSortKey }>;

const filterOptions = computed(() => {
  return [
    { key: "all", label: "全部" },
    ...groups.value.map((group) => ({ key: `group:${group.id}`, label: group.name })),
  ];
});

const displayedBooks = computed(() => books.value);

const emptyTitle = computed(() => {
  if (appliedSearch.value.trim()) {
    return "没有找到匹配的书籍";
  }

  if (getActiveGroupId(activeFilter.value) !== null) {
    return "该分组暂无书籍";
  }

  return "书架还是空的";
});

const emptyDescription = computed(() => {
  if (appliedSearch.value.trim()) {
    return "试试更短的关键词，或清空搜索后浏览全部藏书。";
  }

  if (getActiveGroupId(activeFilter.value) !== null) {
    return "切换到其他分组，或将书籍移动到该分组。";
  }

  return "上传一本 TXT 后，书架会自动刷新。";
});

watch(groups, (currentGroups) => {
  const groupId = getActiveGroupId(activeFilter.value);
  if (groupId === null) {
    return;
  }

  if (!currentGroups.some((group) => group.id === groupId)) {
    activeFilter.value = "all";
    preferencesStore.patchBookshelf({
      groupId: null,
      page: 1,
    });
  }
});

watch(activeFilter, () => {
  preferencesStore.patchBookshelf({
    groupId: getActiveGroupId(activeFilter.value),
    page: 1,
  });
  void loadBooks(appliedSearch.value);
});

watch(sortKey, () => {
  preferencesStore.patchBookshelf({
    sort: sortKey.value,
    page: 1,
  });
  void loadBooks(appliedSearch.value);
});

function getFilterKeyFromGroupId(groupId: number | null) {
  return groupId ? `group:${groupId}` : "all";
}

function getActiveGroupId(filterKey: string) {
  if (!filterKey.startsWith("group:")) {
    return null;
  }

  const value = Number(filterKey.slice("group:".length));
  return Number.isFinite(value) ? value : null;
}

function formatProgress(value: number | null) {
  return formatPercent(value);
}

function formatDate(value: string | null) {
  return formatDateTime(value, "时间未知");
}

function formatRecentLabel(value: string | null) {
  return value ? `最近阅读 ${formatDateTime(value)}` : "最近阅读：未开始";
}

function formatReadingLabel(book: BookShelfItem) {
  const progress = clampPercentage(book.progress_percent);
  return progress > 0 ? `已读 ${formatPercent(progress)}` : "尚未开始阅读";
}

function continueLabel(book: BookShelfItem) {
  return clampPercentage(book.progress_percent) > 0 ? "继续阅读" : "开始阅读";
}

const fileInputRef = ref<HTMLInputElement | null>(null);

function resetUploadControl() {
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
}

async function loadBooks(search = appliedSearch.value.trim()) {
  loading.value = true;
  errorMessage.value = null;

  try {
    books.value = await booksApi.list({
      search: search || undefined,
      groupId: getActiveGroupId(activeFilter.value),
      sort: sortKey.value,
    });
  } catch (error) {
    books.value = [];
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function loadGroups() {
  groupWarningMessage.value = null;

  try {
    groups.value = await bookGroupsApi.list();
  } catch (error) {
    groups.value = [];
    groupWarningMessage.value = getErrorMessage(error);
  }
}

async function loadPage() {
  await Promise.all([loadBooks(appliedSearch.value), loadGroups()]);
  // 数据加载完成后再次强制回到顶部，防止异步内容渲染后滚动位置被撑开
  if (typeof window !== "undefined") {
    window.scrollTo(0, 0);
  }
}

function handleSearch() {
  const normalizedSearch = searchKeyword.value.trim();
  searchKeyword.value = normalizedSearch;
  appliedSearch.value = normalizedSearch;
  preferencesStore.patchBookshelf({
    search: normalizedSearch,
    page: 1,
  });
  void loadBooks(normalizedSearch);
}

function handleRefresh() {
  void loadPage();
}

function toggleEditMode() {
  isEditMode.value = !isEditMode.value;
}

function goToDetail(bookId: number) {
  void router.push({
    name: "book-detail",
    params: { bookId },
  });
}

async function confirmDelete(book: BookShelfItem) {
  const confirmed = await notify.confirm(`删除后将同时移除本地书籍文件，确认删除「${book.title}」吗？`, {
    title: "删除书籍",
    confirmLabel: "确认删除",
    destructive: true,
  });
  if (confirmed) {
    void handleDelete(book);
  }
}

async function handleDelete(book: BookShelfItem) {
  deletingBookId.value = book.id;

  try {
    await booksApi.delete(book.id);
    notify.success(`已删除《${book.title}》`);
    await Promise.all([loadBooks(appliedSearch.value), loadGroups()]);
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    deletingBookId.value = null;
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!(file instanceof File)) {
    notify.error("未找到可上传的文件内容");
    resetUploadControl();
    return;
  }

  uploading.value = true;

  try {
    await booksApi.upload(file);
    notify.success(`《${file.name}》上传成功`);
    await loadPage();
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    uploading.value = false;
    resetUploadControl();
  }
}

async function handleCreateGroup(name: string) {
  groupMutationPending.value = true;

  try {
    await bookGroupsApi.create({ name });
    notify.success("分组已创建");
    await loadGroups();
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    groupMutationPending.value = false;
  }
}

async function handleRenameGroup(payload: { groupId: number; name: string }) {
  groupMutationPending.value = true;

  try {
    await bookGroupsApi.update(payload.groupId, { name: payload.name });
    notify.success("分组已重命名");
    await Promise.all([loadGroups(), loadBooks(appliedSearch.value)]);
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    groupMutationPending.value = false;
  }
}

async function handleDeleteGroup(groupId: number) {
  groupMutationPending.value = true;

  try {
    await bookGroupsApi.remove(groupId);
    notify.success("分组已删除");
    await Promise.all([loadGroups(), loadBooks(appliedSearch.value)]);
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    groupMutationPending.value = false;
  }
}

async function openBookGroupSelector(book: BookShelfItem) {
  managingBook.value = book;
  selectedGroupIds.value = book.groups.map((group) => group.id);
  groupSelectorVisible.value = true;

  try {
    const currentGroups = await booksApi.getGroups(book.id);
    selectedGroupIds.value = currentGroups.map((group) => group.id);
  } catch (error) {
    notify.info(`未能刷新《${book.title}》的最新分组，先使用当前页面数据。${getErrorMessage(error)}`);
  }
}

async function handleSubmitBookGroups(groupIds: number[]) {
  if (!managingBook.value) {
    return;
  }

  bookGroupsSubmitting.value = true;

  try {
    await booksApi.updateGroups(managingBook.value.id, { group_ids: groupIds });
    notify.success(`已更新《${managingBook.value.title}》的分组`);
    groupSelectorVisible.value = false;
    await Promise.all([loadBooks(appliedSearch.value), loadGroups()]);
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    bookGroupsSubmitting.value = false;
  }
}

function handleMetadataUpdated() {
  void loadBooks(appliedSearch.value);
}

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener(BOOK_METADATA_UPDATED_EVENT, handleMetadataUpdated);
    window.scrollTo(0, 0);
  }

  void loadPage();
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener(BOOK_METADATA_UPDATED_EVENT, handleMetadataUpdated);
  }
});
</script>

<style scoped>
.bookshelf-page {
  width: min(100%, 1180px);
  margin: 0 auto;
  display: grid;
  gap: var(--space-5);
}

/* 工具区保持单行横向排列，空间不足时横向滚动，避免操作项被拆散 */
.bookshelf-page__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
}

/* 分组筛选：二次元胶囊式 Tab 栏 */
.bookshelf-page__tabs {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px;
  border: 1px solid var(--border-color-soft);
  border-radius: 999px;
  background: var(--surface-panel-soft-bg);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.bookshelf-page__tabs::-webkit-scrollbar {
  display: none;
}

.bookshelf-page__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: all 180ms ease;
}

.bookshelf-page__tab:hover {
  color: var(--text-primary);
  background: var(--surface-tab-hover-bg);
}

.bookshelf-page__tab--active {
  color: var(--primary-color);
  background: var(--surface-tab-active-bg);
  border-color: var(--surface-tab-active-border);
  box-shadow: 0 4px 12px var(--primary-soft);
  font-weight: 700;
}

.bookshelf-page__tab-sparkle {
  color: var(--accent-color);
  font-size: 11px;
}

/* 工具行：排序 + 视图切换 + 搜索 */
.bookshelf-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.bookshelf-page__toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.bookshelf-page__sort {
  width: 152px;
}

.bookshelf-page__view-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--border-color-soft);
  border-radius: 12px;
  background: var(--surface-card-bg);
}

.bookshelf-page__view-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 160ms ease;
}

.bookshelf-page__view-btn:hover {
  color: var(--text-primary);
}

.bookshelf-page__view-btn--active {
  background: var(--primary-soft);
  color: var(--primary-color);
  font-weight: 700;
}

.bookshelf-page__search {
  flex: 1 1 240px;
  min-width: 0;
  max-width: 360px;
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

.bookshelf-page__search input {
  flex: 1 1 auto;
  min-width: 0;
}

.bookshelf-page__search button {
  flex: 0 0 auto;
  white-space: nowrap;
}

.bookshelf-page__alert {
  border-radius: var(--radius-md);
}

/* 海报网格视图（默认） */
.bookshelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
}

.bookshelf-poster {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-card-bg);
  backdrop-filter: blur(16px);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  transition:
    transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 240ms ease;
}

.bookshelf-poster:hover {
  transform: translateY(-4px);
  border-color: var(--border-color);
  box-shadow: var(--shadow-card-hover);
}

.bookshelf-poster--loading {
  cursor: default;
}

.bookshelf-poster--loading:hover {
  transform: none;
  box-shadow: var(--shadow-soft);
}

.bookshelf-poster__cover-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  padding: 12px 12px 0;
}

.bookshelf-poster__cover,
.bookshelf-poster__cover-skeleton {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md);
}

.bookshelf-poster:hover :deep(.book-cover__image) {
  transform: scale(1.04);
}

.bookshelf-poster__progress-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(19, 15, 33, 0.74);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
}

.bookshelf-poster__sparkle {
  color: var(--accent-color);
  font-size: 10px;
}

.bookshelf-poster__groups {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 8px;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  pointer-events: none;
}

.bookshelf-poster__group-pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #3B2E66;
  font-size: 10.5px;
  font-weight: 700;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.bookshelf-poster__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 14px 16px;
}

.bookshelf-poster__header {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.bookshelf-poster__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.38;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  min-height: 2.76em;
}

.bookshelf-poster__author {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookshelf-poster__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 11.5px;
  margin-top: auto;
}

.bookshelf-poster__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 2px;
}

.bookshelf-poster__primary-btn {
  flex: 1;
  min-width: 0;
}

.bookshelf-poster__sub-btn {
  padding-left: 8px;
  padding-right: 8px;
}

/* 详细列表视图 */
.bookshelf-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.bookshelf-item {
  min-width: 0;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
  padding: 18px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-card-bg);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition:
    transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 200ms ease,
    border-color 200ms ease;
}

.bookshelf-item:hover {
  transform: translateY(-2px);
  border-color: var(--border-color);
  box-shadow: var(--shadow-card-hover);
}

.bookshelf-item--loading {
  cursor: default;
}

.bookshelf-item--loading:hover {
  transform: none;
  box-shadow: var(--shadow-soft);
}

.bookshelf-item__cover {
  width: 96px;
  height: 130px;
}

.bookshelf-item__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.bookshelf-item__header-block {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.bookshelf-item__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.bookshelf-item__author {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookshelf-item__status-row,
.bookshelf-item__facts,
.bookshelf-item__progress-head span {
  color: var(--text-secondary);
}

.bookshelf-item__status-row {
  display: flex;
  gap: 6px 14px;
  flex-wrap: wrap;
  min-width: 0;
  font-size: 12px;
}

.bookshelf-item__facts {
  display: flex;
  gap: 6px 12px;
  flex-wrap: wrap;
  min-width: 0;
  font-size: 12.5px;
}

.bookshelf-item__facts span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookshelf-item__groups {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.bookshelf-item__footer {
  margin-top: auto;
  display: grid;
  gap: 10px;
}

.bookshelf-item__progress {
  display: grid;
  gap: 6px;
}

.bookshelf-item__progress-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  font-size: 12px;
}

.bookshelf-item__progress-head strong {
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 700;
}

.bookshelf-item__actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.bookshelf-item__action {
  min-width: 0;
}

.bookshelf-item__action--primary {
  font-weight: 700;
}

.bookshelf-item__action--danger {
  color: var(--alert-destructive-text);
}

.bookshelf-item__action--danger:hover {
  color: var(--alert-destructive-text);
  background: var(--alert-destructive-bg);
}

@media (max-width: 960px) {
  .bookshelf-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .bookshelf-page {
    gap: 16px;
  }

  .bookshelf-page__tab {
    padding: 7px 13px;
  }

  .bookshelf-page__toolbar-left {
    width: 100%;
    justify-content: space-between;
  }

  .bookshelf-page__sort {
    flex: 1 1 auto;
    width: auto;
  }

  .bookshelf-page__search {
    flex: 1 1 100%;
    max-width: none;
    margin-left: 0;
  }

  .bookshelf-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .bookshelf-poster__cover-wrap {
    padding: 8px 8px 0;
  }

  .bookshelf-poster__body {
    padding: 10px 10px 12px;
    gap: 8px;
  }

  .bookshelf-poster__title {
    font-size: 14px;
  }

  .bookshelf-item {
    grid-template-columns: 74px minmax(0, 1fr);
    gap: 14px;
    padding: 14px;
  }

  .bookshelf-item__cover {
    width: 74px;
    height: 102px;
  }

  .bookshelf-item__title {
    font-size: 16px;
  }

  .bookshelf-item__facts {
    display: none;
  }
}
</style>
