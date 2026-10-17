import Phaser from "phaser";
import type { BattleFrame } from "./RobberBattle";
import type { CarPower } from "./Level";
import { DEPTH_TRACK, DEPTH_HUD } from "./VisualScale";

export class BattleField {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly status: Phaser.GameObjects.Text;
  private readonly controls: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, private readonly groundY: number) {
    this.graphics = scene.add.graphics().setDepth(DEPTH_TRACK + 1);
    this.status = scene.add.text(400, 100, "", { fontFamily: "Arial", fontSize: "20px", fontStyle: "bold",
      color: "#ffffff", backgroundColor: "#7f1d1d", padding: { x: 12, y: 6 }, align: "center" }).setOrigin(0.5).setDepth(DEPTH_HUD);
    this.controls = scene.add.text(400, 435, "A / D / ← / →: MOVE  ·  SPACE / TAP: JUMP ON ROBBERS  ·  F / X: SHOOT", {
      fontFamily: "Arial", fontSize: "12px", align: "center", color: "#ffffff", backgroundColor: "#172033", padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(DEPTH_HUD);
  }
  render(frame: BattleFrame | null, power: CarPower | null, dead: boolean): void {
    this.graphics.clear();
    this.status.setVisible(!!frame);
    this.controls.setVisible(!!frame);
    if (!frame) return;
    const g = this.graphics;
    this.controls.setText(`A / D / ← / →: MOVE · SPACE / TAP: JUMP · F / X: SHOOT\n${frame.jumpReady ? "JUMP READY — RELEASE AND PRESS TO JUMP" : frame.jumpHeight > 0 ? "ONE STOMP PER JUMP" : "LANDING RECOVERY — KEEP MOVING"}`);
    this.controls.setY(425);
    this.status.setText(frame.outcome === "won" ? "ROBBERS DEFEATED!" : dead ? "CAUGHT!" :
      `ROBBER FIGHT  ·  HEALTH ${"♥".repeat(frame.health)}${"♡".repeat(3 - frame.health)}  ·  ${frame.robbers.filter(r => r.health > 0).length} LEFT`);
    for (const robber of frame.robbers) {
      if (robber.health <= 0) continue;
      const x = robber.x, y = this.groundY + robber.y;
      if (robber.attack === "windup") {
        g.lineStyle(3, 0xf87171, 0.9); g.strokeCircle(x, y, 52);
        g.fillStyle(0xf87171, 0.12); g.fillCircle(x, y, 52);
      }
      g.fillStyle(0x172033, 0.3); g.fillEllipse(x, y + 3, 40, 12);
      g.fillStyle(0x272b3b); g.fillRoundedRect(x - 15, y - 23, 30, 22, 4);
      g.fillStyle(0xe2e8f0); g.fillRect(x - 13, y - 18, 26, 4); g.fillRect(x - 13, y - 10, 26, 4);
      g.fillStyle(0xf0bb91); g.fillCircle(x, y - 31, 10);
      g.fillStyle(0x172033); g.fillRoundedRect(x - 11, y - 41, 22, 8, 3); g.fillRect(x - 10, y - 33, 20, 6);
      g.fillStyle(0xffffff); g.fillRect(x - 6, y - 31, 3, 2); g.fillRect(x + 3, y - 31, 3, 2);
      g.fillStyle(robber.attack === "windup" ? 0xf87171 : 0xf0bb91);
      const direction = frame.playerX < x ? -1 : 1;
      g.fillCircle(x + direction * (robber.attack === "recover" ? 24 : 18), y - 18, 7);
      g.fillStyle(0x172033); g.fillRect(x - 18, y - 52, 36, 5);
      g.fillStyle(0xf87171); g.fillRect(x - 18, y - 52, 18 * robber.health, 5);
    }
    if (frame.shot) {
      g.lineStyle(4, power === "fire" ? 0xf97316 : power === "water" ? 0x38bdf8 : 0xfacc15);
      g.lineBetween(frame.playerX, this.groundY + frame.playerY - 18 - frame.jumpHeight, frame.shot.x, this.groundY + frame.shot.y);
    }
  }
}
