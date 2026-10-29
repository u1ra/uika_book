<template>
  <input
    :class="cn(
      'flex h-10 w-full rounded-xl border border-[var(--dialog-border)] bg-[var(--surface-input-bg)] px-3.5 py-1.5 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:border-[var(--primary-color)] focus-visible:ring-2 focus-visible:ring-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-50',
      $attrs.class ?? ''
    )"
    v-model="modelValue"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { cn } from "@/lib/utils";

const modelValue = defineModel<string>();
</script>
