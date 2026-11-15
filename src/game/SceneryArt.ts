import Phaser from "phaser";
import { downscaled } from "./ArtTexture";
import { SCENERY_NAMES, type SceneryName, type SceneryStrip } from "./SceneryFit";
import { RENDER_SCALE, snapToPixel } from "./Viewport";
import contactShadowUrl from "../../assets/art/scenery/contact-shadow.png";

const URLS = import.meta.glob<string>("../../assets/art/scenery/*.png", { eager: true, query: "?url", import: "default" });

const textureKey = (name: SceneryName): string => `scenery-${name}`;
export const CONTACT_SHADOW_KEY = "scenery-contact-shadow";

/** Wash toward the sky colour so the bold-outlined backdrop stays quieter than Hazards and Traffic. */
const WASH_COLOR = "#d7eaf0";
const WASH_ALPHA = 0.22;

export function preloadScenery(scene: Phaser.Scene): void {
  for (const name of SCENERY_NAMES) scene.load.image(textureKey(name), URLS[`../../assets/art/scenery/${name}.png`]);
  scene.load.image(CONTACT_SHADOW_KEY, contactShadowUrl);
}

/**
 * A repeating strip (the street or the sky) is composed once into a device-density canvas and shown
 * as two side-by-side copies, so scrolling never resamples the art.
 */
export class SceneryLayer {
  private readonly copies: Phaser.GameObjects.Image[];
  private readonly width: number;

  /** `groundY` is the world y the strip's ground line (y = 0) sits on; `key` names its composed texture. */
  constructor(scene: Phaser.Scene, strip: SceneryStrip, key: string, groundY: number, depth: number) {
    this.width = strip.width;
    const top = Math.min(...strip.placements.map((p) => groundY + p.top));
    const height = Math.ceil(groundY - top);
    if (!scene.textures.exists(key)) {
      const canvas = scene.textures.createCanvas(key, Math.round(strip.width * RENDER_SCALE), Math.round(height * RENDER_SCALE))!;
      const ctx = canvas.getContext();
      for (const p of strip.placements) {
        const source = downscaled(scene, textureKey(p.name), p.scale * RENDER_SCALE).getSourceImage() as HTMLCanvasElement;
        ctx.drawImage(source, Math.round(p.left * RENDER_SCALE), Math.round((p.top + height) * RENDER_SCALE));
      }
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = WASH_ALPHA;
      ctx.fillStyle = WASH_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      canvas.refresh();
    }
    const source = scene.textures.get(key).getSourceImage();
    this.copies = [0, 1].map(() => scene.add.image(0, snapToPixel(groundY - height), key)
      .setOrigin(0, 0).setDepth(depth)
      .setDisplaySize(source.width / RENDER_SCALE, source.height / RENDER_SCALE));
  }

  /** Scrolls the street left by `offset` world px. */
  setScroll(offset: number): void {
    const x = -(((offset % this.width) + this.width) % this.width);
    this.copies[0].x = snapToPixel(x);
    this.copies[1].x = snapToPixel(x + this.width);
  }
}
