import { type SceneSetting, type ArrowKey, type GamePad } from "@/SceneState";
import { drawers } from "./drawers";
import { sceneState } from "@/SceneState";
import type { Application } from "pixi.js";

export const scene1: SceneSetting = {
  gravity:0.0,
  max_v: { x: 5.0, y: 5.0 },
  limit_y:"ground",
  initialSelectedUnitId: "ロボット",
  unitSettings: {
    ロボット: {
      initialPosition: {
        x: 0,
        y: 0,
      },
      draw: drawers["robot"],
      collid: "stop",
    },
    りんご: {
      initialPosition: {
        x: 2,
        y: 2,
      },
      draw: drawers["apple"],
      collid: "take",
    },
  },
  fixedObjectSettings:{

  },
  initialFocus: {
    x: 3,
    y: 3,
  },
  mapSize: {
    w: 7,
    h: 7,
  },
  handleGamePad(app: Application, pad: GamePad, dt?: number) {
    const MAX_MOVE_PER_SEC = 2;
    const step = dt ? MAX_MOVE_PER_SEC * dt : 1;

    if (Math.abs(pad.l_stick_x) > 0.1 || Math.abs(pad.l_stick_y) > 0.1) {
      const speed_mul = pad.btn_y ? 2 : 1;
      sceneState.getActiveUnit().move(
        pad.l_stick_x * step * speed_mul,
        pad.l_stick_y * step * speed_mul,
      );
    }
  },
  handleArrowKey(app: Application, keys: Set<ArrowKey>, dt?: number) {
    const MAX_MOVE_PER_SEC = 2;
    const step = dt ? MAX_MOVE_PER_SEC * dt : 1;

    if (keys.size == 2) {
      if (keys.has("ArrowUp") && keys.has("ArrowRight")) {
        sceneState.getActiveUnit().move(step / 1.414, -step / 1.414);
      } else if (keys.has("ArrowUp") && keys.has("ArrowLeft")) {
        sceneState.getActiveUnit().move(-step / 1.414, -step / 1.414);
      } else if (keys.has("ArrowDown") && keys.has("ArrowRight")) {
        sceneState.getActiveUnit().move(step / 1.414, step / 1.414);
      } else if (keys.has("ArrowDown") && keys.has("ArrowLeft")) {
        sceneState.getActiveUnit().move(-step / 1.414, step / 1.414);
      }
    } else if (keys.size == 1) {
      const key = keys.keys().next().value;
      switch (key) {
        case "ArrowUp":
          sceneState.getActiveUnit().move(0, -step);
          break;
        case "ArrowDown":
          sceneState.getActiveUnit().move(0, step);
          break;
        case "ArrowLeft":
          sceneState.getActiveUnit().move(-step, 0);
          break;
        case "ArrowRight":
          sceneState.getActiveUnit().move(step, 0);
          break;
      }
    }
  },
  handleWheel(app: Application, deltaY: number) {
    if (deltaY > 0) {
      // pan
      sceneState.tileSize /= 1.1;
      sceneState.redrawAll();
      sceneState.updateCameraPosition(
        app.renderer.screen.width,
        app.renderer.screen.height,
      );
    } else {
      // zoom
      sceneState.tileSize *= 1.1;
      sceneState.redrawAll();
      sceneState.updateCameraPosition(
        app.renderer.screen.width,
        app.renderer.screen.height,
      );
    }
  },
};
