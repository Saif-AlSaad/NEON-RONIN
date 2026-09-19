import { useState } from "react";
import type { Ronin, LevelConfig } from "./types";
import Starfield from "./components/Starfield";
import TitleScreen from "./components/TitleScreen";
import CharacterSelect from "./components/CharacterSelect";
import NeonArena from "./components/NeonArena";
import AchievementsModal from "./components/AchievementsModal";
import AchievementToast from "./components/AchievementToast";
import CyberDojoModal from "./components/CyberDojoModal";
import SettingsModal from "./components/SettingsModal";
import CampaignSelectModal from "./components/CampaignSelectModal";

type Screen = "title" | "select" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [ronin, setRonin] = useState<Ronin | null>(null);
  const [showCampaignSelect, setShowCampaignSelect] = useState(false);
  const [campaignLevel, setCampaignLevel] = useState<LevelConfig | null>(null);
  const [showArchives, setShowArchives] = useState(false);
  const [showDojo, setShowDojo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0318] text-slate-100">
      <AchievementToast />

      {screen !== "game" && <Starfield />}

      {screen === "title" && (
        <TitleScreen
          onCampaign={() => setShowCampaignSelect(true)}
          onStart={() => {
            setCampaignLevel(null);
            setScreen("select");
          }}
          onArchives={() => setShowArchives(true)}
          onDojo={() => setShowDojo(true)}
          onSettings={() => setShowSettings(true)}
        />
      )}

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
          key={campaignLevel ? `campaign-${campaignLevel.level}` : "arcade"}
          ronin={ronin}
          levelConfig={campaignLevel ?? undefined}
          onNextLevel={(nextConfig) => {
            setCampaignLevel(nextConfig);
          }}
          onCampaignMap={() => {
            setScreen("title");
            setShowCampaignSelect(true);
          }}
          onTitle={() => {
            setCampaignLevel(null);
            setScreen("title");
          }}
          onRestart={() => setScreen("select")}
        />
      )}

      {showCampaignSelect && (
        <CampaignSelectModal
          onClose={() => setShowCampaignSelect(false)}
          onDeployLevel={(lvl) => {
            setCampaignLevel(lvl);
            setShowCampaignSelect(false);
            if (ronin) {
              setScreen("game");
            } else {
              setScreen("select");
            }
          }}
        />
      )}

      {showArchives && (
        <AchievementsModal onClose={() => setShowArchives(false)} />
      )}

      {showDojo && (
        <CyberDojoModal onClose={() => setShowDojo(false)} />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
