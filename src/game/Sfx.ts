const MASTER_GAIN = 0.16;

export type SfxName =
  | "flight"
  | "orb"
  | "jump"
  | "land"
  | "coin"
  | "hit"
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
  flight: [{ freq: 240, slideTo: 1100, duration: 360, type: "sine" }],
  orb: [{ freq: 600, slideTo: 1400, duration: 160, type: "triangle" }],
  jump: [{ freq: 320, slideTo: 640, duration: 90, type: "square" }],
  land: [{ freq: 110, duration: 55, type: "triangle", gain: 0.7 }],
  coin: [
    { freq: 880, duration: 60, type: "square" },
    { freq: 1320, delay: 55, duration: 90, type: "square" },
  ],
  hit: [{ freq: 220, slideTo: 60, duration: 160, type: "sawtooth", gain: 0.8 }],
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
