/**
 * Service Worker 更新处理：SW 更新（controllerchange）后立即刷新页面可能打断阅读，
 * 因此阅读页（immersive 路由）内只记录 pending，离开阅读页后再刷新。
 * reloading 防止 controllerchange 重复触发导致的 reload 循环。
 */
export interface SwUpdateHandler {
  /** controllerchange 事件回调。 */
  onControllerChange(): void;
  /** 路由 afterEach 回调：离开阅读页时完成被推迟的刷新。 */
  onRouteAfterEach(to: { immersive: boolean }, from: { immersive: boolean }): void;
  /** 是否有待执行的刷新（测试与调试用）。 */
  readonly pendingReload: boolean;
}

export function createSwUpdateHandler(options: {
  reload: () => void;
  isImmersiveRoute: () => boolean;
}): SwUpdateHandler {
  let reloading = false;
  let pending = false;

  function doReload() {
    if (reloading) {
      return;
    }
    reloading = true;
    options.reload();
  }

  return {
    onControllerChange() {
      if (reloading) {
        return;
      }
      if (options.isImmersiveRoute()) {
        pending = true;
        return;
      }
      doReload();
    },
    onRouteAfterEach(to, from) {
      if (pending && from.immersive && !to.immersive) {
        doReload();
      }
    },
    get pendingReload() {
      return pending;
    },
  };
}
