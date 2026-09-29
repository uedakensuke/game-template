import "./App.css";

import { Button } from "@/components/ui/button";
import { GameCanvas } from "./components/GameCanvas";
import { GameControl } from "./components/GameControl";
import { GameInfo } from "./components/GameInfo";

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 min-h-0 bg-black">
          <div className="flex h-full w-full items-center justify-center">
            <GameCanvas />
          </div>
        </main>
        <aside className="w-[320px] border-l bg-background">
          <div className="flex h-full flex-col">
            <div className="flex-1 border-b p-4">
              <GameInfo/>
            </div>
            <div className="border-t p-4">
              <GameControl/>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
export default App;
