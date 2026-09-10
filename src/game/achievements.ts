export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  rarity: "bronze" | "silver" | "gold" | "cyber";
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: "first_blood",
    title: "First Blood",
    desc: "Slay 10 enemies in the neon wastes.",
    icon: "⚔️",
    rarity: "bronze",
  },
  {
    id: "blade_reflection",
    title: "Mirror Edge",
    desc: "Deflect an enemy projectile back with a timed parry.",
    icon: "🛡️",
    rarity: "silver",
  },
  {
    id: "triple_parry",
    title: "Untouchable Ronin",
    desc: "Execute 3 perfect parries in a single combat wave.",
    icon: "⚡",
    rarity: "gold",
  },
  {
    id: "style_s",
    title: "Neon Phantom",
    desc: "Achieve Style Rank 'S' in combat.",
    icon: "💠",
    rarity: "silver",
  },
  {
    id: "neon_god",
    title: "NEON GOD",
    desc: "Attain the supreme Style Rank 'SSS / NEON GOD'.",
    icon: "👑",
    rarity: "cyber",
  },
  {
    id: "cyber_augmented",
    title: "Chrome & Steel",
    desc: "Equip 3 or more cyberware perks in one run.",
    icon: "🦾",
    rarity: "silver",
  },
  {
    id: "flawless_wave",
    title: "Ghost Runner",
    desc: "Clear a complete combat wave without suffering any damage.",
    icon: "👻",
    rarity: "gold",
  },
  {
    id: "shogun_slayer",
    title: "Shogun Slain",
    desc: "Fell the formidable Shogun Ashi-Garu.",
    icon: "👺",
    rarity: "gold",
  },
  {
    id: "waste_baron",
    title: "Waste Tycoon",
    desc: "Accumulate 200 gold in a single run.",
    icon: "🪙",
    rarity: "bronze",
  },
  {
    id: "grand_master",
    title: "Wastes Conqueror",
    desc: "Clear all 10 waves and conquer the neon wastes.",
    icon: "🏆",
    rarity: "cyber",
  },
];

export interface PlayerStats {
  totalKills: number;
  totalParries: number;
  highestScore: number;
  highestWave: number;
  totalRuns: number;
  unlockedAchievements: string[];
}

const STORAGE_KEY = "nr_player_stats_v1";

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalKills: parsed.totalKills ?? 0,
        totalParries: parsed.totalParries ?? 0,
        highestScore: parsed.highestScore ?? 0,
        highestWave: parsed.highestWave ?? 0,
        totalRuns: parsed.totalRuns ?? 0,
        unlockedAchievements: parsed.unlockedAchievements ?? [],
      };
    }
  } catch (err) {
    console.error("Failed to load player stats", err);
  }
  return {
    totalKills: 0,
    totalParries: 0,
    highestScore: 0,
    highestWave: 0,
    totalRuns: 0,
    unlockedAchievements: [],
  };
}

export function saveStats(stats: PlayerStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error("Failed to save player stats", err);
  }
}

type UnlockCallback = (ach: Achievement) => void;
const unlockListeners = new Set<UnlockCallback>();

export function onAchievementUnlocked(cb: UnlockCallback) {
  unlockListeners.add(cb);
  return () => unlockListeners.delete(cb);
}

export function unlockAchievement(id: string): boolean {
  const stats = loadStats();
  if (stats.unlockedAchievements.includes(id)) return false;

  const def = ACHIEVEMENTS_LIST.find((a) => a.id === id);
  if (!def) return false;

  stats.unlockedAchievements.push(id);
  saveStats(stats);

  unlockListeners.forEach((cb) => cb(def));
  return true;
}

export function recordRunResult(score: number, wave: number, kills: number, parries: number) {
  const stats = loadStats();
  stats.totalRuns++;
  stats.totalKills += kills;
  stats.totalParries += parries;
  if (score > stats.highestScore) stats.highestScore = score;
  if (wave > stats.highestWave) stats.highestWave = wave;
  saveStats(stats);
}
