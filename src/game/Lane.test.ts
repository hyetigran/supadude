import { describe, expect, it } from "vitest";
import { toggleLane } from "./Lane";

describe("toggleLane", () => {
  it("toggles road to lawn", () => {
    expect(toggleLane("road")).toBe("lawn");
  });

  it("toggles lawn to road", () => {
    expect(toggleLane("lawn")).toBe("road");
  });
});
