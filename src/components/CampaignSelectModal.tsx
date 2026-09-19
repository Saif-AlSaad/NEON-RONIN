import { useState, useMemo } from "react";
import {
  getAllSectors,
  getLevelConfig,
  loadCampaignProgress,
  canAccessLevel,
  LevelConfig,
  SectorDef,
} from "../game/campaign/campaign";
import { cn } from "../utils/cn";

interface Props {
  onClose: () => void;
  onDeployLevel: (config: LevelConfig) => void;
}

export default function CampaignSelectModal({ onClose, onDeployLevel }: Props) {
  const sectors = useMemo(() => getAllSectors(), []);
  const [progress, setProgress] = useState(() => loadCampaignProgress());
  
  // Default selected sector based on highest unlocked level
  const defaultSectorId = Math.min(10, Math.floor((progress.highestUnlockedLevel - 1) / 10) + 1);
  const [selectedSectorId, setSelectedSectorId] = useState<number>(defaultSectorId);
  const [selectedLevelNum, setSelectedLevelNum] = useState<number>(progress.highestUnlockedLevel);

  const activeSector = sectors.find((s) => s.id === selectedSectorId) ?? sectors[0];
  const activeLevelConfig = useMemo(() => getLevelConfig(selectedLevelNum), [selectedLevelNum]);

  const isLevelUnlocked = canAccessLevel(selectedLevelNum, progress);
  const record = progress.completedLevels[selectedLevelNum];

  // Sector's 10 levels
  const sectorLevels = useMemo(() => {
    const start = activeSector.startLevel;
    const list: number[] = [];
    for (let l = start; l <= activeSector.endLevel; l++) {
      list.push(l);
    }
    return list;
  }, [activeSector]);

  const handleSelectSector = (sector: SectorDef) => {
    setSelectedSectorId(sector.id);
    // Auto select first level of this sector, or highest unlocked in this sector
    const firstLevel = sector.startLevel;
    if (progress.highestUnlockedLevel >= firstLevel) {
      const best = Math.min(sector.endLevel, progress.highestUnlockedLevel);
      setSelectedLevelNum(best);
    } else {
      setSelectedLevelNum(firstLevel);
    }
  };

  const handleCheckpointJump = (chkLevel: number) => {
    const secId = Math.floor((chkLevel - 1) / 10) + 1;
    setSelectedSectorId(secId);
    setSelectedLevelNum(chkLevel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative flex flex-col max-h-[95vh] w-full max-w-5xl rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#12072b]/95 via-[#0d041e]/95 to-[#080212]/95 shadow-[0_0_60px_rgba(6,182,212,0.3)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-6 py-4 bg-cyan-950/20">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <h2 className="font-display text-xl sm:text-2xl font-black tracking-widest text-cyan-200">
                CAMPAIGN SECTORS
              </h2>
              <span className="rounded-full border border-cyan-400/40 bg-cyan-900/30 px-3 py-0.5 text-xs font-bold text-cyan-300">
                100 LEVELS
              </span>
            </div>
            <p className="text-xs text-pink-300/80 font-mono mt-0.5">
              Highest Cleared: Level {progress.highestUnlockedLevel - 1} / 100 • Unlocked: Level {progress.highestUnlockedLevel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-pink-500/30 bg-pink-950/40 px-3 py-1.5 font-mono text-sm font-bold text-pink-300 hover:border-pink-400 hover:bg-pink-900/40 transition"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Fast Travel Checkpoint Bar */}
        <div className="px-6 py-2.5 bg-black/40 border-b border-cyan-500/10 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-mono text-cyan-400 font-bold tracking-wider shrink-0">
            CHECKPOINTS:
          </span>
          {sectors.map((sec) => {
            const isUnlocked = progress.unlockedCheckpoints.includes(sec.checkpointLevel);
            const isCurrent = activeSector.id === sec.id;
            return (
              <button
                key={sec.id}
                disabled={!isUnlocked}
                onClick={() => handleCheckpointJump(sec.checkpointLevel)}
                className={cn(
                  "px-2.5 py-1 rounded font-mono text-xs transition shrink-0 flex items-center gap-1.5",
                  isCurrent
                    ? "border border-cyan-300 bg-cyan-500/30 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    : isUnlocked
                    ? "border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/40"
                    : "border border-white/5 bg-white/5 text-slate-500 cursor-not-allowed"
                )}
              >
                <span>{isUnlocked ? "⚡" : "🔒"}</span>
                <span>S{sec.id} (L{sec.checkpointLevel})</span>
              </button>
            );
          })}
        </div>

        {/* Content Body: Sector Tabs + Level Grid + Level Intel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">
          {/* Left: Sector Navigation */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-cyan-500/20 bg-black/30 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <span className="block px-2 text-[10px] font-mono tracking-widest text-cyan-400/70 uppercase">
              Select Sector
            </span>
            {sectors.map((sec) => {
              const isSelected = sec.id === activeSector.id;
              const isSectorAccessible = progress.highestUnlockedLevel >= sec.startLevel;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSelectSector(sec)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl border transition flex flex-col gap-0.5",
                    isSelected
                      ? "border-cyan-400 bg-gradient-to-r from-cyan-950/60 to-pink-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      : isSectorAccessible
                      ? "border-cyan-500/20 bg-white/5 hover:border-cyan-500/40 hover:bg-white/10 text-slate-300"
                      : "border-white/5 bg-black/40 text-slate-600 opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-bold tracking-wider text-cyan-300">
                      SECTOR {sec.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      L{sec.startLevel}–{sec.endLevel}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-pink-200/90 truncate">
                    {sec.name.replace(/^Sector \d+: /, "")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Center: Sector Header & 10-Level Grid */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col">
            {/* Active Sector Banner */}
            <div
              className="p-4 rounded-xl border border-cyan-500/30 mb-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${activeSector.themeColor}15 0%, rgba(18,7,43,0.9) 100%)`,
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-cyan-300">
                    {activeSector.subtitle}
                  </span>
                  <h3 className="font-display text-xl font-black text-white">
                    {activeSector.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-lg border border-white/10">
                  <span className="text-xs text-slate-400">Sector Boss:</span>
                  <span className="text-xs font-bold text-rose-400">{activeSector.bossName}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300/80 mt-2 font-story max-w-xl">
                {activeSector.description}
              </p>
            </div>

            {/* Level Matrix */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                Sector Levels ({activeSector.startLevel} to {activeSector.endLevel})
              </span>
              <span className="text-xs font-mono text-pink-300/70">
                Click a level to inspect & deploy
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {sectorLevels.map((lvl) => {
                const isSelected = lvl === selectedLevelNum;
                const isUnlocked = canAccessLevel(lvl, progress);
                const isBoss = lvl % 10 === 0;
                const lvlRecord = progress.completedLevels[lvl];

                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelNum(lvl)}
                    className={cn(
                      "relative p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center",
                      isSelected
                        ? "border-cyan-300 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.45)] ring-2 ring-cyan-400/40"
                        : isUnlocked
                        ? "border-cyan-500/25 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10"
                        : "border-white/5 bg-black/40 opacity-45 cursor-not-allowed",
                      isBoss && isUnlocked && "border-rose-500/50 bg-rose-950/20"
                    )}
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <span className="font-mono text-xs font-black text-cyan-200">
                        #{lvl}
                      </span>
                      {isBoss && <span className="text-xs" title="Boss Level">👺</span>}
                      {!isUnlocked && <span className="text-xs text-slate-500">🔒</span>}
                    </div>

                    <div className="my-1">
                      {isBoss ? (
                        <span className="font-display text-sm font-bold text-rose-400">
                          BOSS
                        </span>
                      ) : (
                        <span className="font-display text-sm font-semibold text-slate-200">
                          LEVEL {lvl}
                        </span>
                      )}
                    </div>

                    {/* Star Rating or Status */}
                    {lvlRecord ? (
                      <div className="text-amber-400 text-xs tracking-tighter">
                        {"★".repeat(lvlRecord.stars)}
                        {"☆".repeat(3 - lvlRecord.stars)}
                      </div>
                    ) : isUnlocked ? (
                      <span className="text-[10px] font-mono text-cyan-300/80 uppercase">READY</span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 uppercase">LOCKED</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Level Intel & Deploy Action */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-cyan-500/20 bg-black/40 p-5 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <div className="border-b border-cyan-500/20 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-cyan-400 font-bold">
                    MISSION INTEL
                  </span>
                  <span className="text-xs font-mono text-pink-300">
                    {activeLevelConfig.isBossLevel ? "👺 BOSS ENCOUNTER" : `WAVES: ${activeLevelConfig.waveCount}`}
                  </span>
                </div>
                <h4 className="font-display text-2xl font-black text-white mt-1">
                  Level {activeLevelConfig.level}
                </h4>
                <p className="text-xs text-cyan-200/80 font-medium">
                  {activeLevelConfig.sectorName}
                </p>
              </div>

              {/* Objective */}
              <div className="rounded-xl border border-pink-500/30 bg-pink-950/30 p-3">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-pink-300/80">
                  PRIMARY OBJECTIVE
                </span>
                <p className="text-xs font-bold text-pink-100 mt-0.5">
                  {activeLevelConfig.objective.description}
                </p>
              </div>

              {/* Difficulty Modifiers */}
              <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-3 space-y-2">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400/80">
                  TACTICAL TELEMETRY
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Enemy HP:</span>
                    <span className="text-cyan-300 font-bold">
                      {activeLevelConfig.difficulty.hpMultiplier}x
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Enemy Dmg:</span>
                    <span className="text-rose-400 font-bold">
                      {activeLevelConfig.difficulty.damageMultiplier}x
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Speed:</span>
                    <span className="text-amber-300 font-bold">
                      {activeLevelConfig.difficulty.speedMultiplier}x
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Elite Spawn:</span>
                    <span className="text-purple-300 font-bold">
                      {(activeLevelConfig.difficulty.eliteChance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-amber-300/80">
                  DEPLOYMENT REWARDS
                </span>
                <div className="flex items-center gap-4 mt-1 text-xs font-mono font-bold">
                  <span className="text-amber-300">🪙 +{activeLevelConfig.reward.gold} Gold</span>
                  <span className="text-cyan-300">🧬 +{activeLevelConfig.reward.neonShards} Shards</span>
                </div>
              </div>

              {/* Player Record */}
              {record && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Best Score: {record.bestScore}</span>
                    <span>Best Time: {record.bestTime}s</span>
                  </div>
                </div>
              )}
            </div>

            {/* Deploy Action */}
            <div className="mt-5">
              <button
                disabled={!isLevelUnlocked}
                onClick={() => onDeployLevel(activeLevelConfig)}
                className={cn(
                  "w-full py-4 rounded-xl font-display text-base font-black tracking-widest uppercase transition-all shadow-lg",
                  isLevelUnlocked
                    ? "border-2 border-cyan-300 bg-gradient-to-r from-cyan-500 to-pink-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 cursor-pointer"
                    : "border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed opacity-60"
                )}
              >
                {isLevelUnlocked ? "⚡ DEPLOY RONIN" : "🔒 LEVEL LOCKED"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
