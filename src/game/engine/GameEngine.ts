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

  public resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public start() {
    this.resize();
    this.combat.reset(this.player, this.getGroundY());
    this.status = "playing";
    this.combat.startWave(0, this.getWidth(), this.getGroundY());

    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  public startWave(waveIdx: number) {
    this.status = "playing";
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

    // Jump
    if (inputState.jump) {
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

    // Physics
    this.physics.updatePlayer(stepDt, this.player, inputState, perks, this.pools, w, groundY);
    this.physics.updateEnemies(stepDt, this.combat.enemies, w, groundY);
    this.physics.updateProjectiles(stepDt, this.pools);
    this.physics.updateSpecials(stepDt, this.combat.specials, w);
    this.physics.updateVfx(stepDt, this.pools);

    // Combat & Rules
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
      this.renderSystem.render(w, this.getHeight(), groundY, this.bgTime, this.player, this.combat, this.pools);
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
    this.renderSystem.render(w, this.getHeight(), groundY, this.bgTime, this.player, this.combat, this.pools);
    this.rafId = requestAnimationFrame(this.loop);
  };

  public dispose() {
    cancelAnimationFrame(this.rafId);
    this.input.dispose();
  }
}
