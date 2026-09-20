import { describe, expect, it } from "vitest";
import { createNeighborhoodLayout } from "./LaneLayout";

describe("createNeighborhoodLayout", () => {
  it("orders Sidewalk, Tree Lawn, and Street from farthest to nearest", () => {
    const layout = createNeighborhoodLayout(450);

    expect(layout.lanes.sidewalk.groundY).toBeLessThan(layout.lanes.treeLawn.groundY);
    expect(layout.lanes.treeLawn.groundY).toBeLessThan(layout.lanes.street.groundY);
    expect(layout.lanes.sidewalk.depth).toBeLessThan(layout.lanes.treeLawn.depth);
    expect(layout.lanes.treeLawn.depth).toBeLessThan(layout.lanes.street.depth);
    expect(layout.lanes.sidewalk.scale).toBeLessThan(layout.lanes.treeLawn.scale);
    expect(layout.lanes.treeLawn.scale).toBeLessThanOrEqual(layout.lanes.street.scale);
  });

  it("keeps every Lane baseline inside the viewport", () => {
    const layout = createNeighborhoodLayout(450);

    for (const presentation of Object.values(layout.lanes)) {
      expect(presentation.groundY).toBeGreaterThan(0);
      expect(presentation.groundY).toBeLessThan(450);
    }
  });
});
