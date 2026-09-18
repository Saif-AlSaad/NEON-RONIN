import React, { useState } from "react";
import {
  loadSettings,
  saveSettings,
  exportFullSaveJson,
  importFullSaveJson,
  wipeAllGameData,
  type GameSettings,
} from "../game/settings";

interface Props {
  onClose: () => void;
  onVolumeChange?: (key: "master" | "music" | "sfx", val: number) => void;
}

export default function SettingsModal({ onClose, onVolumeChange }: Props) {
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    saveSettings(updated);

    if (key === "masterVolume" || key === "musicVolume" || key === "sfxVolume") {
      const volKey = key === "masterVolume" ? "master" : key === "musicVolume" ? "music" : "sfx";
      onVolumeChange?.(volKey, val as number);
    }
  };

  const handleExport = () => {
    try {
      const json = exportFullSaveJson();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neon-ronin-save-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("💾 SAVE FILE EXPORTED SUCCESSFULLY");
    } catch {
      showToast("⚠️ Failed to export save file");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importFullSaveJson(content);
      if (res.success) {
        showToast("📂 SAVE FILE RESTORED! RELOADING...");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(`⚠️ ${res.error || "Failed to parse save file"}`);
      }
    };
    reader.readAsText(file);
  };

  const handleWipe = () => {
    wipeAllGameData();
    showToast("⚠️ ALL DATA RESET. RELOADING...");
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border-2 border-pink-400/40 bg-slate-950/90 shadow-[0_0_80px_rgba(236,72,153,0.35)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-400/20 bg-pink-950/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h2 className="font-display text-2xl font-black tracking-widest text-pink-200">
                SETTINGS & ACCESSIBILITY
              </h2>
              <p className="font-story text-xs text-pink-200/70">
                Configure gameplay accessibility, haptics, audio, and save data.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toast */}
        {notice && (
          <div className="bg-cyan-500/20 px-6 py-2 text-center font-display text-xs font-bold tracking-widest text-cyan-200 animate-pulse">
            {notice}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Accessibility */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
            <h3 className="font-display text-sm font-bold tracking-widest text-cyan-300">
              👁️ ACCESSIBILITY & COMFORT
            </h3>

            {/* Screen Shake Slider */}
            <div>
              <div className="flex justify-between text-xs font-story mb-1.5">
                <span className="text-slate-300">Camera Shake Intensity</span>
                <span className="text-cyan-300 font-sans font-bold">
                  {Math.round(settings.shakeIntensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.shakeIntensity}
                onChange={(e) => updateSetting("shakeIntensity", parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Flashing Lights Toggle (Photosensitivity) */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-display text-xs font-bold text-slate-200">
                  Screen Flash Effects
                </p>
                <p className="font-story text-[11px] text-slate-400">
                  Disable white screen flashes for photosensitive & epilepsy comfort.
                </p>
              </div>
              <button
                onClick={() => updateSetting("screenFlashEnabled", !settings.screenFlashEnabled)}
                className={`rounded-xl px-4 py-1.5 font-display text-xs font-bold transition-all ${
                  settings.screenFlashEnabled
                    ? "border border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border border-white/20 bg-slate-800/40 text-slate-400"
                }`}
              >
                {settings.screenFlashEnabled ? "ENABLED" : "DISABLED (SAFE)"}
              </button>
            </div>

            {/* High Contrast HUD */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-display text-xs font-bold text-slate-200">
                  High Contrast HUD
                </p>
                <p className="font-story text-[11px] text-slate-400">
                  Increase opacity and borders on combat meters for visibility.
                </p>
              </div>
              <button
                onClick={() => updateSetting("highContrast", !settings.highContrast)}
                className={`rounded-xl px-4 py-1.5 font-display text-xs font-bold transition-all ${
                  settings.highContrast
                    ? "border border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border border-white/20 bg-slate-800/40 text-slate-400"
                }`}
              >
                {settings.highContrast ? "ON" : "OFF"}
              </button>
            </div>

            {/* Gamepad Rumble */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-display text-xs font-bold text-slate-200">
                  Gamepad Vibration (Rumble)
                </p>
                <p className="font-story text-[11px] text-slate-400">
                  Controller dual-rumble haptics on hits, parries, and dashes.
                </p>
              </div>
              <button
                onClick={() => updateSetting("rumbleEnabled", !settings.rumbleEnabled)}
                className={`rounded-xl px-4 py-1.5 font-display text-xs font-bold transition-all ${
                  settings.rumbleEnabled
                    ? "border border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200"
                    : "border border-white/20 bg-slate-800/40 text-slate-400"
                }`}
              >
                {settings.rumbleEnabled ? "ENABLED" : "OFF"}
              </button>
            </div>
          </div>

          {/* Section 2: Audio Sliders */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
            <h3 className="font-display text-sm font-bold tracking-widest text-fuchsia-300">
              🔊 AUDIO MIXER
            </h3>
            <div>
              <div className="flex justify-between text-xs font-story mb-1.5">
                <span className="text-slate-300">Master Volume</span>
                <span className="text-fuchsia-300 font-sans font-bold">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={settings.masterVolume}
                onChange={(e) => updateSetting("masterVolume", parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-fuchsia-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-story mb-1.5">
                <span className="text-slate-300">Synthwave Music</span>
                <span className="text-fuchsia-300 font-sans font-bold">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={settings.musicVolume}
                onChange={(e) => updateSetting("musicVolume", parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-fuchsia-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-story mb-1.5">
                <span className="text-slate-300">Sound Effects (SFX)</span>
                <span className="text-fuchsia-300 font-sans font-bold">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={settings.sfxVolume}
                onChange={(e) => updateSetting("sfxVolume", parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-fuchsia-400"
              />
            </div>
          </div>

          {/* Section 3: Commercial Cloud & Save Management */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
            <h3 className="font-display text-sm font-bold tracking-widest text-amber-300">
              💾 SAVE & PROFILE MANAGEMENT
            </h3>
            <p className="font-story text-xs text-slate-400">
              Backup your trophies, lifetime stats, and Cyber-Dojo augments to a JSON file, or transfer them between devices.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-500/20 px-4 py-2 font-display text-xs font-bold text-cyan-200 transition-all hover:bg-cyan-500/30 active:scale-95"
              >
                <span>💾</span> EXPORT BACKUP JSON
              </button>

              <label className="flex items-center gap-2 rounded-xl border border-pink-400/60 bg-pink-500/20 px-4 py-2 font-display text-xs font-bold text-pink-200 transition-all hover:bg-pink-500/30 active:scale-95 cursor-pointer">
                <span>📂</span> IMPORT BACKUP
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              {!confirmWipe ? (
                <button
                  onClick={() => setConfirmWipe(true)}
                  className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-2 font-display text-xs font-bold text-red-300 transition-all hover:bg-red-900/40 active:scale-95"
                >
                  ⚠️ RESET PROGRESS
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleWipe}
                    className="rounded-xl border border-red-500 bg-red-600 px-3 py-1.5 font-display text-xs font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] active:scale-95"
                  >
                    CONFIRM RESET
                  </button>
                  <button
                    onClick={() => setConfirmWipe(false)}
                    className="rounded-xl border border-white/20 px-3 py-1.5 font-display text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-950/60 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 font-display text-sm font-bold tracking-wider text-slate-200 transition-all hover:bg-white/10 active:scale-95"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}
