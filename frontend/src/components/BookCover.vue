<template>
  <div class="book-cover" :class="{ 'book-cover--filled': !!resolvedCoverUrl }" aria-hidden="true">
    <span class="book-cover__spine" />
    <img
      v-if="resolvedCoverUrl"
      class="book-cover__image"
      :src="resolvedCoverUrl"
      :alt="`${title} 封面`"
      loading="lazy"
    />
    <div v-else class="book-cover__placeholder">
      <span class="book-cover__star book-cover__star--tl">✦</span>
      <span class="book-cover__star book-cover__star--br">✦</span>
      <span class="book-cover__type">LIGHT TXT</span>
      <strong class="book-cover__letter">{{ coverLetter }}</strong>
      <span v-if="fallbackText" class="book-cover__text">{{ fallbackText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { resolveApiAssetUrl } from "@/api/client";

const props = withDefaults(
  defineProps<{
    title: string;
    coverUrl?: string | null;
    /** 无封面时在底部显示的提示文字，传空字符串则不显示 */
    fallbackText?: string;
  }>(),
  {
    coverUrl: null,
    fallbackText: "",
  },
);

const resolvedCoverUrl = computed(() => resolveApiAssetUrl(props.coverUrl ?? null));

const coverLetter = computed(() => {
  const normalized = props.title.trim();
  return normalized ? normalized.slice(0, 1).toUpperCase() : "U";
});
</script>

<style scoped>
.book-cover {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-cover-bg);
  color: var(--text-secondary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 8px 20px rgba(96, 68, 198, 0.12);
}

.book-cover--filled {
  background: var(--surface-cover-fill-bg);
}

/* 仿真轻小说左侧书脊压痕光效 */
.book-cover__spine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 10px;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.32) 0%,
    rgba(19, 15, 33, 0.14) 48%,
    rgba(255, 255, 255, 0.22) 72%,
    transparent 100%
  );
}

.book-cover__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.book-cover__placeholder {
  position: relative;
  width: calc(100% - 14px);
  height: calc(100% - 14px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: 1px dashed var(--border-color);
  border-radius: calc(var(--radius-md) - 5px);
  text-align: center;
}

.book-cover__star {
  position: absolute;
  font-size: 11px;
  line-height: 1;
  color: var(--accent-color);
  opacity: 0.85;
}

.book-cover__star--tl {
  top: 6px;
  left: 8px;
}

.book-cover__star--br {
  right: 8px;
  bottom: 6px;
}

.book-cover__type {
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-color);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.book-cover__letter {
  font-family: var(--font-display);
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 800;
  line-height: 1.05;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.book-cover__text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  opacity: 0.85;
}
</style>
