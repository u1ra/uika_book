import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient, setUnauthorizedHandler } from "../client";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    setUnauthorizedHandler(null);
  });

  it("401 且 auth=true 时触发统一 401 处理", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { detail: "token expired" })));

    await expect(apiClient.get("/api/books")).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("auth=false 的请求（如登录）401 时不触发统一处理", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { detail: "bad credentials" })));

    await expect(apiClient.post("/api/auth/login", {}, { auth: false })).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("skipUnauthorizedHandler 时 401 不触发统一处理", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { detail: "expired" })));

    await expect(apiClient.get("/api/books", { skipUnauthorizedHandler: true })).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("请求超过 timeoutMs 后抛出超时提示", async () => {
    vi.useRealTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init.signal;
          if (signal) {
            signal.addEventListener("abort", () => reject(signal.reason));
          }
        }),
      ),
    );

    const promise = apiClient.get("/api/books", { timeoutMs: 50 });
    await expect(promise).rejects.toMatchObject({
      message: "请求超时，请检查网络后重试",
      code: "NETWORK_ERROR",
    });
  });

  it("外部 AbortSignal 取消时抛出“请求已取消”", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init.signal;
          if (signal) {
            signal.addEventListener("abort", () => reject(signal.reason));
          }
        }),
      ),
    );

    const controller = new AbortController();
    const promise = apiClient.get("/api/books", { signal: controller.signal });
    controller.abort(new DOMException("user abort", "AbortError"));

    await expect(promise).rejects.toMatchObject({ message: "请求已取消" });
  });

  it("默认 30s 超时会附加到请求 signal 上", async () => {
    let capturedSignal: AbortSignal | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => {
        capturedSignal = init.signal ?? null;
        return Promise.resolve(jsonResponse(200, {}));
      }),
    );

    await apiClient.get("/api/books");

    expect(capturedSignal).not.toBeNull();
    expect(capturedSignal!.aborted).toBe(false);
  });

  it("网络层异常统一映射为 ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(apiClient.get("/api/books")).rejects.toBeInstanceOf(ApiError);
    await expect(apiClient.get("/api/books")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });
});
