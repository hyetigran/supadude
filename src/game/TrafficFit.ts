import { type CarPower, type SolidEvent } from "./Level";
import carMeta from "../../assets/art/traffic/car-blue.json";
import vanMeta from "../../assets/art/traffic/van-blue.json";

export type TrafficModel = "car" | "van";
export type TrafficColor = "blue" | "red" | "yellow" | "silver";

/** Every colour of a model shares one canvas, so geometry comes from the blue metadata. */
type TrafficMeta = typeof carMeta;
export const TRAFFIC_META: Record<TrafficModel, TrafficMeta> = { car: carMeta, van: vanMeta };
/**
 * Source columns between the wheel arches whose rows are horizontally uniform (roof, glass, door, sill).
 * Only this band stretches, so wider collision boxes lengthen the car without distorting its ends or wheels.
 */
const STRETCH_BAND: Record<TrafficModel, readonly [number, number]> = { car: [476, 488], van: [482, 506] };

/** Low traffic uses the compact car, tall traffic the van. */
export function trafficModel(solid: Pick<SolidEvent, "height">): TrafficModel {
  return solid.height > 48 ? "van" : "car";
}

export function trafficColor(power: CarPower | undefined): TrafficColor {
  return power === "fire" ? "red" : power === "water" ? "blue" : power === "electricity" ? "yellow" : "silver";
}

export interface TrafficSlice {
  /** Source columns [from, to) of the body PNG. */
  sourceX: readonly [number, number];
  /** Left edge and width in world px, before squash. */
  x: number;
  width: number;
}

export interface TrafficFit {
  /** World px per source px (uniform for the ends, the height and the wheels). */
  scale: number;
  /** Horizontal squash applied to the whole rig when the box is narrower than the unstretched ends. */
  squash: number;
  /** Top of the canvas relative to the road contact line, world px. */
  top: number;
  height: number;
  slices: TrafficSlice[];
  wheels: { x: number; y: number; radius: number }[];
}

/**
 * Maps a body sprite onto a collision box: groundY sits on the road (y 0), the roof peak on the
 * box top (y -height), and the body's left/right edges on the box sides.
 */
export function fitTraffic(model: TrafficModel, width: number, height: number): TrafficFit {
  const { anchors, height: canvasHeight } = TRAFFIC_META[model];
  const [bandFrom, bandTo] = STRETCH_BAND[model];
  const scale = height / (anchors.groundY - anchors.roof.peakY);
  const leftWidth = (bandFrom - anchors.bodyLeftX) * scale;
  const rightWidth = (anchors.bodyRightX - bandTo) * scale;
  const bandWidth = Math.max(0, width - leftWidth - rightWidth);
  const squash = Math.min(1, width / (leftWidth + rightWidth));
  const x0 = -(leftWidth + bandWidth + rightWidth) / 2;
  const candidates: TrafficSlice[] = [
    { sourceX: [anchors.bodyLeftX, bandFrom], x: x0, width: leftWidth },
    { sourceX: [bandFrom, bandTo], x: x0 + leftWidth, width: bandWidth },
    { sourceX: [bandTo, anchors.bodyRightX], x: x0 + leftWidth + bandWidth, width: rightWidth },
  ];
  const slices = candidates.filter((slice) => slice.width > 0);
  const wheels = anchors.wheels.map((wheel) => ({
    x: wheel.centerX < bandFrom
      ? x0 + (wheel.centerX - anchors.bodyLeftX) * scale
      : x0 + leftWidth + bandWidth + (wheel.centerX - bandTo) * scale,
    y: (wheel.centerY - anchors.groundY) * scale,
    radius: wheel.radius * scale,
  }));
  return { scale, squash, top: -anchors.groundY * scale, height: canvasHeight * scale, slices, wheels };
}

/** Wheels roll with the car's own travel over the road, turning counter-clockwise as traffic drives left. */
export function wheelRotation(worldX: number, startX: number, radius: number): number {
  return (worldX - startX) / radius;
}
