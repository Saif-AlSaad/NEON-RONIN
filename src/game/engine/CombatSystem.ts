import type { Ronin } from "../types";
import { ENEMIES, WAVES } from "../ronin";
import { unlockAchievement, recordRunResult } from "../achievements";
import { drawPerkOptions, type AggregatedPerks } from "../perks";
import type { GameAudio } from "../audio";
import type { InputManager } from "../input";
import {
  PLAYER_W,
  PLAYER_H,
  type PlayerState,
  type EnemyEntity,
  type SlashEntity,
  type SpecialEntity,
  type CombatStats,
  type StyleRank,
  type GameStatus,
  type EngineCallbacks,
  type HazardEntity,
} from "./types";
import type { EnginePools } from "./ObjectPool";

export class CombatSystem {
  public enemies: EnemyEntity[] = [];
  public slashes: SlashEntity[] = [];
  public specials: SpecialEntity[] = [];
  public hazards: HazardEntity[] = [];

  public score = 0;
  public gold = 0;
  public combo = 0;
  public comboTimer = 0;
  public stylePoints = 0;
  public styleRank: StyleRank = "D";
  public styleMultiplier = 1.0;
  public stats: CombatStats = { kills: 0, parries: 0 };

  public waveIdx = -1;
  public waveTime = 0;
  public waveDamageTaken = 0;
  public waveTitleText = "";
  public waveTitleT = 0;
  public shake = 0;
  public slowmo = 0;
  public hitStop = 0;
  public screenFlash = 0;

  constructor(
    private ronin: Ronin,
    private audio: GameAudio | null,
    private input: InputManager,
    private pools: EnginePools,
    private callbacks: EngineCallbacks
  ) {}

  setAudio(audio: GameAudio | null) {
    this.audio = audio;
  }

  setHazards(hazards: HazardEntity[]) {
    this.hazards = hazards;
  }

  reset(p: PlayerState, groundY: number) {
    this.enemies = [];
    this.slashes = [];
    this.specials = [];
    this.hazards = [];
    this.pools.clearAll();
    this.score = 0;
    this.gold = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.stylePoints = 0;
    this.styleRank = "D";
    this.styleMultiplier = 1.0;
    this.stats = { kills: 0, parries: 0 };
    this.waveIdx = -1;
    this.waveTime = 0;
    this.waveDamageTaken = 0;
    this.waveTitleText = "";
    this.waveTitleT = 0;
    this.shake = 0;
    this.slowmo = 0;
    this.hitStop = 0;
    this.screenFlash = 0;

    p.hp = p.maxHp;
    p.energy = p.maxEnergy;
    p.x = 200;
    p.y = groundY - PLAYER_H;
    p.vx = 0;
    p.vy = 0;
  }

  addStyle(points: number, p: PlayerState) {
    const prevRank = this.styleRank;
    this.stylePoints = Math.min(1200, this.stylePoints + points);

    if (this.stylePoints >= 1000) {
      this.styleRank = "SSS";
      this.styleMultiplier = 3.0;
      unlockAchievement("neon_god");
    } else if (this.stylePoints >= 700) {
      this.styleRank = "S";
      this.styleMultiplier = 2.2;
      unlockAchievement("style_s");
    } else if (this.stylePoints >= 450) {
      this.styleRank = "A";
      this.styleMultiplier = 1.8;
    } else if (this.stylePoints >= 250) {
      this.styleRank = "B";
      this.styleMultiplier = 1.5;
    } else if (this.stylePoints >= 100) {
      this.styleRank = "C";
      this.styleMultiplier = 1.2;
    } else {
      this.styleRank = "D";
      this.styleMultiplier = 1.0;
    }

    if (this.styleRank !== prevRank && points > 0) {
      this.audio?.playSfx("styleUp");
      this.pools.addFloat(p.x, p.y - PLAYER_H - 24, `STYLE ${this.styleRank}!`, "#ec4899", 1.4);
    }
  }

  spawnEnemy(id: string, w: number, groundY: number) {
    const def = ENEMIES[id];
    if (!def) return;
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -40 : w + 40;
    const y = groundY - def.size.h;
    const e: EnemyEntity = {
      def,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: def.maxHp,
      facing: fromLeft ? 1 : -1,
      onGround: false,
      atkCd: 0.6 + Math.random() * 0.8,
      shootCd: (def.shootCd ?? 2) * (0.7 + Math.random() * 0.6),
      hitFlash: 0,
      kb: 0,
      dead: false,
      phase2: false,
      deathT: 0,
    };
    this.enemies.push(e);
  }

  startWave(idx: number, w: number, groundY: number) {
    this.waveIdx = idx;
    this.waveDamageTaken = 0;
    const wave = WAVES[idx];
    if (!wave) return;

    let delay = 0;
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        setTimeout(() => {
          this.spawnEnemy(group.id, w, groundY);
        }, delay * 1000);
        delay += 0.45;
      }
    }

    this.waveTitleText = wave.name ?? `Wave ${idx + 1}`;
    this.waveTitleT = 2.5;
    if (wave.isBoss) {
      this.screenFlash = 0.6;
      this.shake = 0.6;
    }
  }

  playerAttack(p: PlayerState, perks: AggregatedPerks) {
    if (p.atkCd > 0) return;
    p.atkCd = Math.max(0.12, this.ronin.stats.attackCd - perks.reducedAttackCd);
    p.slashActive = 0.18;
    p.slashDir = p.facing;

    const sx = p.x + p.facing * 22;
    const sy = p.y - PLAYER_H / 2 + 6;

    const baseDmg = this.ronin.stats.meleeDmg * (1 + perks.bonusMeleeDmgPercent / 100);
    const isCrit = perks.critChance > 0 && Math.random() < perks.critChance;
    const dmg = isCrit ? baseDmg * perks.critMultiplier : baseDmg;

    this.slashes.push({
      x: sx,
      y: sy,
      facing: p.facing,
      life: 0.18,
      maxLife: 0.18,
      reach: 74,
      arc: 1.25,
      color: isCrit ? "#ef4444" : "#67e8f9",
      dmg,
    });

    this.pools.addRing(sx - p.facing * 12, sy, 34, isCrit ? "#ef4444" : "#67e8f9", 0.28, 3);
    this.pools.addParticles(p.x + p.facing * 50, p.y - PLAYER_H / 2 + 4, 6, isCrit ? "#ef4444" : "#67e8f9", 340, 2.5);
    this.audio?.playSfx("slash");
    this.input.vibrate(40, 0.3, 0.4);
    this.addStyle(15, p);
  }

  throwShuriken(p: PlayerState, perks: AggregatedPerks) {
    if (p.shurikenCd > 0) return;
    if (p.energy < this.ronin.stats.shurikenCost) return;
    p.energy -= this.ronin.stats.shurikenCost;
    p.shurikenCd = 0.32;

    const speed = 720 + perks.shurikenSpeedBonus;
    const dmg = this.ronin.stats.shurikenDmg * (1 + perks.bonusShurikenDmgPercent / 100);

    const pr = this.pools.projectiles.get();
    if (pr) {
      pr.x = p.x + p.facing * 20;
      pr.y = p.y - PLAYER_H / 2 + 4;
      pr.vx = speed * p.facing;
      pr.vy = 0;
      pr.dmg = dmg;
      pr.life = 1.4;
      pr.from = "player";
      pr.color = "#f0abfc";
      pr.size = 9;
      pr.piercing = perks.shurikenPierce;
    }

    this.audio?.playSfx("shuriken");
    this.addStyle(20, p);
  }

  useSpecial(p: PlayerState, groundY: number) {
    const cost = this.ronin.specialCost;
    if (p.energy < cost) return;
    p.energy -= cost;
    this.shake = Math.max(this.shake, 0.35);
    this.screenFlash = 0.3;
    this.input.vibrate(100, 0.8, 1.0);

    const sy = p.y - PLAYER_H / 2 + 10;
    this.pools.addRing(
      p.x,
      sy - 10,
      95,
      this.ronin.id === "tetsu" ? "#fbbf24" : this.ronin.id === "kaminari" ? "#a5f3fc" : "#ff4d8a",
      0.4,
      5
    );

    if (this.ronin.id === "kaze") {
      this.specials.push({
        x: p.x,
        y: p.y - PLAYER_H / 2,
        vx: 940 * p.facing,
        life: 1.2,
        w: 80,
        h: 90,
        dmg: this.ronin.stats.meleeDmg * 2.5,
        hit: new Set(),
        color: "#ff4d8a",
      });
      this.pools.addParticles(p.x, p.y - PLAYER_H / 2, 24, "#ff4d8a", 440, 3.5);
    } else if (this.ronin.id === "kaminari") {
      for (const ang of [-0.28, 0, 0.28]) {
        const v = 850;
        const pr = this.pools.projectiles.get();
        if (pr) {
          pr.x = p.x;
          pr.y = p.y - PLAYER_H / 2;
          pr.vx = Math.cos(ang) * v * p.facing;
          pr.vy = Math.sin(ang) * v;
          pr.dmg = this.ronin.stats.shurikenDmg * 2.2;
          pr.life = 1.6;
          pr.from = "player";
          pr.color = "#a5f3fc";
          pr.size = 13;
          pr.piercing = true;
        }
      }
      this.pools.addParticles(p.x, p.y - PLAYER_H / 2, 20, "#a5f3fc", 400, 3);
    } else {
      this.slashes.push({
        x: p.x + p.facing * 30,
        y: sy,
        facing: p.facing,
        life: 0.35,
        maxLife: 0.35,
        reach: 130,
        arc: 2.5,
        color: "#fbbf24",
        dmg: this.ronin.stats.meleeDmg * 2.4,
      });
      this.pools.addRing(p.x + p.facing * 50, groundY - 6, 95, "#fbbf24", 0.45, 6);
      this.pools.addParticles(p.x + p.facing * 40, groundY - 6, 26, "#fbbf24", 340, 4);
    }

    this.audio?.playSfx("special");
    this.addStyle(60, p);
  }

  triggerParry(p: PlayerState, perks: AggregatedPerks) {
    if (p.parryCd > 0 || p.parryActive > 0) return;
    p.parryActive = 0.22 + perks.parryWindowBonus;
    p.parryCd = 0.38;

    this.pools.addRing(p.x + p.facing * 18, p.y - PLAYER_H / 2, 38, "#fbbf24", 0.25, 3);
    this.pools.addParticles(p.x + p.facing * 20, p.y - PLAYER_H / 2, 8, "#fef08a", 200, 2);
  }

  damageEnemy(e: EnemyEntity, dmg: number, fromX: number, p: PlayerState, perks: AggregatedPerks, isCrit = false) {
    if (e.dead) return;

    e.hp -= dmg;
    e.hitFlash = 0.14;
    const dir = Math.sign(e.x - fromX) || 1;
    e.kb = dir * 220;

    if (perks.bleedDmgOnHit > 0) {
      e.bleedT = 3.0;
    }

    this.pools.addFloat(
      e.x,
      e.y - e.def.size.h - 4,
      `${isCrit ? "CRIT! " : ""}${Math.round(dmg)}`,
      isCrit ? "#ef4444" : "#fde68a",
      isCrit ? 1.3 : 1.0
    );
    this.pools.addParticles(e.x, e.y - e.def.size.h / 2, 6, e.def.accent, 180, 2.5);
    this.pools.addRing(e.x, e.y - e.def.size.h / 2, 34, e.def.accent, 0.26, 3);

    this.combo++;
    this.comboTimer = 2.5;
    this.score += Math.round(dmg * this.styleMultiplier * (1 + this.combo * 0.02));
    this.audio?.playSfx("hit");

    if (e.hp <= 0) {
      e.dead = true;
      this.stats.kills++;
      if (this.stats.kills >= 10) unlockAchievement("first_blood");

      this.audio?.playSfx("kill");
      this.score += 35;
      this.gold += e.def.gold;
      if (this.gold >= 200) unlockAchievement("waste_baron");

      if (perks.lifestealOnKill > 0) {
        p.hp = Math.min(p.maxHp, p.hp + perks.lifestealOnKill);
        this.pools.addFloat(p.x, p.y - PLAYER_H - 12, `+${perks.lifestealOnKill} HP`, "#34d399");
      }

      p.energy = Math.min(p.maxEnergy, p.energy + 12);
      this.pools.addFloat(e.x, e.y - e.def.size.h, `+${e.def.gold}`, "#fcd34d");
      this.pools.addParticles(e.x, e.y - e.def.size.h / 2, 18, e.def.color, 280, 3);
      this.pools.addRing(e.x, e.y - e.def.size.h / 2, 62, e.def.color, 0.45, 5);

      if (e.def.behavior === "boss") {
        unlockAchievement("shogun_slayer");
        this.shake = 0.9;
        this.slowmo = 0.6;
        this.screenFlash = 0.6;
      }
    }
  }

  hurtPlayer(
    dmg: number,
    fromX: number,
    p: PlayerState,
    perks: AggregatedPerks,
    onDeath: () => void
  ) {
    if (p.invuln > 0) return;

    if (p.parryActive > 0) {
      // Melee counter-parry
      p.parryStreak++;
      this.stats.parries++;
      unlockAchievement("blade_reflection");
      if (p.parryStreak >= 3) unlockAchievement("triple_parry");

      this.hitStop = 0.08;
      this.shake = 0.3;
      this.pools.addFloat(p.x, p.y - PLAYER_H - 16, "COUNTER!", "#fbbf24", 1.4);
      this.pools.addRing(p.x, p.y - PLAYER_H / 2, 70, "#fbbf24", 0.35, 5);
      this.audio?.playSfx("parry");
      this.input.vibrate(90, 0.7, 0.9);

      if (perks.kineticBattery) {
        p.energy = p.maxEnergy;
        this.pools.addFloat(p.x, p.y - PLAYER_H - 32, "FULL ENERGY!", "#38bdf8");
      }

      this.addStyle(60, p);
      return;
    }

    this.waveDamageTaken += dmg;
    p.hp -= dmg;
    p.invuln = 0.7;
    this.shake = Math.max(this.shake, 0.28);
    this.combo = 0;
    p.parryStreak = 0;
    this.stylePoints = Math.max(0, this.stylePoints * 0.6);

    const dir = Math.sign(p.x - fromX) || 1;
    p.vx = dir * 220;
    p.vy = -280;

    this.pools.addFloat(p.x, p.y - PLAYER_H - 4, `-${Math.round(dmg)}`, "#fca5a5");
    this.pools.addParticles(p.x, p.y - PLAYER_H / 2, 12, "#ef4444", 220, 2.5);
    this.audio?.playSfx("hurt");
    this.input.vibrate(120, 0.8, 1.0);

    if (p.hp <= 0) {
      p.hp = 0;
      this.audio?.playSfx("dead");
      recordRunResult(this.score, this.waveIdx + 1, this.stats.kills, this.stats.parries);
      onDeath();
      setTimeout(() => {
        this.callbacks.onGameOver({ win: false, score: this.score, wave: this.waveIdx + 1 });
      }, 900);
    }
  }

  updateCombat(
    dt: number,
    p: PlayerState,
    perks: AggregatedPerks,
    activePerkIds: string[],
    status: GameStatus,
    setStatus: (s: GameStatus) => void
  ) {
    // ---- Environmental Hazards (Electric Grids & Plasma Barrels) ----
    for (const h of this.hazards) {
      if (h.type === "electric_grid" || h.type === "laser_gate") {
        h.timer += dt;
        if (h.timer >= h.maxTimer) {
          h.timer = 0;
          h.active = !h.active;
          if (h.active) {
            this.pools.addParticles(h.x + h.w / 2, h.y + h.h / 2, 8, "#38bdf8", 120, 2);
          }
        }

        if (h.active) {
          // Check player collision
          if (
            p.x >= h.x - 6 &&
            p.x <= h.x + h.w + 6 &&
            p.y >= h.y &&
            p.y - PLAYER_H <= h.y + h.h
          ) {
            this.hurtPlayer(22, h.x + h.w / 2, p, perks, () => setStatus("dead"));
          }

          // Check enemies collision
          for (const e of this.enemies) {
            if (e.dead) continue;
            if (
              e.x >= h.x - 8 &&
              e.x <= h.x + h.w + 8 &&
              e.y + e.def.size.h >= h.y &&
              e.y <= h.y + h.h
            ) {
              this.damageEnemy(e, 40, h.x + h.w / 2, p, perks);
              e.kb = Math.sign(e.x - (h.x + h.w / 2)) * 320;
            }
          }
        }
      } else if (h.type === "plasma_barrel" && !h.exploded) {
        // Check if slashed
        let hitBarrel = false;
        for (const s of this.slashes) {
          const bx = h.x + h.w / 2;
          const by = h.y + h.h / 2;
          if (Math.hypot(bx - s.x, by - s.y) < s.reach + 18) {
            hitBarrel = true;
            break;
          }
        }

        // Check if shot by projectiles
        if (!hitBarrel) {
          this.pools.projectiles.forEachActive((pr) => {
            if (
              pr.x >= h.x &&
              pr.x <= h.x + h.w &&
              pr.y >= h.y &&
              pr.y <= h.y + h.h
            ) {
              hitBarrel = true;
              pr.active = false;
            }
          });
        }

        if (hitBarrel) {
          h.exploded = true;
          const bx = h.x + h.w / 2;
          const by = h.y + h.h / 2;
          this.shake = Math.max(this.shake, 0.7);
          this.screenFlash = 0.45;
          this.audio?.playSfx("special");
          this.input.vibrate(120, 0.8, 1.0);

          this.pools.addRing(bx, by, 150, "#06b6d4", 0.45, 6);
          this.pools.addRing(bx, by, 90, "#fde047", 0.35, 4);
          this.pools.addParticles(bx, by, 32, "#22d3ee", 380, 4);
          this.pools.addParticles(bx, by, 24, "#fbbf24", 280, 3);
          this.pools.addFloat(bx, by - 14, "PLASMA DETONATION!", "#38bdf8", 1.4);

          // AoE damage to nearby enemies
          for (const e of this.enemies) {
            if (e.dead) continue;
            const dist = Math.hypot(e.x - bx, e.y + e.def.size.h / 2 - by);
            if (dist < 190) {
              this.damageEnemy(e, 140, bx, p, perks, true);
              e.kb = Math.sign(e.x - bx) * 480;
            }
          }

          // Damage to player if too close
          const pDist = Math.hypot(p.x - bx, p.y - PLAYER_H / 2 - by);
          if (pDist < 95) {
            this.hurtPlayer(20, bx, p, perks, () => setStatus("dead"));
          }
        }
      }
    }

    // Slashes vs Enemies
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      s.x = p.x + s.facing * 22;
      s.y = p.y - PLAYER_H / 2 + 6;

      for (const e of this.enemies) {
        if (e.dead) continue;
        const ex = e.x - s.x;
        const ey = e.y - e.def.size.h / 2 - s.y;
        const d = Math.hypot(ex, ey);
        if (d < s.reach + e.def.size.w / 2) {
          const ang = Math.atan2(ey, ex);
          const fa = Math.atan2(0, s.facing);
          let diff = Math.abs(ang - fa);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < s.arc / 2) {
            this.damageEnemy(e, s.dmg, s.x, p, perks);
            e.kb += s.facing * 260;
          }
        }
      }
      if (s.life <= 0) this.slashes.splice(i, 1);
    }

    // Specials vs Enemies
    for (let i = this.specials.length - 1; i >= 0; i--) {
      const w = this.specials[i];
      for (const e of this.enemies) {
        if (e.dead || w.hit.has(e)) continue;
        if (
          Math.abs(e.x - w.x) < w.w / 2 + e.def.size.w / 2 &&
          Math.abs(e.y - e.def.size.h / 2 - w.y) < w.h / 2 + e.def.size.h / 2
        ) {
          this.damageEnemy(e, w.dmg, w.x, p, perks);
          w.hit.add(e);
          e.kb += Math.sign(w.vx) * 320;
        }
      }
    }

    // Thunder dash perk
    if (p.dashT > 0 && perks.thunderDash) {
      for (const e of this.enemies) {
        if (!e.dead && Math.abs(e.x - p.x) < 40 && Math.abs(e.y - p.y) < 60) {
          this.damageEnemy(e, 20, p.x, p, perks);
          e.kb += p.facing * 300;
        }
      }
    }

    // Projectile collisions (Parry, Reflection, Damage)
    this.pools.projectiles.forEachActive((pr) => {
      if (pr.from === "player") {
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (
            Math.abs(e.x - pr.x) < e.def.size.w / 2 + pr.size &&
            Math.abs(e.y - e.def.size.h / 2 - pr.y) < e.def.size.h / 2 + pr.size
          ) {
            this.damageEnemy(e, pr.dmg, pr.x, p, perks);
            if (!pr.piercing) {
              pr.active = false;
              break;
            }
          }
        }
      } else {
        // Enemy projectile vs Player
        const pCenterX = p.x;
        const pCenterY = p.y - PLAYER_H / 2;
        const hitX = Math.abs(pr.x - pCenterX) < PLAYER_W / 2 + pr.size;
        const hitY = Math.abs(pr.y - pCenterY) < PLAYER_H / 2 + pr.size;

        if (hitX && hitY) {
          // Check Timed Parry
          if (p.parryActive > 0) {
            p.parryStreak++;
            this.stats.parries++;
            unlockAchievement("blade_reflection");
            if (p.parryStreak >= 3) unlockAchievement("triple_parry");

            pr.from = "player";
            const speed = Math.hypot(pr.vx, pr.vy);
            pr.vx = Math.abs(speed) * p.facing * 1.35;
            pr.vy = (Math.random() - 0.5) * 60;
            pr.dmg = pr.dmg * 2.5 * (1 + perks.bonusReflectedDmgPercent / 100);
            pr.color = "#fbbf24";
            pr.piercing = true;
            pr.life = 2.2;

            this.hitStop = 0.08;
            this.shake = 0.35;
            this.pools.addRing(pr.x, pr.y, 65, "#fbbf24", 0.3, 4);
            this.pools.addParticles(pr.x, pr.y, 14, "#fef08a", 280, 3);
            this.pools.addFloat(p.x, p.y - PLAYER_H - 16, "REFLECTED!", "#fbbf24", 1.3);
            this.audio?.playSfx("parry");
            this.input.vibrate(80, 0.6, 0.8);

            if (perks.kineticBattery) {
              p.energy = p.maxEnergy;
              this.pools.addFloat(p.x, p.y - PLAYER_H - 32, "FULL ENERGY!", "#38bdf8");
            }
            this.addStyle(45, p);
          } else {
            pr.active = false;
            this.hurtPlayer(pr.dmg, pr.x, p, perks, () => setStatus("dead"));
          }
        }
      }
    });

    // Enemy AI & Attack behaviors
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = p.x - e.x;
      const dy = p.y - (e.y + e.def.size.h / 2);
      e.facing = Math.sign(dx) || 1;
      e.atkCd = Math.max(0, e.atkCd - dt);
      e.shootCd = Math.max(0, e.shootCd - dt);

      // Movement AI
      if (e.def.behavior === "grunt") {
        e.vx = e.facing * e.def.speed;
      } else if (e.def.behavior === "archer") {
        if (Math.abs(dx) < 220) e.vx = -e.facing * e.def.speed * 0.85;
        else if (Math.abs(dx) > 380) e.vx = e.facing * e.def.speed;
        else e.vx = 0;

        if (e.shootCd <= 0 && Math.abs(dx) < 650) {
          e.shootCd = e.def.shootCd! * (0.8 + Math.random() * 0.4);
          const pr = this.pools.projectiles.get();
          if (pr) {
            pr.x = e.x;
            pr.y = e.y - e.def.size.h / 2;
            pr.vx = e.facing * e.def.projectileSpeed!;
            pr.vy = -30;
            pr.dmg = e.def.dmg;
            pr.life = 2.4;
            pr.from = "enemy";
            pr.color = "#f43f5e";
            pr.size = 8;
            pr.piercing = false;
          }
        }
      } else if (e.def.behavior === "brute") {
        e.vx = e.facing * e.def.speed;
        if (e.onGround && Math.abs(dx) < 320 && Math.abs(dx) > 100 && e.atkCd <= 0) {
          e.vy = -540;
          e.vx = e.facing * 340;
          e.atkCd = 2.2;
        }
      } else if (e.def.behavior === "boss") {
        if (e.hp < e.def.maxHp * 0.5 && !e.phase2) {
          e.phase2 = true;
          this.screenFlash = 0.5;
          this.shake = 0.7;
          this.audio?.playSfx("bossPhase");
          this.pools.addRing(e.x, e.y - e.def.size.h / 2, 130, "#ef4444", 0.6, 6);
          this.pools.addFloat(e.x, e.y - e.def.size.h - 20, "OVERDRIVE!", "#ef4444", 1.6);
        }

        const spd = e.phase2 ? e.def.speed * 1.35 : e.def.speed;
        e.vx = e.facing * spd;

        if (e.shootCd <= 0) {
          e.shootCd = e.phase2 ? 1.4 : 2.2;
          const count = e.phase2 ? 5 : 3;
          const spread = e.phase2 ? 0.45 : 0.28;
          for (let i = 0; i < count; i++) {
            const base = Math.atan2(dy, dx);
            const ang = base + (i / (count - 1) - 0.5) * spread;
            const pr = this.pools.projectiles.get();
            if (pr) {
              pr.x = e.x;
              pr.y = e.y - e.def.size.h / 2;
              pr.vx = Math.cos(ang) * e.def.projectileSpeed!;
              pr.vy = Math.sin(ang) * e.def.projectileSpeed!;
              pr.dmg = e.def.dmg * 0.8;
              pr.life = 2.5;
              pr.from = "enemy";
              pr.color = "#ff6b6b";
              pr.size = 10;
              pr.piercing = false;
            }
          }
        }
      }

      // Contact damage against player
      if (e.def.behavior !== "archer") {
        const r = e.def.size.w / 2 + PLAYER_W / 2;
        if (Math.abs(dx) < r + 2 && Math.abs(p.y - (e.y + e.def.size.h / 2)) < (PLAYER_H + e.def.size.h) / 2) {
          if (e.atkCd <= 0) {
            e.atkCd = 0.7;
            this.hurtPlayer(e.def.dmg * 0.6, e.x, p, perks, () => setStatus("dead"));
          }
        }
      }
    }

    // Clean up finished enemies
    this.enemies = this.enemies.filter((e) => !(e.dead && e.deathT > 1.2));

    // Check wave completion & Roguelite Perk selection
    if (status === "playing" && this.enemies.every((e) => e.dead)) {
      if (this.waveDamageTaken === 0) {
        unlockAchievement("flawless_wave");
      }

      if (this.waveIdx >= WAVES.length - 1) {
        setStatus("win");
        unlockAchievement("grand_master");
        this.audio?.playSfx("win");
        recordRunResult(this.score, WAVES.length, this.stats.kills, this.stats.parries);
        setTimeout(() => {
          this.callbacks.onGameOver({ win: true, score: this.score, wave: WAVES.length });
        }, 800);
      } else {
        setStatus("perk_select");
        const choices = drawPerkOptions(3, activePerkIds);
        this.callbacks.onPerkDraft(choices);
      }
    }
  }
}
