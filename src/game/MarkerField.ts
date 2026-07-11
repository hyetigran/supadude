import Phaser from "phaser";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";

export type MarkerKind = "checkpoint" | "boss";

export interface MarkerEvent {
  distance: number;
  kind: MarkerKind;
}

interface SpawnedMarker {
  gameObject: Phaser.GameObjects.Rectangle;
  resolved: boolean;
}

const MARKER_WIDTH = 10;
const MARKER_HEIGHT = 90;

/**
 * Purely decorative flags marking the Checkpoint and the Final Boss
 * encounter point (see Level.ts, ADR-0004) so they're visible during play.
 * Planted at the Lawn baseline so a single flag reads across both Lanes.
 * Never affects gameplay: resolve() is a no-op.
 */
export class MarkerField extends ScrollingField<MarkerEvent, SpawnedMarker, ScrollingFieldOptions> {
  protected spawnEvent(event: MarkerEvent): void {
    const groundY = this.options.laneGroundY("lawn");
    const x = this.spawnX();
    const color = event.kind === "checkpoint" ? 0x2ecc71 : 0xd62828;

    const gameObject = this.scene.add.rectangle(x, groundY, MARKER_WIDTH, MARKER_HEIGHT, color).setOrigin(0.5, 1);
    this.items.push({ gameObject, resolved: false });
  }

  protected resolve(): boolean {
    return false; // purely visual — scrolls off like any background prop
  }
}
