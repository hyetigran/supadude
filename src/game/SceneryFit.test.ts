import { describe, expect, it } from "vitest";
import { cloudStrip, streetStrip } from "./SceneryFit";
import { VIEWPORT } from "./Viewport";
import houseCreamMeta from "../../assets/art/scenery/house-cream.json";
import housePeachMeta from "../../assets/art/scenery/house-peach.json";
import houseBlueMeta from "../../assets/art/scenery/house-blue.json";
import fenceMeta from "../../assets/art/scenery/fence.json";
import treeMeta from "../../assets/art/scenery/tree.json";
import mailboxMeta from "../../assets/art/scenery/mailbox.json";
import cloudMeta from "../../assets/art/scenery/cloud.json";

const META = {
  "house-cream": houseCreamMeta, "house-peach": housePeachMeta, "house-blue": houseBlueMeta,
  fence: fenceMeta, tree: treeMeta, mailbox: mailboxMeta, cloud: cloudMeta,
};

const opaque = (p: ReturnType<typeof streetStrip>["placements"][number]) => {
  const b = META[p.name].opaqueBounds;
  return { left: p.left + b.left * p.scale, right: p.left + b.right * p.scale, top: p.top + b.top * p.scale, bottom: p.top + b.bottom * p.scale };
};

describe("scenery strip", () => {
  const strip = streetStrip();
  const standing = strip.placements;
  const clouds = cloudStrip();

  it("uses every asset across the street and sky, each repeating wider than the viewport", () => {
    expect(new Set([...standing, ...clouds.placements].map((p) => p.name))).toEqual(new Set(Object.keys(META)));
    expect(standing.some((p) => p.name === "cloud")).toBe(false);
    expect(clouds.placements.every((p) => p.name === "cloud")).toBe(true);
    expect(strip.width).toBeGreaterThan(VIEWPORT.width);
    expect(clouds.width).toBeGreaterThan(VIEWPORT.width);
  });

  it("stands every street item on the ground line at its measured anchor", () => {
    for (const p of standing) expect(p.top + META[p.name].anchors.groundY * p.scale, p.name).toBeCloseTo(0, 6);
  });

  it("draws all three houses at one shared scale", () => {
    const scales = new Set(standing.filter((p) => p.name.startsWith("house")).map((p) => p.scale));
    expect(scales.size).toBe(1);
  });

  it("keeps street items in order without overlapping, and inside one tile so the loop is seamless", () => {
    const boxes = standing.map(opaque);
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].left).toBeGreaterThan(boxes[i - 1].right);
    expect(boxes[0].left).toBeGreaterThan(0);
    expect(boxes[boxes.length - 1].right).toBeLessThan(strip.width);
  });

  it("keeps clouds in the sky above every rooftop and inside the tile", () => {
    const rooftop = Math.min(...standing.map((p) => opaque(p).top));
    for (const cloud of clouds.placements.map(opaque)) {
      expect(cloud.bottom).toBeLessThan(rooftop + 60);
      expect(cloud.left).toBeGreaterThanOrEqual(0);
      expect(cloud.right).toBeLessThanOrEqual(clouds.width);
    }
  });
});
