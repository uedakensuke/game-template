import { useEffect, useRef } from "react";
import { Application } from "pixi.js";

import { sceneState, type ArrowKey } from "@/SceneState";
import { useGameStore } from "@/store/gameStore";
import { defaultScene } from "@/settings/scenes";

export function GameCanvas() {
  /**
   * GameCanvasは一度のみrenderされる（シーンが変わっても再実行されない）
   */

  const containerRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef(new Set<ArrowKey>());
  const setScene = useGameStore((state) => state.setSceneId);
  const app = useGameStore((state) => {
    return state.app;
  });
  const setApp = useGameStore((state) => {
    return state.setApp;
  });

  console.log("render GameCanvas");

  useEffect(() => {
    /**
     * appの初期化
     */
    if (!containerRef.current) {
      return;
    }
    if (app) {
      return;
    }
    const _app = new Application();

    (async () => {
      await _app.init({
        resizeTo: containerRef.current!,
      });

      containerRef.current!.appendChild(_app.canvas);
      setApp(_app);
    })();
  }, [containerRef.current]);

  useEffect(() => {
    if (!app) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.type == "wheel") {
        sceneState.handleWheel(app, event.deltaY);
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        // sceneState.handleArrowKey(app, event.key as ArrowKey, keys);
        keysRef.current.add(event.key as ArrowKey);
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        keysRef.current.delete(event.key as ArrowKey);
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [app]);

  useEffect(() => {
    if (!app) {
      return;
    }
    setScene(defaultScene);

    app.stage.addChild(sceneState.cameraContainer);

    app.ticker.add((ticker) => {
      const dt = (ticker.deltaMS / 1000) * sceneState.throttle_ratio;
      const gamepad = navigator.getGamepads()[0];
      if (gamepad) {
        sceneState.handleGamePad(
          app,
          {
            l_stick_x: gamepad.axes[0],
            l_stick_y: gamepad.axes[1],
            btn_b: gamepad.buttons[0].pressed,
            btn_a: gamepad.buttons[1].pressed,
            btn_y: gamepad.buttons[2].pressed,
            btn_x: gamepad.buttons[3].pressed,
          },
          dt,
        );
      } else {
        sceneState.handleArrowKey(app, keysRef.current, dt);
      }
      sceneState.applyPhysicsToAllUnits(dt);
      sceneState.setFocusXToActiveUnit(app)
    });

    function update() {
      sceneState.redrawAll();
      sceneState.updateCameraPosition(
        app!.renderer.screen.width,
        app!.renderer.screen.height,
      );
    }
    app.renderer.on("resize", update);
    return () => {
      app.stage.removeChild(sceneState.cameraContainer);
      app.renderer.off("resize", update);
    };
  }, [app]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden"></div>
  );
}
