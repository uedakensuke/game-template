import { Button } from "@/components/ui/button";

import { sceneState } from "@/SceneState";
import { useGameStore } from "@/store/gameStore";

export function GameControl() {
  const app = useGameStore((state) => {
    return state.app;
  });
  if (!app) {
    return <div>loading</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <div />
        <Button
          tabIndex={-1}
          onClick={() =>
            sceneState.handleArrowKey(app, new Set(["ArrowUp"]))
          }
        >
          ↑
        </Button>
        <div />

        <Button
          tabIndex={-1}
          onClick={() => sceneState.handleArrowKey(app, new Set(["ArrowLeft"]))}
        >
          ←
        </Button>
        <div />
        <Button
          tabIndex={-1}
          onClick={() => sceneState.handleArrowKey(app, new Set(["ArrowRight"]))}
        >
          →
        </Button>

        <div />
        <Button
          tabIndex={-1}
          onClick={() => sceneState.handleArrowKey(app, new Set(["ArrowDown"]))}
        >
          ↓
        </Button>
        <div />
      </div>
    </div>
  );
}
