import Phaser from "phaser";
import { DEPTH_HUD } from "../game/VisualScale";

const OVERLAY_DEPTH = DEPTH_HUD + 20;

export type PauseOverlayKind = "start" | "lives" | "pause";

export interface PauseOverlayCopy {
  title: string;
  subtitle?: string;
  prompt: string;
}

const COPY: Record<PauseOverlayKind, PauseOverlayCopy> = {
  start: {
    title: "SUPA DUDE",
    subtitle: "Dodge Obstacles. Collect Coins. Beat the Boss.",
    prompt: "Click or press any key to start",
  },
  lives: {
    title: "OUT OF LIVES",
    subtitle: "Respawn at the last Checkpoint",
    prompt: "Click or press any key to continue",
  },
  pause: {
    title: "PAUSED",
    prompt: "Click or press any key to resume",
  },
};

/**
 * Full-screen prompt used for the Level start gate, mid-run pause, and the
 * 0-Lives pause before a Checkpoint respawn. Dismissed by click or any key.
 */
export class PauseOverlay {
  private root?: Phaser.GameObjects.Container;
  private dismissBound?: () => void;

  constructor(private readonly scene: Phaser.Scene) {}

  show(kind: PauseOverlayKind, onDismiss: () => void): void {
    this.destroy();

    const { width, height } = this.scene.scale;
    const copy = COPY[kind];

    const backdrop = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    const title = this.scene.add
      .text(width / 2, height / 2 - 48, copy.title, { fontSize: "36px", color: "#ffffff", fontStyle: "bold" })
      .setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [backdrop, title];

    if (copy.subtitle) {
      children.push(
        this.scene.add
          .text(width / 2, height / 2 + 2, copy.subtitle, { fontSize: "16px", color: "#d1d5db" })
          .setOrigin(0.5),
      );
    }

    children.push(
      this.scene.add
        .text(width / 2, height / 2 + 48, copy.prompt, { fontSize: "14px", color: "#ffffff" })
        .setOrigin(0.5),
    );

    this.root = this.scene.add.container(0, 0, children).setDepth(OVERLAY_DEPTH);

    this.dismissBound = () => {
      this.destroy();
      onDismiss();
    };

    // Bind on the next macrotask so the opening click/key cannot dismiss
    // immediately. Uses setTimeout (not scene.time) so mid-run pause still
    // works when the Phaser clock is paused.
    setTimeout(() => {
      if (!this.dismissBound) return;
      this.scene.input.once("pointerdown", this.dismissBound);
      this.scene.input.keyboard?.once("keydown", this.dismissBound);
    }, 0);
  }

  destroy(): void {
    if (this.dismissBound) {
      this.scene.input.off("pointerdown", this.dismissBound);
      this.scene.input.keyboard?.off("keydown", this.dismissBound);
      this.dismissBound = undefined;
    }
    this.root?.destroy(true);
    this.root = undefined;
  }
}
