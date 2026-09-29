import { useGameStore } from "@/store/gameStore";

export function GameInfo() {
  const units = useGameStore((state) => state.units);

  return (
    <div>
      <h1 className="font-semibold">ユニット一覧</h1>
      {units.map((unit) => {
        return (
          <div>
            <p>
              {unit.id} : {unit.position.x},{unit.position.y}
            </p>
          </div>
        );
      })}
    </div>
  );
}
