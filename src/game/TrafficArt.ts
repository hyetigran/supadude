import Phaser from "phaser";
import { type SolidEvent } from "./Level";
import { RENDER_SCALE, snapToPixel } from "./Viewport";
import { downscaled } from "./ArtTexture";
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
  const body = { texture: downscaled(scene, `traffic-${model}-${trafficColor(solid.power)}`, fit.scale * RENDER_SCALE) };
  // Texels land 1:1 on device pixels; any fractional offset or scale would resample the outlines into a blur.
  const source = body.texture.getSourceImage();
  const bodyImage = scene.add.image(snapToPixel(fit.left), snapToPixel(fit.top), body.texture.key).setOrigin(0, 0)
    .setDisplaySize(source.width / RENDER_SCALE, source.height / RENDER_SCALE);
  const wheelScale = meta.wheelLayer.scale * fit.scale;
  const wheelKey = downscaled(scene, WHEEL_TEXTURE, wheelScale * RENDER_SCALE).key;
  const [wheelW, wheelH] = meta.wheelLayer.imageSize;
  const wheels = fit.wheels.map((wheel) => scene.add.image(wheel.x, wheel.y, wheelKey)
    .setOrigin(meta.wheelLayer.pivot[0] / wheelW, meta.wheelLayer.pivot[1] / wheelH)
    .setDisplaySize(wheelW * wheelScale, wheelH * wheelScale));
  const rig = scene.add.container(0, 0, [bodyImage, ...wheels]);
  return { rig, wheels, wheelRadius: fit.wheels[0].radius };
}
