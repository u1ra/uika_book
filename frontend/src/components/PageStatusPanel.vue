<template>
  <section class="page-status-panel" :class="`page-status-panel--${variant}`">
    <div v-if="variant === 'loading'" class="page-status-panel__spinner" aria-hidden="true" />
    <div v-else class="page-status-panel__visual">
      <img
        v-if="variant === 'empty'"
        class="page-status-panel__mascot"
        src="/icon-192.png"
        alt=""
        aria-hidden="true"
      />
      <div class="page-status-panel__badge">
        <span aria-hidden="true">✦</span>
        <span>{{ badgeLabel }}</span>
      </div>
    </div>
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
  return props.variant === "error" ? "Error State" : "Empty Shelf";
});
</script>

<style scoped>
.page-status-panel {
  position: relative;
  overflow: hidden;
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: clamp(32px, 5vw, 48px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  text-align: center;
  background: var(--surface-card-bg);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-soft);
}

.page-status-panel__visual {
  display: grid;
  justify-items: center;
  gap: 12px;
}

.page-status-panel__mascot {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  object-fit: cover;
  border: 2px solid var(--border-gold);
  box-shadow: 0 10px 24px var(--primary-soft);
}

.page-status-panel__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.page-status-panel--empty .page-status-panel__badge {
  background: var(--primary-soft);
  color: var(--primary-color);
  border: 1px solid var(--border-color-soft);
}

.page-status-panel--error .page-status-panel__badge {
  background: var(--alert-destructive-bg);
  color: var(--alert-destructive-text);
}

.page-status-panel__spinner {
  width: 38px;
  height: 38px;
  border: 3px solid var(--primary-soft);
  border-top-color: var(--primary-color);
  border-right-color: var(--accent-color);
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
  font-size: clamp(22px, 3.5vw, 30px);
  font-weight: 800;
  line-height: 1.25;
}

.page-status-panel__description {
  max-width: 540px;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

.page-status-panel__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .page-status-panel__actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
