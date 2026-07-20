<template>
  <!-- Mobile: right drawer -->
  <transition name="catalog-drawer">
    <div
      v-if="isCompactViewport && show"
      class="catalog-drawer"
      @click="handleShowChange(false)"
    >
      <div
        class="catalog-drawer__panel"
        :style="{ width: drawerWidth + 'px' }"
        @click.stop
      >
        <section class="chapter-catalog-panel chapter-catalog-panel--drawer">
          <div class="chapter-catalog-panel__summary">
            <div class="chapter-catalog-panel__heading">
              <strong>目录</strong>
              <span class="chapter-catalog-panel__count">{{ chapterCountLabel }}</span>
            </div>
            <p v-if="bookTitle" class="chapter-catalog-panel__book">{{ bookTitle }}</p>
            <p class="chapter-catalog-panel__hint">
              点击任意章节后会直接跳转到阅读页，并自动关闭目录面板。
            </p>
          </div>

          <div class="chapter-catalog-panel__body">
            <div v-if="chapters.length === 0" class="chapter-catalog-panel__empty">
              <p>当前还没有可展示的目录</p>
              <p class="chapter-catalog-panel__empty-sub">请稍后再试或重新解析目录。</p>
            </div>

            <div v-else class="chapter-catalog-list">
              <button
                v-for="chapter in chapters"
                :key="`drawer-${chapter.id}`"
                type="button"
                class="chapter-catalog-list__item"
                @click="handleChapterSelect(chapter.chapter_index)"
              >
                <span class="chapter-catalog-list__index">
                  {{ formatChapterOrdinal(chapter.chapter_index) }}
                </span>
                <strong class="chapter-catalog-list__title">{{ chapter.chapter_title }}</strong>
                <span class="chapter-catalog-list__meta">
                  {{ formatNumber(chapter.start_offset) }} - {{ formatNumber(chapter.end_offset) }}
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </transition>

  <!-- Desktop: Dialog -->
  <Dialog :open="!isCompactViewport && show" @update:open="handleShowChange">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          <div class="chapter-catalog-panel__heading">
            <strong>目录</strong>
            <span class="chapter-catalog-panel__count">{{ chapterCountLabel }}</span>
          </div>
        </DialogTitle>
      </DialogHeader>

      <section class="chapter-catalog-panel chapter-catalog-panel--modal">
        <div class="chapter-catalog-panel__summary">
          <p v-if="bookTitle" class="chapter-catalog-panel__book">{{ bookTitle }}</p>
          <p class="chapter-catalog-panel__hint">
            点击任意章节后会直接跳转到阅读页，并自动关闭目录面板。
          </p>
        </div>

        <div class="chapter-catalog-panel__body">
          <div v-if="chapters.length === 0" class="chapter-catalog-panel__empty">
            <p>当前还没有可展示的目录</p>
            <p class="chapter-catalog-panel__empty-sub">请稍后再试或重新解析目录。</p>
          </div>

          <div v-else class="chapter-catalog-list">
            <button
              v-for="chapter in chapters"
              :key="`modal-${chapter.id}`"
              type="button"
              class="chapter-catalog-list__item"
              @click="handleChapterSelect(chapter.chapter_index)"
            >
              <span class="chapter-catalog-list__index">
                {{ formatChapterOrdinal(chapter.chapter_index) }}
              </span>
              <strong class="chapter-catalog-list__title">{{ chapter.chapter_title }}</strong>
              <span class="chapter-catalog-list__meta">
                {{ formatNumber(chapter.start_offset) }} - {{ formatNumber(chapter.end_offset) }}
              </span>
            </button>
          </div>
        </div>
      </section>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMediaQuery, useWindowSize } from "@vueuse/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { BookChapter } from "../types/api";
import { formatNumber } from "../utils/format";

const props = defineProps<{
  show: boolean;
  bookTitle: string;
  chapterCount: number;
  chapters: BookChapter[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  select: [chapterIndex: number];
}>();

const isCompactViewport = useMediaQuery("(max-width: 720px)");
const { width: viewportWidth } = useWindowSize();

const drawerWidth = computed(() => Math.min(Math.max(viewportWidth.value, 320), 420));
const chapterCountLabel = computed(() => `共 ${formatNumber(props.chapterCount)} 章`);

function handleShowChange(value: boolean) {
  emit("update:show", value);
}

function handleChapterSelect(chapterIndex: number) {
  emit("select", chapterIndex);
}

function formatChapterOrdinal(index: number) {
  return `第 ${formatNumber(index + 1)} 章`;
}
</script>

<style scoped>
.catalog-drawer {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.catalog-drawer::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

.catalog-drawer__panel {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  overflow-y: auto;
  background: var(--surface-color);
  padding: 20px;
  box-sizing: border-box;
}

.catalog-drawer-enter-active,
.catalog-drawer-leave-active {
  transition: opacity 280ms ease;
}

.catalog-drawer-enter-from,
.catalog-drawer-leave-to {
  opacity: 0;
}

.catalog-drawer-enter-active .catalog-drawer__panel,
.catalog-drawer-leave-active .catalog-drawer__panel {
  transition: transform 280ms ease;
}

.catalog-drawer-enter-from .catalog-drawer__panel,
.catalog-drawer-leave-to .catalog-drawer__panel {
  transform: translateX(100%);
}

.chapter-catalog-panel {
  display: grid;
  gap: 14px;
}

/* Summary: 纯排版，无卡片 */
.chapter-catalog-panel__summary {
  display: grid;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color-soft);
}

.chapter-catalog-panel__heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.chapter-catalog-panel__heading strong {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}

.chapter-catalog-panel__count {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.chapter-catalog-panel__book,
.chapter-catalog-panel__hint {
  margin: 0;
}

.chapter-catalog-panel__book {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
}

.chapter-catalog-panel__hint {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.chapter-catalog-panel__body {
  max-height: min(62vh, 560px);
  overflow: auto;
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.chapter-catalog-panel__body::-webkit-scrollbar {
  width: 10px;
}

.chapter-catalog-panel__body::-webkit-scrollbar-track {
  background: transparent;
}

.chapter-catalog-panel__body::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 999px;
}

.chapter-catalog-panel__body::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

.chapter-catalog-panel--drawer .chapter-catalog-panel__body {
  max-height: calc(100vh - 220px);
}

.chapter-catalog-panel__empty {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 32px 0;
  color: var(--text-secondary);
  text-align: center;
}

.chapter-catalog-panel__empty p {
  margin: 0;
}

.chapter-catalog-panel__empty-sub {
  font-size: 13px;
  opacity: 0.85;
}

/* 章节条目：简洁行，hover 高亮 */
.chapter-catalog-list {
  display: grid;
  gap: 2px;
}

.chapter-catalog-list__item {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "index meta"
    "title title";
  column-gap: 12px;
  row-gap: 2px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 160ms ease;
}

.chapter-catalog-list__item:hover {
  background: var(--surface-panel-soft-bg);
}

.chapter-catalog-list__item:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 1px;
}

.chapter-catalog-list__index {
  grid-area: index;
  color: var(--text-secondary);
  font-size: 12px;
}

.chapter-catalog-list__meta {
  grid-area: meta;
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  opacity: 0.85;
}

.chapter-catalog-list__title {
  grid-area: title;
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .chapter-catalog-panel__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .chapter-catalog-panel__body {
    max-height: calc(100vh - 240px);
  }
}
</style>
