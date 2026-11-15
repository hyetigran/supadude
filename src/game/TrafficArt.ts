import Phaser from "phaser";
import { type SolidEvent } from "./Level";
import { RENDER_SCALE, snapToPixel } from "./Viewport";
import { TRAFFIC_META, fitTraffic, trafficColor, trafficModel, type TrafficColor, type TrafficModel } from "./TrafficFit";
import carBlueUrl from "../../assets/art/traffic/car-blue.png";
import carRedUrl from "../../assets/art/traffic/car-red.png";
import carYellowUrl from "../../assets/art/traffic/car-yellow.png";
import carSilverUrl from "../../assets/art/traffic/car-silver.png";
import vanBlueUrl from "../../assets/art/traffic/van-blue.png";
import vanRedUrl from "../../assets/art/traffic/van-red.png";
import vanYellowUrl from "../../assets/art/traffic/van-yellow.png";
import vanSilverUrl from "../../assets/art/traffic/van-silver.png";
import wheelUrl from "../../assets/art/traffic/wheel.png";

const URLS: Record<`${TrafficModel}-${TrafficColor}`, string> = {
  "car-blue": carBlueUrl, "car-red": carRedUrl, "car-yellow": carYellowUrl, "car-silver": carSilverUrl,
  "van-blue": vanBlueUrl, "van-red": vanRedUrl, "van-yellow": vanYellowUrl, "van-silver": vanSilverUrl,
};
const WHEEL_TEXTURE = "traffic-wheel";

export function preloadTraffic(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(URLS)) scene.load.image(`traffic-${key}`, url);
  scene.load.image(WHEEL_TEXTURE, wheelUrl);
}

export interface TrafficSprite {
  rig: Phaser.GameObjects.Container;
  wheels: Phaser.GameObjects.Image[];
  wheelRadius: number;
}

/** Builds the body and spinning wheels for one solid; the rig's origin is the road contact point. */
export function createTrafficSprite(scene: Phaser.Scene, solid: SolidEvent): TrafficSprite {
  const model = trafficModel(solid);
  const meta = TRAFFIC_META[model];
  const fit = fitTraffic(model, solid.height);
  const body = downscaled(scene, `traffic-${model}-${trafficColor(solid.power)}`, fit.scale * RENDER_SCALE);
  // Texels land 1:1 on device pixels; any fractional offset or scale would resample the outlines into a blur.
  const source = body.texture.getSourceImage();
  const bodyImage = scene.add.image(snapToPixel(fit.left), snapToPixel(fit.top), body.texture.key).setOrigin(0, 0)
    .setDisplaySize(source.width / RENDER_SCALE, source.height / RENDER_SCALE);
  const wheelScale = meta.wheelLayer.scale * fit.scale;
  const wheelKey = downscaled(scene, WHEEL_TEXTURE, wheelScale * RENDER_SCALE).texture.key;
  const [wheelW, wheelH] = meta.wheelLayer.imageSize;
  const wheels = fit.wheels.map((wheel) => scene.add.image(wheel.x, wheel.y, wheelKey)
    .setOrigin(meta.wheelLayer.pivot[0] / wheelW, meta.wheelLayer.pivot[1] / wheelH)
    .setDisplaySize(wheelW * wheelScale, wheelH * wheelScale));
  const rig = scene.add.container(0, 0, [bodyImage, ...wheels]);
  return { rig, wheels, wheelRadius: fit.wheels[0].radius };
}

/**
 * The source art is ~9x larger than its on-screen size; sampling it directly shimmers while scrolling,
 * so each size is pre-filtered once into a canvas texture at display density.
 */
function downscaled(scene: Phaser.Scene, key: string, factor: number): { texture: Phaser.Textures.Texture } {
  const outKey = `${key}@${factor.toFixed(4)}`;
  if (scene.textures.exists(outKey)) return { texture: scene.textures.get(outKey) };
  let source = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const targetW = Math.max(1, Math.round(source.width * factor));
  const targetH = Math.max(1, Math.round(source.height * factor));
  // Halving steps keep thin outlines from aliasing on a single large minification.
  while (source.width / 2 >= targetW) {
    const step = document.createElement("canvas");
    step.width = Math.ceil(source.width / 2);
    step.height = Math.ceil(source.height / 2);
    const ctx = step.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, step.width, step.height);
    source = step;
  }
  const texture = scene.textures.createCanvas(outKey, targetW, targetH)!;
  const ctx = texture.getContext();
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, targetW, targetH);
  texture.refresh();
  return { texture };
}

