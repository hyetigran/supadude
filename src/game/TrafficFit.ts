import { type CarPower, type SolidEvent } from "./Level";
import carMeta from "../../assets/art/traffic/car-blue.json";
import vanMeta from "../../assets/art/traffic/van-blue.json";

export type TrafficModel = "car" | "van";
export type TrafficColor = "blue" | "red" | "yellow" | "silver";

/** Every colour of a model shares one canvas, so geometry comes from the blue metadata. */
type TrafficMeta = typeof carMeta;
export const TRAFFIC_META: Record<TrafficModel, TrafficMeta> = { car: carMeta, van: vanMeta };
/** Low traffic uses the compact car, tall traffic the van. */
export function trafficModel(solid: Pick<SolidEvent, "height">): TrafficModel {
  return solid.height > 48 ? "van" : "car";
}

export function trafficColor(power: CarPower | undefined): TrafficColor {
  return power === "fire" ? "red" : power === "water" ? "blue" : power === "electricity" ? "yellow" : "silver";
}

export interface TrafficFit {
  /** World px per source px, uniform on both axes so the art is never stretched or squashed. */
  scale: number;
  /** Canvas top-left relative to the road contact point, world px. */
  left: number;
  top: number;
  width: number;
  height: number;
  wheels: { x: number; y: number; radius: number }[];
}

/**
 * Scales a body sprite so the roof peak meets the box top (y -height) and groundY sits on the road (y 0),
 * centred on the box. Boxes are standard per model, so the body fills the box at its natural proportions.
 */
export function fitTraffic(model: TrafficModel, height: number): TrafficFit {
  const { anchors, width: canvasWidth, height: canvasHeight } = TRAFFIC_META[model];
  const scale = height / (anchors.groundY - anchors.roof.peakY);
  const centerX = (anchors.bodyLeftX + anchors.bodyRightX) / 2;
  const wheels = anchors.wheels.map((wheel) => ({
    x: (wheel.centerX - centerX) * scale,
    y: (wheel.centerY - anchors.groundY) * scale,
    radius: wheel.radius * scale,
  }));
  return { scale, left: -centerX * scale, top: -anchors.groundY * scale, width: canvasWidth * scale, height: canvasHeight * scale, wheels };
}

/** Wheels roll with the car's own travel over the road, turning counter-clockwise as traffic drives left. */
export function wheelRotation(worldX: number, startX: number, radius: number): number {
  return (worldX - startX) / radius;
}
