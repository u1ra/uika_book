/**
 * 单调递增请求守卫：用于丢弃"后到但已过期"的异步响应。
 *
 * 典型用法（切章竞态）：
 *   const id = guard.next();
 *   const data = await fetch(...);
 *   if (!guard.isCurrent(id)) return; // 期间发起了更新的请求，丢弃旧响应
 */
export interface RequestGuard {
  /** 发起新请求时调用，返回本次请求序号。 */
  next(): number;
  /** 响应落地前校验：只有最新一次请求返回 true。 */
  isCurrent(id: number): boolean;
  /** 使所有进行中的请求失效（如组件卸载、重新加载）。 */
  invalidate(): void;
}

export function createRequestGuard(): RequestGuard {
  let latestId = 0;

  return {
    next() {
      latestId += 1;
      return latestId;
    },
    isCurrent(id: number) {
      return id === latestId;
    },
    invalidate() {
      latestId += 1;
    },
  };
}
