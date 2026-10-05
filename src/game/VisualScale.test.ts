import { describe, expect, it } from "vitest";
import { GROUND_Y_RATIO, PLAYER_SIZE, groundYForViewport } from "./VisualScale";

describe("single-plane visual scale", () => {
  it("places the ground low enough to leave a large readable play field", () => {
    expect(GROUND_Y_RATIO).toBeGreaterThan(0.7);
    expect(GROUND_Y_RATIO).toBeLessThan(0.9);
    expect(groundYForViewport(450)).toBe(369);
  });

  it("keeps the player icon compact relative to the play field", () => {
    expect(PLAYER_SIZE).toBeGreaterThanOrEqual(32);
    expect(PLAYER_SIZE).toBeLessThanOrEqual(48);
  });
});
