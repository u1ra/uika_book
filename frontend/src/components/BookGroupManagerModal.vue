<template>
  <Dialog :open="show" @update:open="handleShowChange">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>分组管理</DialogTitle>
      </DialogHeader>

      <section class="group-manager__create">
        <div>
          <strong>创建新分组</strong>
          <p>分组名不能为空，且同一用户下不能重复。</p>
        </div>

        <div class="group-manager__create-form">
          <Input
            v-model="newGroupName"
            maxlength="100"
            placeholder="例如：科幻 / 已读 / 收藏"
            :disabled="busy"
            @keydown.enter.prevent="emitCreate"
          />
          <Button :disabled="busy || !newGroupName.trim()" @click="emitCreate">
            创建分组
          </Button>
        </div>
      </section>

      <div v-if="groups.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-500">
        <p>还没有真实分组</p>
        <p class="text-sm">可以先创建一个。</p>
      </div>

      <section v-else class="group-manager__list">
        <article v-for="group in groups" :key="group.id" class="group-manager__item">
          <template v-if="editingGroupId === group.id">
            <div class="group-manager__edit-row">
              <Input
                v-model="editingName"
                maxlength="100"
                :disabled="busy"
                @keydown.enter.prevent="emitRename(group.id)"
              />
              <Button variant="ghost" :disabled="busy" @click="cancelEdit">取消</Button>
              <Button :disabled="busy || !editingName.trim()" @click="emitRename(group.id)">
                保存
              </Button>
            </div>
          </template>

          <template v-else>
            <div class="group-manager__meta">
              <div>
                <strong>{{ group.name }}</strong>
                <p>当前包含 {{ group.book_count }} 本书</p>
              </div>
              <Badge variant="secondary">{{ group.book_count }} 本</Badge>
            </div>

            <div class="group-manager__actions">
              <Button variant="ghost" size="sm" :disabled="busy" @click="startEdit(group)">
                重命名
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="text-red-600 hover:text-red-700"
                :disabled="busy"
                @click="confirmDelete(group.id, group.name)"
              >
                删除
              </Button>
            </div>
          </template>
        </article>
      </section>
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
import { Input } from "@/components/ui/input";
import { notify } from "@/utils/notify";
import { Badge } from "@/components/ui/badge";

import type { BookGroup } from "../types/api";

const props = defineProps<{
  show: boolean;
  groups: BookGroup[];
  busy: boolean;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  create: [name: string];
  rename: [payload: { groupId: number; name: string }];
  delete: [groupId: number];
}>();

const newGroupName = ref("");
const editingGroupId = ref<number | null>(null);
const editingName = ref("");

watch(
  () => props.show,
  (show) => {
    if (!show) {
      newGroupName.value = "";
      editingGroupId.value = null;
      editingName.value = "";
    }
  },
);

function handleShowChange(value: boolean) {
  emit("update:show", value);
}

function emitCreate() {
  const name = newGroupName.value.trim();
  if (!name) {
    return;
  }

  emit("create", name);
  newGroupName.value = "";
}

function startEdit(group: BookGroup) {
  editingGroupId.value = group.id;
  editingName.value = group.name;
}

function cancelEdit() {
  editingGroupId.value = null;
  editingName.value = "";
}

function emitRename(groupId: number) {
  const name = editingName.value.trim();
  if (!name) {
    return;
  }

  emit("rename", { groupId, name });
  cancelEdit();
}

async function confirmDelete(groupId: number, groupName: string) {
  const confirmed = await notify.confirm(`删除前会做安全校验，确认删除「${groupName}」吗？`, {
    title: "删除分组",
    confirmLabel: "确认删除",
    destructive: true,
  });
  if (confirmed) {
    emit("delete", groupId);
  }
}
</script>

<style scoped>
.group-manager__create {
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.55);
}

.group-manager__create p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.group-manager__create-form,
.group-manager__edit-row,
.group-manager__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.group-manager__create-form :deep(input),
.group-manager__edit-row :deep(input) {
  flex: 1;
}

.group-manager__list {
  display: grid;
  gap: 12px;
}

.group-manager__item {
  display: grid;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-md);
  background: var(--surface-card-bg);
}

.group-manager__meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.group-manager__meta p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

@media (max-width: 720px) {
  .group-manager__meta,
  .group-manager__create-form,
  .group-manager__edit-row,
  .group-manager__actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
