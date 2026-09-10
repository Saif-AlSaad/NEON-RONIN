import React, { useEffect } from "react";
import type { Perk } from "../game/perks";

interface Props {
  perks: Perk[];
  onSelect: (perk: Perk) => void;
}

export default function PerkSelectModal({ perks, onSelect }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1" && perks[0]) onSelect(perks[0]);
      if (e.key === "2" && perks[1]) onSelect(perks[1]);
      if (e.key === "3" && perks[2]) onSelect(perks[2]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [perks, onSelect]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl text-center">
        <div className="inline-block rounded-full border border-cyan-400/40 bg-cyan-950/40 px-4 py-1 font-story text-xs font-semibold tracking-widest text-cyan-300">
          CYBERWARE PROTOCOL INITIATED
        </div>
        <h2 className="mt-2 font-display text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-400 to-cyan-300 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">
          CHOOSE YOUR AUGMENTATION
        </h2>
        <p className="mt-1 font-story text-slate-300 text-sm">
          Select 1 cyberware modification to integrate into your battle suit (Press 1, 2, or 3)
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {perks.map((p, idx) => {
            const isLegendary = p.rarity === "legendary";
            const isRare = p.rarity === "rare";

            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 bg-slate-950/80 p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] active:scale-95 ${p.border} ${p.bgGlow}`}
              >
                {/* Background glow orb */}
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: p.accent }}
                />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                      {p.icon}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        isLegendary
                          ? "border border-amber-400/60 bg-amber-500/20 text-amber-300"
                          : isRare
                          ? "border border-rose-400/50 bg-rose-500/20 text-rose-300"
                          : "border border-cyan-400/40 bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      {p.rarity}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-bold tracking-wide text-white group-hover:text-cyan-200 transition-colors">
                    {p.name}
                  </h3>
                  <p className="font-story text-xs tracking-wider text-slate-400 uppercase">
                    {p.tagline}
                  </p>

                  <p className="mt-4 font-sans text-xs leading-relaxed text-slate-300">
                    {p.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-display text-xs tracking-widest text-slate-500 group-hover:text-cyan-300 transition-colors">
                    KEY [{idx + 1}]
                  </span>
                  <span
                    className="rounded-lg px-3 py-1 font-display text-xs font-bold tracking-wider transition-all group-hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                    style={{
                      backgroundColor: `${p.accent}25`,
                      color: p.accent,
                      border: `1px solid ${p.accent}60`,
                    }}
                  >
                    INSTALL →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
