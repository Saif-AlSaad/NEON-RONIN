export interface SectorDef {
  id: number;
  name: string;
  subtitle: string;
  biome: string;
  description: string;
  themeColor: string;
  accentColor: string;
  startLevel: number;
  endLevel: number;
  checkpointLevel: number;
  bossLevel: number;
  bossName: string;
}

export const SECTORS: SectorDef[] = [
  {
    id: 1,
    name: "Sector 01: Neon Underbelly",
    subtitle: "Drenched Alleys & Low-Life Hideouts",
    biome: "neon_slums",
    description: "The neon-soaked gutter of Neo-Edo where scrap-mercenaries and renegade ronin clash in perpetual rainfall.",
    themeColor: "#06b6d4",
    accentColor: "#38bdf8",
    startLevel: 1,
    endLevel: 10,
    checkpointLevel: 1,
    bossLevel: 10,
    bossName: "Shinobi Lieutenant Kuro",
  },
  {
    id: 2,
    name: "Sector 02: Smog Foundry",
    subtitle: "Steam-Belching Assembly Lines",
    biome: "industrial_foundry",
    description: "Vast manufacturing hubs spitting molten steel, hydraulic presses, and weaponized assembly drones.",
    themeColor: "#f97316",
    accentColor: "#fb923c",
    startLevel: 11,
    endLevel: 20,
    checkpointLevel: 11,
    bossLevel: 20,
    bossName: "Iron Forge Overseer",
  },
  {
    id: 3,
    name: "Sector 03: Data Nexus",
    subtitle: "Fiber-Optic Skyways & Cyber Grids",
    biome: "cyber_highway",
    description: "Floating light-ribbons and pulsing server monoliths guarded by encrypted defense protocols.",
    themeColor: "#8b5cf6",
    accentColor: "#c084fc",
    startLevel: 21,
    endLevel: 30,
    checkpointLevel: 21,
    bossLevel: 30,
    bossName: "Firewall Arch-Sentinel",
  },
  {
    id: 4,
    name: "Sector 04: Corporate Spire",
    subtitle: "Chromium Towers & Penthouse Courtyards",
    biome: "corporate_heights",
    description: "Gleaming glass skyscrapers where elite corporate assassins enforce corporate bylaws with thermal katanas.",
    themeColor: "#ec4899",
    accentColor: "#f472b6",
    startLevel: 31,
    endLevel: 40,
    checkpointLevel: 31,
    bossLevel: 40,
    bossName: "Zaibatsu Enforcer Prime",
  },
  {
    id: 5,
    name: "Sector 05: Subterranean Vaults",
    subtitle: "Forgotten Catacombs & Toxic Sumps",
    biome: "underground_vaults",
    description: "Centuries-old ruins buried beneath the megacity, crawling with mutated shock-brutes and rogue AI relays.",
    themeColor: "#10b981",
    accentColor: "#34d399",
    startLevel: 41,
    endLevel: 50,
    checkpointLevel: 41,
    bossLevel: 50,
    bossName: "Vault Warden Gorgon",
  },
  {
    id: 6,
    name: "Sector 06: Bio-Synth Laboratories",
    subtitle: "Cryo Chambers & Gene-Cult Incubators",
    biome: "nanite_lab",
    description: "Sterile white corridors stained with bio-luminescent fluids and experimental cybernetic abominations.",
    themeColor: "#14b8a6",
    accentColor: "#2dd4bf",
    startLevel: 51,
    endLevel: 60,
    checkpointLevel: 51,
    bossLevel: 60,
    bossName: "Dr. Gene-Splicer Vane",
  },
  {
    id: 7,
    name: "Sector 07: Orbital Sky-Tether",
    subtitle: "Zero-G Terminals & Wind-Whipped Platforms",
    biome: "orbital_tether",
    description: "High-altitude elevators dangling over the stratosphere with treacherous winds and gravity disruptions.",
    themeColor: "#0284c7",
    accentColor: "#60a5fa",
    startLevel: 61,
    endLevel: 70,
    checkpointLevel: 61,
    bossLevel: 70,
    bossName: "Stratosphere Hawk-Eye",
  },
  {
    id: 8,
    name: "Sector 08: Plasma Core",
    subtitle: "Volatile Geothermal Conduits",
    biome: "plasma_reactor",
    description: "Superheated reactor chambers humming with raw fusion energy and unstable plasma vents.",
    themeColor: "#eab308",
    accentColor: "#fde047",
    startLevel: 71,
    endLevel: 80,
    checkpointLevel: 71,
    bossLevel: 80,
    bossName: "Reactor Overload Behemoth",
  },
  {
    id: 9,
    name: "Sector 09: Apex Citadel",
    subtitle: "The Shogun's Palace Fortress",
    biome: "shogun_citadel",
    description: "Traditional lacquered wooden pagodas infused with impenetrable energy shielding and honorary royal guards.",
    themeColor: "#ef4444",
    accentColor: "#f87171",
    startLevel: 81,
    endLevel: 90,
    checkpointLevel: 81,
    bossLevel: 90,
    bossName: "Grand Shogun Ashi-Garu",
  },
  {
    id: 10,
    name: "Sector 10: Orbital Rift",
    subtitle: "Singularity Sanctum Beyond Reality",
    biome: "void_sanctuary",
    description: "Where space-time tears apart, revealing the dark cybernetic core orchestrating the eternal simulation.",
    themeColor: "#a855f7",
    accentColor: "#e879f9",
    startLevel: 91,
    endLevel: 100,
    checkpointLevel: 91,
    bossLevel: 100,
    bossName: "Omega Entity: Zero-Kensei",
  },
];

export function getSectorForLevel(level: number): SectorDef {
  const clampedLevel = Math.max(1, Math.min(100, Math.floor(level)));
  const sectorIndex = Math.floor((clampedLevel - 1) / 10);
  return SECTORS[sectorIndex] ?? SECTORS[SECTORS.length - 1];
}

export function getSectorById(sectorId: number): SectorDef {
  const clampedId = Math.max(1, Math.min(10, Math.floor(sectorId)));
  return SECTORS[clampedId - 1] ?? SECTORS[0];
}

export function getAllSectors(): SectorDef[] {
  return [...SECTORS];
}
