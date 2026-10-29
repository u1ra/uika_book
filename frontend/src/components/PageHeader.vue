<template>
  <header class="page-header">
    <div class="page-header__text">
      <p v-if="eyebrow" class="page-header__eyebrow">
        <span class="page-header__sparkle" aria-hidden="true">✦</span>
        <span>{{ eyebrow }}</span>
      </p>
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    eyebrow?: string;
  }>(),
  {
    subtitle: "",
    eyebrow: "",
  },
);
</script>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 24px;
}

.page-header__text {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.page-header__eyebrow {
  margin: 0;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--primary-soft);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary-color);
}

.page-header__sparkle {
  color: var(--accent-color);
  font-size: 12px;
}

.page-header__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-title-2);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-header__subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
</style>
