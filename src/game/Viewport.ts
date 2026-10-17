// Physics and framing stay fixed while the backing canvas renders at higher density.
export const VIEWPORT = { width: 800, height: 450 };
export const RENDER_SCALE = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
