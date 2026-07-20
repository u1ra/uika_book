/**
 * 超长章节的分批渲染（窗口化）辅助逻辑。
 *
 * 背景：章节正则零匹配时后端按 AGENTS.md 约束降级为"全文"单章节，
 * 整本书可能产生上万个段落块，一次性挂载会让移动端直接卡死。
 * 因此渲染层按批挂载段落块，滚动到底部附近再追加；
 * 普通章节（块数 < 批次大小）天然全量挂载，行为与之前完全一致。
 */

/**
 * 当前已挂载部分对应的"可测量正文长度"。
 * 全量挂载时 mountedChars === totalChars，返回值严格等于 renderedLength，
 * 与未启用窗口化时的测量行为一致。
 */
export function computeMeasurableRenderedLength(
  renderedLength: number,
  mountedChars: number,
  totalChars: number,
): number {
  if (renderedLength <= 0 || totalChars <= 0) {
    return renderedLength;
  }

  return renderedLength * Math.max(mountedChars / totalChars, 0);
}

/**
 * 为了让 charOffset 对应的正文位置可见，需要至少挂载多少个块。
 * 结果包含一个额外批次，让定位后向下滚动更顺滑。
 */
export function resolveMountedCountForOffset(options: {
  prefixSums: number[];
  targetCharsInBody: number;
  renderedLength: number;
  batchSize: number;
}): number {
  const { prefixSums, targetCharsInBody, renderedLength, batchSize } = options;
  if (prefixSums.length === 0) {
    return 0;
  }

  const totalChars = prefixSums[prefixSums.length - 1];
  if (renderedLength <= 0 || totalChars <= 0) {
    return Math.min(prefixSums.length, batchSize);
  }

  const targetBlockChars = (Math.max(targetCharsInBody, 0) / renderedLength) * totalChars;
  let index = prefixSums.findIndex((sum) => sum >= targetBlockChars);
  if (index < 0) {
    index = prefixSums.length - 1;
  }

  return Math.min(prefixSums.length, index + 1 + batchSize);
}

/** 由内容块构建字符数前缀和（图片块计 0）。 */
export function buildBlockCharPrefixSums(blockCharCounts: number[]): number[] {
  const sums: number[] = [];
  let total = 0;
  for (const count of blockCharCounts) {
    total += Math.max(count, 0);
    sums.push(total);
  }
  return sums;
}
