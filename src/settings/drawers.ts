import { Graphics } from "pixi.js";

export const drawers: Record<
  string,
  (graphics: Graphics, tileSize: number) => void
> = {
  robot: (graphics, tileSize) => {
    graphics.clear();

    graphics.rect(
      -tileSize * 0.4,
      -tileSize * 0.4,
      tileSize * 0.8,
      tileSize * 0.8,
    );
    graphics.fill(0x4ade80);

    graphics.circle(-tileSize * 0.14, -tileSize * 0.1, tileSize * 0.1);
    graphics.circle(tileSize * 0.14, -tileSize * 0.1, tileSize * 0.1);
    graphics.rect(
      -tileSize * 0.2,
      tileSize * 0.2,
      tileSize * 0.4,
      tileSize * 0.1,
    );
    graphics.fill(0x111111);
  },
  apple: (graphics, tileSize) => {
    graphics.clear();

    graphics.circle(0, tileSize * 0.1, tileSize * 0.3);
    graphics.fill(0xff0000);

    graphics.rect(
      -tileSize * 0.05,
      -tileSize * 0.4,
      tileSize * 0.1,
      tileSize * 0.3,
    );
    graphics.fill(0x00aa00);
  },
  block: (graphics, tileSize) => {
    graphics.clear();

    graphics.rect(
      -tileSize * 0.49,
      -tileSize * 0.49,
      tileSize * 0.98,
      tileSize * 0.98,
    );
    graphics.fill(0x662200);
    graphics.rect(
      -tileSize * 0.4,
      -tileSize * 0.4,
      tileSize * 0.8,
      tileSize * 0.8,
    );
    graphics.fill(0xaa4400);
  },
  cloud: (graphics, tileSize) => {
    graphics.clear();

    graphics.circle(tileSize * -0.2, tileSize * -0.2, tileSize * 0.3);
    graphics.fill(0xeeeeee);
    graphics.circle(tileSize * -0.2, tileSize * 0.2, tileSize * 0.3);
    graphics.fill(0xeeeeee);
    graphics.circle(tileSize * 0.2, tileSize * -0.2, tileSize * 0.3);
    graphics.fill(0xeeeeee);
    graphics.circle(tileSize * 0.2, tileSize * 0.2, tileSize * 0.3);
    graphics.fill(0xeeeeee);
  },
};
