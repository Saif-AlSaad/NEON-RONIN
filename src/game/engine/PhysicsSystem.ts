import {
  GRAVITY,
  PLAYER_W,
  PLAYER_H,
  DASH_SPEED,
  ARENA_PADDING,
  WALL_SLIDE_SPEED,
  type PlayerState,
  type EnemyEntity,
  type SpecialEntity,
  type PlatformEntity,
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
    groundY: number,
    platforms: PlatformEntity[] = []
  ) {
    const moveSpeed = 260 * (1 + perks.bonusSpeedPercent / 100);
    const jumpSpeed = 720 * (1 + perks.bonusJumpPercent / 100);
    const leftWall = ARENA_PADDING + PLAYER_W / 2;
    const rightWall = w - ARENA_PADDING - PLAYER_W / 2;

    // 1. Drop-Through Platforms Trigger (Down + Jump)
    if (p.currentPlatformId && inputState.moveY > 0.4 && inputState.jump) {
      p.dropThroughTimer = 0.3;
      p.onGround = false;
      p.currentPlatformId = null;
      p.y += 6;
      p.vy = 160;
      pools.addParticles(p.x, p.y, 5, "#38bdf8", 120, 2);
    }
    if (p.dropThroughTimer > 0) {
      p.dropThroughTimer -= dt;
    }

    // 2. Wall-Slide & Wall-Jump Mechanics
    if (!p.onGround && p.dashT <= 0) {
      const touchingLeft = p.x <= leftWall + 4 && inputState.moveX < -0.2;
      const touchingRight = p.x >= rightWall - 4 && inputState.moveX > 0.2;

      if (touchingLeft) {
        p.wallSliding = true;
        p.wallDir = -1;
      } else if (touchingRight) {
        p.wallSliding = true;
        p.wallDir = 1;
      } else {
        p.wallSliding = false;
      }

      if (p.wallSliding) {
        // Clamp downward fall speed on walls
        if (p.vy > 0) {
          p.vy = Math.min(p.vy, WALL_SLIDE_SPEED);
        }

        // Emit friction sparks
        if (Math.random() < 0.45) {
          pools.addParticle(
            p.x + p.wallDir * 8,
            p.y - 18,
            -p.wallDir * (40 + Math.random() * 60),
            -20 - Math.random() * 40,
            0.22,
            0.35,
            "#fde047",
            2.2
          );
        }

        // Acrobatic Wall Jump
        if (inputState.jump) {
          p.vy = -jumpSpeed * 0.96;
          p.vx = -p.wallDir * 480;
          p.facing = -p.wallDir;
          p.wallSliding = false;
          p.jumps = 1;
          pools.addRing(p.x, p.y - 20, 36, "#38bdf8", 0.25, 3);
          pools.addParticles(p.x, p.y - 20, 8, "#67e8f9", 220, 2.5);
        }
      }
    } else {
      p.wallSliding = false;
    }

    // 3. Movement & Dash
    if (p.dashT > 0) {
      p.dashT -= dt;
      p.vx = DASH_SPEED * p.facing;
      pools.addAfterimage(p.x, p.y, p.facing, 0.3, "#67e8f9");

      if (perks.plasmaDashTrail) {
        pools.addParticle(p.x, p.y - 12, 0, 0, 0.4, 0.6, "#06b6d4", 3);
      }
    } else if (!p.wallSliding) {
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
    const prevY = p.y;
    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // 4. One-Way Platform Collision Checking
    let onPlat = false;
    if (p.dropThroughTimer <= 0 && p.vy >= 0) {
      for (const plat of platforms) {
        const withinX = p.x + PLAYER_W / 2 >= plat.x && p.x - PLAYER_W / 2 <= plat.x + plat.w;
        if (withinX && p.y >= plat.y && prevY <= plat.y + 16) {
          p.y = plat.y;
          p.vy = 0;
          p.onGround = true;
          p.jumps = 0;
          p.currentPlatformId = plat.id;
          onPlat = true;
          break;
        }
      }
    }

    // 5. Arena Ground Clamping
    if (!onPlat) {
      if (p.y >= groundY) {
        p.y = groundY;
        p.vy = 0;
        p.onGround = true;
        p.jumps = 0;
        p.currentPlatformId = null;
      } else {
        p.onGround = false;
        p.currentPlatformId = null;
      }
    }

    p.x = Math.max(leftWall, Math.min(rightWall, p.x));

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

  updateEnemies(
    dt: number,
    enemies: EnemyEntity[],
    w: number,
    groundY: number,
    platforms: PlatformEntity[] = [],
    playerY?: number
  ) {
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
      const prevY = e.y + e.def.size.h;
      e.vy += GRAVITY * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      const footY = e.y + e.def.size.h;

      // Check Platforms for Enemies
      let onPlat = false;
      if (e.vy >= 0) {
        for (const plat of platforms) {
          const withinX = e.x + e.def.size.w / 2 >= plat.x && e.x - e.def.size.w / 2 <= plat.x + plat.w;
          if (withinX && footY >= plat.y && prevY <= plat.y + 18) {
            e.y = plat.y - e.def.size.h;
            e.vy = 0;
            e.onGround = true;
            e.currentPlatformId = plat.id;
            onPlat = true;

            // If player is far below on the ground, enemies can drop down
            if (playerY && playerY > plat.y + 60 && Math.random() < 0.015) {
              e.y += 6;
              e.vy = 120;
              e.onGround = false;
              e.currentPlatformId = null;
            }
            break;
          }
        }
      }

      if (!onPlat) {
        if (footY >= groundY) {
          e.y = groundY - e.def.size.h;
          e.vy = 0;
          e.onGround = true;
          e.currentPlatformId = null;
        } else {
          e.onGround = false;
        }
      }

      e.x = Math.max(-120, Math.min(w + 120, e.x));
    }
  }

  updateProjectiles(dt: number, pools: EnginePools) {
    pools.projectiles.forEachActive((pr) => {
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      // Particle trail behind projectiles
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
    pools.particles.forEachActive((pt) => {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 320 * dt;
      if (pt.life <= 0) pt.active = false;
    });

    pools.floats.forEachActive((f) => {
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) f.active = false;
    });

    pools.rings.forEachActive((r) => {
      r.life -= dt;
      if (r.life <= 0) r.active = false;
    });

    pools.afterimages.forEachActive((a) => {
      a.life -= dt;
      if (a.life <= 0) a.active = false;
    });
  }
}
