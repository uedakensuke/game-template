import { type SceneSetting, type ArrowKey, type GamePad } from "@/SceneState";
import { drawers } from "./drawers";
import { sceneState } from "@/SceneState";
import type { Application } from "pixi.js";

const MAX_X_ACCEL_PER_SEC = 5;
const JUMP_SPEED = 7;

export const scene2: SceneSetting = {
  throttle_ratio: 1,
  gravity: 9.0,
  max_v: { x: JUMP_SPEED / 2, y: JUMP_SPEED },
  limit_y: "collid",
  initialSelectedUnitId: "ロボット",
  unitSettings: {
    ロボット: {
      initialPosition: {
        x: 0,
        y: 0,
      },
      draw: drawers["robot"],
      overlap: "collid",
      physicalSize: 0.8,
    },
    りんご: {
      initialPosition: {
        x: 3,
        y: 0,
      },
      draw: drawers["apple"],
      overlap: "take",
      physicalSize: 0.8,
    },
  },
  fixedObjectSettings: {
    ブロック0: {
      initialPosition: {
        x: 0,
        y: 4,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    ブロック1: {
      initialPosition: {
        x: 1,
        y: 4,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    ブロック2: {
      initialPosition: {
        x: 2,
        y: 3,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    ブロック3: {
      initialPosition: {
        x: 3,
        y: 2,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    ブロック4: {
      initialPosition: {
        x: 4,
        y: 3,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    ブロック5: {
      initialPosition: {
        x: 8,
        y: 4,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    ブロック6: {
      initialPosition: {
        x: 8,
        y: 2,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    ブロック7: {
      initialPosition: {
        x: 8,
        y: 1,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    ブロック8: {
      initialPosition: {
        x: 8,
        y: 0,
      },
      draw: drawers["block"],
      overlap: "collid",
    },
    雲1: {
      initialPosition: {
        x: 11,
        y: 3,
      },
      draw: drawers["cloud"],
      overlap: "collid_from_upper",
    },
    雲2: {
      initialPosition: {
        x: 12,
        y: 3,
      },
      draw: drawers["cloud"],
      overlap: "collid_from_upper",
    },
    雲3: {
      initialPosition: {
        x: 13,
        y: 3,
      },
      draw: drawers["cloud"],
      overlap: "collid_from_upper",
    },
    雲4: {
      initialPosition: {
        x: 14,
        y: 3,
      },
      draw: drawers["cloud"],
      overlap: "collid_from_upper",
    },
    雲5: {
      initialPosition: {
        x: 15,
        y: 3,
      },
      draw: drawers["cloud"],
      overlap: "collid_from_upper",
    },
    雲6: {
      initialPosition: {
        x: 17,
        y: 3,
      },
      draw: drawers["cloud"],
      overlap: "collid_from_upper",
    },
    雲7: {
      initialPosition: {
        x: 19,
        y: 3,
      },
      draw: drawers["cloud"],
      overlap: "collid_from_upper",
    },
  },
  mapSize: {
    w: 25,
    h: 5,
  },
  handleGamePad(app: Application, pad: GamePad, dt?: number) {
    const unit = sceneState.getActiveUnit();
    if (unit === undefined) {
      return;
    }
    const step = dt ? MAX_X_ACCEL_PER_SEC * dt : 1;

    sceneState
      .getActiveUnit()
      .setMaxSpeedRatio(pad.btn_y ? 2.0 : 1.0, undefined);

    if (Math.abs(pad.l_stick_x) > 0.1) {
      if (unit.checkNearGround()) {
        const speed_mul = pad.btn_y ? 2 : 1;
        unit.accel(pad.l_stick_x * step * speed_mul, 0);
      } else {
        unit.accel(pad.l_stick_x * step * 0.5, 0);
      }
    }
    if (pad.btn_b && unit.checkNearGround() && unit.v.y == 0) {
      console.log("jump", dt);
      unit.setSpeed(undefined, -JUMP_SPEED);
    }
  },
  handleArrowKey(app: Application, keys: Set<ArrowKey>, dt?: number) {
    const unit = sceneState.getActiveUnit();
    if (unit === undefined) {
      return;
    }
    const step = dt ? MAX_X_ACCEL_PER_SEC * dt : 1;

    let val = 0;
    if (keys.has("ArrowRight")) {
      val = 1;
    } else if (keys.has("ArrowLeft")) {
      val = -1;
    }
    if (unit.checkNearGround()) {
      unit.accel(val * step, 0);
    } else {
      unit.accel(val * step * 0.5, 0);
    }
    if (keys.has("ArrowUp") && unit.checkNearGround() && unit.v.y == 0) {
      unit.setSpeed(undefined, -JUMP_SPEED);
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
