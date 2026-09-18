import { loadStats, saveStats, type PlayerStats } from "./achievements";
import { loadMetaState, saveMetaState, type MetaState } from "./meta";

export interface GameSettings {
  shakeIntensity: number; // 0 to 1
  screenFlashEnabled: boolean;
  highContrast: boolean;
  rumbleEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

const SETTINGS_KEY = "nr_game_settings_v1";

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        shakeIntensity: typeof parsed.shakeIntensity === "number" ? parsed.shakeIntensity : 1.0,
        screenFlashEnabled: parsed.screenFlashEnabled ?? true,
        highContrast: parsed.highContrast ?? false,
        rumbleEnabled: parsed.rumbleEnabled ?? true,
        masterVolume: typeof parsed.masterVolume === "number" ? parsed.masterVolume : 0.9,
        musicVolume: typeof parsed.musicVolume === "number" ? parsed.musicVolume : 1.0,
        sfxVolume: typeof parsed.sfxVolume === "number" ? parsed.sfxVolume : 0.55,
        muted: parsed.muted ?? false,
      };
    }
  } catch (err) {
    console.error("Failed to load settings", err);
  }
  return {
    shakeIntensity: 1.0,
    screenFlashEnabled: true,
    highContrast: false,
    rumbleEnabled: true,
    masterVolume: 0.9,
    musicVolume: 1.0,
    sfxVolume: 0.55,
    muted: false,
  };
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings", err);
  }
}

export interface BackupData {
  version: 1;
  timestamp: string;
  stats: PlayerStats;
  meta: MetaState;
  settings: GameSettings;
}

export function exportFullSaveJson(): string {
  const backup: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    stats: loadStats(),
    meta: loadMetaState(),
    settings: loadSettings(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importFullSaveJson(rawJson: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || parsed.version !== 1 || !parsed.stats || !parsed.meta) {
      return { success: false, error: "Invalid backup format or incompatible version." };
    }
    saveStats(parsed.stats);
    saveMetaState(parsed.meta);
    if (parsed.settings) saveSettings(parsed.settings);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to parse JSON backup" };
  }
}

export function wipeAllGameData(): void {
  localStorage.removeItem("nr_player_stats_v1");
  localStorage.removeItem("nr_meta_progression_v1");
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem("nr_master");
  localStorage.removeItem("nr_music");
  localStorage.removeItem("nr_sfx");
  localStorage.removeItem("nr_muted");
}
