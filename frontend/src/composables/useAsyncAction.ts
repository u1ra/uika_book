import { ref } from "vue";

import { getErrorMessage } from "@/api/client";
import { notify } from "@/utils/notify";

interface UseAsyncActionOptions {
  /** 成功后的提示文案；传函数可基于返回值生成；不传则不提示 */
  successMessage?: string | ((result: unknown) => string);
  /** 失败时是否弹出错误通知，默认 true */
  notifyOnError?: boolean;
}

/**
 * 封装 CRUD 操作模板：pending → try → notify.success → catch notify.error → finally。
 * 返回执行函数与 pending 状态；执行结果为 true/false 表示成败。
 */
export function useAsyncAction<T extends unknown[]>(
  action: (...args: T) => Promise<void>,
  options: UseAsyncActionOptions = {},
) {
  const { successMessage, notifyOnError = true } = options;
  const pending = ref(false);

  async function run(...args: T): Promise<boolean> {
    if (pending.value) {
      return false;
    }

    pending.value = true;
    try {
      await action(...args);
      if (successMessage) {
        notify.success(typeof successMessage === "function" ? successMessage(undefined) : successMessage);
      }
      return true;
    } catch (error) {
      if (notifyOnError) {
        notify.error(getErrorMessage(error));
      }
      return false;
    } finally {
      pending.value = false;
    }
  }

  return {
    pending,
    run,
  };
}
