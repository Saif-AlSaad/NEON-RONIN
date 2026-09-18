import type { Ronin } from "../types";
import { WAVES } from "../ronin";
import type { CyberpunkBackground } from "../background";
import {
  PLAYER_W,
  PLAYER_H,
  type PlayerState,
  type EnemyEntity,
  type SpecialEntity,
  type SlashEntity,
} from "./types";
import type { EnginePools } from "./ObjectPool";
import type { CombatSystem } from "./CombatSystem";

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class RenderSystem {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private ronin: Ronin,
    private bg: CyberpunkBackground
  ) {}

  setRonin(ronin: Ronin) {
    this.ronin = ronin;
  }

  drawPlayer(p: PlayerState) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.invuln > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Dynamic blade / dash glow
    if (p.parryActive > 0) {
      ctx.shadowColor = "#fde047";
      ctx.shadowBlur = 28;
    } else if (p.dashT > 0) {
      ctx.shadowColor = "#67e8f9";
      ctx.shadowBlur = 24;
    }

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.save();
    ctx.scale(p.facing, 1);

    // Legs
    ctx.fillStyle = "#1f1036";
    ctx.fillRect(-8, -20, 6, 20);
    ctx.fillRect(2, -20, 6, 20);

    // Tunic
    ctx.fillStyle =
      p.dashT > 0
        ? "#a5f3fc"
        : this.ronin.id === "tetsu"
        ? "#ef4444"
        : this.ronin.id === "kaminari"
        ? "#a855f7"
        : "#22d3ee";
    rr(ctx, -11, -44, 22, 26, 6);
    ctx.fill();

    // Obi Sash
    ctx.fillStyle = "#111827";
    ctx.fillRect(-11, -24, 22, 4);

    // Head
    ctx.fillStyle = "#f1c27d";
    ctx.beginPath();
    ctx.arc(0, -50, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hachimaki Headband
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-10, -54, 20, 4);
    ctx.fillRect(7, -54, 5, 6);

    // Eyes
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(3, -50, 2, 2);
    ctx.fillRect(-4, -50, 2, 2);

    // Katana
    const slashing = p.slashActive > 0;
    const parrying = p.parryActive > 0;
    const swordAng = parrying
      ? -Math.PI * 0.75
      : slashing
      ? (1 - p.slashActive / 0.18) * -Math.PI * 0.9 - 0.3
      : -0.4;

    ctx.save();
    ctx.translate(8, -30);
    ctx.rotate(swordAng);

    // Hilt
    ctx.fillStyle = "#111827";
    ctx.fillRect(-2, -3, 10, 6);

    // Blade
    const bladeGrad = ctx.createLinearGradient(8, 0, 56, 0);
    bladeGrad.addColorStop(0, parrying ? "#fef08a" : "#e0f2fe");
    bladeGrad.addColorStop(1, parrying ? "#fbbf24" : "#93c5fd");
    ctx.fillStyle = bladeGrad;
    ctx.shadowColor = parrying ? "#fbbf24" : "#67e8f9";
    ctx.shadowBlur = slashing || parrying ? 20 : 8;
    ctx.fillRect(8, -2, 48, 4);
    ctx.shadowBlur = 0;

    ctx.restore();
    ctx.restore();
    ctx.restore();
  }

  drawEnemies(enemies: EnemyEntity[], bgTime: number) {
    const ctx = this.ctx;
    for (const e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const w = e.def.size.w,
        h = e.def.size.h;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(0, 2, w * 0.55, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.scale(e.facing, 1);
      if (e.hitFlash > 0) {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 20;
      }

      if (e.def.behavior === "grunt") {
        ctx.fillStyle = e.def.color;
        rr(ctx, -w / 2, -h, w, h - 6, 5);
        ctx.fill();
        ctx.fillStyle = "#1a0533";
        ctx.fillRect(-w / 2, -h + 14, w, 4);
        ctx.fillStyle = e.def.accent;
        ctx.beginPath();
        ctx.arc(0, -h - 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(3, -h - 3, 3, 2);
        ctx.fillRect(-6, -h - 3, 3, 2);
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(w / 2 - 2, -h + 10, 22, 3);
      } else if (e.def.behavior === "archer") {
        ctx.fillStyle = e.def.color;
        rr(ctx, -w / 2, -h, w, h - 8, 5);
        ctx.fill();
        ctx.fillStyle = e.def.accent;
        ctx.beginPath();
        ctx.arc(0, -h - 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(3, -h - 3, 2, 2);
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w / 2 + 4, -h / 2, 16, -1, 1);
        ctx.stroke();
      } else if (e.def.behavior === "brute") {
        ctx.fillStyle = e.def.color;
        rr(ctx, -w / 2, -h, w, h - 4, 8);
        ctx.fill();
        ctx.fillStyle = "#991b1b";
        ctx.fillRect(-w / 2, -h + 18, w, 6);
        ctx.fillStyle = e.def.accent;
        ctx.beginPath();
        ctx.arc(0, -h, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.moveTo(-10, -h - 4);
        ctx.lineTo(-16, -h - 20);
        ctx.lineTo(-6, -h - 8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, -h - 4);
        ctx.lineTo(16, -h - 20);
        ctx.lineTo(6, -h - 8);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-6, -h - 2, 3, 3);
        ctx.fillRect(3, -h - 2, 3, 3);
      } else {
        // Boss
        ctx.fillStyle = e.def.color;
        rr(ctx, -w / 2, -h, w, h - 6, 10);
        ctx.fill();
        ctx.fillStyle = e.phase2 ? "#450a0a" : "#7f1d1d";
        ctx.fillRect(-w / 2, -h + 22, w, 10);
        ctx.fillStyle = e.def.accent;
        ctx.beginPath();
        ctx.arc(0, -h + 2, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-8, -h - 2, 4, 4);
        ctx.fillRect(4, -h - 2, 4, 4);
        ctx.fillStyle = e.phase2 ? "#fde047" : "#fcd34d";
        ctx.beginPath();
        ctx.moveTo(0, -h - 14);
        ctx.lineTo(-14, -h + 2);
        ctx.lineTo(14, -h + 2);
        ctx.fill();
        ctx.fillStyle = "#1f1036";
        rr(ctx, w / 2, -h + 10, 36, 10, 4);
        ctx.fill();
        if (e.phase2) {
          ctx.fillStyle = "rgba(239,68,68,0.2)";
          ctx.beginPath();
          ctx.arc(0, -h / 2, 70 + Math.sin(bgTime * 10) * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      ctx.restore();

      // Enemy HP Bar
      if (!e.dead && (e.def.behavior === "boss" || e.hp < e.def.maxHp)) {
        const bw = e.def.behavior === "boss" ? 160 : 50;
        const bx = e.x - bw / 2;
        const by = e.y - e.def.size.h - 14;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        rr(ctx, bx - 1, by - 1, bw + 2, 7, 3);
        ctx.fill();
        ctx.fillStyle = e.def.behavior === "boss" ? "#ef4444" : "#fb7185";
        rr(ctx, bx, by, bw * Math.max(0, e.hp / e.def.maxHp), 5, 2);
        ctx.fill();
      }
    }
  }

  drawProjectiles(pools: EnginePools) {
    const ctx = this.ctx;
    pools.projectiles.forEachActive((pr) => {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.shadowColor = pr.color;
      ctx.shadowBlur = 14;
      if (pr.from === "player") {
        ctx.rotate(pr.vx > 0 ? 0 : Math.PI);
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(2, -5);
        ctx.lineTo(2, 5);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(0, 0, pr.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  drawHUD(p: PlayerState, combat: CombatSystem, w: number, h: number, bgTime: number) {
    const ctx = this.ctx;

    // Top Left: Player Status
    const bx = 24,
      by = 24;
    ctx.fillStyle = "rgba(10,3,24,0.75)";
    rr(ctx, bx, by, 290, 88, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(56,189,248,0.4)";
    ctx.lineWidth = 1.5;
    rr(ctx, bx, by, 290, 88, 14);
    ctx.stroke();

    // HP Bar
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = "#fca5a5";
    ctx.fillText("HP", bx + 14, by + 24);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    rr(ctx, bx + 44, by + 13, 230, 14, 6);
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    rr(ctx, bx + 44, by + 13, 230 * Math.max(0, p.hp / p.maxHp), 14, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxHp}`, bx + 220, by + 25);

    // Energy Bar
    ctx.fillStyle = "#67e8f9";
    ctx.fillText("EN", bx + 14, by + 48);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    rr(ctx, bx + 44, by + 38, 230, 12, 5);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    rr(ctx, bx + 44, by + 38, 230 * Math.max(0, p.energy / p.maxEnergy), 12, 5);
    ctx.fill();

    // Character & Badges
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillText(`${this.ronin.name} · ${this.ronin.title}`, bx + 14, by + 72);

    // Dash & Parry indicators
    const dashReady = p.dashCd <= 0;
    ctx.fillStyle = dashReady ? "#22d3ee" : "rgba(100,116,139,0.4)";
    rr(ctx, bx + 155, by + 63, 60, 12, 4);
    ctx.fill();
    ctx.fillStyle = "#0a0318";
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.fillText("DASH", bx + 172, by + 72);

    const parryReady = p.parryCd <= 0;
    ctx.fillStyle = parryReady ? "#fde047" : "rgba(100,116,139,0.4)";
    rr(ctx, bx + 222, by + 63, 56, 12, 4);
    ctx.fill();
    ctx.fillStyle = "#0a0318";
    ctx.fillText("PARRY", bx + 235, by + 72);

    // Top Right: Style Rating & Score
    const bw2 = 250;
    ctx.fillStyle = "rgba(10,3,24,0.75)";
    rr(ctx, w - bw2 - 24, 24, bw2, 108, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(236,72,153,0.4)";
    ctx.lineWidth = 1.5;
    rr(ctx, w - bw2 - 24, 24, bw2, 108, 14);
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.fillStyle = "#fcd34d";
    ctx.font = "bold 20px Cinzel, serif";
    ctx.fillText(`SCORE ${combat.score}`, w - 38, 48);
    ctx.fillStyle = "#f9a8d4";
    ctx.font = "600 13px Inter, sans-serif";
    ctx.fillText(`Wave ${combat.waveIdx + 1} / ${WAVES.length}`, w - 38, 68);
    ctx.fillStyle = "#fca5a5";
    ctx.fillText(`🪙 ${combat.gold}`, w - 38, 86);

    // Style Rank Badge
    ctx.textAlign = "left";
    const styleRankColors: Record<string, string> = {
      D: "#94a3b8",
      C: "#38bdf8",
      B: "#a855f7",
      A: "#f43f5e",
      S: "#fbbf24",
      SSS: "#ec4899",
    };
    const rColor = styleRankColors[combat.styleRank] || "#38bdf8";

    ctx.font = "900 24px 'Inter', sans-serif";
    ctx.fillStyle = rColor;
    ctx.shadowColor = rColor;
    ctx.shadowBlur = 12;
    ctx.fillText(combat.styleRank, w - bw2 - 12, 60);
    ctx.shadowBlur = 0;

    ctx.font = "bold 10px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(`${combat.styleMultiplier.toFixed(1)}x`, w - bw2 - 12, 78);

    if (combat.combo > 1) {
      ctx.textAlign = "right";
      ctx.fillStyle = `hsl(${(bgTime * 180) % 360}, 90%, 65%)`;
      ctx.font = "800 15px Inter, sans-serif";
      ctx.fillText(`×${combat.combo} COMBO`, w - 38, 118);
    }
    ctx.textAlign = "left";

    // Wave Title Banner
    if (combat.waveTitleT > 0) {
      ctx.save();
      const a = Math.min(1, combat.waveTitleT / 2.5) * (combat.waveTitleT > 2 ? (combat.waveTitleT - 2) * 2 : 1);
      ctx.globalAlpha = a;
      ctx.textAlign = "center";
      ctx.font = "800 48px Cinzel, serif";
      ctx.fillStyle = "#fde68a";
      ctx.shadowColor = "#ec4899";
      ctx.shadowBlur = 24;
      ctx.fillText(combat.waveTitleText, w / 2, h / 2 - 40);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Controls Hint
    ctx.textAlign = "left";
    ctx.font = "500 12px Inter, sans-serif";
    ctx.fillStyle = "rgba(226,232,240,0.6)";
    ctx.fillText(
      "WASD move · J slash · K shuriken · L special · Shift dash · F parry · Space double-jump · Gamepad supported",
      24,
      h - 22
    );
  }

  render(
    w: number,
    h: number,
    groundY: number,
    bgTime: number,
    p: PlayerState,
    combat: CombatSystem,
    pools: EnginePools
  ) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    // Parallax background
    this.bg.render(ctx, w, h, groundY, bgTime);

    // Screen Shake
    const shakeX = combat.shake > 0 ? (Math.random() - 0.5) * combat.shake * 24 : 0;
    const shakeY = combat.shake > 0 ? (Math.random() - 0.5) * combat.shake * 24 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Enemies
    this.drawEnemies(combat.enemies, bgTime);

    // Specials
    for (const s of combat.specials) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 30;
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
      ctx.restore();
    }

    // Projectiles
    this.drawProjectiles(pools);

    // Player
    this.drawPlayer(p);

    // Rings
    pools.rings.forEachActive((r) => {
      const k = 1 - r.life / r.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(1, r.width * (1 - k));
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.maxRadius * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Particles & Floats
    pools.particles.forEachActive((pt) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    pools.floats.forEachActive((f) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      ctx.font = `bold ${Math.round(18 * (f.scale ?? 1))}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = f.color;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // Scanlines & Vignette
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    if (combat.screenFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.4, combat.screenFlash * 0.6)})`;
      ctx.fillRect(0, 0, w, h);
    }

    this.drawHUD(p, combat, w, h, bgTime);
  }
}
