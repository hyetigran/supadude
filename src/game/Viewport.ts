// Physics and framing stay fixed while the backing canvas renders at higher density.
export const VIEWPORT = { width: 800, height: 450 };

/**
 * Device pixels per world pixel. Matching the canvas to the size it is actually shown at keeps the
 * browser from stretching the finished frame, which softens every outline.
 */
export const RENDER_SCALE = typeof window === "undefined" ? 1 : displayScale();

function displayScale(): number {
  const dpr = window.devicePixelRatio || 1;
  const host = document.getElementById("game")?.getBoundingClientRect();
  const [width, height] = host && host.width > 0 && host.height > 0 ? [host.width, host.height] : [window.innerWidth, window.innerHeight];
  const fit = Math.min(width / VIEWPORT.width, height / VIEWPORT.height);
  return Math.min(3, Math.max(1, fit * dpr));
}

/** Rounds a world coordinate to the nearest device pixel. */
export function snapToPixel(value: number): number {
  return Math.round(value * RENDER_SCALE) / RENDER_SCALE;
}
