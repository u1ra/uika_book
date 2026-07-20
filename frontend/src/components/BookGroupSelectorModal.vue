<template>
  <Dialog :open="show" @update:open="handleShowChange">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>管理分组</DialogTitle>
      </DialogHeader>

      <section class="group-selector__intro">
        <strong>{{ bookTitle || '当前书籍' }}</strong>
        <p>一本书可以同时属于多个分组，但必须至少保留一个真实分组。</p>
      </section>

      <Alert
        v-if="draftGroupIds.length === 0"
        variant="warning"
        class="group-selector__alert"
      >
        至少选择一个分组后才能保存。
      </Alert>

      <div v-if="groups.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-500">
        <p>当前还没有可选分组</p>
        <p class="text-sm">请先去创建分组。</p>
      </div>

      <div v-else class="group-selector__options">
        <label
          v-for="group in groups"
          :key="group.id"
          class="group-selector__option"
        >
          <div>
            <strong>{{ group.name }}</strong>
            <p>当前包含 {{ group.book_count }} 本书</p>
          </div>
          <input
            v-model="draftGroupIds"
            type="checkbox"
            :value="group.id"
            class="group-selector__checkbox"
          />
        </label>
      </div>

      <div class="group-selector__footer">
        <Button variant="ghost" :disabled="submitting" @click="handleShowChange(false)">取消</Button>
        <Button
          :disabled="submitting || draftGroupIds.length === 0 || groups.length === 0"
          @click="handleSubmit"
        >
          保存分组
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

import type { BookGroup } from "../types/api";

const props = defineProps<{
  show: boolean;
  bookTitle: string;
  groups: BookGroup[];
  selectedGroupIds: number[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  submit: [groupIds: number[]];
}>();

const draftGroupIds = ref<number[]>([]);

watch(
  () => [props.show, props.selectedGroupIds],
  () => {
    draftGroupIds.value = [...props.selectedGroupIds];
  },
  { immediate: true, deep: true },
);

function handleShowChange(value: boolean) {
  emit("update:show", value);
}

function handleSubmit() {
  if (draftGroupIds.value.length === 0) {
    return;
  }

  emit("submit", [...draftGroupIds.value]);
}
</script>

<style scoped>
.group-selector__intro {
  margin-bottom: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.58);
}

.group-selector__intro p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.group-selector__alert {
  margin-bottom: 16px;
  border-radius: 16px;
}

.group-selector__options {
  display: grid;
  gap: 12px;
}

.group-selector__option {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-md);
  background: var(--surface-card-bg);
  cursor: pointer;
}

.group-selector__option p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.group-selector__checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
  cursor: pointer;
  flex-shrink: 0;
}

.group-selector__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 720px) {
  .group-selector__option,
  .group-selector__footer {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
