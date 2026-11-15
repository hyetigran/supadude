import { describe, expect, it } from "vitest";
import { LEVEL } from "./Level";
import { coinPlacement, finishGatePlacement, hazardPlacements, trampolinePlacement, trashcanLidPlacement, SIDEWALK_DEPTH, VERGE_HEIGHT } from "./ObjectFit";
import bushMeta from "../../assets/art/objects/bush.json";
import treeMeta from "../../assets/art/objects/tree-overhead.json";
import hoopMeta from "../../assets/art/objects/basketball-hoop.json";
import pitLeftMeta from "../../assets/art/objects/pit-left-lip.json";
import pitRightMeta from "../../assets/art/objects/pit-right-lip.json";
import trampolineMeta from "../../assets/art/objects/trampoline.json";
import coinMeta from "../../assets/art/objects/coin.json";

const close = (value: number) => expect.closeTo(value, 6);

describe("gameplay object fit", () => {
  it("gives every hazard kind in the level its art", () => {
    for (const hazard of LEVEL.hazards) expect(hazardPlacements(hazard).length, hazard.kind).toBeGreaterThan(0);
  });

  it("stands one garden object per unit, as tall as the hazard and grounded on its baseline", () => {
    const placements = hazardPlacements({ kind: "bush", width: 90, height: 30, bottom: 0 });
    expect(placements).toHaveLength(3);
    for (const p of placements) {
      expect((bushMeta.opaqueBounds.bottom - bushMeta.opaqueBounds.top) * p.scale).toEqual(close(30));
      expect(p.top + bushMeta.anchors.groundY * p.scale).toEqual(close(0));
    }
    const centres = placements.map((p) => p.left + bushMeta.anchors.groundCenterX * placements[0].scale);
    expect(centres).toEqual([close(-30), close(0), close(30)]);
  });

  it("keeps a short fallen tree within 1.5x its collision width", () => {
    const [log] = hazardPlacements({ kind: "fallenTree", width: 30, height: 30, bottom: 0 });
    expect((844 - 24) * log.scale).toBeLessThanOrEqual(45 + 1e-9);
  });

  it("hangs the tree canopy and hoop net at the hazard underside and plants supports in the verge", () => {
    const hazard = { kind: "tree", width: 110, height: 92, bottom: 44 } as const;
    const [tree] = hazardPlacements(hazard);
    const { fromX, maxY } = treeMeta.anchors.undersideRightOfTrunk;
    expect(tree.top + maxY * tree.scale).toEqual(close(0));
    expect(tree.left + fromX * tree.scale).toEqual(close(-55));
    expect(tree.top + tree.cropBottom! * tree.scale).toBeCloseTo(hazard.bottom - VERGE_HEIGHT, 0);

    const [hoop] = hazardPlacements({ ...hazard, kind: "basketballHoop" });
    expect(hoop.top + hoopMeta.anchors.overhangUndersideY * hoop.scale).toEqual(close(0));
    expect(hoop.left + hoopMeta.anchors.poleX[0] * hoop.scale).toEqual(close(-49.5));
    expect(hoop.left + hoopMeta.anchors.rim.right * hoop.scale).toEqual(close(49.5));
  });

  it("puts the pit's broken slab edges exactly at the level's pit width, on the sidewalk", () => {
    const [left, right] = hazardPlacements({ kind: "constructionPit", width: 60, height: 8, bottom: 0 });
    expect(left.left + pitLeftMeta.anchors.innerEdgeX * left.scale).toEqual(close(-30));
    expect(right.left + pitRightMeta.anchors.innerEdgeX * right.scale).toEqual(close(30));
    expect(left.top + pitLeftMeta.anchors.slabTopY * left.scale).toEqual(close(-SIDEWALK_DEPTH));
  });

  it("swaps trampoline states on one shared ground anchor", () => {
    const states = (["trampoline", "trampoline-compressed", "trampoline-rebound"] as const).map(trampolinePlacement);
    for (const p of states) {
      expect(p.top + trampolineMeta.anchors.groundY * p.scale).toEqual(close(0));
      expect({ ...p, name: "" }).toEqual({ ...states[0], name: "" });
    }
  });

  it("sizes coins by radius, the lid to the can, and stands the finish gate on the ground", () => {
    const coin = coinPlacement(10);
    expect(coin.left + coinMeta.anchors.centerX * coin.scale).toEqual(close(0));
    expect(coinMeta.anchors.radius * coin.scale).toEqual(close(10));
    const [can] = hazardPlacements({ kind: "trashCan", width: 30, height: 30, bottom: 0 });
    expect((808 - 24) * trashcanLidPlacement(can.scale).scale).toEqual(close((581 - 24) * can.scale));
    const gate = finishGatePlacement();
    expect(gate.top + 806 * gate.scale).toEqual(close(0));
  });
});
