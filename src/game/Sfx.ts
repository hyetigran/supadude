const MASTER_GAIN = 0.16;

export type SfxName =
  | "jump"
  | "duck"
  | "land"
  | "laneSwitch"
  | "coin"
  | "heart"
  | "powerCollect"
  | "powerActivate"
  | "blockerDestroyed"
  | "hit"
  | "punch"
  | "bossHit"
  | "bossDefeated"
  | "levelComplete"
  | "pause";

interface Tone {
  freq: number;
  /** Offset from the SFX's start (ms). */
  delay?: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  /** Slide to this frequency by the end of the tone; omit for a flat pitch. */
  slideTo?: number;
}

const SEQUENCES: Record<SfxName, Tone[]> = {
  jump: [{ freq: 320, slideTo: 640, duration: 90, type: "square" }],
  duck: [{ freq: 340, slideTo: 170, duration: 90, type: "square" }],
  land: [{ freq: 110, duration: 55, type: "triangle", gain: 0.7 }],
  laneSwitch: [{ freq: 500, duration: 45, type: "square", gain: 0.5 }],
  coin: [
    { freq: 880, duration: 60, type: "square" },
    { freq: 1320, delay: 55, duration: 90, type: "square" },
  ],
  heart: [{ freq: 523, slideTo: 784, duration: 160, type: "sine" }],
  powerCollect: [{ freq: 400, slideTo: 900, duration: 180, type: "sawtooth", gain: 0.5 }],
  powerActivate: [
    { freq: 660, duration: 70, type: "square" },
    { freq: 660, delay: 90, duration: 70, type: "square" },
  ],
  blockerDestroyed: [
    { freq: 200, duration: 70, type: "sawtooth" },
    { freq: 700, delay: 30, duration: 120, type: "square", gain: 0.5 },
  ],
  hit: [{ freq: 220, slideTo: 60, duration: 160, type: "sawtooth", gain: 0.8 }],
  punch: [{ freq: 180, duration: 70, type: "square", gain: 0.7 }],
  bossHit: [{ freq: 300, slideTo: 90, duration: 130, type: "sawtooth", gain: 0.8 }],
  bossDefeated: [
    { freq: 523, duration: 100, type: "square" },
    { freq: 659, delay: 100, duration: 100, type: "square" },
    { freq: 784, delay: 200, duration: 100, type: "square" },
    { freq: 1046, delay: 300, duration: 260, type: "square" },
  ],
  levelComplete: [
    { freq: 523, duration: 90, type: "square" },
    { freq: 659, delay: 90, duration: 90, type: "square" },
    { freq: 784, delay: 180, duration: 90, type: "square" },
    { freq: 1046, delay: 270, duration: 90, type: "square" },
    { freq: 1318, delay: 360, duration: 300, type: "square" },
  ],
  pause: [{ freq: 440, duration: 60, type: "sine", gain: 0.5 }],
};

/**
 * Synthesized WebAudio blips (no audio asset files) for the placeholder
 * art phase — swap for authored SFX in the art-integration pass. Lazily
 * creates its AudioContext on the first play() so construction never runs
 * afoul of autoplay policies; callers should trigger the first play from a
 * genuine user gesture (e.g. the start-overlay dismiss).
 */
export class Sfx {
  private ctx?: AudioContext;

  play(name: SfxName): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    for (const tone of SEQUENCES[name]) {
      this.playTone(ctx, tone);
    }
  }

  private playTone(ctx: AudioContext, tone: Tone): void {
    const startAt = ctx.currentTime + (tone.delay ?? 0) / 1000;
    const duration = (tone.duration ?? 80) / 1000;

    const oscillator = ctx.createOscillator();
    oscillator.type = tone.type ?? "square";
    oscillator.frequency.setValueAtTime(tone.freq, startAt);
    if (tone.slideTo !== undefined) {
      oscillator.frequency.linearRampToValueAtTime(tone.slideTo, startAt + duration);
    }

    const gainNode = ctx.createGain();
    const peakGain = MASTER_GAIN * (tone.gain ?? 1);
    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(peakGain, startAt + Math.min(0.01, duration / 4));
    gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    oscillator.connect(gainNode).connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  private getContext(): AudioContext | undefined {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined" || !window.AudioContext) return undefined;
    this.ctx = new AudioContext();
    return this.ctx;
  }
}
