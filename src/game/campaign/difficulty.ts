export interface DifficultyModifiers {
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  spawnDensity: number;
  projectileSpeedMultiplier: number;
  attackFrequencyMultiplier: number;
  aggression: number; // 0.0 to 1.0 scale
  eliteChance: number; // 0.0 to 1.0 scale
}

/**
 * Calculates multi-variable difficulty scaling for a specific level.
 * Uses non-linear compounded scaling rather than simple linear HP multiplication
 * to maintain tactical challenge, fair reaction windows, and endgame intensity.
 */
export function calculateDifficulty(level: number, isBoss: boolean = false): DifficultyModifiers {
  const clampedLevel = Math.max(1, Math.min(100, Math.floor(level)));
  const progress = (clampedLevel - 1) / 99; // 0.0 at level 1, 1.0 at level 100
  const sectorIndex = Math.floor((clampedLevel - 1) / 10);

  // Sector tier step bonus (gives each new sector an immediate subtle bump)
  const sectorBump = sectorIndex * 0.1;

  // Non-linear compounded HP scaling (polynomial + exponential bend)
  const hpCurve = Math.pow(clampedLevel, 1.25) / 32;
  let hpMultiplier = 1.0 + (clampedLevel - 1) * 0.032 + hpCurve + sectorBump;
  if (isBoss) {
    hpMultiplier *= 1.45;
  }
  // Round to 2 decimal places
  hpMultiplier = Math.round(hpMultiplier * 100) / 100;

  // Smooth damage ramp with quadratic curve
  let damageMultiplier = 1.0 + 0.016 * (clampedLevel - 1) + 0.00015 * Math.pow(clampedLevel - 1, 1.85);
  if (isBoss) {
    damageMultiplier *= 1.15;
  }
  damageMultiplier = Math.round(damageMultiplier * 100) / 100;

  // Speed multiplier with diminishing returns (protects readable combat frames)
  const speedMultiplier = Math.round((1.0 + 0.35 * Math.tanh((clampedLevel - 1) / 42)) * 100) / 100;

  // Spawn density: enemy density in waves (1.0x to 1.85x)
  const spawnDensity = Math.round((1.0 + 0.85 * Math.pow(progress, 0.85)) * 100) / 100;

  // Projectile speed with soft ceiling to preserve parry reaction timing
  const projectileSpeedMultiplier = Math.round((1.0 + 0.36 * Math.tanh((clampedLevel - 1) / 35)) * 100) / 100;

  // Attack frequency: increases enemy attack speed / decreases cooldowns (1.0x to 1.55x)
  const attackFrequencyMultiplier = Math.round((1.0 + 0.55 * (1 - Math.exp(-(clampedLevel - 1) / 28))) * 100) / 100;

  // Enemy AI aggression index (0.15 at lvl 1 to 1.0 at lvl 100)
  const aggression = Math.round((0.15 + 0.85 * Math.pow(progress, 0.9)) * 100) / 100;

  // Elite enemy spawn chance (0% for tutorial levels, ramping to 45% in Sector 10)
  let eliteChance = 0;
  if (clampedLevel > 5) {
    eliteChance = Math.round((0.02 + 0.43 * Math.pow((clampedLevel - 5) / 95, 1.25)) * 100) / 100;
  }

  return {
    hpMultiplier,
    damageMultiplier,
    speedMultiplier,
    spawnDensity,
    projectileSpeedMultiplier,
    attackFrequencyMultiplier,
    aggression,
    eliteChance,
  };
}
