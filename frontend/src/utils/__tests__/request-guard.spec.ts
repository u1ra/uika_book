import { describe, expect, it } from "vitest";

import { createRequestGuard } from "../request-guard";

describe("createRequestGuard", () => {
  it("只有最新一次请求通过校验", () => {
    const guard = createRequestGuard();
    const staleId = guard.next();
    const freshId = guard.next();

    expect(guard.isCurrent(staleId)).toBe(false);
    expect(guard.isCurrent(freshId)).toBe(true);
  });

  it("模拟快速连点：慢响应（先发后至）被丢弃，快响应（后发先至）生效", async () => {
    const guard = createRequestGuard();
    const applied: string[] = [];

    async function fakeRequest(label: string, delayMs: number) {
      const id = guard.next();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (!guard.isCurrent(id)) {
        return;
      }
      applied.push(label);
    }

    // 先发的请求慢（30ms），后发的请求快（1ms）：慢响应回来时已被丢弃。
    await Promise.all([fakeRequest("stale-slow", 30), fakeRequest("fresh-fast", 1)]);

    expect(applied).toEqual(["fresh-fast"]);
  });

  it("invalidate 使所有进行中请求失效", () => {
    const guard = createRequestGuard();
    const id = guard.next();

    guard.invalidate();

    expect(guard.isCurrent(id)).toBe(false);
    // 失效后新请求不受影响
    const nextId = guard.next();
    expect(guard.isCurrent(nextId)).toBe(true);
  });
});
