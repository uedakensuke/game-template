import type { SceneSetting } from "@/SceneState";
import { scene1 } from "./scene1";
import { scene2 } from "./scene2";

export const scenes: Record<string, SceneSetting> = {
  scene1: scene1,
  scene2: scene2,
};

export const defaultScene="scene2"