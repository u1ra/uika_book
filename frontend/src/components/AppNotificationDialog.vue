<template>
  <Dialog :open="notificationDialogState.open" @update:open="handleNotificationOpenChange">
    <DialogContent
      overlay-class="!z-[1000] bg-black/45 backdrop-blur-[2px]"
      class="!z-[1001] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-3xl p-0 shadow-[var(--shadow-modal)]"
    >
      <div class="app-notification-dialog__layout">
        <div
          class="app-notification-dialog__icon"
          :class="`app-notification-dialog__icon--${notificationDialogState.variant}`"
          aria-hidden="true"
        >
          <CircleCheck v-if="notificationDialogState.variant === 'success'" :size="30" />
          <CircleX v-else-if="notificationDialogState.variant === 'error'" :size="30" />
          <TriangleAlert v-else-if="notificationDialogState.variant === 'warning'" :size="30" />
          <Info v-else :size="30" />
        </div>

        <DialogHeader class="w-full !text-center">
          <DialogTitle>{{ notificationDialogState.title }}</DialogTitle>
          <DialogDescription class="text-[var(--text-secondary)] leading-7">
            {{ notificationDialogState.message }}
          </DialogDescription>
        </DialogHeader>

        <div
          class="app-notification-dialog__actions"
          :class="{ 'app-notification-dialog__actions--double': notificationDialogState.showCancel }"
        >
          <Button
            v-if="notificationDialogState.showCancel"
            variant="outline"
            @click="dismissNotification"
          >
            {{ notificationDialogState.cancelLabel }}
          </Button>
          <Button
            :variant="notificationDialogState.destructive ? 'destructive' : 'default'"
            @click="confirmNotification"
          >
            {{ notificationDialogState.confirmLabel }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  confirmNotification,
  dismissNotification,
  handleNotificationOpenChange,
  notificationDialogState,
} from "@/utils/notify";
</script>

<style scoped>
.app-notification-dialog__layout {
  display: grid;
  justify-items: center;
  gap: 18px;
  width: 100%;
  padding: 28px 24px 24px;
  color: var(--text-primary);
  text-align: center;
}

.app-notification-dialog__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 999px;
}

.app-notification-dialog__icon--success {
  background: var(--alert-success-bg);
  color: var(--alert-success-text);
}

.app-notification-dialog__icon--error {
  background: var(--alert-destructive-bg);
  color: var(--alert-destructive-text);
}

.app-notification-dialog__icon--info {
  background: var(--alert-info-bg);
  color: var(--alert-info-text);
}

.app-notification-dialog__icon--warning {
  background: var(--alert-warning-bg);
  color: var(--alert-warning-text);
}

.app-notification-dialog__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: 100%;
}

.app-notification-dialog__actions--double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 480px) {
  .app-notification-dialog__layout {
    max-height: calc(100dvh - 32px);
    padding: 22px 20px 20px;
    overflow-y: auto;
  }

  .app-notification-dialog__actions--double {
    grid-template-columns: 1fr;
  }
}
</style>
