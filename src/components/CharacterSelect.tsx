import type { Ronin } from "../types";
import { RONIN } from "../game/ronin";
import { cn } from "../utils/cn";

interface Props {
  onSelect: (ronin: Ronin) => void;
  onBack: () => void;
}

function Bar({ label, value, tone }: { label: string; value: number; tone: string }) {
  const pct = Math.min(100, (value / 160) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 font-semibold tracking-wide text-slate-300">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CharacterSelect({ onSelect, onBack }: Props) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-4 py-10">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.45em] text-cyan-300/80">
        Choose your style
      </p>
      <h2
        className="mt-2 font-display text-3xl font-black tracking-tight sm:text-5xl"
        style={{
          background: "linear-gradient(180deg,#fef3c7 0%,#ff4d8a 60%,#7c3aed 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Who wields the blade?
      </h2>
      <p className="mt-3 max-w-lg text-center font-story text-lg italic text-pink-100/80">
        Three ronin walk the neon wastes. Pick the one whose rhythm matches yours.
      </p>

      <div className="mt-10 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {RONIN.map((r, i) => (
          <div
            key={r.id}
            className={cn(
              "animate-fade-in-up group flex flex-col overflow-hidden rounded-2xl border border-pink-400/20 bg-slate-950/70 shadow-xl backdrop-blur-sm transition-all duration-300",
              "hover:-translate-y-2 hover:border-cyan-300/60 hover:shadow-[0_20px_60px_rgba(236,72,153,0.3)]"
            )}
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <div className={cn("relative flex flex-col items-center bg-gradient-to-br px-6 pb-6 pt-8", r.gradient)}>
              <div className="text-7xl drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110">
                {r.emoji}
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold text-white">{r.name}</h3>
              <p className={cn("font-display text-sm font-semibold tracking-widest", r.accent)}>{r.title}</p>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6">
              <p className="font-story text-base leading-relaxed text-slate-300/90">{r.blurb}</p>
              <div className="space-y-2.5 rounded-xl bg-black/30 p-4">
                <Bar label="Health" value={r.stats.maxHp} tone="bg-gradient-to-r from-rose-400 to-pink-300" />
                <Bar label="Energy" value={r.stats.maxEnergy} tone="bg-gradient-to-r from-cyan-400 to-sky-300" />
                <Bar label="Damage" value={r.stats.meleeDmg * 6} tone="bg-gradient-to-r from-amber-400 to-pink-300" />
                <Bar label="Speed" value={r.stats.speed * 0.45} tone="bg-gradient-to-r from-fuchsia-400 to-violet-300" />
              </div>
              <div className="rounded-lg bg-fuchsia-500/10 p-3 text-center ring-1 ring-fuchsia-400/20">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-fuchsia-200">Special</p>
                <p className="font-display text-sm font-bold text-white">{r.specialName}</p>
              </div>
              <button
                onClick={() => onSelect(r)}
                className={cn(
                  "mt-auto rounded-xl border-2 border-cyan-300/50 bg-gradient-to-b from-pink-500/20 to-fuchsia-800/20 py-3 font-display text-sm font-black tracking-[0.2em] text-cyan-100 transition-all hover:border-cyan-300 hover:from-pink-500/40 hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95"
                )}
              >
                SELECT {r.name.toUpperCase()}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-8 font-story text-sm italic text-pink-200/70 transition-colors hover:text-cyan-200"
      >
        ← Return to the neon skyline
      </button>
    </div>
  );
}
