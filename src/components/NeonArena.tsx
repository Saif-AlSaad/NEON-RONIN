import React, { useEffect, useRef, useState } from "react";
import type { Ronin } from "../types";
import { GameAudio } from "../game/audio";
import { unlockAchievement } from "../game/achievements";
import type { Perk } from "../game/perks";
import { GameEngine } from "../game/engine/GameEngine";
import PerkSelectModal from "./PerkSelectModal";
import TouchControls from "./TouchControls";
import AchievementsModal from "./AchievementsModal";
import AchievementToast from "./AchievementToast";

interface Props {
  ronin: Ronin;
  onTitle: () => void;
  onRestart: () => void;
}

function loadVol(key: string, def: number) {
  const v = parseFloat(localStorage.getItem(key) ?? "");
  return Number.isNaN(v) ? def : v;
}

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 flex justify-between font-story text-xs text-pink-200/80">
        <span>{label}</span>
        <span className="font-sans text-cyan-200">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer accent-fuchsia-400"
      />
    </label>
  );
}

export default function NeonArena({ ronin, onTitle, onRestart }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const audioRef = useRef<GameAudio | null>(null);

  const [result, setResult] = useState<{ win: boolean; score: number; wave: number } | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showSound, setShowSound] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [touchEnabled, setTouchEnabled] = useState(
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
  const [gamepadNotice, setGamepadNotice] = useState<string | null>(null);

  // Roguelite Perks
  const [activePerks, setActivePerks] = useState<Perk[]>([]);
  const [perkChoices, setPerkChoices] = useState<Perk[] | null>(null);

  const [volumes, setVolumes] = useState({
    master: loadVol("nr_master", 0.9),
    music: loadVol("nr_music", 1),
    sfx: loadVol("nr_sfx", 0.55),
    muted: localStorage.getItem("nr_muted") === "1",
  });

  const changeVolume = (k: "master" | "music" | "sfx", v: number) => {
    setVolumes((p) => ({ ...p, [k]: v }));
    localStorage.setItem(`nr_${k}`, String(v));
    if (k === "master") audioRef.current?.setMasterVolume(v);
    else if (k === "music") audioRef.current?.setMusicVolume(v);
    else audioRef.current?.setSfxVolume(v);
  };

  const toggleMute = () => {
    setVolumes((p) => {
      const next = !p.muted;
      localStorage.setItem("nr_muted", next ? "1" : "0");
      audioRef.current?.setMuted(next);
      return { ...p, muted: next };
    });
  };

  const ensureAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new GameAudio();
      audioRef.current.setMasterVolume(volumes.master);
      audioRef.current.setMusicVolume(volumes.music);
      audioRef.current.setSfxVolume(volumes.sfx);
      audioRef.current.setMuted(volumes.muted);
      if (engineRef.current) {
        engineRef.current.setAudio(audioRef.current);
      }
    }
    audioRef.current.start();
    audioRef.current.resume();
  };

  const handleSelectPerk = (chosen: Perk) => {
    setActivePerks((prev) => {
      const next = [...prev, chosen];
      if (engineRef.current) {
        engineRef.current.setPerks(next);
      }
      if (next.length >= 3) {
        unlockAchievement("cyber_augmented");
      }
      return next;
    });
    audioRef.current?.playSfx("perk");
    setPerkChoices(null);

    // Continue next wave in engine
    if (engineRef.current) {
      const nextWave = engineRef.current.combat.waveIdx + 1;
      engineRef.current.startWave(nextWave);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(
      canvas,
      ronin,
      {
        onGameOver: (res) => setResult(res),
        onPerkDraft: (choices) => setPerkChoices(choices),
        onGamepadNotice: (name) => {
          setGamepadNotice(`🎮 ${name} CONNECTED`);
          setTimeout(() => setGamepadNotice(null), 4000);
        },
      },
      audioRef.current
    );
    engineRef.current = engine;

    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    const startTimer = setTimeout(() => {
      engine.start();
    }, 300);

    return () => {
      clearTimeout(startTimer);
      window.removeEventListener("resize", handleResize);
      engine.dispose();
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, [ronin]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Gamepad Connected Toast */}
      {gamepadNotice && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 rounded-full border border-cyan-400/50 bg-slate-950/85 px-6 py-2 font-display text-xs font-bold tracking-widest text-cyan-200 shadow-[0_0_25px_rgba(56,189,248,0.4)] backdrop-blur-md animate-fadeIn">
          {gamepadNotice}
        </div>
      )}

      {/* Achievement Unlocked Toasts */}
      <AchievementToast />

      {/* Top Controls Toolbar */}
      <div className="absolute right-4 top-[132px] z-30 flex flex-col gap-2">
        {/* Sound Settings Button */}
        <button
          onClick={() => {
            ensureAudio();
            setShowSound((s) => !s);
          }}
          aria-label="Sound settings"
          title="Sound settings"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-slate-950/70 text-lg backdrop-blur-sm transition-all active:scale-90 ${
            showSound
              ? "border-cyan-300/70 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
              : "border-white/15 hover:border-cyan-300/60"
          }`}
        >
          {volumes.muted ? "🔇" : "🎛️"}
        </button>

        {/* Achievements / Trophy Button */}
        <button
          onClick={() => setShowAchievements(true)}
          aria-label="Trophies & Stats"
          title="Trophies & Stats"
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/15 bg-slate-950/70 text-lg backdrop-blur-sm transition-all hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-90"
        >
          🏆
        </button>

        {/* Mobile Touch Controls Toggle */}
        <button
          onClick={() => setTouchEnabled((t) => !t)}
          aria-label="Toggle Touch Controls"
          title="Toggle Touch Controls"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-slate-950/70 text-lg backdrop-blur-sm transition-all active:scale-90 ${
            touchEnabled
              ? "border-fuchsia-400/70 shadow-[0_0_20px_rgba(232,121,249,0.4)]"
              : "border-white/15 hover:border-fuchsia-400/60"
          }`}
        >
          📱
        </button>
      </div>

      {/* Sound Settings Modal */}
      {showSound && (
        <div className="absolute right-4 top-[184px] z-30 w-64 rounded-2xl border-2 border-pink-400/30 bg-slate-950/85 p-4 shadow-[0_0_40px_rgba(236,72,153,0.3)] backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-sm font-bold tracking-[0.2em] text-cyan-200">SOUND</span>
            <button
              onClick={() => setShowSound(false)}
              className="rounded-md px-1.5 text-slate-400 transition-colors hover:text-cyan-200"
            >
              ✕
            </button>
          </div>
          <VolumeSlider label="Master" value={volumes.master} onChange={(v) => changeVolume("master", v)} />
          <VolumeSlider label="Music" value={volumes.music} onChange={(v) => changeVolume("music", v)} />
          <VolumeSlider label="SFX" value={volumes.sfx} onChange={(v) => changeVolume("sfx", v)} />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={toggleMute}
              className="rounded-lg border-2 border-white/10 bg-white/5 px-3 py-1.5 font-story text-xs text-slate-200 transition-all hover:border-cyan-300/50 active:scale-95"
            >
              {volumes.muted ? "🔇 Muted" : "🔊 Sound on"}
            </button>
            <button
              onClick={() => {
                ensureAudio();
                audioRef.current?.playSfx("parry");
              }}
              className="rounded-lg border-2 border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 font-story text-xs text-fuchsia-200 transition-all hover:border-fuchsia-300/60 active:scale-95"
            >
              Test SFX
            </button>
          </div>
        </div>
      )}

      {/* On-Screen Touch Controls (Mobile / Tablet) */}
      {touchEnabled && (
        <TouchControls
          onMoveX={(val) => engineRef.current?.input.setTouchMovement(val)}
          onAction={(act, isDown) => engineRef.current?.input.triggerTouchAction(act, isDown)}
        />
      )}

      {/* Roguelite Perks Selection Modal (Between Waves) */}
      {perkChoices && (
        <PerkSelectModal perks={perkChoices} onSelect={handleSelectPerk} />
      )}

      {/* Lifetime Achievements & Statistics Modal */}
      {showAchievements && (
        <AchievementsModal onClose={() => setShowAchievements(false)} />
      )}

      {/* Welcome / Controls Help Overlay */}
      {showHelp && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div className="w-full max-w-md rounded-2xl border-2 border-pink-400/40 bg-slate-950/80 p-7 text-center shadow-[0_0_60px_rgba(236,72,153,0.35)]">
            <p className="text-4xl">{ronin.emoji}</p>
            <h2
              className="mt-3 font-display text-2xl font-bold"
              style={{
                background: "linear-gradient(180deg,#fef3c7,#ff4d8a)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Ready, ronin?
            </h2>
            <ul className="mt-5 space-y-1.5 text-left font-story text-lg text-pink-100/90">
              <li>
                <span className="font-sans font-bold text-cyan-300">A / D / Left Stick</span> — move
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">Space / W / (A)</span> — double-jump & wall kick
              </li>
              <li>
                <span className="font-sans font-bold text-amber-300">S + Space / Down + (A)</span> — drop through platforms
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">J / (X)</span> — katana slash (detonates barrels!)
              </li>
              <li>
                <span className="font-sans font-bold text-yellow-300">F / (B)</span> — 🛡️ timed parry & deflect
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">K / (Y)</span> — shuriken
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">L / (LB)</span> — {ronin.specialName}
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">Shift / (RB)</span> — dash (invulnerable)
              </li>
            </ul>
            <p className="mt-4 font-story italic text-pink-200/70">
              Cling to boundary walls to wall-slide and wall-jump! Slash explosive plasma barrels to clear waves.
            </p>
            <button
              onClick={() => {
                ensureAudio();
                setShowHelp(false);
              }}
              className="mt-6 rounded-xl border-2 border-cyan-300/60 bg-gradient-to-b from-pink-500/30 to-fuchsia-900/40 px-8 py-3 font-display font-black tracking-[0.2em] text-cyan-100 transition-all hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] active:scale-95"
            >
              ▶ ENTER THE WASTES
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal */}
      {result && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-pink-400/40 bg-slate-950/85 p-8 text-center shadow-[0_0_60px_rgba(236,72,153,0.35)]">
            <div className="text-6xl">{result.win ? "🏆" : "💀"}</div>
            <h2
              className="mt-4 font-display text-4xl font-black"
              style={{
                background: result.win
                  ? "linear-gradient(180deg,#fef3c7,#ff4d8a)"
                  : "linear-gradient(180deg,#fecaca,#ef4444)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {result.win ? "SHOGUN SLAIN" : "YOU HAVE FALLEN"}
            </h2>
            <p className="mt-3 font-story text-lg text-pink-100/80">
              {result.win
                ? "The wastes belong to your blade. Neon lights flicker in your wake."
                : "The neon grows dim... but every ronin rises again."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
                <p className="font-display text-xl font-bold text-amber-300">{result.score}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Score</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
                <p className="font-display text-xl font-bold text-fuchsia-300">Wave {result.wave}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Reached</p>
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {!result.win && (
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-xl border-2 border-cyan-300/50 bg-gradient-to-b from-pink-500/30 to-fuchsia-900/40 px-6 py-3 font-display font-black tracking-widest text-cyan-100 transition-all hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-95"
                >
                  RISE AGAIN
                </button>
              )}
              {result.win && (
                <button
                  onClick={onRestart}
                  className="rounded-xl border-2 border-cyan-300/50 bg-gradient-to-b from-pink-500/30 to-fuchsia-900/40 px-6 py-3 font-display font-black tracking-widest text-cyan-100 transition-all hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-95"
                >
                  NEW RONIN
                </button>
              )}
              <button
                onClick={onTitle}
                className="rounded-xl border-2 border-white/15 bg-white/5 px-6 py-3 font-display font-bold tracking-widest text-slate-200 transition-all hover:bg-white/10 active:scale-95"
              >
                Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
