import { type SceneSetting, type ArrowKey, type GamePad } from "@/SceneState";
import { drawers } from "./drawers";
import { sceneState } from "@/SceneState";
import type { Application } from "pixi.js";

const MAX_X_ACCEL_PER_SEC = 5;
const JUMP_SPEED = 7;

export const scene2: SceneSetting = {
  gravity: 9.0,
  max_v: { x: JUMP_SPEED / 2, y: JUMP_SPEED },
  limit_y: "ground",
  initialSelectedUnitId: "ロボット",
  unitSettings: {
    ロボット: {
      initialPosition: {
        x: 0,
        y: 0,
      },
      draw: drawers["robot"],
      collid: "stop",
      collidRatio: 0.8,
    },
    りんご: {
      initialPosition: {
        x: 3,
        y: 0,
      },
      draw: drawers["apple"],
      collid: "take",
      collidRatio: 0.8,
    },
  },
  fixedObjectSettings: {
    ブロック0: {
      initialPosition: {
        x: 0,
        y: 4,
      },
      draw: drawers["block"],
      collid: "stop",
    },
    ブロック1: {
      initialPosition: {
        x: 1,
        y: 4,
      },
      draw: drawers["block"],
      collid: "stop",
    },
    ブロック2: {
      initialPosition: {
        x: 2,
        y: 3,
      },
      draw: drawers["block"],
      collid: "stop",
    },
    ブロック3: {
      initialPosition: {
        x: 3,
        y: 2,
      },
      draw: drawers["block"],
      collid: "stop",
    },
    ブロック4: {
      initialPosition: {
        x: 4,
        y: 3,
      },
      draw: drawers["block"],
      collid: "stop",
    },
    ブロック5: {
      initialPosition: {
        x: 8,
        y: 4,
      },
      draw: drawers["block"],
      collid: "stop",
    },
    ブロック6: {
      initialPosition: {
        x: 8,
        y: 2,
      },
      draw: drawers["block"],
      collid: "stop",
    },
    ブロック7: {
      initialPosition: {
        x: 8,
        y: 1,
      },
      draw: drawers["block"],
      collid: "stop",
    },
    ブロック8: {
      initialPosition: {
        x: 8,
        y: 0,
      },
      draw: drawers["block"],
      collid: "stop",
    },
  },
  initialFocus: {
    x: 12,
    y: 2,
  },
  mapSize: {
    w: 25,
    h: 5,
  },
  handleGamePad(app: Application, pad: GamePad, dt?: number) {
    const step = dt ? MAX_X_ACCEL_PER_SEC * dt : 1;

    sceneState
      .getActiveUnit()
      .setMaxSpeedRatio(pad.btn_y ? 2.0 : 1.0, undefined);

    if (Math.abs(pad.l_stick_x) > 0.1) {
      if (sceneState.checkUnitOnGround()) {
        const speed_mul = pad.btn_y ? 2 : 1;
        sceneState.getActiveUnit().accel(pad.l_stick_x * step * speed_mul, 0);
      } else {
        sceneState.getActiveUnit().accel(pad.l_stick_x * step * 0.5, 0);
      }
    }
    if (pad.btn_b && sceneState.checkUnitOnGround()) {
      console.log("jump", dt);
      sceneState.getActiveUnit().setSpeed(undefined, -JUMP_SPEED);
    }
  },
  handleArrowKey(app: Application, keys: Set<ArrowKey>, dt?: number) {
    const step = dt ? MAX_X_ACCEL_PER_SEC * dt : 1;

    let val = 0;
    if (keys.has("ArrowRight")) {
      val = 1;
    } else if (keys.has("ArrowLeft")) {
      val = -1;
    }
    if (sceneState.checkUnitOnGround()) {
      sceneState.getActiveUnit().accel(val * step, 0);
    } else {
      sceneState.getActiveUnit().accel(val * step * 0.5, 0);
    }
    if (keys.has("ArrowUp") && sceneState.checkUnitOnGround()) {
      sceneState.getActiveUnit().setSpeed(undefined, -JUMP_SPEED);
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
