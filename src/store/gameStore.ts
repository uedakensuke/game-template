import { create } from "zustand";

import { scenes } from "@/settings/scenes";
import { sceneState } from "@/SceneState";
import { Application } from "pixi.js";

type GameState = {
  currentSceneId: string;
  setSceneId: (sceneId: string) => void;
  app?: Application;
  setApp: (app: Application) => void;
};

export const useGameStore = create<GameState>((set) => ({
  app: undefined,
  setApp: (app: Application) => {
    set(() => {
      return {
        app: app,
      };
    });
  },
  currentSceneId: "scene1",
  setSceneId: (sceneId) => {
    /**
     * シーンを切り替える。シーン切り替え時には、GameStateのcurrentSceneIdが切り替わる
     */

    set((state) => {
      if (!state.app) {
        console.error("app not initialized");
        return state;
      }
      const setting = scenes[sceneId];
      sceneState.set(state.app, setting);
      return {
        currentSceneId: sceneId,
      };
    });
  },
}));
