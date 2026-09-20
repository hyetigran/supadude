import { describe, expect, it } from "vitest";
import {
  DUCK_HEIGHT,
  JUMP_HEIGHT,
  GROUND_OBSTACLE_HEIGHT,
  OVERHEAD_GAP,
  PLAYER_STAND_HEIGHT,
} from "./VisualScale";

describe("VisualScale clearance contract", () => {
  it("keeps duck under overhead gap under stand height", () => {
    expect(DUCK_HEIGHT).toBeLessThan(OVERHEAD_GAP);
    expect(OVERHEAD_GAP).toBeLessThan(PLAYER_STAND_HEIGHT);
  });

  it("keeps jump just above the tallest ground obstacle", () => {
    expect(JUMP_HEIGHT).toBeGreaterThan(GROUND_OBSTACLE_HEIGHT);
    expect(JUMP_HEIGHT).toBeLessThan(PLAYER_STAND_HEIGHT);
  });
});
