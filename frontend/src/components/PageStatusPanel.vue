<template>
  <section class="page-status-panel" :class="`page-status-panel--${variant}`">
    <div v-if="variant === 'loading'" class="page-status-panel__spinner" aria-hidden="true" />
    <div v-else class="page-status-panel__badge">{{ badgeLabel }}</div>
    <h2 class="page-status-panel__title">{{ title }}</h2>
    <p class="page-status-panel__description">{{ description }}</p>
    <div v-if="$slots.action" class="page-status-panel__actions">
      <slot name="action" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "empty" | "error" | "loading";
    title: string;
    description: string;
  }>(),
  {
    variant: "empty",
  },
);

const badgeLabel = computed(() => {
  return props.variant === "error" ? "Error State" : "Empty State";
});
</script>

<style scoped>
.page-status-panel {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: clamp(28px, 5vw, 44px);
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-xl);
  text-align: center;
  background: var(--surface-color);
}

.page-status-panel__badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-status-panel--empty .page-status-panel__badge {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.page-status-panel--error .page-status-panel__badge {
  background: var(--alert-destructive-bg);
  color: var(--alert-destructive-text);
}

.page-status-panel__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--primary-soft);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: page-status-panel-spin 0.9s linear infinite;
}

@keyframes page-status-panel-spin {
  to {
    transform: rotate(360deg);
  }
}

.page-status-panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 34px);
  line-height: 1.15;
}

.page-status-panel__description {
  max-width: 560px;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.8;
}

.page-status-panel__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

@media (max-width: 640px) {
  .page-status-panel__actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
