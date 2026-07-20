import { authTokenStorage } from "../utils/token";
import type { ApiErrorResponse } from "../types/api";

function getFallbackOrigin() {
  return typeof window === "undefined" ? "http://127.0.0.1" : window.location.origin;
}

export function resolveApiAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
}

type QueryValue = string | number | boolean | null | undefined;
type RequestBody = BodyInit | FormData | URLSearchParams | object | null | undefined;

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: RequestBody;
  headers?: HeadersInit;
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  skipUnauthorizedHandler?: boolean;
}

const DEFAULT_TIMEOUT_MS = 30_000;

let unauthorizedHandler: (() => void) | null = null;

/** 注册全局 401 处理（如清理会话并跳登录），由应用装配层注入，避免 client 反向依赖 store/router。 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

/** 合并外部取消信号与超时信号（不依赖 AbortSignal.any，兼容更多运行时）。 */
function combineSignals(signals: Array<AbortSignal | undefined>): AbortSignal {
  const controller = new AbortController();
  const abort = (reason: unknown) => {
    if (!controller.signal.aborted) {
      controller.abort(reason);
    }
  };

  for (const signal of signals) {
    if (!signal) {
      continue;
    }
    if (signal.aborted) {
      abort(signal.reason);
      continue;
    }
    signal.addEventListener("abort", () => abort(signal.reason), { once: true });
  }

  return controller.signal;
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return typeof payload === "object" && payload !== null && ("error" in payload || "detail" in payload);
}

function isRawBody(body: RequestBody): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  );
}

function formatErrorDetail(detail: ApiErrorResponse["detail"]) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => item.msg || "请求参数不合法")
      .join("；");
  }

  return "请求失败，请稍后再试";
}

export function buildApiUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, getFallbackOrigin());

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const {
    method = "GET",
    query,
    body,
    headers,
    auth = true,
    signal,
  } = options;

  const requestHeaders = new Headers(headers);
  const token = authTokenStorage.get();

  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let payload: BodyInit | undefined;

  if (isRawBody(body)) {
    payload = body;
  } else if (body !== undefined && body !== null) {
    requestHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  let response: Response;

  const requestUrl = buildApiUrl(path, query);
  const requestSignal = combineSignals([signal, AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)]);
  try {
    response = await fetch(requestUrl, {
      method,
      headers: requestHeaders,
      body: payload,
      signal: requestSignal,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[API] fetch failed:", { url: requestUrl, method, error });

    const message = error instanceof DOMException && error.name === "TimeoutError"
      ? "请求超时，请检查网络后重试"
      : error instanceof DOMException && error.name === "AbortError"
        ? "请求已取消"
        : "无法连接到同源后端，请确认服务已启动且反向代理配置正确";

    throw new ApiError(message, 0, "NETWORK_ERROR", error);
  }

  const contentType = response.headers.get("content-type") || "";
  const data = response.status === 204
    ? undefined
    : contentType.includes("application/json")
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    // 会话过期：统一走注入的 401 处理（清理会话并跳登录），登录等 auth:false 请求除外。
    if (response.status === 401 && auth && !options.skipUnauthorizedHandler) {
      unauthorizedHandler?.();
    }

    if (isApiErrorResponse(data)) {
      const message = data.error?.message || formatErrorDetail(data.detail);
      throw new ApiError(message, response.status, data.error?.code, data.error?.details ?? data.detail);
    }

    if (typeof data === "string" && data.trim()) {
      throw new ApiError(data, response.status, undefined, data);
    }

    throw new ApiError(response.statusText || "请求失败", response.status, undefined, data);
  }

  return data as T;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后再试";
}

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: RequestOptions["body"], options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "POST", body });
  },
  put<T>(path: string, body?: RequestOptions["body"], options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "PUT", body });
  },
  patch<T>(path: string, body?: RequestOptions["body"], options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },
  delete<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};
