import Phaser from "phaser";
import { downscaled } from "./ArtTexture";
import { OBJECT_NAMES, type ObjectName, type ObjectPlacement } from "./ObjectFit";
import { RENDER_SCALE, snapToPixel } from "./Viewport";

const URLS = import.meta.glob<string>("../../assets/art/objects/*.png", { eager: true, query: "?url", import: "default" });

const textureKey = (name: ObjectName): string => `object-${name}`;

export function preloadObjects(scene: Phaser.Scene): void {
  for (const name of OBJECT_NAMES) scene.load.image(textureKey(name), URLS[`../../assets/art/objects/${name}.png`]);
}

/** Display-density texture key for a placement (shared by every object with the same size). */
export function objectTextureKey(scene: Phaser.Scene, placement: ObjectPlacement): string {
  return downscaled(scene, textureKey(placement.name), placement.scale * RENDER_SCALE, placement.cropBottom).key;
}

/** One object image whose texels land 1:1 on device pixels. */
export function createObjectImage(scene: Phaser.Scene, placement: ObjectPlacement): Phaser.GameObjects.Image {
  const key = objectTextureKey(scene, placement);
  const source = scene.textures.get(key).getSourceImage();
  return scene.add.image(snapToPixel(placement.left), snapToPixel(placement.top), key).setOrigin(0, 0)
    .setDisplaySize(source.width / RENDER_SCALE, source.height / RENDER_SCALE);
}
