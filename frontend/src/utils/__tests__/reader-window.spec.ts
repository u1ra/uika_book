import { describe, expect, it } from "vitest";

import { buildBlockCharPrefixSums, computeMeasurableRenderedLength, resolveMountedCountForOffset } from "../reader-window";

describe("computeMeasurableRenderedLength", () => {
  it("全量挂载时严格等于原始正文长度（与未窗口化行为一致）", () => {
    expect(computeMeasurableRenderedLength(1000, 900, 900)).toBe(1000);
  });

  it("部分挂载时按比例缩放", () => {
    expect(computeMeasurableRenderedLength(1000, 450, 900)).toBe(500);
  });

  it("异常输入回退为原始长度", () => {
    expect(computeMeasurableRenderedLength(0, 100, 900)).toBe(0);
    expect(computeMeasurableRenderedLength(1000, 100, 0)).toBe(1000);
  });
});

describe("buildBlockCharPrefixSums", () => {
  it("累计字符数", () => {
    expect(buildBlockCharPrefixSums([10, 0, 20, 30])).toEqual([10, 10, 30, 60]);
    expect(buildBlockCharPrefixSums([])).toEqual([]);
  });
});

describe("resolveMountedCountForOffset", () => {
  const prefixSums = buildBlockCharPrefixSums(new Array(1000).fill(10)); // 1000 块，每块 10 字符

  it("定位到开头只需首个批次+追加批次", () => {
    const count = resolveMountedCountForOffset({
      prefixSums,
      targetCharsInBody: 0,
      renderedLength: 10_000,
      batchSize: 200,
    });
    // 第 0 块即覆盖，再加一个批次
    expect(count).toBe(201);
  });

  it("定位到中部时挂载到对应块再加一个批次", () => {
    const count = resolveMountedCountForOffset({
      prefixSums,
      targetCharsInBody: 5000, // 一半 → 第 500 块
      renderedLength: 10_000,
      batchSize: 200,
    });
    expect(count).toBe(700);
  });

  it("定位到末尾时全量挂载", () => {
    const count = resolveMountedCountForOffset({
      prefixSums,
      targetCharsInBody: 9999,
      renderedLength: 10_000,
      batchSize: 200,
    });
    expect(count).toBe(1000);
  });

  it("空块列表返回 0", () => {
    expect(
      resolveMountedCountForOffset({ prefixSums: [], targetCharsInBody: 10, renderedLength: 100, batchSize: 200 }),
    ).toBe(0);
  });
});
