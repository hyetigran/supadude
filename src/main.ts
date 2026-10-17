import Phaser from "phaser";
import { VIEWPORT, RENDER_SCALE } from "./game/Viewport";
import "./style.css";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: VIEWPORT.width * RENDER_SCALE,
  height: VIEWPORT.height * RENDER_SCALE,
  backgroundColor: "#1d1f27",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
});
