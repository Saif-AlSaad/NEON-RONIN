export type RoninStyle = "kaze" | "kaminari" | "tetsu";

export interface Ronin {
  id: RoninStyle;
  name: string;
  title: string;
  emoji: string;
  gradient: string;
  accent: string;
  blurb: string;
  stats: {
    maxHp: number;
    maxEnergy: number;
    speed: number;
    jumpPower: number;
    meleeDmg: number;
    shurikenDmg: number;
    attackCd: number;
    shurikenCost: number;
    dashCd: number;
  };
  specialName: string;
  specialCost: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  color: string;
  accent: string;
  emoji: string;
  maxHp: number;
  speed: number;
  size: { w: number; h: number };
  dmg: number;
  gold: number;
  behavior: "grunt" | "archer" | "brute" | "boss";
  shootCd?: number;
  shootRange?: number;
  projectileSpeed?: number;
  meleeRange?: number;
}

export interface WaveEnemyGroup {
  id: string;
  count: number;
  isElite?: boolean;
}

export interface Wave {
  enemies: WaveEnemyGroup[];
  isBoss?: boolean;
  name?: string;
  objectiveText?: string;
  eliteChance?: number;
  level?: number;
}

// Campaign exports
export type {
  SectorDef,
  DifficultyModifiers,
  ObjectiveType,
  LevelObjective,
  LevelReward,
  LevelConfig,
  CampaignState,
  LevelRecord,
} from "./game/campaign/campaign";

