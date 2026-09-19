import type { Ronin, EnemyDef } from "../types";
import type { Perk } from "../perks";

export type GameStatus = "ready" | "playing" | "wave_interlude" | "perk_select" | "win" | "dead";
export type StyleRank = "D" | "C" | "B" | "A" | "S" | "SSS";

export interface PlatformEntity {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  glow: string;
  oneWay: boolean;
}

export interface HazardEntity {
  id: string;
  type: "laser_gate" | "electric_grid" | "plasma_barrel";
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  timer: number;
  maxTimer: number;
  exploded?: boolean;
  hp?: number;
}

export interface SectorConfig {
  name: string;
  subtitle: string;
  themeColor: string;
  platforms: PlatformEntity[];
  hazards: HazardEntity[];
}

export interface EnemyEntity {
  def: EnemyDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  facing: number;
  onGround: boolean;
  atkCd: number;
  shootCd: number;
  hitFlash: number;
  kb: number;
  dead: boolean;
  phase2: boolean;
  deathT: number;
  bleedT?: number;
  currentPlatformId?: string | null;
  isElite?: boolean;
  maxHp?: number;
}

export interface ProjectileEntity {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  life: number;
  from: "player" | "enemy";
  color: string;
  size: number;
  piercing?: boolean;
}

export interface SlashEntity {
  x: number;
  y: number;
  facing: number;
  life: number;
  maxLife: number;
  reach: number;
  arc: number;
  color: string;
  dmg: number;
}

export interface SpecialEntity {
  x: number;
  y: number;
  vx: number;
  life: number;
  w: number;
  h: number;
  dmg: number;
  hit: Set<EnemyEntity>;
  color: string;
}

export interface ParticleEntity {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatTextEntity {
  active: boolean;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
  scale?: number;
}

export interface RingEntity {
  active: boolean;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
  color: string;
  width: number;
}

export interface AfterimageEntity {
  active: boolean;
  x: number;
  y: number;
  facing: number;
  life: number;
  color: string;
}

export interface SwordTrailPoint {
  x: number;
  y: number;
  life: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  onGround: boolean;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  atkCd: number;
  shurikenCd: number;
  dashCd: number;
  dashT: number;
  parryActive: number;
  parryCd: number;
  parryStreak: number;
  invuln: number;
  jumps: number;
  slashActive: number;
  slashDir: number;
  swordTrail: SwordTrailPoint[];
  wallSliding: boolean;
  wallDir: number;
  dropThroughTimer: number;
  currentPlatformId?: string | null;
}

export interface CombatStats {
  kills: number;
  parries: number;
}

export interface EngineCallbacks {
  onGameOver: (result: { win: boolean; score: number; wave: number }) => void;
  onPerkDraft: (choices: Perk[]) => void;
  onGamepadNotice?: (name: string) => void;
}

export const GRAVITY = 2200;
export const GROUND_OFFSET = 160;
export const PLAYER_W = 26;
export const PLAYER_H = 46;
export const DASH_SPEED = 780;
export const DASH_DURATION = 0.18;
export const DOUBLE_JUMP = true;
export const ARENA_PADDING = 40;
export const FIXED_STEP = 1 / 60;
export const WALL_SLIDE_SPEED = 180;
