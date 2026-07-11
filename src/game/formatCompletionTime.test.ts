import { describe, expect, it } from "vitest";
import { formatCompletionTime } from "./formatCompletionTime";

describe("formatCompletionTime", () => {
  it("formats sub-minute durations as 0:SS.d", () => {
    expect(formatCompletionTime(5300)).toBe("0:05.3");
  });

  it("formats minute-plus durations as M:SS.d", () => {
    expect(formatCompletionTime(65300)).toBe("1:05.3");
  });

  it("pads seconds under 10 with a leading zero", () => {
    expect(formatCompletionTime(61000)).toBe("1:01.0");
  });

  it("handles multi-minute durations", () => {
    expect(formatCompletionTime(125800)).toBe("2:05.8");
  });

  it("handles 0ms", () => {
    expect(formatCompletionTime(0)).toBe("0:00.0");
  });
});
