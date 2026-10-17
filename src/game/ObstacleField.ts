import Phaser from "phaser";
import { solidWorldX, solidBottom, type HazardEvent, type Level, type SolidEvent } from "./Level";
import { type RunnerFrame } from "./Runner";
import { DEPTH_TRACK } from "./VisualScale";

interface TrackObject {
  x: number;
  object: Phaser.GameObjects.Container;
  solid?: SolidEvent;
  powerId?: string;
  hazardId?: string;
  powerLabel?: Phaser.GameObjects.Text;
  wheels?: Phaser.GameObjects.Graphics[];
}

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
      const g = scene.add.graphics();
      const isPad = power.kind === "flightPad";
      if (isPad) {
        g.lineStyle(4, 0x64748b);
        g.lineBetween(-23, -8, -23, 0);
        g.lineBetween(23, -8, 23, 0);
        g.fillStyle(0x1e293b);
        g.fillRoundedRect(-30, -17, 60, 9, 4);
        g.lineStyle(3, 0x22d3ee);
        g.strokeEllipse(0, -12, 58, 8);
        g.fillStyle(0xa5f3fc);
        g.fillTriangle(-7, -27, 0, -36, 7, -27);
      } else {
        g.fillStyle(0xfbbf24, 0.16);
        g.fillCircle(0, 0, 23);
        g.lineStyle(2, 0xfffbeb);
        g.strokeCircle(0, 0, 15);
        g.fillStyle(0xf59e0b);
        g.fillCircle(0, 0, 11);
        g.fillStyle(0xfffbeb);
        g.fillTriangle(-6, 2, 0, -6, 6, 2);
      }
      const label = scene.add.text(0, isPad ? -54 : -40, isPad ? "FLY · 4s" : "DOUBLE JUMP", {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold", color: isPad ? "#075985" : "#92400e",
        backgroundColor: "#fffbeb", padding: { x: 5, y: 3 },
      }).setOrigin(0.5);
      this.objects.push({ x: power.x, powerId: power.id, object: scene.add.container(0, isPad ? groundY : groundY - power.altitude, [g, label]).setDepth(DEPTH_TRACK + 1) });
    }
    const finish = scene.add.graphics();
    finish.fillStyle(0x334155);
    finish.fillRect(-3, -140, 6, 140);
    finish.fillStyle(0xfef3c7);
    finish.fillRect(3, -140, 74, 34);
    for (let x = 0; x < 8; x++) for (let y = 0; y < 3; y++) {
      if ((x + y) % 2 === 0) { finish.fillStyle(0x334155); finish.fillRect(3 + x * 9, -140 + y * 11, 9, 11); }
    }
    this.objects.push({ x: level.length, object: scene.add.container(0, groundY, [finish]).setDepth(DEPTH_TRACK) });
  }

  render(frame: RunnerFrame): void {
    for (const item of this.objects) {
      const worldX = item.solid ? solidWorldX(item.solid, frame.distance) : item.x;
      const screenX = this.characterX + worldX - frame.distance;
      item.object.setPosition(screenX, item.object.y).setVisible(!frame.battle && screenX > -180 && screenX < this.scene.scale.width + 180 && !frame.clearedHazardIds.includes(item.hazardId ?? ""));
      item.object.setAlpha(item.powerId && frame.usedPowerIds.includes(item.powerId) ? 0.3 : 1);
      item.powerLabel?.setAlpha(frame.usedCarIds.includes(item.solid?.id ?? "") ? 0.3 : 1);
      for (const wheel of item.wheels ?? []) wheel.rotation = -frame.distance / 12;
    }
  }

  private createCar(solid: SolidEvent): void {
    const { width: w, height: h } = solid;
    const g = this.scene.add.graphics();
    const color = solid.power === "fire" ? 0xef4444 : solid.power === "water" ? 0x2563eb : solid.power === "electricity" ? 0xfacc15 : 0x8b6bb1;
    g.fillStyle(0x172033, 0.18);
    g.fillEllipse(0, 1, w + 12, 10);
    g.fillStyle(color);
    g.fillRoundedRect(-w / 2, -h, w, h - 6, 6);
    g.lineStyle(2, 0x243c4b);
    g.strokeRoundedRect(-w / 2, -h, w, h - 6, 6);
    g.fillStyle(0xd7eff5);
    g.fillRoundedRect(-w / 2 + 7, -h + 6, w * 0.35, h * 0.4, 3);
    g.fillStyle(0x8fc2d4);
    g.fillRoundedRect(-w / 2 + w * 0.44, -h + 6, w * 0.42, h * 0.4, 3);
    g.lineStyle(2, 0xffffff, 0.6);
    g.lineBetween(-w / 2 + 8, -h + 8, -w / 2 + 18, -h + 8);
    g.fillStyle(0xfff3b0);
    g.fillRect(-w / 2, -19, 6, 8);
    g.fillStyle(0x991b1b);
    g.fillRect(w / 2 - 5, -19, 5, 8);
    g.fillStyle(0x243c4b);
    g.fillRect(-5, -h * 0.45, 9, 3);
    const wheels = [-w * 0.3, w * 0.3].map((x) => {
      const wheel = this.scene.add.graphics({ x, y: -8 });
      wheel.fillStyle(0x202b38); wheel.fillCircle(0, 0, 10);
      wheel.fillStyle(0xcbd5e1); wheel.fillCircle(0, 0, 5);
      wheel.lineStyle(2, 0x64748b); wheel.lineBetween(-4, 0, 4, 0);
      return wheel;
    });
    const object = this.scene.add.container(0, this.groundY - solidBottom(solid), [g, ...wheels]).setDepth(DEPTH_TRACK);
    const powerLabel = solid.power ? this.scene.add.text(0, -h - 16,
      `${solid.power.toUpperCase()} ↓`, {
        fontFamily: "Arial, sans-serif", fontSize: "10px", fontStyle: "bold",
        color: solid.power === "fire" ? "#991b1b" : solid.power === "water" ? "#1e40af" : "#854d0e", backgroundColor: "#fffbeb",
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5) : undefined;
    if (powerLabel) object.add(powerLabel);
    this.objects.push({ x: solid.x, solid, object, wheels, powerLabel });
  }

  private createHazard(hazard: HazardEvent): void {
    const { width: w, height: h } = hazard;
    const g = this.scene.add.graphics();
    if (hazard.kind === "fireHydrant") {
      g.fillStyle(0xfacc15); g.fillRoundedRect(-w / 2 + 5, -h + 4, w - 10, h - 4, 4);
      g.fillStyle(0xeab308); g.fillRect(-w / 2, -h * 0.65, w, 9);
      g.fillStyle(0x854d0e); g.fillRect(-w / 2 + 2, -4, w - 4, 4);
      g.fillStyle(0xfef08a); g.fillEllipse(0, -h + 3, w - 6, 9);
      g.lineStyle(2, 0x854d0e); g.strokeCircle(0, -h / 2, 5);
    } else if (hazard.kind === "constructionPit") {
      g.fillStyle(0x172033); g.fillRect(-w / 2, -3, w, 22);
      g.fillStyle(0x806344); g.fillRect(-w / 2 + 4, 10, w - 8, 9);
      g.lineStyle(4, 0xfbbf24); g.lineBetween(-w / 2, -3, w / 2, -3);
      g.lineStyle(3, 0x172033);
      for (let x = -w / 2 + 4; x < w / 2; x += 12) g.lineBetween(x, -5, x + 4, -1);
    } else if (hazard.kind === "fallenTree") {
      g.fillStyle(0x795032); g.fillRoundedRect(-w / 2, -h, w, h, 9);
      g.lineStyle(2, 0xc49a6c); g.lineBetween(-w / 2 + 8, -h + 8, w / 2 - 6, -h + 8);
      g.fillStyle(0xd5b382); g.fillEllipse(w / 2 - 7, -h / 2, 13, h - 4);
      g.lineStyle(2, 0x795032); g.strokeEllipse(w / 2 - 7, -h / 2, 7, h - 12);
    } else if (hazard.kind === "tree") {
      // The trunk stands behind the curb; the outlined low branch is in the player's path.
      g.fillStyle(0x9b7653, 0.65); g.fillRect(w / 2 - 8, -h + 12, 12, h + 24);
      g.fillStyle(0x467c44); g.fillRoundedRect(-w / 2, -h, w, h, 18);
      g.fillStyle(0x669c50); g.fillCircle(-20, -h + 12, 31); g.fillCircle(22, -h + 8, 34);
      g.lineStyle(4, 0x5b442e); g.lineBetween(-w / 2 + 5, -3, w / 2 - 6, -3);
    } else if (hazard.kind === "basketballHoop") {
      g.fillStyle(0x718096, 0.65); g.fillRect(w / 2 - 8, -h + 8, 7, h + hazard.bottom - 15);
      g.fillStyle(0xf8fafc); g.fillRoundedRect(-w / 2, -h, w, h, 3);
      g.lineStyle(3, 0x345565); g.strokeRect(-w / 2, -h, w, h);
      g.lineStyle(2, 0xe76f51); g.strokeRect(-18, -h + 15, 36, h - 24);
      g.lineStyle(4, 0xef6c35); g.lineBetween(-23, -3, 23, -3);
      g.lineStyle(1, 0xffffff); for (let x = -18; x < 20; x += 9) g.lineBetween(x, 0, x * 0.65, 15);
    } else if (hazard.kind === "trashCan") {
      g.fillStyle(0x557780); g.fillRoundedRect(-w / 2, -h, w, h, 3);
      g.fillStyle(0x304d59); g.fillRoundedRect(-w / 2 - 2, -h, w + 4, 5, 2);
      g.lineStyle(2, 0xa2bfc4); for (let x = -w / 2 + 6; x < w / 2; x += 8) g.lineBetween(x, -h + 8, x, -5);
    } else {
      g.fillStyle(0x427747); g.fillRoundedRect(-w / 2, -h * 0.7, w, h * 0.7, 6);
      g.fillStyle(0x62994b);
      for (let x = -w / 2 + 10; x < w / 2; x += 14) g.fillCircle(x, -h * 0.6, Math.min(17, h * 0.55));
      g.fillStyle(0xf4cf6c); g.fillCircle(-w / 4, -h * 0.65, 2); g.fillCircle(w / 4, -h * 0.5, 2);
    }
    const object = this.scene.add.container(0, this.groundY - hazard.bottom, [g]).setDepth(DEPTH_TRACK);
    if (hazard.bottom > 0) object.add(this.scene.add.text(0, -h - 17, "STAY LOW", { fontSize: "10px", fontFamily: "Arial", color: "#334155", backgroundColor: "#fffbeb", padding: { x: 4, y: 2 } }).setOrigin(0.5));
    this.objects.push({ x: hazard.x, hazardId: hazard.id, object });
  }
}
