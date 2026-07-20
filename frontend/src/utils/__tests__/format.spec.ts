import { describe, expect, it } from "vitest";

import { clampPercentage, formatDateTime, formatNumber, formatPercent, formatWordCount } from "../format";

describe("clampPercentage", () => {
  it("clamps values into [0, 100]", () => {
    expect(clampPercentage(-5)).toBe(0);
    expect(clampPercentage(105)).toBe(100);
    expect(clampPercentage(42.5)).toBe(42.5);
  });

  it("returns 0 for nullish and NaN input", () => {
    expect(clampPercentage(null)).toBe(0);
    expect(clampPercentage(undefined)).toBe(0);
    expect(clampPercentage(Number.NaN)).toBe(0);
  });
});

describe("formatNumber / formatWordCount", () => {
  it("formats with zh-CN grouping", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatWordCount(1234567)).toBe("1,234,567 字");
  });

  it("treats nullish as 0", () => {
    expect(formatNumber(null)).toBe("0");
    expect(formatWordCount(undefined)).toBe("0 字");
  });
});

describe("formatPercent", () => {
  it("formats percentages with clamping", () => {
    expect(formatPercent(55.5)).toBe("56%");
    expect(formatPercent(120)).toBe("100%");
    expect(formatPercent(null)).toBe("0%");
  });

  it("respects maximumFractionDigits", () => {
    expect(formatPercent(33.333, 2)).toBe("33.33%");
  });
});

describe("formatDateTime", () => {
  it("returns fallback for empty or invalid input", () => {
    expect(formatDateTime(null)).toBe("时间未知");
    expect(formatDateTime("not-a-date")).toBe("时间未知");
    expect(formatDateTime("not-a-date", "未知")).toBe("未知");
  });

  it("formats a valid ISO string", () => {
    const formatted = formatDateTime("2026-07-20T08:00:00Z");
    expect(formatted).not.toBe("时间未知");
    expect(formatted).toContain("2026");
  });
});
