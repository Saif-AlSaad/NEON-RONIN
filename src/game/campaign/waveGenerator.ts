import type { Wave, WaveEnemyGroup } from "../../types";
import { getSectorForLevel, SectorDef } from "./sectors";
import { calculateDifficulty, DifficultyModifiers } from "./difficulty";
import { isBossLevel } from "./levels";

/**
 * Squad archetype templates providing the 70% curated foundation.
 */
type SquadArchetype =
  | "grunt_patrol" // Early or swarm wave
  | "crossfire_squad" // Archer backline with grunt shield
  | "brute_vanguard" // Heavy melee frontline with flankers
  | "balanced_strike" // Mixed grunts, archers, brutes
  | "boss_escort"; // Boss with bodyguard retinue

/**
 * Deterministic pseudo-random number generator helper based on level, wave, and seed.
 * Ensures consistent testing while allowing controlled 30% variation.
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Determines which squad archetype to use for a given level and wave index.
 */
function chooseArchetype(
  level: number,
  waveIdx: number,
  totalWaves: number,
  isBoss: boolean
): SquadArchetype {
  if (isBoss && waveIdx === totalWaves - 1) {
    return "boss_escort";
  }

  // Level 1-2: Grunts only
  if (level <= 2) {
    return "grunt_patrol";
  }

  // Level 3-5: Archers introduced
  if (level <= 5) {
    return waveIdx % 2 === 0 ? "grunt_patrol" : "crossfire_squad";
  }

  // Sector-influenced archetypes
  const sector = Math.floor((level - 1) / 10) + 1;
  const waveCycle = (level * 7 + waveIdx * 3) % 10;

  // Tech / Data sectors favor archers & crossfire
  if (sector === 3 || sector === 6 || sector === 7) {
    if (waveCycle < 5) return "crossfire_squad";
    if (waveCycle < 8) return "balanced_strike";
    return "brute_vanguard";
  }

  // Heavy / Foundry / Vault sectors favor brutes
  if (sector === 2 || sector === 5 || sector === 8) {
    if (waveCycle < 4) return "brute_vanguard";
    if (waveCycle < 8) return "balanced_strike";
    return "crossfire_squad";
  }

  // Citadel & Void sectors (Sectors 9 & 10) feature intense mixed assaults
  if (sector >= 9) {
    if (waveCycle < 3) return "brute_vanguard";
    if (waveCycle < 6) return "crossfire_squad";
    return "balanced_strike";
  }

  // General progression
  if (waveIdx === 0) return "grunt_patrol";
  if (waveIdx === 1) return "crossfire_squad";
  return "balanced_strike";
}

/**
 * Builds enemy groups for a wave given level, difficulty, archetype, and wave index.
 * Implements 70% curated structure with 30% controlled variation.
 */
function buildWaveGroups(
  level: number,
  waveIdx: number,
  totalWaves: number,
  diff: DifficultyModifiers,
  isBoss: boolean,
  sector: SectorDef
): WaveEnemyGroup[] {
  const seed = level * 100 + waveIdx * 17 + 42;
  const archetype = chooseArchetype(level, waveIdx, totalWaves, isBoss);
  const density = diff.spawnDensity;

  // 30% Controlled variation roll [-0.15, +0.15]
  const variation = (pseudoRandom(seed) - 0.5) * 0.3;
  const effectiveDensity = Math.max(0.9, density * (1 + variation));

  const groups: WaveEnemyGroup[] = [];

  // Helper to determine if a group qualifies for elite promotion
  const shouldMakeElite = (enemyType: string, groupIdx: number): boolean => {
    if (level <= 5) return false;
    const eliteRoll = pseudoRandom(seed + groupIdx * 31 + 7);
    return eliteRoll < diff.eliteChance;
  };

  switch (archetype) {
    case "boss_escort": {
      // Climax boss wave
      groups.push({ id: "boss", count: 1, isElite: level >= 50 });

      // Add escort minions based on sector progression
      const escortGruntCount = Math.max(1, Math.round(2 * effectiveDensity));
      groups.push({ id: "grunt", count: escortGruntCount });

      if (level >= 20) {
        const escortArcherCount = Math.max(1, Math.round(1.5 * effectiveDensity));
        groups.push({
          id: "archer",
          count: escortArcherCount,
          isElite: shouldMakeElite("archer", 1),
        });
      }

      if (level >= 40) {
        const escortBruteCount = Math.max(1, Math.round(1.2 * effectiveDensity));
        groups.push({
          id: "brute",
          count: escortBruteCount,
          isElite: shouldMakeElite("brute", 2),
        });
      }
      break;
    }

    case "grunt_patrol": {
      // 70% Curated base: 3 grunts scaling with level & density
      const baseCount = Math.min(14, Math.max(3, Math.round((3 + level * 0.08) * effectiveDensity)));
      const hasElite = shouldMakeElite("grunt", 0);
      groups.push({
        id: "grunt",
        count: baseCount,
        isElite: hasElite,
      });

      // After level 4, add a slight archer support (30% controlled variation)
      if (level >= 4 && pseudoRandom(seed + 1) > 0.4) {
        groups.push({ id: "archer", count: Math.max(1, Math.round(2 * effectiveDensity)) });
      }
      break;
    }

    case "crossfire_squad": {
      // Curated: Archer backline protected by grunt frontline
      const archerCount = Math.min(8, Math.max(2, Math.round((2 + level * 0.06) * effectiveDensity)));
      const gruntCount = Math.min(10, Math.max(2, Math.round((2 + level * 0.05) * effectiveDensity)));

      groups.push({
        id: "grunt",
        count: gruntCount,
        isElite: shouldMakeElite("grunt", 0),
      });

      groups.push({
        id: "archer",
        count: archerCount,
        isElite: shouldMakeElite("archer", 1),
      });

      // Mid-to-high sectors add 1 protective brute
      if (level >= 25 && pseudoRandom(seed + 2) > 0.35) {
        groups.push({
          id: "brute",
          count: Math.max(1, Math.round(1 * effectiveDensity)),
          isElite: shouldMakeElite("brute", 2),
        });
      }
      break;
    }

    case "brute_vanguard": {
      // Curated: Heavy melee vanguard
      const bruteCount = Math.min(5, Math.max(1, Math.round((1 + level * 0.035) * effectiveDensity)));
      const gruntCount = Math.min(8, Math.max(2, Math.round((2 + level * 0.04) * effectiveDensity)));

      groups.push({
        id: "brute",
        count: bruteCount,
        isElite: shouldMakeElite("brute", 0),
      });

      groups.push({
        id: "grunt",
        count: gruntCount,
        isElite: shouldMakeElite("grunt", 1),
      });

      // Add archer suppression in later levels
      if (level >= 15) {
        const archerCount = Math.max(1, Math.round(1.5 * effectiveDensity));
        groups.push({
          id: "archer",
          count: archerCount,
          isElite: shouldMakeElite("archer", 2),
        });
      }
      break;
    }

    case "balanced_strike":
    default: {
      // Curated: Tactical tri-force strike squad
      const gruntCount = Math.min(8, Math.max(2, Math.round((2 + level * 0.04) * effectiveDensity)));
      const archerCount = Math.min(6, Math.max(1, Math.round((1.5 + level * 0.03) * effectiveDensity)));
      const bruteCount = Math.min(4, Math.max(1, Math.round((1 + level * 0.025) * effectiveDensity)));

      groups.push({
        id: "grunt",
        count: gruntCount,
        isElite: shouldMakeElite("grunt", 0),
      });

      groups.push({
        id: "archer",
        count: archerCount,
        isElite: shouldMakeElite("archer", 1),
      });

      groups.push({
        id: "brute",
        count: bruteCount,
        isElite: shouldMakeElite("brute", 2),
      });
      break;
    }
  }

  return groups;
}

/**
 * Generates a single wave configuration for a given level and wave index.
 */
export function generateLevelWave(level: number, waveIndex: number = 0): Wave {
  const clampedLevel = Math.max(1, Math.min(100, Math.floor(level)));
  const sector = getSectorForLevel(clampedLevel);
  const boss = isBossLevel(clampedLevel);
  const diff = calculateDifficulty(clampedLevel, boss);

  const totalWaves = boss ? 2 : 2 + (clampedLevel % 3);
  const safeWaveIdx = Math.max(0, Math.min(totalWaves - 1, waveIndex));
  const isFinalWave = safeWaveIdx === totalWaves - 1;
  const isBossWave = boss && isFinalWave;

  const enemies = buildWaveGroups(clampedLevel, safeWaveIdx, totalWaves, diff, boss, sector);

  // Dynamic wave title naming
  let name = `Sector ${sector.id} • Wave ${safeWaveIdx + 1}/${totalWaves}`;
  if (isBossWave) {
    name = `BOSS CONFRONTATION — ${sector.bossName}`;
  } else if (isFinalWave && totalWaves > 1) {
    name = `Wave ${safeWaveIdx + 1} • Final Skirmish`;
  }

  return {
    enemies,
    isBoss: isBossWave,
    name,
    level: clampedLevel,
    eliteChance: diff.eliteChance,
  };
}

/**
 * Generates the full array of waves required to complete a given campaign level.
 */
export function generateLevelWaves(level: number): Wave[] {
  const clampedLevel = Math.max(1, Math.min(100, Math.floor(level)));
  const boss = isBossLevel(clampedLevel);
  const waveCount = boss ? 2 : 2 + (clampedLevel % 3);

  const waves: Wave[] = [];
  for (let idx = 0; idx < waveCount; idx++) {
    waves.push(generateLevelWave(clampedLevel, idx));
  }
  return waves;
}
