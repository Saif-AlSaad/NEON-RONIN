export interface MetaUpgradeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  maxTier: number;
  costs: number[]; // cost per tier (1 to maxTier)
  bonusPerTier: number;
  unit: string;
  effectType: "hp" | "energy" | "speed" | "parry" | "gold" | "damage";
}

export const META_UPGRADES: MetaUpgradeDef[] = [
  {
    id: "nanite_weave",
    name: "Nanite Weave",
    desc: "Reinforces cellular structure, permanently boosting maximum vitality.",
    icon: "🧬",
    maxTier: 3,
    costs: [35, 75, 140],
    bonusPerTier: 15,
    unit: "HP",
    effectType: "hp",
  },
  {
    id: "capacitor_overclock",
    name: "Capacitor Overclock",
    desc: "Expands the cybernetic power core for sustained ability deployment.",
    icon: "🔋",
    maxTier: 3,
    costs: [30, 65, 120],
    bonusPerTier: 20,
    unit: "Energy",
    effectType: "energy",
  },
  {
    id: "kinetic_actuators",
    name: "Kinetic Actuators",
    desc: "Overdrives prosthetic joints for increased sprint and dash velocity.",
    icon: "⚡",
    maxTier: 3,
    costs: [40, 85, 150],
    bonusPerTier: 7,
    unit: "% Speed",
    effectType: "speed",
  },
  {
    id: "tachyon_core",
    name: "Tachyon Deflector",
    desc: "Dilates temporal perception during parry stance, widening the deflection window.",
    icon: "🛡️",
    maxTier: 3,
    costs: [50, 110, 180],
    bonusPerTier: 0.05,
    unit: "s Parry Window",
    effectType: "parry",
  },
  {
    id: "hyper_strike",
    name: "Monomolecular Edge",
    desc: "Hones the katana blade to molecular thickness, amplifying melee damage.",
    icon: "⚔️",
    maxTier: 3,
    costs: [45, 95, 160],
    bonusPerTier: 10,
    unit: "% Melee Dmg",
    effectType: "damage",
  },
  {
    id: "void_siphon",
    name: "Waste Scavenger",
    desc: "Extracts valuable scrap on deployment, starting each run with bonus gold.",
    icon: "🪙",
    maxTier: 3,
    costs: [25, 55, 100],
    bonusPerTier: 25,
    unit: "Starting Gold",
    effectType: "gold",
  },
];

export interface BladeStanceDef {
  id: string;
  name: string;
  desc: string;
  cost: number;
  primaryColor: string;
  glowColor: string;
  trailColor: string;
}

export const BLADE_STANCES: BladeStanceDef[] = [
  {
    id: "cyan_pulse",
    name: "Cyan Pulse",
    desc: "The classic neon blade of the Ronin.",
    cost: 0,
    primaryColor: "#e0f2fe",
    glowColor: "#06b6d4",
    trailColor: "#67e8f9",
  },
  {
    id: "crimson_fury",
    name: "Crimson Fury",
    desc: "Forged in the blood fires of the Shogun's war.",
    cost: 60,
    primaryColor: "#fee2e2",
    glowColor: "#ef4444",
    trailColor: "#f87171",
  },
  {
    id: "emerald_matrix",
    name: "Emerald Matrix",
    desc: "Infused with corrosive military nanites.",
    cost: 80,
    primaryColor: "#dcfce7",
    glowColor: "#10b981",
    trailColor: "#34d399",
  },
  {
    id: "solar_radiance",
    name: "Solar Radiance",
    desc: "Blazing with thermal plasma energy.",
    cost: 110,
    primaryColor: "#fef3c7",
    glowColor: "#f59e0b",
    trailColor: "#fbbf24",
  },
  {
    id: "void_singularity",
    name: "Void Singularity",
    desc: "Harnessing the dark matter of the orbital rift.",
    cost: 150,
    primaryColor: "#f3e8ff",
    glowColor: "#a855f7",
    trailColor: "#c084fc",
  },
];

export interface MetaState {
  neonShards: number;
  upgrades: Record<string, number>; // upgradeId -> tier (0 to maxTier)
  unlockedBlades: string[];
  activeBlade: string;
}

const META_STORAGE_KEY = "nr_meta_progression_v1";

export function loadMetaState(): MetaState {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        neonShards: parsed.neonShards ?? 0,
        upgrades: parsed.upgrades ?? {},
        unlockedBlades: parsed.unlockedBlades ?? ["cyan_pulse"],
        activeBlade: parsed.activeBlade ?? "cyan_pulse",
      };
    }
  } catch (err) {
    console.error("Failed to load meta progression", err);
  }
  return {
    neonShards: 0,
    upgrades: {},
    unlockedBlades: ["cyan_pulse"],
    activeBlade: "cyan_pulse",
  };
}

export function saveMetaState(state: MetaState): void {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save meta progression", err);
  }
}

export function addNeonShards(amount: number): number {
  const state = loadMetaState();
  state.neonShards += Math.max(0, Math.round(amount));
  saveMetaState(state);
  return state.neonShards;
}

export function purchaseMetaUpgrade(upgradeId: string): { success: boolean; newState: MetaState; error?: string } {
  const state = loadMetaState();
  const def = META_UPGRADES.find((u) => u.id === upgradeId);
  if (!def) return { success: false, newState: state, error: "Upgrade not found" };

  const currentTier = state.upgrades[upgradeId] ?? 0;
  if (currentTier >= def.maxTier) {
    return { success: false, newState: state, error: "Already at maximum tier" };
  }

  const cost = def.costs[currentTier];
  if (state.neonShards < cost) {
    return { success: false, newState: state, error: "Insufficient Neon Shards" };
  }

  state.neonShards -= cost;
  state.upgrades[upgradeId] = currentTier + 1;
  saveMetaState(state);
  return { success: true, newState: state };
}

export function unlockBladeStance(bladeId: string): { success: boolean; newState: MetaState; error?: string } {
  const state = loadMetaState();
  const def = BLADE_STANCES.find((b) => b.id === bladeId);
  if (!def) return { success: false, newState: state, error: "Blade not found" };

  if (state.unlockedBlades.includes(bladeId)) {
    state.activeBlade = bladeId;
    saveMetaState(state);
    return { success: true, newState: state };
  }

  if (state.neonShards < def.cost) {
    return { success: false, newState: state, error: "Insufficient Neon Shards" };
  }

  state.neonShards -= def.cost;
  state.unlockedBlades.push(bladeId);
  state.activeBlade = bladeId;
  saveMetaState(state);
  return { success: true, newState: state };
}

export interface AggregatedMetaBonus {
  bonusMaxHp: number;
  bonusMaxEnergy: number;
  bonusSpeedPercent: number;
  bonusParryWindow: number;
  bonusMeleeDmgPercent: number;
  startingGold: number;
  bladeStance: BladeStanceDef;
}

export function getAggregatedMetaBonus(): AggregatedMetaBonus {
  const state = loadMetaState();
  let bonusMaxHp = 0;
  let bonusMaxEnergy = 0;
  let bonusSpeedPercent = 0;
  let bonusParryWindow = 0;
  let bonusMeleeDmgPercent = 0;
  let startingGold = 0;

  for (const def of META_UPGRADES) {
    const tier = state.upgrades[def.id] ?? 0;
    if (tier <= 0) continue;
    const val = tier * def.bonusPerTier;
    if (def.effectType === "hp") bonusMaxHp += val;
    else if (def.effectType === "energy") bonusMaxEnergy += val;
    else if (def.effectType === "speed") bonusSpeedPercent += val;
    else if (def.effectType === "parry") bonusParryWindow += val;
    else if (def.effectType === "damage") bonusMeleeDmgPercent += val;
    else if (def.effectType === "gold") startingGold += val;
  }

  const bladeStance =
    BLADE_STANCES.find((b) => b.id === state.activeBlade) ?? BLADE_STANCES[0];

  return {
    bonusMaxHp,
    bonusMaxEnergy,
    bonusSpeedPercent,
    bonusParryWindow,
    bonusMeleeDmgPercent,
    startingGold,
    bladeStance,
  };
}
