import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dismissNotification, notificationDialogState, notify } from "../notify";

describe("notify", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // 清空可能残留的活动通知与队列，避免用例间相互影响。
    while (notificationDialogState.open) {
      dismissNotification();
      vi.runAllTimers();
    }
    vi.useRealTimers();
  });

  it("success 通知默认 3000ms 后自动消失", () => {
    notify.success("上传完成");
    expect(notificationDialogState.open).toBe(true);
    expect(notificationDialogState.variant).toBe("success");

    vi.advanceTimersByTime(2999);
    expect(notificationDialogState.open).toBe(true);

    vi.advanceTimersByTime(1);
    expect(notificationDialogState.open).toBe(false);
  });

  it("duration 选项覆盖默认自动消失时间", () => {
    notify.success("自定义时长", { duration: 5000 });

    vi.advanceTimersByTime(3000);
    expect(notificationDialogState.open).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(notificationDialogState.open).toBe(false);
  });

  it("error 通知不自动消失，需手动确认", () => {
    notify.error("操作失败");

    vi.advanceTimersByTime(60_000);
    expect(notificationDialogState.open).toBe(true);

    dismissNotification();
    expect(notificationDialogState.open).toBe(false);
  });

  it("confirm 不自动消失且能 resolve 用户选择", async () => {
    const promise = notify.confirm("确认删除？");
    expect(notificationDialogState.showCancel).toBe(true);

    vi.advanceTimersByTime(60_000);
    expect(notificationDialogState.open).toBe(true);

    dismissNotification();
    await expect(promise).resolves.toBe(false);
  });

  it("队列中的通知依次自动消失，不会卡死", () => {
    notify.success("第一条");
    notify.success("第二条");
    expect(notificationDialogState.message).toBe("第一条");

    // 第一条自动消失后，0ms 接力定时器把第二条补上
    vi.advanceTimersByTime(3000);
    vi.advanceTimersByTime(1);
    expect(notificationDialogState.open).toBe(true);
    expect(notificationDialogState.message).toBe("第二条");

    vi.advanceTimersByTime(3000);
    expect(notificationDialogState.open).toBe(false);
  });

  it("手动关闭自动通知后定时器不会重复触发", () => {
    notify.success("手动关闭");
    dismissNotification();
    expect(notificationDialogState.open).toBe(false);

    // 原定时器已被清理，推进时间不会重新触发任何状态变化
    vi.advanceTimersByTime(10_000);
    expect(notificationDialogState.open).toBe(false);
  });
});
