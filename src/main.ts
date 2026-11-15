// The stylesheet loads first so the game container has its real size when Viewport measures it.
import "./style.css";
import Phaser from "phaser";
import { VIEWPORT, RENDER_SCALE } from "./game/Viewport";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: Math.round(VIEWPORT.width * RENDER_SCALE),
  height: Math.round(VIEWPORT.height * RENDER_SCALE),
  backgroundColor: "#1d1f27",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
});
