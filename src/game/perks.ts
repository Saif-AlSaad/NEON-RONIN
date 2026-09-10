export type PerkRarity = "common" | "rare" | "legendary";

export interface Perk {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  rarity: PerkRarity;
  description: string;
  accent: string;
  border: string;
  bgGlow: string;
  effect: {
    bonusMeleeDmgPercent?: number;
    bonusMaxHp?: number;
    bonusEnergy?: number;
    bonusSpeedPercent?: number;
    bonusJumpPercent?: number;
    bonusShurikenDmgPercent?: number;
    reducedDashCd?: number;
    reducedAttackCd?: number;
    parryWindowBonus?: number;
    parryDmgMultiplier?: number;
    lifestealOnKill?: number;
    bleedDmgOnHit?: number;
    plasmaDashTrail?: boolean;
    thunderDash?: boolean;
    critChance?: number;
    critMultiplier?: number;
    shurikenPierce?: boolean;
    shurikenSpeedBonus?: number;
    kineticBattery?: boolean;
    bonusEnergyRegen?: number;
  };
}

export const PERKS_DATABASE: Perk[] = [
  {
    id: "nanite_blade",
    name: "Nanite Blade",
    tagline: "Corrosive Bio-Tech",
    icon: "🩸",
    rarity: "rare",
    description: "Katana attacks coat foes in nanites, inflicting 15 bleed damage over 3 seconds.",
    accent: "#f43f5e",
    border: "border-rose-500/50",
    bgGlow: "shadow-[0_0_30px_rgba(244,63,94,0.3)]",
    effect: { bleedDmgOnHit: 15 },
  },
  {
    id: "kinetic_battery",
    name: "Kinetic Battery",
    tagline: "Energy Reclamation",
    icon: "⚡",
    rarity: "legendary",
    description: "Perfect parries immediately restore 100% of your energy and grant instant momentum.",
    accent: "#38bdf8",
    border: "border-cyan-400/60",
    bgGlow: "shadow-[0_0_35px_rgba(56,189,248,0.4)]",
    effect: { kineticBattery: true, bonusEnergy: 20 },
  },
  {
    id: "plasma_thruster",
    name: "Plasma Thrusters",
    tagline: "Exhaust Overcharge",
    icon: "🔥",
    rarity: "rare",
    description: "Dashing leaves an incinerating plasma trail behind you that burns pursuing enemies.",
    accent: "#06b6d4",
    border: "border-cyan-500/50",
    bgGlow: "shadow-[0_0_30px_rgba(6,182,212,0.35)]",
    effect: { plasmaDashTrail: true, reducedDashCd: 0.15 },
  },
  {
    id: "deflector_core",
    name: "Deflector Core",
    tagline: "Sub-Atomic Mirror",
    icon: "🛡️",
    rarity: "legendary",
    description: "Increases Parry Window by +40%. Reflected enemy projectiles deal +100% bonus damage.",
    accent: "#fbbf24",
    border: "border-amber-400/60",
    bgGlow: "shadow-[0_0_35px_rgba(251,191,36,0.4)]",
    effect: { parryWindowBonus: 0.08, parryDmgMultiplier: 2.0 },
  },
  {
    id: "vampiric_matrix",
    name: "Vampiric Matrix",
    tagline: "Siphon Protocol",
    icon: "💉",
    rarity: "rare",
    description: "Siphon vital fluids upon slaying a target, immediately healing 6 HP.",
    accent: "#ec4899",
    border: "border-pink-500/50",
    bgGlow: "shadow-[0_0_30px_rgba(236,72,153,0.3)]",
    effect: { lifestealOnKill: 6 },
  },
  {
    id: "cyclone_shuriken",
    name: "Cyclone Shuriken",
    tagline: "Aerodynamic Micro-Fins",
    icon: "🌀",
    rarity: "common",
    description: "Shurikens pierce through all enemies and fly 40% faster with +25% damage.",
    accent: "#a855f7",
    border: "border-purple-500/40",
    bgGlow: "shadow-[0_0_25px_rgba(168,85,247,0.25)]",
    effect: { shurikenPierce: true, shurikenSpeedBonus: 280, bonusShurikenDmgPercent: 25 },
  },
  {
    id: "critical_overdrive",
    name: "Critical Overdrive",
    tagline: "Precision Subroutines",
    icon: "🎯",
    rarity: "legendary",
    description: "Grants a 25% chance on any attack to unleash a brutal 2.5x Critical Strike.",
    accent: "#ef4444",
    border: "border-red-500/60",
    bgGlow: "shadow-[0_0_35px_rgba(239,68,68,0.4)]",
    effect: { critChance: 0.25, critMultiplier: 2.5 },
  },
  {
    id: "thunder_step",
    name: "Thunder Step",
    tagline: "Electrified Coil",
    icon: "⚡",
    rarity: "rare",
    description: "Dashing directly through foes shocks them for 20 electric damage and heavy knockback.",
    accent: "#e879f9",
    border: "border-fuchsia-400/50",
    bgGlow: "shadow-[0_0_30px_rgba(232,121,249,0.35)]",
    effect: { thunderDash: true },
  },
  {
    id: "hydraulic_greaves",
    name: "Hydraulic Greaves",
    tagline: "Pneumatic Suspension",
    icon: "🚀",
    rarity: "common",
    description: "+18% Movement Speed and +14% Jump Velocity. Feel weightless in the arena.",
    accent: "#2dd4bf",
    border: "border-teal-400/40",
    bgGlow: "shadow-[0_0_25px_rgba(45,212,191,0.25)]",
    effect: { bonusSpeedPercent: 18, bonusJumpPercent: 14 },
  },
  {
    id: "reinforced_alloy",
    name: "Reinforced Alloy",
    tagline: "Carbon Weave Shell",
    icon: "🦾",
    rarity: "common",
    description: "+35 Maximum HP and instantly restores 35 Health upon acquisition.",
    accent: "#10b981",
    border: "border-emerald-500/40",
    bgGlow: "shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    effect: { bonusMaxHp: 35 },
  },
  {
    id: "hyper_reactor",
    name: "Hyper Reactor",
    tagline: "Zero-Point Catalyst",
    icon: "🔋",
    rarity: "common",
    description: "+30 Max Energy and +60% passive Energy recovery rate.",
    accent: "#38bdf8",
    border: "border-sky-400/40",
    bgGlow: "shadow-[0_0_25px_rgba(56,189,248,0.25)]",
    effect: { bonusEnergy: 30, bonusEnergyRegen: 8 },
  },
  {
    id: "executioner_edge",
    name: "Executioner Edge",
    tagline: "Monofilament Edge",
    icon: "⚔️",
    rarity: "rare",
    description: "+30% Blade Damage and +15% faster katana swing recovery.",
    accent: "#fb923c",
    border: "border-orange-500/50",
    bgGlow: "shadow-[0_0_30px_rgba(251,146,60,0.3)]",
    effect: { bonusMeleeDmgPercent: 30, reducedAttackCd: 0.05 },
  },
];

export function drawPerkOptions(count = 3, ownedIds: string[] = []): Perk[] {
  const available = PERKS_DATABASE.filter((p) => !ownedIds.includes(p.id));
  const pool = available.length >= count ? available : PERKS_DATABASE;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export interface AggregatedPerks {
  bonusMeleeDmgPercent: number;
  bonusMaxHp: number;
  bonusEnergy: number;
  bonusSpeedPercent: number;
  bonusJumpPercent: number;
  bonusShurikenDmgPercent: number;
  reducedDashCd: number;
  reducedAttackCd: number;
  parryWindowBonus: number;
  parryDmgMultiplier: number;
  lifestealOnKill: number;
  bleedDmgOnHit: number;
  plasmaDashTrail: boolean;
  thunderDash: boolean;
  critChance: number;
  critMultiplier: number;
  shurikenPierce: boolean;
  shurikenSpeedBonus: number;
  kineticBattery: boolean;
  bonusEnergyRegen: number;
}

export function aggregatePerks(perks: Perk[]): AggregatedPerks {
  const result: AggregatedPerks = {
    bonusMeleeDmgPercent: 0,
    bonusMaxHp: 0,
    bonusEnergy: 0,
    bonusSpeedPercent: 0,
    bonusJumpPercent: 0,
    bonusShurikenDmgPercent: 0,
    reducedDashCd: 0,
    reducedAttackCd: 0,
    parryWindowBonus: 0,
    parryDmgMultiplier: 1.0,
    lifestealOnKill: 0,
    bleedDmgOnHit: 0,
    plasmaDashTrail: false,
    thunderDash: false,
    critChance: 0,
    critMultiplier: 2.0,
    shurikenPierce: false,
    shurikenSpeedBonus: 0,
    kineticBattery: false,
    bonusEnergyRegen: 0,
  };

  for (const p of perks) {
    const ef = p.effect;
    if (ef.bonusMeleeDmgPercent) result.bonusMeleeDmgPercent += ef.bonusMeleeDmgPercent;
    if (ef.bonusMaxHp) result.bonusMaxHp += ef.bonusMaxHp;
    if (ef.bonusEnergy) result.bonusEnergy += ef.bonusEnergy;
    if (ef.bonusSpeedPercent) result.bonusSpeedPercent += ef.bonusSpeedPercent;
    if (ef.bonusJumpPercent) result.bonusJumpPercent += ef.bonusJumpPercent;
    if (ef.bonusShurikenDmgPercent) result.bonusShurikenDmgPercent += ef.bonusShurikenDmgPercent;
    if (ef.reducedDashCd) result.reducedDashCd += ef.reducedDashCd;
    if (ef.reducedAttackCd) result.reducedAttackCd += ef.reducedAttackCd;
    if (ef.parryWindowBonus) result.parryWindowBonus += ef.parryWindowBonus;
    if (ef.parryDmgMultiplier) result.parryDmgMultiplier = Math.max(result.parryDmgMultiplier, ef.parryDmgMultiplier);
    if (ef.lifestealOnKill) result.lifestealOnKill += ef.lifestealOnKill;
    if (ef.bleedDmgOnHit) result.bleedDmgOnHit += ef.bleedDmgOnHit;
    if (ef.plasmaDashTrail) result.plasmaDashTrail = true;
    if (ef.thunderDash) result.thunderDash = true;
    if (ef.critChance) result.critChance += ef.critChance;
    if (ef.critMultiplier) result.critMultiplier = Math.max(result.critMultiplier, ef.critMultiplier);
    if (ef.shurikenPierce) result.shurikenPierce = true;
    if (ef.shurikenSpeedBonus) result.shurikenSpeedBonus += ef.shurikenSpeedBonus;
    if (ef.kineticBattery) result.kineticBattery = true;
    if (ef.bonusEnergyRegen) result.bonusEnergyRegen += ef.bonusEnergyRegen;
  }

  return result;
}
