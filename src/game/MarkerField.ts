import Phaser from "phaser";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";
import { MARKER_HEIGHT, MARKER_WIDTH } from "./VisualScale";

export type MarkerKind = "checkpoint" | "boss";

export interface MarkerEvent {
  distance: number;
  kind: MarkerKind;
}

interface SpawnedMarker {
  gameObject: Phaser.GameObjects.Rectangle;
  resolved: boolean;
}

/**
 * Purely decorative flags marking the Checkpoint and the Final Boss
 * encounter point (see Level.ts, ADR-0004) so they're visible during play.
 * Planted at the Tree Lawn baseline so a single flag reads across all Lanes.
 * Never affects gameplay: resolve() is a no-op.
 */
export class MarkerField extends ScrollingField<MarkerEvent, SpawnedMarker, ScrollingFieldOptions> {
  protected spawnEvent(event: MarkerEvent): void {
    const presentation = this.options.lanePresentation("treeLawn");
    const groundY = presentation.groundY;
    const x = this.spawnX();
    const color = event.kind === "checkpoint" ? 0x2ecc71 : 0xd62828;

    const gameObject = this.scene.add
      .rectangle(x, groundY, MARKER_WIDTH, MARKER_HEIGHT, color)
      .setOrigin(0.5, 1)
      .setDepth(presentation.depth)
      .setScale(presentation.scale);
    this.items.push({ gameObject, resolved: false });
  }

  protected resolve(): boolean {
    return false; // purely visual — scrolls off like any background prop
  }
}
