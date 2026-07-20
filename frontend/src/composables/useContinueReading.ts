import { ref } from "vue";
import { useRouter } from "vue-router";

import { ApiError, getErrorMessage } from "@/api/client";
import { booksApi } from "@/api/books";
import { notify } from "@/utils/notify";

/**
 * “继续阅读”跳转：优先读取服务端进度定位到对应章节；
 * 无进度记录（404）时降级为从第 0 章开始。
 */
export function useContinueReading() {
  const router = useRouter();
  const continuingBookId = ref<number | null>(null);

  async function continueReading(bookId: number) {
    continuingBookId.value = bookId;

    try {
      const progress = await booksApi.getProgress(bookId);
      await router.push({
        name: "reader",
        params: {
          bookId,
          chapterIndex: progress.chapter_index,
        },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        await router.push({
          name: "reader",
          params: { bookId },
        });
        return;
      }

      notify.error(getErrorMessage(error));
    } finally {
      continuingBookId.value = null;
    }
  }

  return {
    continuingBookId,
    continueReading,
  };
}
