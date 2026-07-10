import Phaser from "phaser";
import { shouldTakeDamage, type ObstacleKind } from "./DodgeRule";
import type { VerticalState } from "./PlayerState";
import type { Lane } from "./Lane";

const OBSTACLE_MIN_INTERVAL_MS = 1200;
const OBSTACLE_MAX_INTERVAL_MS = 2000;
const OBSTACLE_SPAWN_MARGIN = 40;
const OBSTACLE_DESPAWN_MARGIN = 60;
const OBSTACLE_RESOLVE_TOLERANCE = 14;
const GROUND_OBSTACLE_WIDTH = 22;
const GROUND_OBSTACLE_HEIGHT = 36;
const OVERHEAD_OBSTACLE_WIDTH = 20;
const OVERHEAD_GAP = 50; // must satisfy duckHeight < OVERHEAD_GAP < standHeight
const LANES: Lane[] = ["road", "lawn"];
const KINDS: ObstacleKind[] = ["ground", "overhead"];

/**
 * Fraction of spawn events that force a lane switch: a Ground + Overhead
 * Obstacle paired in the same Lane at the same x. For every VerticalState
 * (grounded/jumping/ducking), at least one half of the pair always hits —
 * jumping clears the ground half but not the overhead half, ducking clears
 * the overhead half but not the ground half, grounded clears neither — so a
 * forced pair is only survivable by being in the other Lane. This is what
 * makes lane-switching load-bearing rather than a purely cosmetic choice
 * (see issue #3's "switching lanes is the only way to avoid some obstacle
 * placements"). Named distinctly from CONTEXT.md's "Blocker Obstacle" (a
 * Wood/Electric obstacle destroyed by a Power) — unrelated concept, same
 * area of the codebase, easy to confuse if named similarly.
 */
const FORCED_PAIR_PROBABILITY = 0.3;

interface SpawnedObstacle {
  gameObject: Phaser.GameObjects.Rectangle;
  lane: Lane;
  kind: ObstacleKind;
  resolved: boolean;
  /** Set for both halves of a forced pair — resolving one resolves both as a single decision. */
  pairedWith?: SpawnedObstacle;
}

export interface PlayerPose {
  lane: Lane;
  verticalState: VerticalState;
}

export interface ObstacleFieldOptions {
  laneGroundY: (lane: Lane) => number;
  characterX: number;
  scrollSpeed: number;
  getPlayerPose: () => PlayerPose;
  onMissed: () => void;
}

/**
 * Owns obstacle spawning, scrolling, dodge-resolution, and cleanup — the
 * one responsibility GameScene would otherwise accrete alongside pose
 * handling and game-over UI.
 *
 * Spawns are randomly timed/kinded/laned. That's placeholder test-track
 * scaffolding for exercising the dodge and lane-switch mechanics in
 * isolation, not the intended final content — ADR-0003 commits the real
 * Level to deliberate, hand-authored placement. Ticket #6 replaces this
 * with that authored Level (see the ticket's own "replaces the test track
 * used in prior tickets" scope note).
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
    const { characterX, getPlayerPose, onMissed } = this.options;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.gameObject.x -= dx;

      if (!obstacle.resolved && obstacle.gameObject.x <= characterX + OBSTACLE_RESOLVE_TOLERANCE) {
        obstacle.resolved = true;
        const pose = getPlayerPose();

        if (obstacle.pairedWith) {
          // A forced pair is one decision point: being in this Lane at all
          // is the miss, regardless of pose — see FORCED_PAIR_PROBABILITY.
          obstacle.pairedWith.resolved = true;
          if (obstacle.lane === pose.lane) onMissed();
        } else {
          const hit = shouldTakeDamage({
            obstacleLane: obstacle.lane,
            obstacleKind: obstacle.kind,
            playerLane: pose.lane,
            playerState: pose.verticalState,
          });
          if (hit) onMissed();
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
    const lane = Phaser.Utils.Array.GetRandom(LANES);

    if (Math.random() < FORCED_PAIR_PROBABILITY) {
      const ground = this.spawnObstacle(lane, "ground");
      const overhead = this.spawnObstacle(lane, "overhead");
      ground.pairedWith = overhead;
      overhead.pairedWith = ground;
      return;
    }

    const kind = Phaser.Utils.Array.GetRandom(KINDS);
    this.spawnObstacle(lane, kind);
  }

  private spawnObstacle(lane: Lane, kind: ObstacleKind): SpawnedObstacle {
    const groundY = this.options.laneGroundY(lane);
    const x = this.scene.scale.width + OBSTACLE_SPAWN_MARGIN;

    const gameObject =
      kind === "ground"
        ? this.scene.add
            .rectangle(x, groundY, GROUND_OBSTACLE_WIDTH, GROUND_OBSTACLE_HEIGHT, 0x4a4a4a)
            .setOrigin(0.5, 1)
        : this.scene.add
            .rectangle(x, groundY - OVERHEAD_GAP, OVERHEAD_OBSTACLE_WIDTH, groundY - OVERHEAD_GAP, 0x8b5a2b)
            .setOrigin(0.5, 1);

    const obstacle: SpawnedObstacle = { gameObject, lane, kind, resolved: false };
    this.obstacles.push(obstacle);
    return obstacle;
  }
}
