import houseCreamMeta from "../../assets/art/scenery/house-cream.json";
import housePeachMeta from "../../assets/art/scenery/house-peach.json";
import houseBlueMeta from "../../assets/art/scenery/house-blue.json";
import fenceMeta from "../../assets/art/scenery/fence.json";
import treeMeta from "../../assets/art/scenery/tree.json";
import mailboxMeta from "../../assets/art/scenery/mailbox.json";
import cloudMeta from "../../assets/art/scenery/cloud.json";

/** Decorative backdrop only: nothing here takes part in collision. */
export type SceneryName = "house-cream" | "house-peach" | "house-blue" | "fence" | "tree" | "mailbox" | "cloud";

export const SCENERY_NAMES: readonly SceneryName[] = [
  "house-cream", "house-peach", "house-blue", "fence", "tree", "mailbox", "cloud",
];

interface SceneryMeta {
  opaqueBounds: { left: number; top: number; right: number; bottom: number };
  anchors: { groundY: number; groundCenterX: number };
}

const META: Record<SceneryName, SceneryMeta> = {
  "house-cream": houseCreamMeta, "house-peach": housePeachMeta, "house-blue": houseBlueMeta,
  fence: fenceMeta, tree: treeMeta, mailbox: mailboxMeta, cloud: cloudMeta,
};

export interface SceneryPlacement {
  name: SceneryName;
  /** World px per source px, uniform on both axes. */
  scale: number;
  /** Canvas top-left within the strip; y is relative to the strip's ground line. */
  left: number;
  top: number;
}

/** On-screen opaque heights in world px, chosen against the 38px hero and 48px cars. */
const HOUSE_HEIGHT = 160;
const TREE_HEIGHT = 150;
const FENCE_HEIGHT = 32;
const MAILBOX_HEIGHT = 38;
const CLOUD_WIDTH = 120;

/** Left-to-right street order with the gap (world px) left before each item; the last gap closes the loop. */
const STREET: readonly (readonly [SceneryName, number])[] = [
  ["house-cream", 24], ["mailbox", 10], ["tree", 14], ["house-peach", 18], ["fence", 14],
  ["house-blue", 18], ["tree", 22],
];
const END_GAP = 24;
/** Cloud left edge (world px) and opaque top relative to the ground line. */
const CLOUDS: readonly (readonly [number, number])[] = [[60, -300], [470, -270], [880, -310]];
/** The sky repeats on its own, wider loop so cloud spacing never lines up with the houses. */
const CLOUD_STRIP_WIDTH = 1220;

const opaqueHeight = (meta: SceneryMeta): number => meta.opaqueBounds.bottom - meta.opaqueBounds.top;
const opaqueWidth = (meta: SceneryMeta): number => meta.opaqueBounds.right - meta.opaqueBounds.left;

function scaleFor(name: SceneryName): number {
  const meta = META[name];
  switch (name) {
    // All houses share the cream house's scale so they read as one street.
    case "house-cream": case "house-peach": case "house-blue": return HOUSE_HEIGHT / opaqueHeight(houseCreamMeta);
    case "tree": return TREE_HEIGHT / opaqueHeight(meta);
    case "fence": return FENCE_HEIGHT / opaqueHeight(meta);
    case "mailbox": return MAILBOX_HEIGHT / opaqueHeight(meta);
    case "cloud": return CLOUD_WIDTH / opaqueWidth(meta);
  }
}

export interface SceneryStrip {
  /** World px after which the strip repeats seamlessly. */
  width: number;
  placements: SceneryPlacement[];
}

/** One repeating street: every standing item's measured ground point sits on y = 0. */
export function streetStrip(): SceneryStrip {
  const placements: SceneryPlacement[] = [];
  let x = 0;
  for (const [name, gap] of STREET) {
    const meta = META[name];
    const scale = scaleFor(name);
    x += gap;
    placements.push({ name, scale, left: x - meta.opaqueBounds.left * scale, top: -meta.anchors.groundY * scale });
    x += opaqueWidth(meta) * scale;
  }
  return { width: Math.round(x + END_GAP), placements };
}

/** The sky's clouds, placed relative to the same ground line as the street so they clear every rooftop. */
export function cloudStrip(): SceneryStrip {
  const placements: SceneryPlacement[] = [];
  const cloudScale = scaleFor("cloud");
  for (const [left, top] of CLOUDS) {
    placements.push({
      name: "cloud", scale: cloudScale,
      left: left - cloudMeta.opaqueBounds.left * cloudScale, top: top - cloudMeta.opaqueBounds.top * cloudScale,
    });
  }
  return { width: CLOUD_STRIP_WIDTH, placements };
}
