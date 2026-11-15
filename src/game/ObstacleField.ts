import { VIEWPORT, snapToPixel } from "./Viewport";
import Phaser from "phaser";
import { solidWorldX, solidBottom, type HazardEvent, type Level, type SolidEvent } from "./Level";
import { type RunnerFrame } from "./Runner";
import { DEPTH_TRACK } from "./VisualScale";
import { createTrafficSprite } from "./TrafficArt";
import { wheelRotation } from "./TrafficFit";
import { createObjectImage, objectTextureKey } from "./ObjectArt";
import {
  PIT_FLOOR, SIDEWALK_DEPTH, finishGatePlacement, hazardPlacements, jumpOrbPlacement, trampolinePlacement,
  trashcanLidOffsetY, trashcanLidPlacement, type TrampolineState,
} from "./ObjectFit";

interface TrackObject {
  x: number;
  object: Phaser.GameObjects.Container;
  solid?: SolidEvent;
  powerId?: string;
  hazardId?: string;
  powerLabel?: Phaser.GameObjects.Text;
  wheels?: Phaser.GameObjects.Image[];
  wheelRadius?: number;
  hazard?: HazardEvent;
  pad?: Phaser.GameObjects.Image;
}

const TRAMPOLINE_BOUNCE: readonly [TrampolineState, number][] = [["trampoline-compressed", 90], ["trampoline-rebound", 140], ["trampoline", 0]];

/** The same world positions drive traffic collision and its approaching artwork. */
export class ObstacleField {
  private readonly objects: TrackObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly groundY: number,
    private readonly characterX: number,
    level: Level,
  ) {
    for (const solid of level.solids) this.createCar(solid);
    for (const hazard of level.hazards) this.createHazard(hazard);
    for (const power of level.powers ?? []) {
      const isPad = power.kind === "flightPad";
      const art = createObjectImage(scene, isPad ? trampolinePlacement() : jumpOrbPlacement());
      const label = scene.add.text(0, isPad ? -54 : -40, isPad ? "FLY · 4s" : "DOUBLE JUMP", {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold", color: isPad ? "#075985" : "#92400e",
        backgroundColor: "#fffbeb", padding: { x: 5, y: 3 },
      }).setOrigin(0.5);
      this.objects.push({ x: power.x, powerId: power.id, pad: isPad ? art : undefined,
        object: scene.add.container(0, isPad ? groundY : groundY - power.altitude, [art, label]).setDepth(DEPTH_TRACK + 1) });
    }
    const finish = createObjectImage(scene, finishGatePlacement());
    this.objects.push({ x: level.length, object: scene.add.container(0, groundY, [finish]).setDepth(DEPTH_TRACK) });
  }

  /** Squash and rebound the trampoline mat when Supa Dude launches from it. */
  bouncePad(powerId: string): void {
    const pad = this.objects.find((item) => item.powerId === powerId)?.pad;
    if (!pad) return;
    let delay = 0;
    for (const [state, duration] of TRAMPOLINE_BOUNCE) {
      this.scene.time.delayedCall(delay, () => pad.setTexture(objectTextureKey(this.scene, trampolinePlacement(state))));
      delay += duration;
    }
  }

  /** A cleared Trash Can throws its lid; other hazards just disappear. */
  popLid(hazardId: string, distance: number): void {
    const item = this.objects.find((candidate) => candidate.hazardId === hazardId);
    if (item?.hazard?.kind !== "trashCan") return;
    const canScale = hazardPlacements(item.hazard)[0].scale;
    const lid = createObjectImage(this.scene, trashcanLidPlacement(canScale));
    const container = this.scene.add.container(this.characterX + item.x - distance, this.groundY + trashcanLidOffsetY(canScale), [lid])
      .setDepth(DEPTH_TRACK + 0.5);
    this.scene.tweens.add({ targets: container, y: container.y - 46, x: container.x + 26, angle: 200, alpha: 0, duration: 520,
      ease: "Quad.easeOut", onComplete: () => container.destroy() });
  }

  render(frame: RunnerFrame): void {
    for (const item of this.objects) {
      const worldX = item.solid ? solidWorldX(item.solid, frame.renderDistance) : item.x;
      // Art snaps to whole device pixels so its outlines are never resampled between frames.
      const screenX = snapToPixel(this.characterX + worldX - frame.renderDistance);
      item.object.setPosition(screenX, item.object.y).setVisible(!frame.battle && screenX > -180 && screenX < VIEWPORT.width + 180 && !frame.clearedHazardIds.includes(item.hazardId ?? ""));
      item.object.setAlpha(item.powerId && frame.usedPowerIds.includes(item.powerId) ? 0.3 : 1);
      item.powerLabel?.setAlpha(frame.usedCarIds.includes(item.solid?.id ?? "") ? 0.3 : 1);
      if (item.solid && item.wheelRadius) {
        const rotation = wheelRotation(worldX, item.solid.x, item.wheelRadius);
        for (const wheel of item.wheels ?? []) wheel.rotation = rotation;
      }
    }
  }

  private createCar(solid: SolidEvent): void {
    const { width: w, height: h } = solid;
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x172033, 0.18);
    shadow.fillEllipse(0, 1, w + 12, 10);
    const { rig, wheels, wheelRadius } = createTrafficSprite(this.scene, solid);
    const object = this.scene.add.container(0, snapToPixel(this.groundY - solidBottom(solid)), [shadow, rig]).setDepth(DEPTH_TRACK);
    const powerLabel = solid.power ? this.scene.add.text(0, -h - 16,
      `${solid.power.toUpperCase()} ↓`, {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold",
        color: solid.power === "fire" ? "#991b1b" : solid.power === "water" ? "#1e40af" : "#854d0e", backgroundColor: "#fffbeb",
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5) : undefined;
    if (powerLabel) object.add(powerLabel);
    this.objects.push({ x: solid.x, solid, object, wheels, wheelRadius, powerLabel });
  }

  private createHazard(hazard: HazardEvent): void {
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (hazard.kind === "constructionPit") {
      // The level's pit width cuts the sidewalk; the slab art only frames it.
      const gap = this.scene.add.graphics();
      gap.fillStyle(0x261b17); gap.fillRect(-hazard.width / 2 - 2, -SIDEWALK_DEPTH, hazard.width + 4, SIDEWALK_DEPTH + PIT_FLOOR);
      gap.fillStyle(0x3b2b24); gap.fillRect(-hazard.width / 2 - 2, PIT_FLOOR - 5, hazard.width + 4, 5);
      gap.lineStyle(1.5, 0x111111); gap.strokeRect(-hazard.width / 2 - 2, -SIDEWALK_DEPTH, hazard.width + 4, SIDEWALK_DEPTH + PIT_FLOOR);
      parts.push(gap);
    }
    for (const placement of hazardPlacements(hazard)) parts.push(createObjectImage(this.scene, placement));
    const object = this.scene.add.container(0, this.groundY - hazard.bottom, parts).setDepth(DEPTH_TRACK);
    if (hazard.bottom > 0) object.add(this.scene.add.text(0, -hazard.height - 17, "STAY LOW", { fontSize: "10px", fontFamily: "Arial", color: "#334155", backgroundColor: "#fffbeb", padding: { x: 4, y: 2 } }).setOrigin(0.5));
    this.objects.push({ x: hazard.x, hazardId: hazard.id, hazard, object });
  }
}
