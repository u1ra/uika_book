<template>
  <div class="bookshelf-page">
    <PageHeader
      eyebrow="Bookshelf"
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
            {{ uploading ? "上传中…" : "上传 TXT" }}
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
        {{ filter.label }}
      </button>
    </nav>

    <div class="bookshelf-page__toolbar">
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

      <div class="bookshelf-page__search">
        <Input
          v-model="searchKeyword"
          placeholder="搜索书名"
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

    <section v-if="loading" class="bookshelf-list" aria-label="加载中的书架">
      <article v-for="index in 6" :key="index" class="bookshelf-item bookshelf-item--loading">
        <Skeleton class="bookshelf-item__cover" />
        <div class="bookshelf-item__body">
          <Skeleton class="h-5 w-2/3" />
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
        </div>
      </article>
    </section>

    <PageStatusPanel
      v-else-if="displayedBooks.length === 0"
      variant="empty"
      :title="emptyTitle"
      :description="emptyDescription"
    >
      <template #action>
        <Button variant="default" :disabled="uploading" @click="fileInputRef?.click()">上传 TXT</Button>
      </template>
    </PageStatusPanel>

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

const router = useRouter();

const preferencesStore = usePreferencesStore();
const { continuingBookId, continueReading } = useContinueReading();
const BOOK_METADATA_UPDATED_EVENT = "books:metadata-updated";
const books = ref<BookShelfItem[]>([]);
const groups = ref<BookGroup[]>([]);
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
  width: min(100%, 1080px);
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

/* 分组筛选：下划线式 tab */
.bookshelf-page__tabs {
  display: flex;
  gap: 4px;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--border-color-soft);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.bookshelf-page__tabs::-webkit-scrollbar {
  display: none;
}

.bookshelf-page__tab {
  position: relative;
  flex: 0 0 auto;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: color 160ms ease;
}

.bookshelf-page__tab:hover {
  color: var(--text-primary);
}

.bookshelf-page__tab--active {
  color: var(--primary-color);
  font-weight: 600;
}

.bookshelf-page__tab--active::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: -1px;
  height: 2px;
  border-radius: 999px;
  background: var(--primary-color);
}

/* 工具行：排序 + 搜索 */
.bookshelf-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.bookshelf-page__sort {
  width: 148px;
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

/* 书籍列表：单列横向卡片 */
.bookshelf-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.bookshelf-item {
  min-width: 0;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  padding: 20px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-md);
  background: var(--surface-card-bg);
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.bookshelf-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.bookshelf-item--loading {
  cursor: default;
}

.bookshelf-item--loading:hover {
  transform: none;
  box-shadow: none;
}

.bookshelf-item__cover {
  width: 88px;
  height: 120px;
}

.bookshelf-item__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bookshelf-item__header-block {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.bookshelf-item__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.bookshelf-item__author {
  margin: 0;
  font-size: 13px;
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
  gap: 6px 14px;
  flex-wrap: wrap;
  min-width: 0;
  font-size: 13px;
}

.bookshelf-item__facts span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookshelf-item__groups {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.bookshelf-item__footer {
  margin-top: auto;
  display: grid;
  gap: 12px;
}

.bookshelf-item__progress {
  display: grid;
  gap: 8px;
}

.bookshelf-item__progress-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  font-size: 12px;
}

.bookshelf-item__progress-head strong {
  color: var(--text-primary);
  font-size: 13px;
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
  font-weight: 600;
}

.bookshelf-item__action--danger {
  color: var(--alert-destructive-text);
}

.bookshelf-item__action--danger:hover {
  color: var(--alert-destructive-text);
  background: var(--alert-destructive-bg);
}

@media (max-width: 720px) {
  .bookshelf-page {
    gap: 16px;
  }

  .bookshelf-page__tab {
    padding: 9px 12px;
  }

  .bookshelf-page__tab--active::after {
    left: 12px;
    right: 12px;
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

  .bookshelf-item {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 14px;
    padding: 16px;
  }

  .bookshelf-item__cover {
    width: 72px;
    height: 100px;
  }

  .bookshelf-item__title {
    font-size: 17px;
  }

  .bookshelf-item__facts {
    display: none;
  }
}
</style>
