import React, { useEffect, useRef, useState } from "react";
import type { Ronin, EnemyDef } from "../types";
import { ENEMIES, WAVES } from "../game/ronin";
import { GameAudio } from "../game/audio";
import { CyberpunkBackground } from "../game/background";
import { InputManager } from "../game/input";
import {
  drawPerkOptions,
  aggregatePerks,
  type Perk,
  type AggregatedPerks,
} from "../game/perks";
import {
  unlockAchievement,
  recordRunResult,
} from "../game/achievements";
import PerkSelectModal from "./PerkSelectModal";
import TouchControls from "./TouchControls";
import AchievementsModal from "./AchievementsModal";
import AchievementToast from "./AchievementToast";

interface Props {
  ronin: Ronin;
  onTitle: () => void;
  onRestart: () => void;
}

type Status = "ready" | "playing" | "wave_interlude" | "perk_select" | "win" | "dead";

interface Enemy {
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
}

interface Projectile {
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

interface SlashFx {
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
  scale?: number;
}

interface SpecialWave {
  x: number;
  y: number;
  vx: number;
  life: number;
  w: number;
  h: number;
  dmg: number;
  hit: Set<Enemy>;
  color: string;
}

interface RingFx {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
  color: string;
  width: number;
}

interface Afterimage {
  x: number;
  y: number;
  facing: number;
  life: number;
  color: string;
}

interface SwordTrailPoint {
  x: number;
  y: number;
  life: number;
}

const GRAVITY = 2200;
const GROUND_OFFSET = 160;
const PLAYER_W = 26;
const PLAYER_H = 46;
const DASH_SPEED = 780;
const DASH_DURATION = 0.18;
const DOUBLE_JUMP = true;
const ARENA_PADDING = 40;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadVol(key: string, def: number) {
  const v = parseFloat(localStorage.getItem(key) ?? "");
  return Number.isNaN(v) ? def : v;
}

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 flex justify-between font-story text-xs text-pink-200/80">
        <span>{label}</span>
        <span className="font-sans text-cyan-200">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer accent-fuchsia-400"
      />
    </label>
  );
}

export default function NeonArena({ ronin, onTitle, onRestart }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const audioRef = useRef<GameAudio | null>(null);
  const inputRef = useRef<InputManager | null>(null);

  const [result, setResult] = useState<{ win: boolean; score: number; wave: number } | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showSound, setShowSound] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [touchEnabled, setTouchEnabled] = useState(
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
  const [gamepadNotice, setGamepadNotice] = useState<string | null>(null);

  // Roguelite Perks state
  const [activePerks, setActivePerks] = useState<Perk[]>([]);
  const [perkChoices, setPerkChoices] = useState<Perk[] | null>(null);
  const activePerksRef = useRef<AggregatedPerks>(aggregatePerks([]));

  const [volumes, setVolumes] = useState({
    master: loadVol("nr_master", 0.9),
    music: loadVol("nr_music", 1),
    sfx: loadVol("nr_sfx", 0.55),
    muted: localStorage.getItem("nr_muted") === "1",
  });

  const changeVolume = (k: "master" | "music" | "sfx", v: number) => {
    setVolumes((p) => ({ ...p, [k]: v }));
    localStorage.setItem(`nr_${k}`, String(v));
    if (k === "master") audioRef.current?.setMasterVolume(v);
    else if (k === "music") audioRef.current?.setMusicVolume(v);
    else audioRef.current?.setSfxVolume(v);
  };

  const toggleMute = () => {
    setVolumes((p) => {
      const next = !p.muted;
      localStorage.setItem("nr_muted", next ? "1" : "0");
      audioRef.current?.setMuted(next);
      return { ...p, muted: next };
    });
  };

  const ensureAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new GameAudio();
      audioRef.current.setMasterVolume(volumes.master);
      audioRef.current.setMusicVolume(volumes.music);
      audioRef.current.setSfxVolume(volumes.sfx);
      audioRef.current.setMuted(volumes.muted);
    }
    audioRef.current.start();
    audioRef.current.resume();
  };

  const handleSelectPerk = (chosen: Perk) => {
    setActivePerks((prev) => {
      const next = [...prev, chosen];
      activePerksRef.current = aggregatePerks(next);
      if (chosen.effect.bonusMaxHp && gameRef.current) {
        gameRef.current.p.maxHp += chosen.effect.bonusMaxHp;
        gameRef.current.p.hp = Math.min(gameRef.current.p.maxHp, gameRef.current.p.hp + chosen.effect.bonusMaxHp);
      }
      if (next.length >= 3) {
        unlockAchievement("cyber_augmented");
      }
      return next;
    });
    audioRef.current?.playSfx("perk");
    setPerkChoices(null);

    // Resume next wave
    if (gameRef.current) {
      const nextWave = gameRef.current.waveIdx + 1;
      gameRef.current.startWave(nextWave);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const bg = new CyberpunkBackground();
    const input = new InputManager();
    inputRef.current = input;

    input.onGamepadConnected = (name) => {
      setGamepadNotice(`🎮 ${name} CONNECTED`);
      setTimeout(() => setGamepadNotice(null), 4000);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const groundY = () => H() - GROUND_OFFSET;

    const g = {
      ronin,
      status: "ready" as Status,
      waveIdx: -1,
      waveTime: 0,
      waveDamageTaken: 0,
      score: 0,
      gold: 0,
      combo: 0,
      comboTimer: 0,
      stylePoints: 0,
      styleRank: "D" as "D" | "C" | "B" | "A" | "S" | "SSS",
      styleMultiplier: 1.0,
      shake: 0,
      slowmo: 0,
      hitStop: 0,
      stats: {
        kills: 0,
        parries: 0,
      },
      p: {
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
        swordTrail: [] as SwordTrailPoint[],
      },
      enemies: [] as Enemy[],
      projectiles: [] as Projectile[],
      slashes: [] as SlashFx[],
      specials: [] as SpecialWave[],
      particles: [] as Particle[],
      floats: [] as FloatText[],
      rings: [] as RingFx[],
      afterimages: [] as Afterimage[],
      waveTitleT: 0,
      waveTitleText: "",
      screenFlash: 0,
      bgTime: 0,
      startWave: (idx: number) => {},
    };
    gameRef.current = g;

    function groundLine() {
      return groundY();
    }

    function addParticles(x: number, y: number, n: number, color: string, speed = 240, size = 3) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.3 + Math.random() * 0.9);
        g.particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 40,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.6,
          color,
          size: size * (0.6 + Math.random()),
        });
      }
    }

    function addFloat(x: number, y: number, text: string, color: string, scale = 1) {
      g.floats.push({ x, y, text, color, life: 0.9, vy: -50, scale });
    }

    function addRing(x: number, y: number, maxRadius: number, color: string, life = 0.35, width = 4) {
      g.rings.push({ x, y, life, maxLife: life, maxRadius, color, width });
    }

    function addStyle(points: number) {
      const prevRank = g.styleRank;
      g.stylePoints = Math.min(1200, g.stylePoints + points);

      if (g.stylePoints >= 1000) {
        g.styleRank = "SSS";
        g.styleMultiplier = 3.0;
        unlockAchievement("neon_god");
      } else if (g.stylePoints >= 700) {
        g.styleRank = "S";
        g.styleMultiplier = 2.2;
        unlockAchievement("style_s");
      } else if (g.stylePoints >= 450) {
        g.styleRank = "A";
        g.styleMultiplier = 1.8;
      } else if (g.stylePoints >= 250) {
        g.styleRank = "B";
        g.styleMultiplier = 1.5;
      } else if (g.stylePoints >= 100) {
        g.styleRank = "C";
        g.styleMultiplier = 1.2;
      } else {
        g.styleRank = "D";
        g.styleMultiplier = 1.0;
      }

      if (g.styleRank !== prevRank && points > 0) {
        audioRef.current?.playSfx("styleUp");
        addFloat(g.p.x, g.p.y - PLAYER_H - 24, `STYLE ${g.styleRank}!`, "#ec4899", 1.4);
      }
    }

    function spawnEnemy(id: string) {
      const def = ENEMIES[id];
      const fromLeft = Math.random() < 0.5;
      const x = fromLeft ? -40 : W() + 40;
      const y = groundLine() - def.size.h;
      const e: Enemy = {
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
      g.enemies.push(e);
    }

    function startWave(idx: number) {
      g.waveIdx = idx;
      g.status = "playing";
      g.waveDamageTaken = 0;
      const wave = WAVES[idx];
      let delay = 0;
      for (const group of wave.enemies) {
        for (let i = 0; i < group.count; i++) {
          setTimeout(() => {
            if (!g || g.status === "win" || g.status === "dead") return;
            spawnEnemy(group.id);
          }, delay * 1000);
          delay += 0.45;
        }
      }
      g.waveTitleText = wave.name ?? `Wave ${idx + 1}`;
      g.waveTitleT = 2.5;
      if (wave.isBoss) {
        g.screenFlash = 0.6;
        g.shake = 0.6;
      }
    }
    g.startWave = startWave;

    function beginGame() {
      g.p.hp = g.p.maxHp;
      g.p.energy = g.p.maxEnergy;
      g.p.x = 200;
      g.p.y = groundLine() - PLAYER_H;
      g.p.vx = 0;
      g.p.vy = 0;
      g.enemies = [];
      g.projectiles = [];
      g.slashes = [];
      g.specials = [];
      g.particles = [];
      g.floats = [];
      g.rings = [];
      g.afterimages = [];
      g.score = 0;
      g.combo = 0;
      g.comboTimer = 0;
      g.stylePoints = 0;
      g.styleRank = "D";
      startWave(0);
    }

    // Player Actions
    function playerAttack() {
      const perks = activePerksRef.current;
      if (g.p.atkCd > 0) return;
      g.p.atkCd = Math.max(0.12, ronin.stats.attackCd - perks.reducedAttackCd);
      g.p.slashActive = 0.18;
      g.p.slashDir = g.p.facing;

      const sx = g.p.x + g.p.facing * 22;
      const sy = g.p.y - PLAYER_H / 2 + 6;

      const baseDmg = ronin.stats.meleeDmg * (1 + perks.bonusMeleeDmgPercent / 100);
      const isCrit = perks.critChance > 0 && Math.random() < perks.critChance;
      const dmg = isCrit ? baseDmg * perks.critMultiplier : baseDmg;

      g.slashes.push({
        x: sx,
        y: sy,
        facing: g.p.facing,
        life: 0.18,
        maxLife: 0.18,
        reach: 74,
        arc: 1.25,
        color: isCrit ? "#ef4444" : "#67e8f9",
        dmg,
      });

      addRing(sx - g.p.facing * 12, sy, 34, isCrit ? "#ef4444" : "#67e8f9", 0.28, 3);
      addParticles(g.p.x + g.p.facing * 50, g.p.y - PLAYER_H / 2 + 4, 6, isCrit ? "#ef4444" : "#67e8f9", 340, 2.5);
      audioRef.current?.playSfx("slash");
      inputRef.current?.vibrate(40, 0.3, 0.4);
      addStyle(15);
    }

    function throwShuriken() {
      const perks = activePerksRef.current;
      if (g.p.shurikenCd > 0) return;
      if (g.p.energy < ronin.stats.shurikenCost) return;
      g.p.energy -= ronin.stats.shurikenCost;
      g.p.shurikenCd = 0.32;

      const speed = 720 + perks.shurikenSpeedBonus;
      const dmg = ronin.stats.shurikenDmg * (1 + perks.bonusShurikenDmgPercent / 100);

      g.projectiles.push({
        x: g.p.x + g.p.facing * 20,
        y: g.p.y - PLAYER_H / 2 + 4,
        vx: speed * g.p.facing,
        vy: 0,
        dmg,
        life: 1.4,
        from: "player",
        color: "#f0abfc",
        size: 9,
        piercing: perks.shurikenPierce,
      });

      audioRef.current?.playSfx("shuriken");
      addStyle(20);
    }

    function useSpecial() {
      const cost = ronin.specialCost;
      if (g.p.energy < cost) return;
      g.p.energy -= cost;
      g.shake = Math.max(g.shake, 0.35);
      g.screenFlash = 0.3;
      inputRef.current?.vibrate(100, 0.8, 1.0);

      const sy = g.p.y - PLAYER_H / 2 + 10;
      addRing(g.p.x, sy - 10, 95, ronin.id === "tetsu" ? "#fbbf24" : ronin.id === "kaminari" ? "#a5f3fc" : "#ff4d8a", 0.4, 5);

      if (ronin.id === "kaze") {
        g.specials.push({
          x: g.p.x,
          y: g.p.y - PLAYER_H / 2,
          vx: 940 * g.p.facing,
          life: 1.2,
          w: 80,
          h: 90,
          dmg: ronin.stats.meleeDmg * 2.5,
          hit: new Set(),
          color: "#ff4d8a",
        });
        addParticles(g.p.x, g.p.y - PLAYER_H / 2, 24, "#ff4d8a", 440, 3.5);
      } else if (ronin.id === "kaminari") {
        for (const ang of [-0.28, 0, 0.28]) {
          const v = 850;
          g.projectiles.push({
            x: g.p.x,
            y: g.p.y - PLAYER_H / 2,
            vx: Math.cos(ang) * v * g.p.facing,
            vy: Math.sin(ang) * v,
            dmg: ronin.stats.shurikenDmg * 2.2,
            life: 1.6,
            from: "player",
            color: "#a5f3fc",
            size: 13,
            piercing: true,
          });
        }
        addParticles(g.p.x, g.p.y - PLAYER_H / 2, 20, "#a5f3fc", 400, 3);
      } else {
        g.slashes.push({
          x: g.p.x + g.p.facing * 30,
          y: sy,
          facing: g.p.facing,
          life: 0.35,
          maxLife: 0.35,
          reach: 130,
          arc: 2.5,
          color: "#fbbf24",
          dmg: ronin.stats.meleeDmg * 2.4,
        });
        addRing(g.p.x + g.p.facing * 50, groundLine() - 6, 95, "#fbbf24", 0.45, 6);
        addParticles(g.p.x + g.p.facing * 40, groundLine() - 6, 26, "#fbbf24", 340, 4);
      }

      audioRef.current?.playSfx("special");
      addStyle(60);
    }

    function dash() {
      const perks = activePerksRef.current;
      if (g.p.dashCd > 0 || g.p.dashT > 0) return;
      g.p.dashT = DASH_DURATION;
      g.p.dashCd = Math.max(0.4, ronin.stats.dashCd - perks.reducedDashCd);
      g.p.invuln = Math.max(g.p.invuln, DASH_DURATION + 0.06);
      g.p.vy = 0;

      addParticles(g.p.x, g.p.y - PLAYER_H / 2, 14, "#67e8f9", 220, 2);
      addRing(g.p.x, g.p.y - PLAYER_H / 2, 45, "#67e8f9", 0.3, 3);
      audioRef.current?.playSfx("dash");
      inputRef.current?.vibrate(50, 0.4, 0.5);
      addStyle(10);
    }

    function triggerParry() {
      const perks = activePerksRef.current;
      if (g.p.parryCd > 0 || g.p.parryActive > 0) return;

      g.p.parryActive = 0.22 + perks.parryWindowBonus;
      g.p.parryCd = 0.38;

      addRing(g.p.x + g.p.facing * 18, g.p.y - PLAYER_H / 2, 38, "#fbbf24", 0.25, 3);
      addParticles(g.p.x + g.p.facing * 20, g.p.y - PLAYER_H / 2, 8, "#fef08a", 200, 2);
    }

    function damageEnemy(e: Enemy, dmg: number, fromX: number, isCrit = false) {
      if (e.dead) return;
      const perks = activePerksRef.current;

      e.hp -= dmg;
      e.hitFlash = 0.14;
      const dir = Math.sign(e.x - fromX) || 1;
      e.kb = dir * 220;

      // Bleed perk trigger
      if (perks.bleedDmgOnHit > 0) {
        e.bleedT = 3.0;
      }

      addFloat(
        e.x,
        e.y - e.def.size.h - 4,
        `${isCrit ? "CRIT! " : ""}${Math.round(dmg)}`,
        isCrit ? "#ef4444" : "#fde68a",
        isCrit ? 1.3 : 1.0
      );
      addParticles(e.x, e.y - e.def.size.h / 2, 6, e.def.accent, 180, 2.5);
      addRing(e.x, e.y - e.def.size.h / 2, 34, e.def.accent, 0.26, 3);

      g.combo++;
      g.comboTimer = 2.5;
      g.score += Math.round(dmg * g.styleMultiplier * (1 + g.combo * 0.02));
      audioRef.current?.playSfx("hit");

      if (e.hp <= 0) {
        e.dead = true;
        g.stats.kills++;
        if (g.stats.kills >= 10) unlockAchievement("first_blood");

        audioRef.current?.playSfx("kill");
        g.score += 35;
        g.gold += e.def.gold;
        if (g.gold >= 200) unlockAchievement("waste_baron");

        // Lifesteal Perk
        if (perks.lifestealOnKill > 0) {
          g.p.hp = Math.min(g.p.maxHp, g.p.hp + perks.lifestealOnKill);
          addFloat(g.p.x, g.p.y - PLAYER_H - 12, `+${perks.lifestealOnKill} HP`, "#34d399");
        }

        g.p.energy = Math.min(g.p.maxEnergy, g.p.energy + 12);
        addFloat(e.x, e.y - e.def.size.h, `+${e.def.gold}`, "#fcd34d");
        addParticles(e.x, e.y - e.def.size.h / 2, 18, e.def.color, 280, 3);
        addRing(e.x, e.y - e.def.size.h / 2, 62, e.def.color, 0.45, 5);

        if (e.def.behavior === "boss") {
          unlockAchievement("shogun_slayer");
          g.shake = 0.9;
          g.slowmo = 0.6;
          g.screenFlash = 0.6;
        }
      }
    }

    function hurtPlayer(dmg: number, fromX: number) {
      if (g.p.invuln > 0) return;

      // Check Parry
      if (g.p.parryActive > 0) {
        // Melee counter-parry
        g.p.parryStreak++;
        g.stats.parries++;
        unlockAchievement("blade_reflection");
        if (g.p.parryStreak >= 3) unlockAchievement("triple_parry");

        g.hitStop = 0.08;
        g.shake = 0.3;
        addFloat(g.p.x, g.p.y - PLAYER_H - 16, "COUNTER!", "#fbbf24", 1.4);
        addRing(g.p.x, g.p.y - PLAYER_H / 2, 70, "#fbbf24", 0.35, 5);
        audioRef.current?.playSfx("parry");
        inputRef.current?.vibrate(90, 0.7, 0.9);

        if (activePerksRef.current.kineticBattery) {
          g.p.energy = g.p.maxEnergy;
          addFloat(g.p.x, g.p.y - PLAYER_H - 32, "FULL ENERGY!", "#38bdf8");
        }

        addStyle(60);
        return;
      }

      g.waveDamageTaken += dmg;
      g.p.hp -= dmg;
      g.p.invuln = 0.7;
      g.shake = Math.max(g.shake, 0.28);
      g.combo = 0;
      g.p.parryStreak = 0;
      g.stylePoints = Math.max(0, g.stylePoints * 0.6); // style penalty

      const dir = Math.sign(g.p.x - fromX) || 1;
      g.p.vx = dir * 220;
      g.p.vy = -280;

      addFloat(g.p.x, g.p.y - PLAYER_H - 4, `-${Math.round(dmg)}`, "#fca5a5");
      addParticles(g.p.x, g.p.y - PLAYER_H / 2, 12, "#ef4444", 220, 2.5);
      audioRef.current?.playSfx("hurt");
      inputRef.current?.vibrate(120, 0.8, 1.0);

      if (g.p.hp <= 0) {
        g.p.hp = 0;
        g.status = "dead";
        audioRef.current?.playSfx("dead");
        recordRunResult(g.score, g.waveIdx + 1, g.stats.kills, g.stats.parries);
        setTimeout(() => setResult({ win: false, score: g.score, wave: g.waveIdx + 1 }), 900);
      }
    }

    // Core Frame Update
    function update(dt: number) {
      g.bgTime += dt;
      bg.update(dt, W(), groundLine());

      g.waveTitleT = Math.max(0, g.waveTitleT - dt);
      g.screenFlash = Math.max(0, g.screenFlash - dt * 1.6);
      g.shake = Math.max(0, g.shake - dt);
      g.comboTimer = Math.max(0, g.comboTimer - dt);
      if (g.comboTimer === 0) g.combo = 0;

      // Style decay
      g.stylePoints = Math.max(0, g.stylePoints - dt * 25);
      addStyle(0); // recalculate rank

      if (g.slowmo > 0) {
        g.slowmo -= dt;
        dt *= 0.35;
      }

      // Hit-Stop check: brief frame freeze on heavy strikes
      if (g.hitStop > 0) {
        g.hitStop -= dt;
        return;
      }

      // Adaptive music
      const mode =
        g.status === "dead"
          ? "defeat"
          : g.waveIdx >= 0 && WAVES[g.waveIdx]?.isBoss
          ? "boss"
          : g.status === "playing"
          ? "battle"
          : "ambient";
      audioRef.current?.setMode(mode);
      audioRef.current?.addCombo(g.combo);

      // Check wave completion & trigger Roguelite Perk Draft
      if (g.status === "playing" && g.enemies.every((e) => e.dead)) {
        if (g.waveDamageTaken === 0) {
          unlockAchievement("flawless_wave");
        }

        if (g.waveIdx >= WAVES.length - 1) {
          g.status = "win";
          unlockAchievement("grand_master");
          audioRef.current?.playSfx("win");
          recordRunResult(g.score, WAVES.length, g.stats.kills, g.stats.parries);
          setTimeout(() => setResult({ win: true, score: g.score, wave: WAVES.length }), 800);
        } else {
          // Trigger Perk Choice between waves
          g.status = "perk_select";
          const choices = drawPerkOptions(3, activePerks.map((p) => p.id));
          setPerkChoices(choices);
        }
      }

      const perks = activePerksRef.current;
      const p = g.p;

      // Poll Unified Input
      const inputState = input.poll();

      // Parry Input
      if (inputState.parry) triggerParry();

      // Jump Input
      if (inputState.jump) {
        ensureAudio();
        const jumpSpeed = ronin.stats.jumpPower * (1 + perks.bonusJumpPercent / 100);
        if (DOUBLE_JUMP) {
          if (p.jumps < 2) {
            p.vy = -jumpSpeed;
            p.jumps++;
            addParticles(p.x, p.y, 5, "#a5f3fc", 150, 2);
            audioRef.current?.playSfx("jump");
          }
        } else if (p.onGround) {
          p.vy = -jumpSpeed;
          audioRef.current?.playSfx("jump");
        }
      }

      // Attack / Shuriken / Special / Dash inputs
      if (inputState.attack) playerAttack();
      if (inputState.shuriken) throwShuriken();
      if (inputState.special) useSpecial();
      if (inputState.dash) dash();

      // Continuous holding attack
      if (inputState.attackHeld && p.atkCd <= 0 && p.slashActive <= 0) playerAttack();
      if (inputState.shurikenHeld && p.shurikenCd <= 0 && p.energy >= ronin.stats.shurikenCost) throwShuriken();

      // Movement & Dash
      const moveSpeed = ronin.stats.speed * (1 + perks.bonusSpeedPercent / 100);
      if (p.dashT > 0) {
        p.dashT -= dt;
        p.vx = DASH_SPEED * p.facing;
        g.afterimages.push({ x: p.x, y: p.y, facing: p.facing, life: 0.3, color: "#67e8f9" });

        // Plasma dash trail perk
        if (perks.plasmaDashTrail) {
          addParticles(p.x, p.y - 12, 3, "#06b6d4", 80, 3);
        }
        // Thunder dash perk: shock enemies passed through
        if (perks.thunderDash) {
          for (const e of g.enemies) {
            if (!e.dead && Math.abs(e.x - p.x) < 40 && Math.abs(e.y - p.y) < 60) {
              damageEnemy(e, 20, p.x);
              e.kb += p.facing * 300;
            }
          }
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

      p.atkCd = Math.max(0, p.atkCd - dt);
      p.shurikenCd = Math.max(0, p.shurikenCd - dt);
      p.dashCd = Math.max(0, p.dashCd - dt);
      p.parryActive = Math.max(0, p.parryActive - dt);
      p.parryCd = Math.max(0, p.parryCd - dt);
      p.invuln = Math.max(0, p.invuln - dt);
      p.slashActive = Math.max(0, p.slashActive - dt);

      // Energy recovery (with hyper-reactor perk bonus)
      const regen = 12 + perks.bonusEnergyRegen;
      p.energy = Math.min(p.maxEnergy, p.energy + regen * dt);

      // Gravity & Position
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const gy = groundLine();
      if (p.y > gy) {
        p.y = gy;
        p.vy = 0;
        p.onGround = true;
        p.jumps = 0;
      } else {
        p.onGround = false;
      }
      p.x = Math.max(ARENA_PADDING + PLAYER_W / 2, Math.min(W() - ARENA_PADDING - PLAYER_W / 2, p.x));

      // Katana Blade Trail Recording
      if (p.slashActive > 0) {
        const tipX = p.x + p.facing * 64;
        const tipY = p.y - PLAYER_H / 2;
        p.swordTrail.push({ x: tipX, y: tipY, life: 0.16 });
      }
      for (let i = p.swordTrail.length - 1; i >= 0; i--) {
        p.swordTrail[i].life -= dt;
        if (p.swordTrail[i].life <= 0) p.swordTrail.splice(i, 1);
      }

      // ---- Enemies ----
      for (const e of g.enemies) {
        if (e.dead) {
          e.deathT += dt;
          e.x += e.vx * dt * 0.5;
          e.y += e.vy * dt * 0.5 + 200 * dt;
          continue;
        }

        // Bleed perk tick
        if (e.bleedT && e.bleedT > 0) {
          e.bleedT -= dt;
          if (Math.random() < 0.15) {
            damageEnemy(e, 3, p.x);
            addParticles(e.x, e.y - e.def.size.h / 2, 2, "#f43f5e", 80, 2);
          }
        }

        e.hitFlash = Math.max(0, e.hitFlash - dt);
        e.atkCd = Math.max(0, e.atkCd - dt);
        e.shootCd = Math.max(0, e.shootCd - dt);
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.hypot(dx, dy);
        e.facing = Math.sign(dx) || e.facing;

        // Knockback
        if (Math.abs(e.kb) > 1) {
          e.vx = e.kb;
          e.kb *= Math.exp(-6 * dt);
        } else {
          e.kb = 0;
          if (e.def.behavior === "grunt") {
            if (dist > e.def.meleeRange!) {
              e.vx = Math.sign(dx) * e.def.speed;
            } else {
              e.vx *= 0.6;
              if (e.atkCd <= 0 && Math.abs(p.y - (e.y + e.def.size.h)) < 50) {
                e.atkCd = 0.9;
                hurtPlayer(e.def.dmg, e.x);
              }
            }
          } else if (e.def.behavior === "archer") {
            const preferred = 320;
            if (dist < preferred - 40) e.vx = -Math.sign(dx) * e.def.speed;
            else if (dist > preferred + 60) e.vx = Math.sign(dx) * e.def.speed;
            else e.vx *= 0.6;

            if (e.shootCd <= 0 && Math.abs(dy) < 80) {
              e.shootCd = e.def.shootCd!;
              const ang = Math.atan2(dy, dx);
              g.projectiles.push({
                x: e.x + e.facing * 10,
                y: e.y - e.def.size.h / 2,
                vx: Math.cos(ang) * e.def.projectileSpeed!,
                vy: Math.sin(ang) * e.def.projectileSpeed!,
                dmg: e.def.dmg,
                life: 2.2,
                from: "enemy",
                color: "#f472b6",
                size: 7,
              });
            }
          } else if (e.def.behavior === "brute") {
            if (dist > e.def.meleeRange!) {
              e.vx = Math.sign(dx) * e.def.speed;
            } else {
              e.vx *= 0.5;
              if (e.atkCd <= 0 && Math.abs(p.y - (e.y + e.def.size.h)) < 70) {
                e.atkCd = 1.3;
                hurtPlayer(e.def.dmg * 1.1, e.x);
                g.shake = Math.max(g.shake, 0.3);
              }
            }
          } else if (e.def.behavior === "boss") {
            if (!e.phase2 && e.hp < e.def.maxHp * 0.5) {
              e.phase2 = true;
              g.shake = 0.6;
              g.screenFlash = 0.5;
              addFloat(e.x, e.y - e.def.size.h, "ENRAGED!", "#f87171", 1.4);
              audioRef.current?.playSfx("bossPhase");
            }
            const speedMul = e.phase2 ? 1.4 : 1;
            if (dist > e.def.meleeRange!) {
              e.vx = Math.sign(dx) * e.def.speed * speedMul;
            } else {
              e.vx *= 0.4;
              if (e.atkCd <= 0) {
                e.atkCd = 0.9 / speedMul;
                if (dist < e.def.meleeRange! + 20 && Math.abs(p.y - (e.y + e.def.size.h)) < 90) {
                  hurtPlayer(e.def.dmg * 1.1, e.x);
                  g.shake = Math.max(g.shake, 0.35);
                }
              }
            }
            if (e.shootCd <= 0 && Math.abs(dx) < e.def.shootRange!) {
              e.shootCd = (e.def.shootCd ?? 2.5) / speedMul;
              const count = e.phase2 ? 5 : 3;
              const spread = e.phase2 ? 0.9 : 0.5;
              for (let i = 0; i < count; i++) {
                const base = Math.atan2(dy, dx);
                const ang = base + (i / (count - 1) - 0.5) * spread;
                g.projectiles.push({
                  x: e.x,
                  y: e.y - e.def.size.h / 2,
                  vx: Math.cos(ang) * e.def.projectileSpeed!,
                  vy: Math.sin(ang) * e.def.projectileSpeed!,
                  dmg: e.def.dmg * 0.8,
                  life: 2.5,
                  from: "enemy",
                  color: "#ff6b6b",
                  size: 10,
                });
              }
            }
          }
        }

        // Enemy gravity
        e.vy += GRAVITY * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        const egy = groundLine();
        if (e.y + e.def.size.h > egy) {
          e.y = egy - e.def.size.h;
          e.vy = 0;
          e.onGround = true;
        } else {
          e.onGround = false;
        }
        e.x = Math.max(-120, Math.min(W() + 120, e.x));

        // Contact damage
        if (e.def.behavior !== "archer") {
          const r = e.def.size.w / 2 + PLAYER_W / 2;
          if (Math.abs(dx) < r + 2 && Math.abs(p.y - (e.y + e.def.size.h / 2)) < (PLAYER_H + e.def.size.h) / 2) {
            if (e.atkCd <= 0) {
              e.atkCd = 0.7;
              hurtPlayer(e.def.dmg * 0.6, e.x);
            }
          }
        }
      }
      g.enemies = g.enemies.filter((e) => !(e.dead && e.deathT > 1.2));

      // ---- Slashes ----
      for (let i = g.slashes.length - 1; i >= 0; i--) {
        const s = g.slashes[i];
        s.life -= dt;
        s.x = g.p.x + s.facing * 22;
        s.y = g.p.y - PLAYER_H / 2 + 6;
        for (const e of g.enemies) {
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
              damageEnemy(e, s.dmg, s.x);
              e.kb += s.facing * 260;
            }
          }
        }
        if (s.life <= 0) g.slashes.splice(i, 1);
      }

      // ---- Specials ----
      for (let i = g.specials.length - 1; i >= 0; i--) {
        const w = g.specials[i];
        w.life -= dt;
        w.x += w.vx * dt;
        for (const e of g.enemies) {
          if (e.dead || w.hit.has(e)) continue;
          if (
            Math.abs(e.x - w.x) < w.w / 2 + e.def.size.w / 2 &&
            Math.abs(e.y - e.def.size.h / 2 - w.y) < w.h / 2 + e.def.size.h / 2
          ) {
            damageEnemy(e, w.dmg, w.x);
            w.hit.add(e);
            e.kb += Math.sign(w.vx) * 320;
          }
        }
        if (w.life <= 0 || w.x < -100 || w.x > W() + 100) g.specials.splice(i, 1);
      }

      // ---- Projectiles (With Parry / Deflection System) ----
      for (let i = g.projectiles.length - 1; i >= 0; i--) {
        const pr = g.projectiles[i];
        pr.life -= dt;
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        if (g.particles.length < 180) {
          g.particles.push({
            x: pr.x,
            y: pr.y,
            vx: -pr.vx * 0.04,
            vy: -pr.vy * 0.04,
            life: 0.16,
            maxLife: 0.16,
            color: pr.color,
            size: pr.size * 0.45,
          });
        }

        if (pr.from === "player") {
          // Hits enemy
          for (const e of g.enemies) {
            if (e.dead) continue;
            if (
              Math.abs(e.x - pr.x) < e.def.size.w / 2 + pr.size &&
              Math.abs(e.y - e.def.size.h / 2 - pr.y) < e.def.size.h / 2 + pr.size
            ) {
              damageEnemy(e, pr.dmg, pr.x);
              addParticles(pr.x, pr.y, 5, pr.color, 180, 2);
              if (!pr.piercing) {
                g.projectiles.splice(i, 1);
                break;
              }
            }
          }
        } else {
          // Enemy projectile approaches player
          const distToPlayer = Math.hypot(p.x - pr.x, p.y - PLAYER_H / 2 - pr.y);
          if (distToPlayer < PLAYER_W / 2 + pr.size + 16) {
            // Check Timed Parry Window
            if (p.parryActive > 0) {
              // PERFECT DEFLECTION!
              pr.from = "player";
              pr.vx = -pr.vx * 1.6;
              pr.vy = -pr.vy * 1.6;
              pr.dmg = Math.round(pr.dmg * 2.5 * perks.parryDmgMultiplier);
              pr.color = "#fde047";
              pr.piercing = true;
              pr.life = 2.0;

              g.hitStop = 0.08;
              g.shake = 0.32;
              p.parryStreak++;
              g.stats.parries++;
              unlockAchievement("blade_reflection");
              if (p.parryStreak >= 3) unlockAchievement("triple_parry");

              addRing(pr.x, pr.y, 65, "#fbbf24", 0.35, 5);
              addFloat(pr.x, pr.y - 20, "DEFLECT!", "#fde047", 1.4);
              audioRef.current?.playSfx("parry");
              inputRef.current?.vibrate(90, 0.7, 0.9);

              if (perks.kineticBattery) {
                p.energy = p.maxEnergy;
                addFloat(p.x, p.y - PLAYER_H - 28, "FULL ENERGY!", "#38bdf8");
              }

              addStyle(50);
              continue;
            }

            // Normal damage if not parried
            hurtPlayer(pr.dmg, pr.x);
            addParticles(pr.x, pr.y, 6, pr.color, 180, 2);
            g.projectiles.splice(i, 1);
            continue;
          }
        }

        if (pr.life <= 0 || pr.y > groundLine() || pr.x < -60 || pr.x > W() + 60) {
          g.projectiles.splice(i, 1);
        }
      }

      // ---- Particles / Rings / Afterimages / Floats ----
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.life -= dt;
        pt.vy += GRAVITY * 0.5 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (pt.life <= 0) g.particles.splice(i, 1);
      }
      for (let i = g.rings.length - 1; i >= 0; i--) {
        const r = g.rings[i];
        r.life -= dt;
        if (r.life <= 0) g.rings.splice(i, 1);
      }
      for (let i = g.afterimages.length - 1; i >= 0; i--) {
        const a = g.afterimages[i];
        a.life -= dt;
        if (a.life <= 0) g.afterimages.splice(i, 1);
      }
      for (let i = g.floats.length - 1; i >= 0; i--) {
        const f = g.floats[i];
        f.life -= dt;
        f.y += f.vy * dt;
        f.vy *= 0.96;
        if (f.life <= 0) g.floats.splice(i, 1);
      }
    }

    // ----- Rendering -----
    function drawPlayer() {
      const p = g.p;

      // Dash Afterimages
      for (const a of g.afterimages) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.globalAlpha = (a.life / 0.3) * 0.4;
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = a.color;
        rr(ctx, -11, -44, 22, 26, 6);
        ctx.fill();
        ctx.restore();
      }

      // Procedural Katana Blade Trail Ribbon
      if (p.swordTrail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p.swordTrail[0].x, p.swordTrail[0].y);
        for (let i = 1; i < p.swordTrail.length; i++) {
          ctx.lineTo(p.swordTrail[i].x, p.swordTrail[i].y);
        }
        ctx.strokeStyle = "rgba(103, 232, 249, 0.7)";
        ctx.lineWidth = 14;
        ctx.shadowColor = "#67e8f9";
        ctx.shadowBlur = 24;
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(p.x, p.y);

      // Invulnerability flicker
      if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.5;

      // Parry shield glow aura
      if (p.parryActive > 0) {
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 30;
        ctx.strokeStyle = "rgba(251,191,36,0.8)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -PLAYER_H / 2, 34, 0, Math.PI * 2);
        ctx.stroke();
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
          : ronin.id === "tetsu"
          ? "#ef4444"
          : ronin.id === "kaminari"
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

    function drawEnemies() {
      for (const e of g.enemies) {
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
            ctx.arc(0, -h / 2, 70 + Math.sin(g.bgTime * 10) * 6, 0, Math.PI * 2);
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

    function drawProjectiles() {
      for (const pr of g.projectiles) {
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
      }
    }

    function drawHUD() {
      const w = W();

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
      rr(ctx, bx + 44, by + 13, 230 * Math.max(0, g.p.hp / g.p.maxHp), 14, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(`${Math.ceil(g.p.hp)} / ${g.p.maxHp}`, bx + 220, by + 25);

      // Energy Bar
      ctx.fillStyle = "#67e8f9";
      ctx.fillText("EN", bx + 14, by + 48);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      rr(ctx, bx + 44, by + 38, 230, 12, 5);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      rr(ctx, bx + 44, by + 38, 230 * Math.max(0, g.p.energy / g.p.maxEnergy), 12, 5);
      ctx.fill();

      // Character & Badges
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 11px Inter, sans-serif";
      ctx.fillText(`${ronin.name} · ${ronin.title}`, bx + 14, by + 72);

      // Dash & Parry indicators
      const dashReady = g.p.dashCd <= 0;
      ctx.fillStyle = dashReady ? "#22d3ee" : "rgba(100,116,139,0.4)";
      rr(ctx, bx + 155, by + 63, 60, 12, 4);
      ctx.fill();
      ctx.fillStyle = "#0a0318";
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.fillText("DASH", bx + 172, by + 72);

      const parryReady = g.p.parryCd <= 0;
      ctx.fillStyle = parryReady ? "#fde047" : "rgba(100,116,139,0.4)";
      rr(ctx, bx + 222, by + 63, 56, 12, 4);
      ctx.fill();
      ctx.fillStyle = "#0a0318";
      ctx.fillText("PARRY", bx + 235, by + 72);

      // Top Right: Devil May Cry Style Rating & Score
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
      ctx.fillText(`SCORE ${g.score}`, w - 38, 48);
      ctx.fillStyle = "#f9a8d4";
      ctx.font = "600 13px Inter, sans-serif";
      ctx.fillText(`Wave ${g.waveIdx + 1} / ${WAVES.length}`, w - 38, 68);
      ctx.fillStyle = "#fca5a5";
      ctx.fillText(`🪙 ${g.gold}`, w - 38, 86);

      // Style Rank Badge & Multiplier
      ctx.textAlign = "left";
      const styleRankColors: Record<string, string> = {
        D: "#94a3b8",
        C: "#38bdf8",
        B: "#a855f7",
        A: "#f43f5e",
        S: "#fbbf24",
        SSS: "#ec4899",
      };
      const rColor = styleRankColors[g.styleRank] || "#38bdf8";

      ctx.font = "900 24px 'Inter', sans-serif";
      ctx.fillStyle = rColor;
      ctx.shadowColor = rColor;
      ctx.shadowBlur = 12;
      ctx.fillText(g.styleRank, w - bw2 - 12, 60);
      ctx.shadowBlur = 0;

      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(`${g.styleMultiplier.toFixed(1)}x`, w - bw2 - 12, 78);

      if (g.combo > 1) {
        ctx.textAlign = "right";
        ctx.fillStyle = `hsl(${(g.bgTime * 180) % 360}, 90%, 65%)`;
        ctx.font = "800 15px Inter, sans-serif";
        ctx.fillText(`×${g.combo} COMBO`, w - 38, 118);
      }
      ctx.textAlign = "left";

      // Wave title banner
      if (g.waveTitleT > 0) {
        ctx.save();
        const a = Math.min(1, g.waveTitleT / 2.5) * (g.waveTitleT > 2 ? (g.waveTitleT - 2) * 2 : 1);
        ctx.globalAlpha = a;
        ctx.textAlign = "center";
        ctx.font = "800 48px Cinzel, serif";
        ctx.fillStyle = "#fde68a";
        ctx.shadowColor = "#ec4899";
        ctx.shadowBlur = 24;
        ctx.fillText(g.waveTitleText, w / 2, H() / 2 - 40);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Controls hint
      ctx.textAlign = "left";
      ctx.font = "500 12px Inter, sans-serif";
      ctx.fillStyle = "rgba(226,232,240,0.6)";
      ctx.fillText(
        "WASD move · J slash · K shuriken · L special · Shift dash · F parry · Space double-jump · Gamepad supported",
        24,
        H() - 22
      );
    }

    function render() {
      const w = W(),
        h = H();
      ctx.clearRect(0, 0, w, h);

      // Cyberpunk Parallax Background
      bg.render(ctx, w, h, groundLine(), g.bgTime);

      const shakeX = g.shake > 0 ? (Math.random() - 0.5) * g.shake * 24 : 0;
      const shakeY = g.shake > 0 ? (Math.random() - 0.5) * g.shake * 24 : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      drawEnemies();
      for (const s of g.specials) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 30;
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.restore();
      }
      drawProjectiles();
      drawPlayer();

      // Rings
      for (const r of g.rings) {
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
      }

      // Particles & Floats
      for (const pt of g.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const f of g.floats) {
        ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
        ctx.font = `bold ${Math.round(18 * (f.scale ?? 1))}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = f.color;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 6;
        ctx.fillText(f.text, f.x, f.y);
      }
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

      if (g.screenFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.4, g.screenFlash * 0.6)})`;
        ctx.fillRect(0, 0, w, h);
      }

      drawHUD();
    }

    function frame(now: number) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (g.status === "playing" || g.status === "wave_interlude") {
        update(dt);
      }
      render();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    setTimeout(beginGame, 300);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      input.dispose();
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, [ronin]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Gamepad Connected Toast */}
      {gamepadNotice && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 rounded-full border border-cyan-400/50 bg-slate-950/85 px-6 py-2 font-display text-xs font-bold tracking-widest text-cyan-200 shadow-[0_0_25px_rgba(56,189,248,0.4)] backdrop-blur-md animate-fadeIn">
          {gamepadNotice}
        </div>
      )}

      {/* Achievement Unlocked Toasts */}
      <AchievementToast />

      {/* Top Controls Toolbar */}
      <div className="absolute right-4 top-[132px] z-30 flex flex-col gap-2">
        {/* Sound Settings Button */}
        <button
          onClick={() => {
            ensureAudio();
            setShowSound((s) => !s);
          }}
          aria-label="Sound settings"
          title="Sound settings"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-slate-950/70 text-lg backdrop-blur-sm transition-all active:scale-90 ${
            showSound
              ? "border-cyan-300/70 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
              : "border-white/15 hover:border-cyan-300/60"
          }`}
        >
          {volumes.muted ? "🔇" : "🎛️"}
        </button>

        {/* Achievements / Trophy Button */}
        <button
          onClick={() => setShowAchievements(true)}
          aria-label="Trophies & Stats"
          title="Trophies & Stats"
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/15 bg-slate-950/70 text-lg backdrop-blur-sm transition-all hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-90"
        >
          🏆
        </button>

        {/* Mobile Touch Controls Toggle */}
        <button
          onClick={() => setTouchEnabled((t) => !t)}
          aria-label="Toggle Touch Controls"
          title="Toggle Touch Controls"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-slate-950/70 text-lg backdrop-blur-sm transition-all active:scale-90 ${
            touchEnabled
              ? "border-fuchsia-400/70 shadow-[0_0_20px_rgba(232,121,249,0.4)]"
              : "border-white/15 hover:border-fuchsia-400/60"
          }`}
        >
          📱
        </button>
      </div>

      {/* Sound Settings Modal */}
      {showSound && (
        <div className="absolute right-4 top-[184px] z-30 w-64 rounded-2xl border-2 border-pink-400/30 bg-slate-950/85 p-4 shadow-[0_0_40px_rgba(236,72,153,0.3)] backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-sm font-bold tracking-[0.2em] text-cyan-200">SOUND</span>
            <button
              onClick={() => setShowSound(false)}
              className="rounded-md px-1.5 text-slate-400 transition-colors hover:text-cyan-200"
            >
              ✕
            </button>
          </div>
          <VolumeSlider label="Master" value={volumes.master} onChange={(v) => changeVolume("master", v)} />
          <VolumeSlider label="Music" value={volumes.music} onChange={(v) => changeVolume("music", v)} />
          <VolumeSlider label="SFX" value={volumes.sfx} onChange={(v) => changeVolume("sfx", v)} />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={toggleMute}
              className="rounded-lg border-2 border-white/10 bg-white/5 px-3 py-1.5 font-story text-xs text-slate-200 transition-all hover:border-cyan-300/50 active:scale-95"
            >
              {volumes.muted ? "🔇 Muted" : "🔊 Sound on"}
            </button>
            <button
              onClick={() => {
                ensureAudio();
                audioRef.current?.playSfx("parry");
              }}
              className="rounded-lg border-2 border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 font-story text-xs text-fuchsia-200 transition-all hover:border-fuchsia-300/60 active:scale-95"
            >
              Test SFX
            </button>
          </div>
        </div>
      )}

      {/* On-Screen Touch Controls (Mobile / Tablet) */}
      {touchEnabled && (
        <TouchControls
          onMoveX={(val) => inputRef.current?.setTouchMovement(val)}
          onAction={(act, isDown) => inputRef.current?.triggerTouchAction(act, isDown)}
        />
      )}

      {/* Roguelite Perks Selection Modal (Between Waves) */}
      {perkChoices && (
        <PerkSelectModal perks={perkChoices} onSelect={handleSelectPerk} />
      )}

      {/* Lifetime Achievements & Statistics Modal */}
      {showAchievements && (
        <AchievementsModal onClose={() => setShowAchievements(false)} />
      )}

      {/* Welcome / Controls Help Overlay */}
      {showHelp && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div className="w-full max-w-md rounded-2xl border-2 border-pink-400/40 bg-slate-950/80 p-7 text-center shadow-[0_0_60px_rgba(236,72,153,0.35)]">
            <p className="text-4xl">{ronin.emoji}</p>
            <h2
              className="mt-3 font-display text-2xl font-bold"
              style={{
                background: "linear-gradient(180deg,#fef3c7,#ff4d8a)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Ready, ronin?
            </h2>
            <ul className="mt-5 space-y-1.5 text-left font-story text-lg text-pink-100/90">
              <li>
                <span className="font-sans font-bold text-cyan-300">A / D / Left Stick</span> — move
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">Space / W / (A)</span> — double-jump
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">J / (X)</span> — katana slash
              </li>
              <li>
                <span className="font-sans font-bold text-yellow-300">F / (B)</span> — 🛡️ timed parry & deflect
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">K / (Y)</span> — shuriken
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">L / (LB)</span> — {ronin.specialName}
              </li>
              <li>
                <span className="font-sans font-bold text-cyan-300">Shift / (RB)</span> — dash (invulnerable)
              </li>
            </ul>
            <p className="mt-4 font-story italic text-pink-200/70">
              Timed parries reflect enemy bullets back at them! Clear waves to unlock cyberware augments.
            </p>
            <button
              onClick={() => {
                ensureAudio();
                setShowHelp(false);
              }}
              className="mt-6 rounded-xl border-2 border-cyan-300/60 bg-gradient-to-b from-pink-500/30 to-fuchsia-900/40 px-8 py-3 font-display font-black tracking-[0.2em] text-cyan-100 transition-all hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] active:scale-95"
            >
              ▶ ENTER THE WASTES
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal */}
      {result && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-pink-400/40 bg-slate-950/85 p-8 text-center shadow-[0_0_60px_rgba(236,72,153,0.35)]">
            <div className="text-6xl">{result.win ? "🏆" : "💀"}</div>
            <h2
              className="mt-4 font-display text-4xl font-black"
              style={{
                background: result.win
                  ? "linear-gradient(180deg,#fef3c7,#ff4d8a)"
                  : "linear-gradient(180deg,#fecaca,#ef4444)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {result.win ? "SHUGUN SLAIN" : "YOU HAVE FALLEN"}
            </h2>
            <p className="mt-3 font-story text-lg text-pink-100/80">
              {result.win
                ? "The wastes belong to your blade. Neon lights flicker in your wake."
                : "The neon grows dim... but every ronin rises again."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
                <p className="font-display text-xl font-bold text-amber-300">{result.score}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Score</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
                <p className="font-display text-xl font-bold text-fuchsia-300">Wave {result.wave}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Reached</p>
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {!result.win && (
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-xl border-2 border-cyan-300/50 bg-gradient-to-b from-pink-500/30 to-fuchsia-900/40 px-6 py-3 font-display font-black tracking-widest text-cyan-100 transition-all hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-95"
                >
                  RISE AGAIN
                </button>
              )}
              {result.win && (
                <button
                  onClick={onRestart}
                  className="rounded-xl border-2 border-cyan-300/50 bg-gradient-to-b from-pink-500/30 to-fuchsia-900/40 px-6 py-3 font-display font-black tracking-widest text-cyan-100 transition-all hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-95"
                >
                  NEW RONIN
                </button>
              )}
              <button
                onClick={onTitle}
                className="rounded-xl border-2 border-white/15 bg-white/5 px-6 py-3 font-display font-bold tracking-widest text-slate-200 transition-all hover:bg-white/10 active:scale-95"
              >
                Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
