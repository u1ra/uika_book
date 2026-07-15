import { reactive } from "vue";

export type NotificationVariant = "success" | "error" | "info" | "warning";

interface NotificationOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  duration?: number;
  destructive?: boolean;
}

interface NotificationRequest {
  variant: NotificationVariant;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  showCancel: boolean;
  destructive: boolean;
  resolve?: (confirmed: boolean) => void;
}

const DEFAULT_TITLES: Record<NotificationVariant, string> = {
  success: "操作成功",
  error: "操作失败",
  info: "提示",
  warning: "请确认",
};

const notificationQueue: NotificationRequest[] = [];
let activeRequest: NotificationRequest | null = null;

export const notificationDialogState = reactive({
  open: false,
  variant: "info" as NotificationVariant,
  title: "",
  message: "",
  confirmLabel: "确定",
  cancelLabel: "取消",
  showCancel: false,
  destructive: false,
});

function enqueueNotification(request: NotificationRequest) {
  notificationQueue.push(request);
  showNextNotification();
}

function showNextNotification() {
  if (activeRequest || notificationQueue.length === 0) {
    return;
  }

  activeRequest = notificationQueue.shift() ?? null;
  if (!activeRequest) return;

  Object.assign(notificationDialogState, {
    open: true,
    variant: activeRequest.variant,
    title: activeRequest.title,
    message: activeRequest.message,
    confirmLabel: activeRequest.confirmLabel,
    cancelLabel: activeRequest.cancelLabel,
    showCancel: activeRequest.showCancel,
    destructive: activeRequest.destructive,
  });
}

function finishNotification(confirmed: boolean) {
  if (!activeRequest) {
    notificationDialogState.open = false;
    return;
  }

  const finishedRequest = activeRequest;
  activeRequest = null;
  notificationDialogState.open = false;
  finishedRequest.resolve?.(confirmed);

  window.setTimeout(showNextNotification, 0);
}

function showResult(variant: NotificationVariant, message: string, options: NotificationOptions = {}) {
  enqueueNotification({
    variant,
    title: options.title || DEFAULT_TITLES[variant],
    message,
    confirmLabel: options.confirmLabel || "确定",
    cancelLabel: options.cancelLabel || "取消",
    showCancel: false,
    destructive: false,
  });
}

export function confirmNotification() {
  finishNotification(true);
}

export function dismissNotification() {
  finishNotification(false);
}

export function handleNotificationOpenChange(open: boolean) {
  if (!open && notificationDialogState.open) {
    dismissNotification();
  }
}

export const notify = {
  success: (message: string, options?: NotificationOptions) => showResult("success", message, options),
  error: (message: string, options?: NotificationOptions) => showResult("error", message, options),
  info: (message: string, options?: NotificationOptions) => showResult("info", message, options),
  warning: (message: string, options?: NotificationOptions) => showResult("warning", message, options),
  confirm: (message: string, options: NotificationOptions = {}) =>
    new Promise<boolean>((resolve) => {
      enqueueNotification({
        variant: "warning",
        title: options.title || DEFAULT_TITLES.warning,
        message,
        confirmLabel: options.confirmLabel || "确认",
        cancelLabel: options.cancelLabel || "取消",
        showCancel: true,
        destructive: options.destructive ?? false,
        resolve,
      });
    }),
};
