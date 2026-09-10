import { useState } from "react";
import type { Ronin } from "./types";
import Starfield from "./components/Starfield";
import TitleScreen from "./components/TitleScreen";
import CharacterSelect from "./components/CharacterSelect";
import NeonArena from "./components/NeonArena";

type Screen = "title" | "select" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [ronin, setRonin] = useState<Ronin | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0318] text-slate-100">
      {screen !== "game" && <Starfield />}

      {screen === "title" && <TitleScreen onStart={() => setScreen("select")} />}

      {screen === "select" && (
        <CharacterSelect
          onSelect={(r) => {
            setRonin(r);
            setScreen("game");
          }}
          onBack={() => setScreen("title")}
        />
      )}

      {screen === "game" && ronin && (
        <NeonArena
          ronin={ronin}
          onTitle={() => setScreen("title")}
          onRestart={() => setScreen("select")}
        />
      )}
    </div>
  );
}
