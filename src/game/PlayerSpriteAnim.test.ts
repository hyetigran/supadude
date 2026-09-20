import { describe, expect, it } from "vitest";
import { ANIM_SPECS, animKeyForVerticalState } from "./PlayerSpriteAnim";

describe("animKeyForVerticalState", () => {
  it("maps grounded to run", () => {
    expect(animKeyForVerticalState("grounded")).toBe("run");
  });

  it("maps jumping to jump", () => {
    expect(animKeyForVerticalState("jumping")).toBe("jump");
  });

  it("maps ducking to duck", () => {
    expect(animKeyForVerticalState("ducking")).toBe("duck");
  });
});

describe("ANIM_SPECS", () => {
  it("covers all 16 frames of the sheet with no gaps or overlaps", () => {
    const ranges = Object.values(ANIM_SPECS)
      .map(({ start, end }) => [start, end] as const)
      .sort((a, b) => a[0] - b[0]);

    expect(ranges[0][0]).toBe(0);
    expect(ranges[ranges.length - 1][1]).toBe(15);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i][0]).toBe(ranges[i - 1][1] + 1);
    }
  });

  it("loops only idle and run; every other pose is one-shot", () => {
    expect(ANIM_SPECS.idle.repeat).toBe(-1);
    expect(ANIM_SPECS.run.repeat).toBe(-1);
    for (const key of ["jump", "duck", "laneSwitch", "hit", "punch"] as const) {
      expect(ANIM_SPECS[key].repeat).toBe(0);
    }
  });
});
