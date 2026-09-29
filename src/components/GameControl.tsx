import { useGameStore } from "@/store/gameStore"

const STEP = 1

export function GameControl() {
  const moveUnit = useGameStore((state) => state.moveUnit)

  const move = (dx: number, dy: number) => {
    moveUnit("ロボット", dx, dy)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <div />

      <button
        type="button"
        onClick={() => move(0, -STEP)}
      >
        ↑
      </button>

      <div />

      <button
        type="button"
        onClick={() => move(-STEP, 0)}
      >
        ←
      </button>

      <button
        type="button"
        onClick={() => move(0, STEP)}
      >
        ↓
      </button>

      <button
        type="button"
        onClick={() => move(STEP, 0)}
      >
        →
      </button>
    </div>
  )
}
