import { type HazardEvent } from "./Level";
import bushMeta from "../../assets/art/objects/bush.json";
import trashcanMeta from "../../assets/art/objects/trashcan.json";
import trashcanLidMeta from "../../assets/art/objects/trashcan-lid.json";
import hydrantMeta from "../../assets/art/objects/hydrant.json";
import fallenTreeMeta from "../../assets/art/objects/fallen-tree.json";
import treeMeta from "../../assets/art/objects/tree-overhead.json";
import hoopMeta from "../../assets/art/objects/basketball-hoop.json";
import pitLeftMeta from "../../assets/art/objects/pit-left-lip.json";
import pitRightMeta from "../../assets/art/objects/pit-right-lip.json";
import trampolineMeta from "../../assets/art/objects/trampoline.json";
import coinMeta from "../../assets/art/objects/coin.json";
import orbMeta from "../../assets/art/objects/jump-orb.json";
import gateMeta from "../../assets/art/objects/finish-gate.json";

/** Art is placement only: hazard collision keeps coming from the Level data. */
export type ObjectName =
  | "bush" | "trashcan" | "trashcan-lid" | "hydrant" | "fallen-tree" | "tree-overhead" | "basketball-hoop"
  | "pit-left-lip" | "pit-right-lip" | "trampoline" | "trampoline-compressed" | "trampoline-rebound"
  | "coin" | "jump-orb" | "finish-gate";

export const OBJECT_NAMES: readonly ObjectName[] = [
  "bush", "trashcan", "trashcan-lid", "hydrant", "fallen-tree", "tree-overhead", "basketball-hoop",
  "pit-left-lip", "pit-right-lip", "trampoline", "trampoline-compressed", "trampoline-rebound",
  "coin", "jump-orb", "finish-gate",
];

export interface ObjectPlacement {
  name: ObjectName;
  /** World px per source px, uniform on both axes. */
  scale: number;
  /** Canvas top-left relative to the owning container's origin, world px. */
  left: number;
  top: number;
  /** Source rows at and below this one are hidden (supports planted behind the sidewalk). */
  cropBottom?: number;
}

/** Garden hazards are authored in units of this width; each unit gets its own object. */
const GARDEN_UNIT = 30;
/** A single trunk may overhang its short collision box, but never by more than this factor. */
const MAX_LOG_OVERHANG = 1.5;
/** Supports for overhead hazards are planted in the grass verge behind the sidewalk. */
export const VERGE_HEIGHT = 22;
/** Sidewalk band drawn by the scene background, above the ground line. */
export const SIDEWALK_DEPTH = 14;
/** Broken slab thickness: the sidewalk band plus its front face. */
const PIT_SLAB = 18;
export const PIT_FLOOR = 20;
const TRAMPOLINE_WIDTH = 64;
const ORB_RADIUS = 16;
const FINISH_GATE_HEIGHT = 150;

const opaqueHeight = (meta: { opaqueBounds: { top: number; bottom: number } }): number =>
  meta.opaqueBounds.bottom - meta.opaqueBounds.top;
const opaqueWidth = (meta: { opaqueBounds: { left: number; right: number } }): number =>
  meta.opaqueBounds.right - meta.opaqueBounds.left;

/** Places a standing object so its measured ground point sits at (x, 0). */
function standing(name: ObjectName, meta: { anchors: { groundY: number; groundCenterX: number } }, scale: number, x = 0): ObjectPlacement {
  return { name, scale, left: x - meta.anchors.groundCenterX * scale, top: -meta.anchors.groundY * scale };
}

/** Art for one hazard, relative to its container at (hazard.x, ground - hazard.bottom). */
export function hazardPlacements(hazard: Pick<HazardEvent, "kind" | "width" | "height" | "bottom">): ObjectPlacement[] {
  const { width: w, height: h } = hazard;
  switch (hazard.kind) {
    case "fallenTree":
      return [standing("fallen-tree", fallenTreeMeta, Math.min(h / opaqueHeight(fallenTreeMeta), MAX_LOG_OVERHANG * w / opaqueWidth(fallenTreeMeta)))];
    case "tree": {
      // The canopy right of the trunk is the overhang; its lowest point marks the hazard's underside.
      const { fromX, maxY } = treeMeta.anchors.undersideRightOfTrunk;
      const scale = h / (maxY - treeMeta.anchors.topY);
      return [{ name: "tree-overhead", scale, left: -w / 2 - fromX * scale, top: -maxY * scale,
        cropBottom: Math.round(maxY + (hazard.bottom - VERGE_HEIGHT) / scale) }];
    }
    case "basketballHoop": {
      // Pole to rim spans the hazard's collision width; the net's underside is the hazard's underside.
      const { poleX: [poleLeft], rim, overhangUndersideY } = hoopMeta.anchors;
      const scale = (0.9 * w) / (rim.right - poleLeft);
      return [{ name: "basketball-hoop", scale, left: -0.45 * w - poleLeft * scale, top: -overhangUndersideY * scale,
        cropBottom: Math.round(overhangUndersideY + (hazard.bottom - VERGE_HEIGHT) / scale) }];
    }
    case "constructionPit": {
      // Broken slab ends frame a game-drawn gap whose width follows the level.
      const scale = PIT_SLAB / (pitLeftMeta.anchors.slabBottomY - pitLeftMeta.anchors.slabTopY);
      const top = -SIDEWALK_DEPTH - pitLeftMeta.anchors.slabTopY * scale;
      return [
        { name: "pit-left-lip", scale, left: -w / 2 - pitLeftMeta.anchors.innerEdgeX * scale, top },
        { name: "pit-right-lip", scale, left: w / 2 - pitRightMeta.anchors.innerEdgeX * scale, top },
      ];
    }
    default: {
      // Bushes, bins, hydrants (and legacy spikes, drawn as bushes).
      const [name, meta] = hazard.kind === "trashCan" ? ["trashcan", trashcanMeta] as const
        : hazard.kind === "fireHydrant" ? ["hydrant", hydrantMeta] as const : ["bush", bushMeta] as const;
      const copies = Math.max(1, Math.round(w / GARDEN_UNIT));
      const scale = h / opaqueHeight(meta);
      return Array.from({ length: copies }, (_, i) => standing(name, meta, scale, -w / 2 + (i + 0.5) * (w / copies)));
    }
  }
}

/** The lid matches the can's width, so it reads as the same part once it flies off. */
export function trashcanLidPlacement(canScale: number): ObjectPlacement {
  const scale = (opaqueWidth(trashcanMeta) * canScale) / opaqueWidth(trashcanLidMeta);
  return { name: "trashcan-lid", scale, left: -trashcanLidMeta.anchors.centerX * scale, top: -trashcanLidMeta.anchors.centerY * scale };
}

/** Lid centre relative to a can's ground point. */
export function trashcanLidOffsetY(canScale: number): number {
  return -(trashcanMeta.anchors.groundY - trashcanMeta.anchors.topY) * canScale + (opaqueHeight(trashcanLidMeta) / 2) * trashcanLidPlacement(canScale).scale;
}

export type TrampolineState = "trampoline" | "trampoline-compressed" | "trampoline-rebound";

/** All three trampoline states share one canvas and ground anchor. */
export function trampolinePlacement(state: TrampolineState = "trampoline"): ObjectPlacement {
  return { ...standing("trampoline", trampolineMeta, TRAMPOLINE_WIDTH / opaqueWidth(trampolineMeta)), name: state };
}

function centred(name: ObjectName, meta: { anchors: { centerX: number; centerY: number; radius: number } }, radius: number): ObjectPlacement {
  const scale = radius / meta.anchors.radius;
  return { name, scale, left: -meta.anchors.centerX * scale, top: -meta.anchors.centerY * scale };
}

export const coinPlacement = (radius: number): ObjectPlacement => centred("coin", coinMeta, radius);
export const jumpOrbPlacement = (): ObjectPlacement => centred("jump-orb", orbMeta, ORB_RADIUS);
export const finishGatePlacement = (): ObjectPlacement => standing("finish-gate", gateMeta, FINISH_GATE_HEIGHT / opaqueHeight(gateMeta));
