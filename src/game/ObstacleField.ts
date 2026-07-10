import Phaser from "phaser";
import { isCleared, type ObstacleKind } from "./DodgeRule";
import type { VerticalState } from "./PlayerState";

const OBSTACLE_MIN_INTERVAL_MS = 1200;
const OBSTACLE_MAX_INTERVAL_MS = 2000;
const OBSTACLE_SPAWN_MARGIN = 40;
const OBSTACLE_DESPAWN_MARGIN = 60;
const OBSTACLE_RESOLVE_TOLERANCE = 14;
const GROUND_OBSTACLE_WIDTH = 22;
const GROUND_OBSTACLE_HEIGHT = 36;
const OVERHEAD_OBSTACLE_WIDTH = 20;
const OVERHEAD_GAP = 50; // must satisfy duckHeight < OVERHEAD_GAP < standHeight

interface SpawnedObstacle {
  gameObject: Phaser.GameObjects.Rectangle;
  kind: ObstacleKind;
  resolved: boolean;
}

export interface ObstacleFieldOptions {
  groundY: number;
  characterX: number;
  scrollSpeed: number;
  getVerticalState: () => VerticalState;
  onMissed: () => void;
}

/**
 * Owns obstacle spawning, scrolling, dodge-resolution, and cleanup — the
 * one responsibility GameScene would otherwise accrete alongside pose
 * handling and game-over UI.
 *
 * Spawns are randomly timed/kinded. That's placeholder test-track scaffolding
 * for exercising the dodge mechanic in isolation, not the intended final
 * content — ADR-0003 commits the real Level to deliberate, hand-authored
 * placement. Ticket #6 replaces this with that authored Level (see the
 * ticket's own "replaces the test track used in prior tickets" scope note).
 */
export class ObstacleField {
  private obstacles: SpawnedObstacle[] = [];
  private stopped = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: ObstacleFieldOptions,
  ) {}

  start(): void {
    this.scheduleNext();
  }

  stop(): void {
    this.stopped = true;
  }

  update(delta: number): void {
    if (this.stopped) return;

    const dx = (this.options.scrollSpeed * delta) / 1000;
    const { characterX, getVerticalState, onMissed } = this.options;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.gameObject.x -= dx;

      if (!obstacle.resolved && obstacle.gameObject.x <= characterX + OBSTACLE_RESOLVE_TOLERANCE) {
        obstacle.resolved = true;
        if (!isCleared(obstacle.kind, getVerticalState())) {
          onMissed();
        }
      }

      if (obstacle.gameObject.x < -OBSTACLE_DESPAWN_MARGIN) {
        obstacle.gameObject.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  private scheduleNext(): void {
    if (this.stopped) return;
    const delay = Phaser.Math.Between(OBSTACLE_MIN_INTERVAL_MS, OBSTACLE_MAX_INTERVAL_MS);
    this.scene.time.delayedCall(delay, () => {
      if (this.stopped) return;
      this.spawn();
      this.scheduleNext();
    });
  }

  private spawn(): void {
    const kind: ObstacleKind = Phaser.Math.Between(0, 1) === 0 ? "ground" : "overhead";
    const { groundY } = this.options;
    const x = this.scene.scale.width + OBSTACLE_SPAWN_MARGIN;

    const gameObject =
      kind === "ground"
        ? this.scene.add
            .rectangle(x, groundY, GROUND_OBSTACLE_WIDTH, GROUND_OBSTACLE_HEIGHT, 0x4a4a4a)
            .setOrigin(0.5, 1)
        : this.scene.add
            .rectangle(x, groundY - OVERHEAD_GAP, OVERHEAD_OBSTACLE_WIDTH, groundY - OVERHEAD_GAP, 0x8b5a2b)
            .setOrigin(0.5, 1);

    this.obstacles.push({ gameObject, kind, resolved: false });
  }
}
