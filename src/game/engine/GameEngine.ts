import type { Ronin } from "../types";
import { CyberpunkBackground } from "../background";
import { InputManager } from "../input";
import { GameAudio } from "../audio";
import { WAVES } from "../ronin";
import { aggregatePerks, type Perk, type AggregatedPerks } from "../perks";
import {
  FIXED_STEP,
  GROUND_OFFSET,
  DOUBLE_JUMP,
  type PlayerState,
  type GameStatus,
  type EngineCallbacks,
  type PlatformEntity,
  type HazardEntity,
} from "./types";
import { EnginePools } from "./ObjectPool";
import { PhysicsSystem } from "./PhysicsSystem";
import { CombatSystem } from "./CombatSystem";
import { RenderSystem } from "./RenderSystem";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ronin: Ronin;
  private callbacks: EngineCallbacks;

  public pools: EnginePools;
  public physics: PhysicsSystem;
  public combat: CombatSystem;
  public renderSystem: RenderSystem;
  public input: InputManager;
  public bg: CyberpunkBackground;
  public audio: GameAudio | null = null;

  public status: GameStatus = "ready";
  public player: PlayerState;
  public activePerks: Perk[] = [];
  public aggregatedPerks: AggregatedPerks;
  public currentPlatforms: PlatformEntity[] = [];

  private rafId = 0;
  private lastTime = performance.now();
  private accumulator = 0;
  public bgTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    ronin: Ronin,
    callbacks: EngineCallbacks,
    audioInstance?: GameAudio | null
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.ronin = ronin;
    this.callbacks = callbacks;
    this.audio = audioInstance ?? null;

    this.pools = new EnginePools();
    this.physics = new PhysicsSystem();
    this.input = new InputManager();
    this.bg = new CyberpunkBackground();
    this.combat = new CombatSystem(ronin, this.audio, this.input, this.pools, callbacks);
    this.renderSystem = new RenderSystem(this.ctx, ronin, this.bg);

    this.aggregatedPerks = aggregatePerks([]);
    this.player = {
      x: 200,
      y: 200,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      hp: ronin.stats.maxHp,
      maxHp: ronin.stats.maxHp,
      energy: ronin.stats.maxEnergy,
      maxEnergy: ronin.stats.maxEnergy,
      atkCd: 0,
      shurikenCd: 0,
      dashCd: 0,
      dashT: 0,
      parryActive: 0,
      parryCd: 0,
      parryStreak: 0,
      invuln: 0,
      jumps: 0,
      slashActive: 0,
      slashDir: 1,
      swordTrail: [],
      wallSliding: false,
      wallDir: 0,
      dropThroughTimer: 0,
    };

    this.input.onGamepadConnected = (name) => {
      this.callbacks.onGamepadNotice?.(name);
    };
  }

  setAudio(audio: GameAudio | null) {
    this.audio = audio;
    this.combat.setAudio(audio);
  }

  setRonin(ronin: Ronin) {
    this.ronin = ronin;
    this.renderSystem.setRonin(ronin);
  }

  setPerks(perks: Perk[]) {
    this.activePerks = perks;
    this.aggregatedPerks = aggregatePerks(perks);
    for (const p of perks) {
      if (p.effect.bonusMaxHp) {
        this.player.maxHp = this.ronin.stats.maxHp + p.effect.bonusMaxHp;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + p.effect.bonusMaxHp);
      }
    }
  }

  private getWidth() {
    return window.innerWidth;
  }

  private getHeight() {
    return window.innerHeight;
  }

  private getGroundY() {
    return this.getHeight() - GROUND_OFFSET;
  }

  public setupSectorForWave(waveIdx: number) {
    const w = this.getWidth();
    const gy = this.getGroundY();
    const platforms: PlatformEntity[] = [];
    const hazards: HazardEntity[] = [];

    if (waveIdx <= 1) {
      // Sector 1: Rooftop Nexus (Waves 1-2)
      platforms.push(
        {
          id: "plat_s1_left",
          x: Math.max(60, w * 0.12),
          y: gy - 125,
          w: Math.min(280, w * 0.28),
          h: 16,
          color: "#38bdf8",
          glow: "#0284c7",
          oneWay: true,
        },
        {
          id: "plat_s1_right",
          x: Math.min(w - 340, w * 0.62),
          y: gy - 125,
          w: Math.min(280, w * 0.28),
          h: 16,
          color: "#ec4899",
          glow: "#db2777",
          oneWay: true,
        }
      );
      hazards.push({
        id: "barrel_s1_1",
        type: "plasma_barrel",
        x: Math.max(60, w * 0.12) + 40,
        y: gy - 125 - 28,
        w: 24,
        h: 28,
        active: true,
        timer: 0,
        maxTimer: 1,
        exploded: false,
      });
    } else if (waveIdx <= 3) {
      // Sector 2: Subterranean Power Grid (Waves 3-4)
      platforms.push(
        {
          id: "plat_s2_left",
          x: Math.max(50, w * 0.08),
          y: gy - 110,
          w: Math.min(220, w * 0.24),
          h: 16,
          color: "#a855f7",
          glow: "#9333ea",
          oneWay: true,
        },
        {
          id: "plat_s2_center",
          x: w / 2 - Math.min(150, w * 0.18),
          y: gy - 180,
          w: Math.min(300, w * 0.36),
          h: 18,
          color: "#22d3ee",
          glow: "#06b6d4",
          oneWay: true,
        },
        {
          id: "plat_s2_right",
          x: Math.min(w - 270, w * 0.68),
          y: gy - 110,
          w: Math.min(220, w * 0.24),
          h: 16,
          color: "#a855f7",
          glow: "#9333ea",
          oneWay: true,
        }
      );
      // Central electrified floor grid
      hazards.push(
        {
          id: "grid_s2_center",
          type: "electric_grid",
          x: w / 2 - 110,
          y: gy - 10,
          w: 220,
          h: 14,
          active: false,
          timer: 0,
          maxTimer: 3.2,
        },
        {
          id: "barrel_s2_1",
          type: "plasma_barrel",
          x: Math.max(50, w * 0.08) + 30,
          y: gy - 110 - 28,
          w: 24,
          h: 28,
          active: true,
          timer: 0,
          maxTimer: 1,
          exploded: false,
        },
        {
          id: "barrel_s2_2",
          type: "plasma_barrel",
          x: Math.min(w - 270, w * 0.68) + 160,
          y: gy - 110 - 28,
          w: 24,
          h: 28,
          active: true,
          timer: 0,
          maxTimer: 1,
          exploded: false,
        }
      );
    } else {
      // Sector 3: Shogun's Apex Citadel (Wave 5 Boss)
      platforms.push(
        {
          id: "plat_s3_duel",
          x: w / 2 - Math.min(240, w * 0.3),
          y: gy - 135,
          w: Math.min(480, w * 0.6),
          h: 20,
          color: "#fbbf24",
          glow: "#d97706",
          oneWay: true,
        },
        {
          id: "plat_s3_high_left",
          x: Math.max(60, w * 0.06),
          y: gy - 230,
          w: Math.min(180, w * 0.2),
          h: 16,
          color: "#f43f5e",
          glow: "#e11d48",
          oneWay: true,
        },
        {
          id: "plat_s3_high_right",
          x: Math.min(w - 240, w * 0.74),
          y: gy - 230,
          w: Math.min(180, w * 0.2),
          h: 16,
          color: "#f43f5e",
          glow: "#e11d48",
          oneWay: true,
        }
      );
      hazards.push(
        {
          id: "laser_gate_left",
          type: "laser_gate",
          x: Math.max(70, w * 0.06) + 30,
          y: gy - 230 - 32,
          w: 120,
          h: 32,
          active: false,
          timer: 0,
          maxTimer: 2.8,
        },
        {
          id: "barrel_s3_center",
          type: "plasma_barrel",
          x: w / 2 - 12,
          y: gy - 135 - 28,
          w: 24,
          h: 28,
          active: true,
          timer: 0,
          maxTimer: 1,
          exploded: false,
        }
      );
    }

    this.currentPlatforms = platforms;
    this.combat.setHazards(hazards);
  }

  public resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.setupSectorForWave(this.combat.waveIdx >= 0 ? this.combat.waveIdx : 0);
  }

  public start() {
    this.resize();
    this.combat.reset(this.player, this.getGroundY());
    this.status = "playing";
    this.setupSectorForWave(0);
    this.combat.startWave(0, this.getWidth(), this.getGroundY());

    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  public startWave(waveIdx: number) {
    this.status = "playing";
    this.setupSectorForWave(waveIdx);
    this.combat.startWave(waveIdx, this.getWidth(), this.getGroundY());
  }

  private handlePlayerInput() {
    const inputState = this.input.poll();
    const p = this.player;
    const perks = this.aggregatedPerks;

    // Parry
    if (inputState.parry) {
      this.combat.triggerParry(p, perks);
    }

    // Jump (Normal or Double Jump)
    if (inputState.jump && !p.wallSliding) {
      const jumpSpeed = this.ronin.stats.jumpPower * (1 + perks.bonusJumpPercent / 100);
      if (DOUBLE_JUMP) {
        if (p.jumps < 2) {
          p.vy = -jumpSpeed;
          p.jumps++;
          this.pools.addParticles(p.x, p.y, 5, "#a5f3fc", 150, 2);
          this.audio?.playSfx("jump");
        }
      } else if (p.onGround) {
        p.vy = -jumpSpeed;
        this.audio?.playSfx("jump");
      }
    }

    // Attacks & Abilities
    if (inputState.attack) this.combat.playerAttack(p, perks);
    if (inputState.shuriken) this.combat.throwShuriken(p, perks);
    if (inputState.special) this.combat.useSpecial(p, this.getGroundY());

    // Continuous attack holds
    if (inputState.attackHeld && p.atkCd <= 0 && p.slashActive <= 0) {
      this.combat.playerAttack(p, perks);
    }
    if (inputState.shurikenHeld && p.shurikenCd <= 0 && p.energy >= this.ronin.stats.shurikenCost) {
      this.combat.throwShuriken(p, perks);
    }

    // Dash
    if (inputState.dash) {
      if (p.dashCd <= 0 && p.dashT <= 0) {
        p.dashT = 0.18;
        p.dashCd = Math.max(0.4, this.ronin.stats.dashCd - perks.reducedDashCd);
        p.invuln = Math.max(p.invuln, 0.18 + 0.06);
        p.vy = 0;
        this.pools.addParticles(p.x, p.y - 46 / 2, 14, "#67e8f9", 220, 2);
        this.pools.addRing(p.x, p.y - 46 / 2, 45, "#67e8f9", 0.3, 3);
        this.audio?.playSfx("dash");
        this.input.vibrate(50, 0.4, 0.5);
        this.combat.addStyle(10, p);
      }
    }

    return inputState;
  }

  // Fixed timestep physics & combat update
  private fixedUpdate(stepDt: number) {
    const w = this.getWidth();
    const groundY = this.getGroundY();
    const perks = this.aggregatedPerks;

    const inputState = this.handlePlayerInput();

    // Physics (Platforms & Traversal included)
    this.physics.updatePlayer(
      stepDt,
      this.player,
      inputState,
      perks,
      this.pools,
      w,
      groundY,
      this.currentPlatforms
    );
    this.physics.updateEnemies(
      stepDt,
      this.combat.enemies,
      w,
      groundY,
      this.currentPlatforms,
      this.player.y
    );
    this.physics.updateProjectiles(stepDt, this.pools);
    this.physics.updateSpecials(stepDt, this.combat.specials, w);
    this.physics.updateVfx(stepDt, this.pools);

    // Combat & Rules (Environmental hazards included)
    this.combat.updateCombat(
      stepDt,
      this.player,
      perks,
      this.activePerks.map((p) => p.id),
      this.status,
      (newStatus) => {
        this.status = newStatus;
      }
    );
  }

  private loop = (now: number) => {
    let frameDt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (frameDt > 0.25) frameDt = 0.25; // prevent spiral of death on tab unfocus

    const w = this.getWidth();
    const groundY = this.getGroundY();

    this.bgTime += frameDt;
    this.bg.update(frameDt, w, groundY);

    this.combat.waveTitleT = Math.max(0, this.combat.waveTitleT - frameDt);
    this.combat.screenFlash = Math.max(0, this.combat.screenFlash - frameDt * 1.6);
    this.combat.shake = Math.max(0, this.combat.shake - frameDt);
    this.combat.comboTimer = Math.max(0, this.combat.comboTimer - frameDt);
    if (this.combat.comboTimer === 0) this.combat.combo = 0;

    // Style decay
    this.combat.stylePoints = Math.max(0, this.combat.stylePoints - frameDt * 25);
    this.combat.addStyle(0, this.player);

    if (this.combat.slowmo > 0) {
      this.combat.slowmo -= frameDt;
      frameDt *= 0.35;
    }

    // Hit-stop micro freeze
    if (this.combat.hitStop > 0) {
      this.combat.hitStop -= frameDt;
      this.renderSystem.render(
        w,
        this.getHeight(),
        groundY,
        this.bgTime,
        this.player,
        this.combat,
        this.pools,
        this.currentPlatforms
      );
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    // Adaptive audio
    const mode =
      this.status === "dead"
        ? "defeat"
        : this.combat.waveIdx >= 0 && WAVES[this.combat.waveIdx]?.isBoss
        ? "boss"
        : this.status === "playing"
        ? "battle"
        : "ambient";
    this.audio?.setMode(mode);
    this.audio?.addCombo(this.combat.combo);

    // Fixed timestep accumulator loop
    if (this.status === "playing" || this.status === "wave_interlude") {
      this.accumulator += frameDt;
      while (this.accumulator >= FIXED_STEP) {
        this.fixedUpdate(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
      }
    }

    // Render frame
    this.renderSystem.render(
      w,
      this.getHeight(),
      groundY,
      this.bgTime,
      this.player,
      this.combat,
      this.pools,
      this.currentPlatforms
    );
    this.rafId = requestAnimationFrame(this.loop);
  };

  public dispose() {
    cancelAnimationFrame(this.rafId);
    this.input.dispose();
  }
}
