<template>
  <div class="book-cover" :class="{ 'book-cover--filled': !!resolvedCoverUrl }" aria-hidden="true">
    <img
      v-if="resolvedCoverUrl"
      class="book-cover__image"
      :src="resolvedCoverUrl"
      :alt="`${title} 封面`"
      loading="lazy"
    />
    <template v-else>
      <span class="book-cover__type">TXT</span>
      <strong class="book-cover__letter">{{ coverLetter }}</strong>
      <span v-if="fallbackText" class="book-cover__text">{{ fallbackText }}</span>
    </template>
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
  return normalized ? normalized.slice(0, 1).toUpperCase() : "T";
});
</script>

<style scoped>
.book-cover {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-cover-bg);
  color: var(--text-secondary);
}

.book-cover--filled {
  background: var(--surface-cover-fill-bg);
}

.book-cover__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-cover__type {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  opacity: 0.72;
}

.book-cover__letter {
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}

.book-cover__text {
  font-size: 12px;
  opacity: 0.72;
}
</style>
