<template>
  <div
    class="progress-bar"
    role="progressbar"
    :aria-valuenow="normalizedPercent"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="progress-bar__fill" :style="{ width: `${normalizedPercent}%` }" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { clampPercentage } from "@/utils/format";

const props = defineProps<{
  percent: number | null | undefined;
}>();

const normalizedPercent = computed(() => clampPercentage(props.percent));
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--primary-soft);
}

.progress-bar__fill {
  height: 100%;
  border-radius: inherit;
  background: var(--primary-color);
  transition: width 240ms ease;
}
</style>
