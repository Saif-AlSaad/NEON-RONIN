import type { EnemyDef, Ronin, Wave } from "../types";

export const RONIN: Ronin[] = [
  {
    id: "kaze",
    name: "Kaze",
    title: "Wind of the Wastes",
    emoji: "🌬️",
    gradient: "from-cyan-400/30 via-sky-500/30 to-indigo-600/40",
    accent: "text-cyan-300",
    blurb: "Lightning-fast and almost weightless, Kaze dances between blades, cutting down foes before they can blink.",
    stats: {
      maxHp: 85, maxEnergy: 100, speed: 280, jumpPower: 680,
      meleeDmg: 14, shurikenDmg: 9, attackCd: 0.22, shurikenCost: 12, dashCd: 0.9,
    },
    specialName: "Crimson Slash",
    specialCost: 40,
  },
  {
    id: "kaminari",
    name: "Kaminari",
    title: "Thunder Fist",
    emoji: "⚡",
    gradient: "from-fuchsia-400/30 via-purple-500/30 to-violet-600/40",
    accent: "text-fuchsia-300",
    blurb: "A balanced storm of blade and shuriken. Kaminari plays the long game, wearing enemies down with every tool.",
    stats: {
      maxHp: 110, maxEnergy: 120, speed: 240, jumpPower: 640,
      meleeDmg: 18, shurikenDmg: 13, attackCd: 0.28, shurikenCost: 10, dashCd: 1.1,
    },
    specialName: "Storm Shuriken",
    specialCost: 50,
  },
  {
    id: "tetsu",
    name: "Tetsu",
    title: "Iron Demon",
    emoji: "🗡️",
    gradient: "from-rose-400/30 via-red-500/30 to-orange-600/40",
    accent: "text-rose-300",
    blurb: "A walking fortress. Slow and deliberate, but Tetsu's katana strikes like a landslide.",
    stats: {
      maxHp: 150, maxEnergy: 80, speed: 205, jumpPower: 580,
      meleeDmg: 26, shurikenDmg: 11, attackCd: 0.36, shurikenCost: 15, dashCd: 1.3,
    },
    specialName: "Earthcleaver",
    specialCost: 45,
  },
];

export const ENEMIES: Record<string, EnemyDef> = {
  grunt: {
    id: "grunt", name: "Waste Raider", emoji: "🥷",
    color: "#ff5bd0", accent: "#ffd1f0",
    maxHp: 28, speed: 110, size: { w: 26, h: 48 }, dmg: 8, gold: 8,
    behavior: "grunt", meleeRange: 40,
  },
  archer: {
    id: "archer", name: "Shinobi Archer", emoji: "🏹",
    color: "#5ce1e6", accent: "#c6f7fa",
    maxHp: 22, speed: 80, size: { w: 26, h: 48 }, dmg: 10, gold: 10,
    behavior: "archer", shootCd: 2.2, shootRange: 520, projectileSpeed: 420,
  },
  brute: {
    id: "brute", name: "Oni Brute", emoji: "👹",
    color: "#ffb347", accent: "#ffe0b0",
    maxHp: 80, speed: 70, size: { w: 40, h: 58 }, dmg: 18, gold: 22,
    behavior: "brute", meleeRange: 50,
  },
  boss: {
    id: "boss", name: "Shogun Ashi-Garu", emoji: "👺",
    color: "#ff4d4d", accent: "#ffd0d0",
    maxHp: 380, speed: 120, size: { w: 56, h: 78 }, dmg: 22, gold: 120,
    behavior: "boss", meleeRange: 70, shootCd: 2.8, shootRange: 700, projectileSpeed: 520,
  },
};

export const WAVES: Wave[] = [
  { enemies: [{ id: "grunt", count: 3 }], name: "Wave I" },
  { enemies: [{ id: "grunt", count: 4 }, { id: "archer", count: 1 }], name: "Wave II" },
  { enemies: [{ id: "archer", count: 3 }, { id: "grunt", count: 2 }], name: "Wave III" },
  { enemies: [{ id: "grunt", count: 3 }, { id: "brute", count: 1 }], name: "Wave IV" },
  { enemies: [{ id: "boss", count: 1 }], isBoss: true, name: "BOSS — Shogun Ashi-Garu" },
  { enemies: [{ id: "brute", count: 2 }, { id: "archer", count: 2 }], name: "Wave VI" },
  { enemies: [{ id: "grunt", count: 6 }, { id: "brute", count: 1 }], name: "Wave VII" },
  { enemies: [{ id: "archer", count: 4 }, { id: "brute", count: 2 }], name: "Wave VIII" },
  { enemies: [{ id: "grunt", count: 4 }, { id: "brute", count: 2 }, { id: "archer", count: 2 }], name: "Wave IX" },
  { enemies: [{ id: "boss", count: 1 }], isBoss: true, name: "FINAL BOSS — Shogun Ashi-Garu" },
];
