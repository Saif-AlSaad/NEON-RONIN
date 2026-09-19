import { getSectorForLevel, SectorDef } from "./sectors";
import { calculateDifficulty, DifficultyModifiers } from "./difficulty";

export type ObjectiveType = "eliminate_all" | "survive_time" | "assassinate_target" | "defeat_boss";

export interface LevelObjective {
  type: ObjectiveType;
  description: string;
  targetCount?: number;
  timeLimitSeconds?: number;
}

export interface LevelReward {
  gold: number;
  neonShards: number;
  perkDrafts: number;
  firstClearBonus?: {
    neonShards: number;
    title?: string;
  };
}

export interface LevelConfig {
  level: number;
  sector: number;
  sectorName: string;
  biome: string;
  objective: LevelObjective;
  difficulty: DifficultyModifiers;
  waveCount: number;
  enemyPool: string[];
  eliteChance: number;
  isBossLevel: boolean;
  bossType: string | null;
  reward: LevelReward;
}

/**
 * Checks if a level is a boss climax level (every 10th level: 10, 20, 30, ..., 100).
 */
export function isBossLevel(level: number): boolean {
  const clamped = Math.max(1, Math.min(100, Math.floor(level)));
  return clamped % 10 === 0;
}

/**
 * Returns the environment biome identifier for the given level.
 */
export function getBiomeForLevel(level: number): string {
  return getSectorForLevel(level).biome;
}

/**
 * Returns the sector checkpoint start level for the given level.
 * Sector 1 (1-10) -> 1
 * Sector 2 (11-20) -> 11
 * Sector 3 (21-30) -> 21
 * ...
 * Sector 10 (91-100) -> 91
 */
export function getCheckpointForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(100, Math.floor(level)));
  return Math.floor((clamped - 1) / 10) * 10 + 1;
}

/**
 * Determines enemy pool composition based on campaign level and sector progression.
 * Utilizes existing enemy archetypes ("grunt", "archer", "brute", "boss") as temporary base types.
 */
function getEnemyPoolForLevel(level: number, isBoss: boolean): string[] {
  if (isBoss) {
    return ["boss", "grunt", "archer", "brute"];
  }

  // Level 1-2: intro grunts
  if (level <= 2) {
    return ["grunt"];
  }
  // Level 3-5: add archers
  if (level <= 5) {
    return ["grunt", "archer"];
  }
  // Level 6+: full mix with brutes
  return ["grunt", "archer", "brute"];
}

/**
 * Generates an objective for the given level.
 */
function getObjectiveForLevel(level: number, isBoss: boolean, sectorDef: SectorDef): LevelObjective {
  if (isBoss) {
    return {
      type: "defeat_boss",
      description: `Defeat ${sectorDef.bossName}`,
      targetCount: 1,
    };
  }

  // Every 5th level (5, 15, 25, etc.) is a survival challenge
  if (level % 5 === 0) {
    const duration = 45 + Math.min(45, Math.floor(level / 2));
    return {
      type: "survive_time",
      description: `Survive the onslaught for ${duration}s`,
      timeLimitSeconds: duration,
    };
  }

  // Every 7th or 8th level is an assassination target challenge
  if (level % 8 === 0) {
    return {
      type: "assassinate_target",
      description: "Eliminate the cyber commander before reinforcements arrive",
      targetCount: 1,
    };
  }

  return {
    type: "eliminate_all",
    description: "Clear all hostile cybernetic forces in this zone",
  };
}

/**
 * Calculates gold and neon shard rewards for completing a level.
 */
function getRewardForLevel(level: number, isBoss: boolean, sector: number): LevelReward {
  const baseGold = 25 + level * 5;
  const baseShards = 5 + Math.floor(level * 1.5);
  const perkDrafts = isBoss ? 2 : 1;

  const reward: LevelReward = {
    gold: baseGold,
    neonShards: baseShards,
    perkDrafts,
    firstClearBonus: {
      neonShards: isBoss ? 50 + sector * 25 : 15 + sector * 5,
      title: isBoss ? `Conqueror of ${getSectorForLevel(level).name}` : undefined,
    },
  };

  return reward;
}

/**
 * Generates the full configuration for any of the 100 campaign levels.
 */
export function getLevelConfig(level: number): LevelConfig {
  const clampedLevel = Math.max(1, Math.min(100, Math.floor(level)));
  const sectorDef = getSectorForLevel(clampedLevel);
  const boss = isBossLevel(clampedLevel);
  const diff = calculateDifficulty(clampedLevel, boss);

  // Boss levels have concentrated high-intensity waves, standard levels have 2-4 waves
  let waveCount = 2 + (clampedLevel % 3);
  if (boss) {
    waveCount = 2; // Minion phase + Boss phase
  }

  const enemyPool = getEnemyPoolForLevel(clampedLevel, boss);
  const objective = getObjectiveForLevel(clampedLevel, boss, sectorDef);
  const reward = getRewardForLevel(clampedLevel, boss, sectorDef.id);

  return {
    level: clampedLevel,
    sector: sectorDef.id,
    sectorName: sectorDef.name,
    biome: sectorDef.biome,
    objective,
    difficulty: diff,
    waveCount,
    enemyPool,
    eliteChance: diff.eliteChance,
    isBossLevel: boss,
    bossType: boss ? "boss" : null,
    reward,
  };
}

/**
 * Pre-generates all 100 level configurations.
 */
export function getAllLevelConfigs(): LevelConfig[] {
  const configs: LevelConfig[] = [];
  for (let lvl = 1; lvl <= 100; lvl++) {
    configs.push(getLevelConfig(lvl));
  }
  return configs;
}

// Re-export sector helper for convenience
export { getSectorForLevel };
