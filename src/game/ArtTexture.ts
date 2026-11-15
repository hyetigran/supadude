import Phaser from "phaser";

/**
 * The source art is far larger than its on-screen size; sampling it directly shimmers while scrolling,
 * so each size is pre-filtered once into a canvas texture at display density.
 * `cropBottom` (source px) drops the rows at and below it before scaling.
 */
export function downscaled(scene: Phaser.Scene, key: string, factor: number, cropBottom?: number): Phaser.Textures.Texture {
  const outKey = `${key}@${factor.toFixed(4)}${cropBottom === undefined ? "" : `^${cropBottom}`}`;
  if (scene.textures.exists(outKey)) return scene.textures.get(outKey);
  let source = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  if (cropBottom !== undefined && cropBottom < source.height) {
    const cropped = document.createElement("canvas");
    cropped.width = source.width;
    cropped.height = Math.max(1, cropBottom);
    cropped.getContext("2d")!.drawImage(source, 0, 0);
    source = cropped;
  }
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
  return texture;
}
