import { describe, expect, it, vi } from "vitest";

import { createSwUpdateHandler } from "../sw-update";

describe("createSwUpdateHandler", () => {
  it("非阅读页：controllerchange 立即刷新", () => {
    const reload = vi.fn();
    const handler = createSwUpdateHandler({ reload, isImmersiveRoute: () => false });

    handler.onControllerChange();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(handler.pendingReload).toBe(false);
  });

  it("阅读页：controllerchange 不刷新，离开阅读页后才刷新", () => {
    const reload = vi.fn();
    let immersive = true;
    const handler = createSwUpdateHandler({ reload, isImmersiveRoute: () => immersive });

    handler.onControllerChange();
    expect(reload).not.toHaveBeenCalled();
    expect(handler.pendingReload).toBe(true);

    // 阅读页内路由变化（切章）：仍不刷新
    handler.onRouteAfterEach({ immersive: true }, { immersive: true });
    expect(reload).not.toHaveBeenCalled();

    // 离开阅读页：完成推迟的刷新
    handler.onRouteAfterEach({ immersive: false }, { immersive: true });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("重复 controllerchange 不会导致重复刷新", () => {
    const reload = vi.fn();
    const handler = createSwUpdateHandler({ reload, isImmersiveRoute: () => false });

    handler.onControllerChange();
    handler.onControllerChange();
    handler.onControllerChange();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("无 pending 时普通路由跳转不触发刷新", () => {
    const reload = vi.fn();
    const handler = createSwUpdateHandler({ reload, isImmersiveRoute: () => false });

    handler.onRouteAfterEach({ immersive: false }, { immersive: true });

    expect(reload).not.toHaveBeenCalled();
  });
});
