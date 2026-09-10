interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

interface CyberVehicle {
  x: number;
  y: number;
  speed: number;
  dir: number; // 1 or -1
  color: string;
  size: number;
}

interface NeonSign {
  xPercent: number;
  y: number;
  text: string;
  color: string;
  glow: string;
  flickerRate: number;
}

export class CyberpunkBackground {
  private rain: RainDrop[] = [];
  private ripples: Ripple[] = [];
  private vehicles: CyberVehicle[] = [];
  private signs: NeonSign[] = [
    { xPercent: 0.12, y: 0.52, text: "刀", color: "#38bdf8", glow: "#0284c7", flickerRate: 3 },
    { xPercent: 0.28, y: 0.44, text: "ネオン", color: "#f43f5e", glow: "#e11d48", flickerRate: 2 },
    { xPercent: 0.48, y: 0.38, text: "電脳", color: "#a855f7", glow: "#9333ea", flickerRate: 4 },
    { xPercent: 0.72, y: 0.48, text: "浪人", color: "#fbbf24", glow: "#d97706", flickerRate: 1 },
    { xPercent: 0.88, y: 0.42, text: "疾風", color: "#2dd4bf", glow: "#0d9488", flickerRate: 2.5 },
  ];

  constructor() {
    // Initialize rain drops
    for (let i = 0; i < 90; i++) {
      this.rain.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        speed: 900 + Math.random() * 400,
        length: 12 + Math.random() * 16,
      });
    }

    // Initialize sky vehicles
    const colors = ["#38bdf8", "#f43f5e", "#fbbf24", "#a855f7", "#2dd4bf"];
    for (let i = 0; i < 4; i++) {
      this.vehicles.push({
        x: Math.random() * 1800,
        y: 100 + Math.random() * 220,
        speed: 120 + Math.random() * 140,
        dir: Math.random() < 0.5 ? 1 : -1,
        color: colors[i % colors.length],
        size: 14 + Math.random() * 8,
      });
    }
  }

  public update(dt: number, width: number, groundY: number) {
    // Update Rain
    for (const drop of this.rain) {
      drop.y += drop.speed * dt;
      drop.x -= drop.speed * 0.25 * dt; // slant wind

      if (drop.y >= groundY) {
        // Spawn ground puddle ripple
        if (this.ripples.length < 35 && Math.random() < 0.4) {
          this.ripples.push({
            x: drop.x,
            y: groundY + Math.random() * 18,
            radius: 2,
            maxRadius: 10 + Math.random() * 12,
            life: 0.4,
          });
        }
        drop.y = -20;
        drop.x = Math.random() * (width + 400);
      }
    }

    // Update Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.life -= dt;
      rip.radius += (rip.maxRadius - rip.radius) * 6 * dt;
      if (rip.life <= 0) {
        this.ripples.splice(i, 1);
      }
    }

    // Update Flying Vehicles
    for (const v of this.vehicles) {
      v.x += v.dir * v.speed * dt;
      if (v.dir === 1 && v.x > width + 100) {
        v.x = -100;
        v.y = 80 + Math.random() * 220;
      } else if (v.dir === -1 && v.x < -100) {
        v.x = width + 100;
        v.y = 80 + Math.random() * 220;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, groundY: number, time: number) {
    // 1. Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#080214");
    sky.addColorStop(0.35, "#1f043a");
    sky.addColorStop(0.7, "#580a6b");
    sky.addColorStop(1, "#b51770");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // 2. Retro Synthwave Sun
    const sunX = width * 0.72;
    const sunY = height * 0.38;
    const sunRadius = Math.min(width, height) * 0.2;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.1, sunX, sunY, sunRadius * 1.3);
    sunGlow.addColorStop(0, "rgba(255, 230, 150, 0.9)");
    sunGlow.addColorStop(0.4, "rgba(255, 77, 138, 0.7)");
    sunGlow.addColorStop(1, "rgba(255, 77, 138, 0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffb36b";
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Sun horizontal scan-cuts
    ctx.fillStyle = "#220538";
    for (let i = 0; i < 6; i++) {
      const barY = sunY + sunRadius * 0.25 + i * (sunRadius * 0.1);
      ctx.fillRect(sunX - sunRadius, barY, sunRadius * 2, sunRadius * 0.05);
    }

    // 3. Distant Megatower Skyline (Parallax Layer 1)
    ctx.fillStyle = "#150428";
    this.drawSkyline(ctx, width, groundY, 42, 180, 0.04, time);

    // 4. Midground Cyber Towers with Window Lights (Parallax Layer 2)
    ctx.fillStyle = "#20063d";
    this.drawSkyline(ctx, width, groundY, 65, 240, 0.08, time);

    // 5. Holographic Kanji Signs
    ctx.save();
    for (const sign of this.signs) {
      const sx = sign.xPercent * width;
      const sy = groundY - sign.y * 240;
      const flicker = Math.sin(time * sign.flickerRate * 4) > 0.85 ? 0.3 : 0.95;

      ctx.font = "bold 26px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = sign.glow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = sign.color;
      ctx.globalAlpha = flicker;
      ctx.fillText(sign.text, sx, sy);
    }
    ctx.restore();

    // 6. Flying Vehicles (Spinners with Headlights & Tail Lights)
    ctx.save();
    for (const v of this.vehicles) {
      ctx.fillStyle = "#110220";
      ctx.fillRect(v.x - v.size / 2, v.y - 4, v.size, 8);

      // Headlight Beam
      const beamLen = 60 * v.dir;
      const beamGrad = ctx.createLinearGradient(v.x, v.y, v.x + beamLen, v.y);
      beamGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(v.x + (v.size / 2) * v.dir, v.y - 2);
      ctx.lineTo(v.x + beamLen, v.y - 8);
      ctx.lineTo(v.x + beamLen, v.y + 8);
      ctx.lineTo(v.x + (v.size / 2) * v.dir, v.y + 2);
      ctx.fill();

      // Rear Engine Glow
      ctx.shadowColor = v.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = v.color;
      ctx.fillRect(v.x - (v.size / 2) * v.dir - 2 * v.dir, v.y - 2, 4, 4);
    }
    ctx.restore();

    // 7. Ground Gradient
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, "#19032b");
    groundGrad.addColorStop(0.4, "#0b0116");
    groundGrad.addColorStop(1, "#030008");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // 8. 3D Perspective Neon Grid on Floor
    ctx.save();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#f43f5e";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Horizontal receding lines
    ctx.strokeStyle = "rgba(244, 63, 94, 0.28)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 15; i++) {
      const y = groundY + Math.pow(i / 15, 1.4) * (height - groundY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical converging lines to horizon
    const vanishX = width * 0.5;
    const vanishY = groundY;
    const numLines = 26;
    for (let i = -numLines / 2; i <= numLines / 2; i++) {
      const bottomX = vanishX + i * 85;
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }
    ctx.restore();

    // 9. Rain Ripples on Ground
    ctx.save();
    for (const rip of this.ripples) {
      ctx.strokeStyle = "rgba(103, 232, 249, " + (rip.life / 0.4) * 0.6 + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 10. Digital Angled Rain Streaks
    ctx.save();
    ctx.strokeStyle = "rgba(165, 243, 252, 0.4)";
    ctx.lineWidth = 1.2;
    for (const drop of this.rain) {
      if (drop.y > groundY) continue;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.35, drop.y + drop.length);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSkyline(
    ctx: CanvasRenderingContext2D,
    width: number,
    groundY: number,
    buildingWidth: number,
    maxHeight: number,
    _parallaxFactor: number,
    time: number
  ) {
    let x = 0;
    let bIdx = 0;
    while (x < width) {
      const seed = Math.sin(bIdx * 12.345) * 10000;
      const rand = seed - Math.floor(seed);
      const bH = 80 + rand * maxHeight;
      const bW = buildingWidth + ((rand * 31) % 25);
      const topY = groundY - bH;

      ctx.fillRect(x, topY, bW, bH);

      // Window Light matrix
      if (rand > 0.3) {
        ctx.save();
        const rows = Math.floor(bH / 16);
        const cols = Math.floor(bW / 12);
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 1; c < cols - 1; c++) {
            const winSeed = Math.sin(bIdx * 50 + r * 10 + c) * 1000;
            const winRand = winSeed - Math.floor(winSeed);
            if (winRand > 0.65) {
              const flicker = Math.sin(time * 2 + r + c) > 0.9 ? 0.2 : 0.8;
              ctx.fillStyle = winRand > 0.85 ? `rgba(244, 63, 94, ${flicker * 0.7})` : `rgba(56, 189, 248, ${flicker * 0.7})`;
              ctx.fillRect(x + c * 12, topY + r * 16, 5, 8);
            }
          }
        }
        ctx.restore();
      }

      // Tower antenna
      if (rand > 0.7) {
        ctx.fillRect(x + bW / 2 - 1, topY - 24, 2, 24);
        ctx.fillStyle = Math.sin(time * 3 + bIdx) > 0 ? "#ef4444" : "#450a0a";
        ctx.fillRect(x + bW / 2 - 2, topY - 26, 4, 4);
        ctx.fillStyle = "#20063d";
      }

      x += bW + 6;
      bIdx++;
    }
  }
}
