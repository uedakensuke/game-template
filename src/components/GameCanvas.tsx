import { useEffect, useRef } from "react";
import { Application, extend, useApplication } from "@pixi/react";
import { Graphics, Container } from "pixi.js";

import { useGameStore, type Unit, type UnitType } from "@/store/gameStore";

extend({
  Graphics,
  Container,
});

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      <Application resizeTo={containerRef} background={0x20252b} antialias>
        <World />
      </Application>
    </div>
  );
}

export function World() {
  const { app } = useApplication();
  const worldRef = useRef<Container>(null);
  const units = useGameStore((state) => state.units);

  useEffect(() => {
    const updatePosition = () => {
      if (!worldRef.current) {
        return;
      }
      worldRef.current.x = app.screen.width / 2 - (MAP_WIDTH / 2) * TILE_SIZE;
      worldRef.current.y = app.screen.height / 2 - (MAP_HEIGHT / 2) * TILE_SIZE;
    };

    updatePosition();

    app.renderer.on("resize", updatePosition);

    return () => {
      app.renderer.off("resize", updatePosition);
    };
  }, [app]);

  return (
    <pixiContainer ref={worldRef}>
      <Grid />
      {units.map((unit) => (
        <UnitView unit={unit} />
      ))}
    </pixiContainer>
  );
}

const TILE_SIZE = 50;
const MAP_WIDTH = 5;
const MAP_HEIGHT = 5;
export function Grid() {
  return (
    <pixiGraphics
      draw={(graphics) => {
        graphics.clear();

        for (let x = 0; x <= MAP_WIDTH; x++) {
          graphics.moveTo(x * TILE_SIZE, 0);
          graphics.lineTo(x * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        }

        for (let y = 0; y <= MAP_HEIGHT; y++) {
          graphics.moveTo(0, y * TILE_SIZE);
          graphics.lineTo(MAP_WIDTH * TILE_SIZE, y * TILE_SIZE);
        }

        graphics.stroke({
          width: 1,
          color: 0x666666,
        });
      }}
    />
  );
}

type UnitProp = {
  unit: Unit;
};

const drawer: Record<UnitType, (g: Graphics) => void> = {
  robot: (graphics) => {
    graphics.clear();

    graphics.rect(
      -TILE_SIZE * 0.4,
      -TILE_SIZE * 0.4,
      TILE_SIZE * 0.8,
      TILE_SIZE * 0.8,
    );
    graphics.fill(0x4ade80);

    graphics.circle(-TILE_SIZE * 0.14, -TILE_SIZE * 0.1, TILE_SIZE * 0.1);
    graphics.circle(TILE_SIZE * 0.14, -TILE_SIZE * 0.1, TILE_SIZE * 0.1);
    graphics.rect(
      -TILE_SIZE * 0.2,
      TILE_SIZE * 0.2,
      TILE_SIZE * 0.4,
      TILE_SIZE * 0.1,
    );
    graphics.fill(0x111111);
  },
  apple: (graphics) => {
    graphics.clear();

    graphics.circle(0, TILE_SIZE*0.1, TILE_SIZE * 0.3);
    graphics.fill(0xff0000);

    graphics.rect(
      -TILE_SIZE * 0.05,
      -TILE_SIZE * 0.4,
      TILE_SIZE * 0.1,
      TILE_SIZE * 0.3,
    );
    graphics.fill(0x00aa00);
  },
};

function UnitView(prop: UnitProp) {
  const position = prop.unit.position;

  return (
    <pixiGraphics
      x={(position.x + 0.5) * TILE_SIZE}
      y={(position.y + 0.5) * TILE_SIZE}
      draw={drawer[prop.unit.type]}
    />
  );
}
