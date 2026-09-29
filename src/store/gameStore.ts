import { create } from "zustand";

type Position = {
  x: number;
  y: number;
};

export type UnitType = "robot" | "apple";

export type Unit = {
  id: string;
  position: Position;
  type: UnitType;
};

type GameState = {
  units: Unit[];

  moveUnit: (unitId: string, dx: number, dy: number) => void;
};

export const useGameStore = create<GameState>((set) => ({
  units: [
    {
      id: "ロボット",
      position: {
        x: 0,
        y: 0,
      },
      type: "robot",
    },
    {
      id: "りんご",
      position: {
        x: 2,
        y: 2,
      },
      type: "apple",
    },
  ],

  moveUnit: (unitId, dx, dy) => {
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              position: {
                x: unit.position.x + dx,
                y: unit.position.y + dy,
              },
            }
          : unit,
      ),
    }));
  },
}));
