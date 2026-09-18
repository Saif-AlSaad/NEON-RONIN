import type {
  ParticleEntity,
  ProjectileEntity,
  FloatTextEntity,
  RingEntity,
  AfterimageEntity,
} from "./types";

export class ObjectPool<T extends { active: boolean }> {
  public items: T[];

  constructor(factory: () => T, size: number) {
    this.items = Array.from({ length: size }, factory);
  }

  get(): T | null {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].active) {
        this.items[i].active = true;
        return this.items[i];
      }
    }
    return null;
  }

  clear(): void {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].active = false;
    }
  }

  forEachActive(fn: (item: T, index: number) => void): void {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].active) {
        fn(this.items[i], i);
      }
    }
  }

  filterActive(): T[] {
    return this.items.filter((item) => item.active);
  }
}

export class EnginePools {
  public particles: ObjectPool<ParticleEntity>;
  public projectiles: ObjectPool<ProjectileEntity>;
  public floats: ObjectPool<FloatTextEntity>;
  public rings: ObjectPool<RingEntity>;
  public afterimages: ObjectPool<AfterimageEntity>;

  constructor() {
    this.particles = new ObjectPool<ParticleEntity>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        color: "#ffffff",
        size: 2,
      }),
      350
    );

    this.projectiles = new ObjectPool<ProjectileEntity>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        dmg: 0,
        life: 0,
        from: "enemy",
        color: "#ffffff",
        size: 8,
        piercing: false,
      }),
      100
    );

    this.floats = new ObjectPool<FloatTextEntity>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        text: "",
        color: "#ffffff",
        life: 0,
        vy: 0,
        scale: 1,
      }),
      60
    );

    this.rings = new ObjectPool<RingEntity>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        life: 0,
        maxLife: 1,
        maxRadius: 20,
        color: "#ffffff",
        width: 2,
      }),
      50
    );

    this.afterimages = new ObjectPool<AfterimageEntity>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        facing: 1,
        life: 0,
        color: "#ffffff",
      }),
      40
    );
  }

  addParticle(x: number, y: number, vx: number, vy: number, life: number, maxLife: number, color: string, size: number) {
    const p = this.particles.get();
    if (!p) return;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = maxLife;
    p.color = color;
    p.size = size;
  }

  addParticles(x: number, y: number, n: number, color: string, speed = 240, size = 3) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.9);
      const life = 0.4 + Math.random() * 0.3;
      this.addParticle(
        x,
        y,
        Math.cos(a) * s,
        Math.sin(a) * s - 40,
        life,
        0.6,
        color,
        size * (0.6 + Math.random())
      );
    }
  }

  addFloat(x: number, y: number, text: string, color: string, scale = 1) {
    const f = this.floats.get();
    if (!f) return;
    f.x = x;
    f.y = y;
    f.text = text;
    f.color = color;
    f.life = 0.9;
    f.vy = -50;
    f.scale = scale;
  }

  addRing(x: number, y: number, maxRadius: number, color: string, life = 0.35, width = 4) {
    const r = this.rings.get();
    if (!r) return;
    r.x = x;
    r.y = y;
    r.life = life;
    r.maxLife = life;
    r.maxRadius = maxRadius;
    r.color = color;
    r.width = width;
  }

  addAfterimage(x: number, y: number, facing: number, life: number, color: string) {
    const a = this.afterimages.get();
    if (!a) return;
    a.x = x;
    a.y = y;
    a.facing = facing;
    a.life = life;
    a.color = color;
  }

  clearAll() {
    this.particles.clear();
    this.projectiles.clear();
    this.floats.clear();
    this.rings.clear();
    this.afterimages.clear();
  }
}
