import { useGameStore } from "@/store/gameStore";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";

import { scenes } from "@/settings/scenes";

export function GameMenu() {
  const sceneId = useGameStore((state) => state.currentSceneId);
  const setSceneId = useGameStore((state) => state.setSceneId);
  const items = Object.keys(scenes);

  return (
    <div>
      <div className="flex flex-col">
        <Select
          value={sceneId}
          onValueChange={(value) => {
            if (value) setSceneId(value);
          }}
        >
          <SelectTrigger className="w-[180px]" tabIndex={-1}>
            <SelectValue placeholder="World" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
