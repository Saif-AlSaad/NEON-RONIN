import React, { useEffect, useState } from "react";
import { onAchievementUnlocked, type Achievement } from "../game/achievements";

export default function AchievementToast() {
  const [toasts, setToasts] = useState<Achievement[]>([]);

  useEffect(() => {
    const unsub = onAchievementUnlocked((ach) => {
      setToasts((prev) => [...prev, ach]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== ach.id));
      }, 4500);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-6 top-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-4 rounded-2xl border-2 border-amber-400/60 bg-slate-950/90 p-4 shadow-[0_0_35px_rgba(251,191,36,0.35)] backdrop-blur-md animate-fadeIn"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl shadow-[0_0_15px_rgba(251,191,36,0.4)]">
            {t.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-story text-[10px] font-bold uppercase tracking-widest text-amber-400">
                ACHIEVEMENT UNLOCKED
              </span>
              <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-bold uppercase text-amber-300">
                {t.rarity}
              </span>
            </div>
            <h4 className="font-display text-sm font-bold tracking-wide text-white">
              {t.title}
            </h4>
            <p className="font-sans text-xs text-slate-400">{t.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
