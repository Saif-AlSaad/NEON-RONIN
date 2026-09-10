import React from "react";
import { ACHIEVEMENTS_LIST, loadStats } from "../game/achievements";

interface Props {
  onClose: () => void;
}

export default function AchievementsModal({ onClose }: Props) {
  const stats = loadStats();
  const unlockedSet = new Set(stats.unlockedAchievements);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border-2 border-pink-400/40 bg-slate-950/90 p-6 shadow-[0_0_60px_rgba(236,72,153,0.35)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-400 to-cyan-300">
              RONIN ARCHIVES
            </h2>
            <p className="font-story text-xs uppercase tracking-widest text-slate-400">
              Combat Statistics & Cyberpunk Trophies
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 transition-colors hover:border-cyan-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-5 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5">
            <p className="font-display text-lg font-bold text-amber-300">{stats.highestScore}</p>
            <p className="font-story text-[10px] uppercase tracking-wider text-slate-400">High Score</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5">
            <p className="font-display text-lg font-bold text-cyan-300">W{stats.highestWave}</p>
            <p className="font-story text-[10px] uppercase tracking-wider text-slate-400">Best Wave</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5">
            <p className="font-display text-lg font-bold text-rose-300">{stats.totalKills}</p>
            <p className="font-story text-[10px] uppercase tracking-wider text-slate-400">Total Kills</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5">
            <p className="font-display text-lg font-bold text-yellow-300">{stats.totalParries}</p>
            <p className="font-story text-[10px] uppercase tracking-wider text-slate-400">Parries</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5">
            <p className="font-display text-lg font-bold text-fuchsia-300">{stats.totalRuns}</p>
            <p className="font-story text-[10px] uppercase tracking-wider text-slate-400">Runs</p>
          </div>
        </div>

        {/* Achievements Progress */}
        <div className="mt-4 flex items-center justify-between font-story text-xs text-slate-400">
          <span>TROPHIES UNLOCKED</span>
          <span className="font-bold text-cyan-300">
            {stats.unlockedAchievements.length} / {ACHIEVEMENTS_LIST.length}
          </span>
        </div>

        {/* Achievements List */}
        <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {ACHIEVEMENTS_LIST.map((ach) => {
            const unlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-4 rounded-2xl border p-3.5 transition-all ${
                  unlocked
                    ? "border-amber-400/40 bg-slate-900/80 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                    : "border-white/5 bg-slate-950/40 opacity-45"
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                    unlocked
                      ? "border border-amber-400/50 bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      : "border border-white/10 bg-white/5 text-slate-600"
                  }`}
                >
                  {unlocked ? ach.icon : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display text-sm font-bold tracking-wide text-white truncate">
                      {ach.title}
                    </h4>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        ach.rarity === "cyber"
                          ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40"
                          : ach.rarity === "gold"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                      }`}
                    >
                      {ach.rarity}
                    </span>
                  </div>
                  <p className="mt-0.5 font-sans text-xs text-slate-400">{ach.desc}</p>
                </div>
                <div>
                  {unlocked ? (
                    <span className="text-xs font-bold text-amber-400">UNLOCKED</span>
                  ) : (
                    <span className="text-xs text-slate-500">LOCKED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <div className="mt-5 border-t border-white/10 pt-4 text-center">
          <button
            onClick={onClose}
            className="rounded-xl border-2 border-cyan-300/50 bg-gradient-to-r from-pink-500/30 to-fuchsia-900/40 px-8 py-2.5 font-display text-xs font-black tracking-widest text-cyan-100 transition-all hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-95"
          >
            RETURN TO BATTLE
          </button>
        </div>
      </div>
    </div>
  );
}
