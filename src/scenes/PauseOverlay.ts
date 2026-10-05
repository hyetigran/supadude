import Phaser from "phaser";
import type { Difficulty } from "../game/Difficulty";
import { DEPTH_HUD } from "../game/VisualScale";

const OVERLAY_DEPTH = DEPTH_HUD + 20;
const TEXT_RESOLUTION = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);

export type PauseOverlayKind = "start" | "pause";

export interface PauseOverlayCopy {
  title: string;
  subtitle?: string;
  controls?: string;
  prompt: string;
}

const COPY: Record<PauseOverlayKind, PauseOverlayCopy> = {
  start: {
    title: "SUPA DUDE",
    subtitle: "Your neighborhood. Your superpowers.",
    controls: "SPACE / ↑ / TAP: JUMP · HOLD: FLY · F / X: SHOOT",
    prompt: "Trampolines: fly · Gold orbs: double jump\nLand on cars: RED = FIRE · BLUE = WATER",
  },
  pause: {
    title: "PAUSED",
    prompt: "Click, tap, or press any key to resume",
  },
};

/**
 * Full-screen prompt used for the Level start gate and mid-run pause.
 */
export class PauseOverlay {
  private root?: Phaser.GameObjects.Container;
  private dismissBound?: () => void;
  private keyboardDismissBound?: (event: KeyboardEvent) => void;

  constructor(private readonly scene: Phaser.Scene) {}

  show(kind: PauseOverlayKind, onDismiss: (difficulty?: Difficulty) => void): void {
    this.destroy();

    const { width, height } = this.scene.scale;
    const copy = COPY[kind];
    const panelWidth = kind === "start" ? 520 : 460;
    const panelHeight = kind === "start" ? 302 : 164;

    const backdrop = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x0f172a, 0.48);
    const panel = this.scene.add
      .rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x172033, 0.94)
      .setStrokeStyle(2, 0xf8fafc, 0.24);
    const title = this.scene.add
      .text(width / 2, height / 2 - 58, copy.title, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "36px",
        color: "#f8fafc",
        fontStyle: "bold",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [backdrop, panel, title];

    if (copy.subtitle) {
      children.push(
        this.scene.add
          .text(width / 2, height / 2 - 8, copy.subtitle, {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "16px",
            color: "#dbeafe",
            resolution: TEXT_RESOLUTION,
          })
          .setOrigin(0.5),
      );
    }

    if (copy.controls) {
      children.push(
        this.scene.add
          .text(width / 2, height / 2 + 34, copy.controls, {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "13px",
            color: "#fef3c7",
            resolution: TEXT_RESOLUTION,
          })
          .setOrigin(0.5),
      );
    }

    children.push(
      this.scene.add
        .text(width / 2, height / 2 + 72, copy.prompt, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "12px",
          align: "center",
          color: "#f8fafc",
          resolution: TEXT_RESOLUTION,
        })
        .setOrigin(0.5),
    );

    if (kind === "start") {
      const choose = (difficulty: Difficulty): void => { this.destroy(); onDismiss(difficulty); };
      for (const [difficulty, offset, label] of [
        ["normal", -116, "NORMAL  ·  SPACE"],
        ["hard", 116, "HARD +23%  ·  H"],
      ] as const) {
        const button = this.scene.add.rectangle(width / 2 + offset, height / 2 + 117, 216, 44,
          difficulty === "normal" ? 0x256b78 : 0x854b30).setStrokeStyle(2, 0xf8fafc, 0.7).setInteractive({ useHandCursor: true });
        button.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation(); choose(difficulty);
        });
        const labelText = this.scene.add.text(width / 2 + offset, height / 2 + 117, label, {
          fontFamily: "Arial, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#ffffff", resolution: TEXT_RESOLUTION,
        }).setOrigin(0.5);
        children.push(button, labelText);
      }
      this.keyboardDismissBound = (event: KeyboardEvent) => {
        if (event.repeat) return;
        if (["Space", "Enter", "ArrowUp"].includes(event.code)) choose("normal");
        if (event.code === "KeyH") choose("hard");
      };
      this.scene.input.keyboard?.on("keydown", this.keyboardDismissBound);
      this.root = this.scene.add.container(0, 0, children).setDepth(OVERLAY_DEPTH);
      return;
    }

    this.root = this.scene.add.container(0, 0, children).setDepth(OVERLAY_DEPTH);

    this.dismissBound = () => {
      this.destroy();
      onDismiss();
    };
    this.keyboardDismissBound = (event: KeyboardEvent) => {
      if (event.repeat) return;
      this.dismissBound?.();
    };

    // Bind on the next macrotask so the opening click/key cannot dismiss
    // immediately. Uses setTimeout (not scene.time) so mid-run pause still
    // works when the Phaser clock is paused.
    setTimeout(() => {
      if (!this.dismissBound) return;
      this.scene.input.once("pointerdown", this.dismissBound);
      if (this.keyboardDismissBound) this.scene.input.keyboard?.on("keydown", this.keyboardDismissBound);
    }, 0);
  }

  destroy(): void {
    if (this.dismissBound) {
      this.scene.input.off("pointerdown", this.dismissBound);
      this.dismissBound = undefined;
    }
    if (this.keyboardDismissBound) {
      this.scene.input.keyboard?.off("keydown", this.keyboardDismissBound);
      this.keyboardDismissBound = undefined;
    }
    this.root?.destroy(true);
    this.root = undefined;
  }
}
