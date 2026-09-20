import { describe, expect, it } from "vitest";
import { adjacentLane, LANES, STARTING_LANE } from "./Lane";

describe("Lane", () => {
  it("defines the Lanes in spatial order", () => {
    expect(LANES).toEqual(["sidewalk", "treeLawn", "street"]);
  });

  it("starts in the middle Lane", () => {
    expect(STARTING_LANE).toBe("treeLawn");
  });

  describe("adjacentLane", () => {
    it("moves from the tree lawn toward the sidewalk", () => {
      expect(adjacentLane("treeLawn", "towardSidewalk")).toBe("sidewalk");
    });

    it("moves from the tree lawn toward the street", () => {
      expect(adjacentLane("treeLawn", "towardStreet")).toBe("street");
    });

    it("moves from the sidewalk toward the tree lawn", () => {
      expect(adjacentLane("sidewalk", "towardStreet")).toBe("treeLawn");
    });

    it("moves from the street toward the tree lawn", () => {
      expect(adjacentLane("street", "towardSidewalk")).toBe("treeLawn");
    });

    it("clamps at the sidewalk instead of wrapping", () => {
      expect(adjacentLane("sidewalk", "towardSidewalk")).toBe("sidewalk");
    });

    it("clamps at the street instead of wrapping", () => {
      expect(adjacentLane("street", "towardStreet")).toBe("street");
    });
  });
});
