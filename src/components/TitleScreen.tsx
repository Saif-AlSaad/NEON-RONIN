import { cn } from "../utils/cn";

interface Props {
  onStart: () => void;
}

const SUN = (
  <svg viewBox="0 0 200 200" className="h-44 w-44 sm:h-64 sm:w-64" aria-hidden>
    <defs>
      <linearGradient id="sung" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#ffb86b" />
        <stop offset="55%" stopColor="#ff4d8a" />
        <stop offset="100%" stopColor="#7b2cbf" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="90" fill="url(#sung)" />
    {[54, 72, 90, 108, 126, 144].map((y) => (
      <rect key={y} x={80 - ((y - 54) / 2) * 1.2} y={y} width={40 + (y - 54) * 1.2} height="6" fill="#0a0720" />
    ))}
  </svg>
);

export default function TitleScreen({ onStart }: Props) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Synthwave sky */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,100,180,0.35),transparent_55%),linear-gradient(180deg,#200b45_0%,#4b0d6b_50%,#a5196e_100%)]" />
      {/* Sun */}
      <div className="pointer-events-none absolute top-10 flex justify-center">
        <div className="animate-float">{SUN}</div>
      </div>
      {/* Grid */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[32%]"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(244,114,182,0.35) 30%, rgba(236,72,153,0.9) 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent, black 30%), repeating-linear-gradient(90deg, rgba(0,0,0,0.8) 0 2px, transparent 2px 60px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 30%), repeating-linear-gradient(90deg, rgba(0,0,0,0.8) 0 2px, transparent 2px 60px)",
          transform: "perspective(400px) rotateX(60deg)",
          transformOrigin: "bottom",
        }}
      />

      <div className="relative z-10 mt-[22vh] sm:mt-[28vh]">
        <p className="animate-fade-in-up font-display text-xs font-semibold uppercase tracking-[0.55em] text-cyan-300 sm:text-sm">
          A Neon Hack & Slash
        </p>
        <h1
          className="animate-fade-in-up mt-2 font-display text-6xl font-black tracking-tight sm:text-8xl"
          style={{
            background: "linear-gradient(180deg,#fef3c7 0%,#ff4d8a 50%,#7c3aed 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 40px rgba(255,77,138,0.45)",
            animationDelay: "0.08s",
          }}
        >
          NEON RONIN
        </h1>
        <p
          className="animate-fade-in-up mt-3 font-display text-lg font-semibold tracking-[0.4em] text-pink-200 sm:text-2xl"
          style={{ animationDelay: "0.18s" }}
        >
          BLADE OF THE WASTES
        </p>
        <p
          className="animate-fade-in-up mx-auto mt-6 max-w-md font-story text-lg italic text-pink-100/80 sm:text-xl"
          style={{ animationDelay: "0.28s" }}
        >
          Ten waves of raiders, archers, and oni stand between you and the
          shogun. Draw your blade, neon-streaked and hungry.
        </p>

        <button
          onClick={onStart}
          className={cn(
            "animate-fade-in-up group relative mt-10 overflow-hidden rounded-xl border-2 border-cyan-300/70 bg-gradient-to-b from-pink-500/25 to-fuchsia-900/30 px-12 py-4 font-display text-lg font-black tracking-[0.25em] text-cyan-100 shadow-[0_0_35px_rgba(236,72,153,0.45)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(56,189,248,0.55)] active:scale-95",
            "after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:ring-2 after:ring-cyan-300/30 after:animate-pulse-glow"
          )}
          style={{ animationDelay: "0.4s" }}
        >
          <span className="relative z-10">▶ DRAW BLADE</span>
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.8) 0 1px, transparent 1px 3px)",
      }} />
    </div>
  );
}
