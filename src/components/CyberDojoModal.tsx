import React, { useState } from "react";
import {
  META_UPGRADES,
  BLADE_STANCES,
  loadMetaState,
  purchaseMetaUpgrade,
  unlockBladeStance,
  type MetaState,
} from "../game/meta";

interface Props {
  onClose: () => void;
}

export default function CyberDojoModal({ onClose }: Props) {
  const [meta, setMeta] = useState<MetaState>(() => loadMetaState());
  const [tab, setTab] = useState<"upgrades" | "blades">("upgrades");
  const [feedback, setFeedback] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleUpgrade = (id: string) => {
    const res = purchaseMetaUpgrade(id);
    if (res.success) {
      setMeta(res.newState);
      showNotice("⚡ CYBERNETIC UPGRADE INSTALLED");
    } else {
      showNotice(`⚠️ ${res.error || "Cannot upgrade"}`);
    }
  };

  const handleBlade = (id: string) => {
    const res = unlockBladeStance(id);
    if (res.success) {
      setMeta(res.newState);
      showNotice("⚔️ BLADE STANCE SYNCHRONIZED");
    } else {
      showNotice(`⚠️ ${res.error || "Cannot equip blade"}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border-2 border-cyan-400/40 bg-slate-950/90 shadow-[0_0_80px_rgba(6,182,212,0.35)] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-cyan-400/20 bg-cyan-950/20 px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦾</span>
              <h2 className="font-display text-2xl sm:text-3xl font-black tracking-widest text-cyan-200">
                CYBER-DOJO
              </h2>
            </div>
            <p className="mt-1 font-story text-sm text-pink-200/80">
              Permanent augmentations & blade modifications across all ronin runs.
            </p>
          </div>

          {/* Shard Bank Balance */}
          <div className="mt-3 sm:mt-0 flex items-center gap-2 rounded-2xl border border-cyan-400/50 bg-black/60 px-5 py-2.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <span className="text-xl">💎</span>
            <div className="text-left">
              <p className="font-display text-lg font-black tracking-wider text-cyan-300">
                {meta.neonShards}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">
                NEON SHARDS
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 bg-slate-950/40 px-6 pt-3">
          <button
            onClick={() => setTab("upgrades")}
            className={`mr-4 pb-3 font-display text-sm font-bold tracking-widest transition-all ${
              tab === "upgrades"
                ? "border-b-2 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚡ AUGMENT MATRIX
          </button>
          <button
            onClick={() => setTab("blades")}
            className={`pb-3 font-display text-sm font-bold tracking-widest transition-all ${
              tab === "blades"
                ? "border-b-2 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_15px_rgba(232,121,249,0.5)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚔️ BLADE CORES & STANCES
          </button>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div className="bg-cyan-500/20 px-6 py-2 text-center font-display text-xs font-bold tracking-widest text-cyan-200 animate-pulse">
            {feedback}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "upgrades" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {META_UPGRADES.map((u) => {
                const tier = meta.upgrades[u.id] ?? 0;
                const isMax = tier >= u.maxTier;
                const cost = isMax ? 0 : u.costs[tier];
                const canAfford = !isMax && meta.neonShards >= cost;

                return (
                  <div
                    key={u.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/15 bg-black/40 p-5 backdrop-blur-sm transition-all hover:border-cyan-400/40 hover:bg-slate-900/40"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{u.icon}</span>
                          <div>
                            <h3 className="font-display text-lg font-bold text-white">
                              {u.name}
                            </h3>
                            <p className="font-story text-xs text-pink-200/70">{u.desc}</p>
                          </div>
                        </div>

                        {/* Tier indicator pips */}
                        <div className="flex gap-1.5 pt-1">
                          {Array.from({ length: u.maxTier }).map((_, idx) => (
                            <span
                              key={idx}
                              className={`h-2.5 w-2.5 rounded-full transition-all ${
                                idx < tier
                                  ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                                  : "bg-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Current Bonus */}
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950/60 px-3.5 py-2 text-xs">
                        <span className="text-slate-400">Total Enhancement:</span>
                        <span className="font-bold text-cyan-300">
                          +{tier * u.bonusPerTier} {u.unit}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="font-display text-xs text-slate-300">
                        {isMax ? (
                          <span className="font-bold text-emerald-400">MAX TIER</span>
                        ) : (
                          <span className="flex items-center gap-1 text-cyan-200 font-bold">
                            <span>💎</span> {cost} Shards
                          </span>
                        )}
                      </span>

                      <button
                        onClick={() => handleUpgrade(u.id)}
                        disabled={isMax || !canAfford}
                        className={`rounded-xl px-4 py-2 font-display text-xs font-bold tracking-wider transition-all active:scale-95 ${
                          isMax
                            ? "cursor-not-allowed border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : canAfford
                            ? "border border-cyan-400 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                            : "cursor-not-allowed border border-white/10 bg-slate-800/40 text-slate-500"
                        }`}
                      >
                        {isMax ? "COMPLETED" : "UPGRADE"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "blades" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BLADE_STANCES.map((b) => {
                const isUnlocked = meta.unlockedBlades.includes(b.id);
                const isEquipped = meta.activeBlade === b.id;
                const canAfford = !isUnlocked && meta.neonShards >= b.cost;

                return (
                  <div
                    key={b.id}
                    className={`flex flex-col justify-between rounded-2xl border p-5 backdrop-blur-sm transition-all ${
                      isEquipped
                        ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                        : "border-white/15 bg-black/40 hover:border-white/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold text-white">
                          {b.name}
                        </h3>
                        {isEquipped && (
                          <span className="rounded-full border border-cyan-400/60 bg-cyan-500/20 px-2.5 py-0.5 font-display text-[10px] font-bold text-cyan-300 tracking-wider">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-story text-xs text-pink-200/70">{b.desc}</p>

                      {/* Visual Blade Preview Bar */}
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-story">Core Beam:</span>
                        <div
                          className="h-3 flex-1 rounded-full shadow-[0_0_15px_currentColor]"
                          style={{
                            background: `linear-gradient(90deg, ${b.primaryColor}, ${b.glowColor})`,
                            color: b.glowColor,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="font-display text-xs text-slate-300">
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-bold">UNLOCKED</span>
                        ) : (
                          <span className="flex items-center gap-1 text-cyan-200 font-bold">
                            <span>💎</span> {b.cost} Shards
                          </span>
                        )}
                      </span>

                      <button
                        onClick={() => handleBlade(b.id)}
                        disabled={isEquipped || (!isUnlocked && !canAfford)}
                        className={`rounded-xl px-4 py-2 font-display text-xs font-bold tracking-wider transition-all active:scale-95 ${
                          isEquipped
                            ? "cursor-default border border-cyan-400/30 bg-cyan-500/10 text-cyan-400"
                            : isUnlocked
                            ? "border border-cyan-400/60 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            : canAfford
                            ? "border border-amber-400/60 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 hover:shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                            : "cursor-not-allowed border border-white/10 bg-slate-800/40 text-slate-500"
                        }`}
                      >
                        {isEquipped ? "ACTIVE" : isUnlocked ? "EQUIP" : "UNLOCK"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-950/60 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 font-display text-sm font-bold tracking-wider text-slate-200 transition-all hover:bg-white/10 active:scale-95"
          >
            CLOSE DOJO
          </button>
        </div>
      </div>
    </div>
  );
}
