import {
  GRAVITY,
  PLAYER_W,
  PLAYER_H,
  DASH_SPEED,
  ARENA_PADDING,
  type PlayerState,
  type EnemyEntity,
  type SpecialEntity,
} from "./types";
import type { EnginePools } from "./ObjectPool";
import type { AggregatedPerks } from "../perks";
import type { InputState } from "../input";

export class PhysicsSystem {
  updatePlayer(
    dt: number,
    p: PlayerState,
    inputState: InputState,
    perks: AggregatedPerks,
    pools: EnginePools,
    w: number,
    groundY: number
  ) {
    const moveSpeed = 260 * (1 + perks.bonusSpeedPercent / 100);

    // Movement & Dash
    if (p.dashT > 0) {
      p.dashT -= dt;
      p.vx = DASH_SPEED * p.facing;
      pools.addAfterimage(p.x, p.y, p.facing, 0.3, "#67e8f9");

      if (perks.plasmaDashTrail) {
        pools.addParticle(p.x, p.y - 12, 0, 0, 0.4, 0.6, "#06b6d4", 3);
      }
    } else {
      const move = inputState.moveX;
      if (Math.abs(move) > 0.1) {
        p.facing = Math.sign(move);
        p.vx = move * moveSpeed;
      } else {
        p.vx *= 0.6;
      }
    }

    // Cooldown decays
    p.atkCd = Math.max(0, p.atkCd - dt);
    p.shurikenCd = Math.max(0, p.shurikenCd - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.parryActive = Math.max(0, p.parryActive - dt);
    p.parryCd = Math.max(0, p.parryCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.slashActive = Math.max(0, p.slashActive - dt);

    // Energy recovery
    const regen = 12 + perks.bonusEnergyRegen;
    p.energy = Math.min(p.maxEnergy, p.energy + regen * dt);

    // Gravity & position integration
    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.y > groundY) {
      p.y = groundY;
      p.vy = 0;
      p.onGround = true;
      p.jumps = 0;
    } else {
      p.onGround = false;
    }
    p.x = Math.max(ARENA_PADDING + PLAYER_W / 2, Math.min(w - ARENA_PADDING - PLAYER_W / 2, p.x));

    // Sword trail points
    if (p.slashActive > 0) {
      const tipX = p.x + p.facing * 64;
      const tipY = p.y - PLAYER_H / 2;
      p.swordTrail.push({ x: tipX, y: tipY, life: 0.16 });
    }
    for (let i = p.swordTrail.length - 1; i >= 0; i--) {
      p.swordTrail[i].life -= dt;
      if (p.swordTrail[i].life <= 0) p.swordTrail.splice(i, 1);
    }
  }

  updateEnemies(dt: number, enemies: EnemyEntity[], w: number, groundY: number) {
    for (const e of enemies) {
      if (e.dead) {
        e.deathT += dt;
        continue;
      }

      // Bleed damage-over-time tick
      if (e.bleedT && e.bleedT > 0) {
        e.bleedT -= dt;
        e.hp -= 18 * dt;
      }

      // Hitflash decay
      e.hitFlash = Math.max(0, e.hitFlash - dt);

      // Knockback damping
      e.x += e.kb * dt;
      e.kb *= 0.88;

      // Enemy gravity and position
      e.vy += GRAVITY * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.y + e.def.size.h > groundY) {
        e.y = groundY - e.def.size.h;
        e.vy = 0;
        e.onGround = true;
      } else {
        e.onGround = false;
      }
      e.x = Math.max(-120, Math.min(w + 120, e.x));
    }
  }

  updateProjectiles(dt: number, pools: EnginePools) {
    pools.projectiles.forEachActive((pr) => {
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      // Subtle particle trail behind projectiles
      pools.addParticle(
        pr.x,
        pr.y,
        -pr.vx * 0.04,
        -pr.vy * 0.04,
        0.18,
        0.3,
        pr.color,
        pr.size * 0.35
      );

      if (pr.life <= 0) {
        pr.active = false;
      }
    });
  }

  updateSpecials(dt: number, specials: SpecialEntity[], w: number) {
    for (let i = specials.length - 1; i >= 0; i--) {
      const sp = specials[i];
      sp.life -= dt;
      sp.x += sp.vx * dt;
      if (sp.life <= 0 || sp.x < -100 || sp.x > w + 100) {
        specials.splice(i, 1);
      }
    }
  }

  updateVfx(dt: number, pools: EnginePools) {
    // Particles
    pools.particles.forEachActive((pt) => {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 320 * dt; // slight particle gravity
      if (pt.life <= 0) pt.active = false;
    });

    // Floats
    pools.floats.forEachActive((f) => {
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) f.active = false;
    });

    // Rings
    pools.rings.forEachActive((r) => {
      r.life -= dt;
      if (r.life <= 0) r.active = false;
    });

    // Afterimages
    pools.afterimages.forEachActive((a) => {
      a.life -= dt;
      if (a.life <= 0) a.active = false;
    });
  }
}
