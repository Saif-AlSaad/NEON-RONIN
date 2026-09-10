type Mode = "ambient" | "battle" | "boss" | "defeat";

export type SfxName =
  | "slash"
  | "shuriken"
  | "special"
  | "dash"
  | "jump"
  | "hit"
  | "kill"
  | "hurt"
  | "bossPhase"
  | "win"
  | "dead"
  | "parry"
  | "perk"
  | "achievement"
  | "styleUp";

interface Chord {
  bass: number;
  tones: number[];
}

// i - VI - III - VII, classic synthwave cycle in A minor
const CHORDS: Chord[] = [
  { bass: 45, tones: [57, 60, 64, 69] },
  { bass: 41, tones: [53, 57, 60, 65] },
  { bass: 48, tones: [55, 60, 64, 67] },
  { bass: 43, tones: [55, 59, 62, 66] },
];

const BASS_PATTERN = [0, 0, 12, 0, 7, 0, 12, 0, 0, 0, 12, 0, 7, 12, 0, 0];
const ARP_SEQ = [0, 1, 2, 1, 3, 1, 2, 1, 0, 2, 3, 2, 1, 2, 1, 0];

function midi(n: number) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private bar = 0;
  private intensity = 0;
  private targetIntensity = 0;
  private boss = false;
  private combo = 0;
  private muted = false;
  private masterVol = 0.9;
  private musicVol = 1;
  private sfxVol = 0.55;

  get running() {
    return !!this.ctx;
  }

  start() {
    if (this.ctx) {
      this.resume();
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 20;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    comp.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.masterVol;
    this.master.connect(comp);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVol;
    this.musicBus.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);

    const len = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.nextTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  dispose() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    if (this.ctx) this.ctx.close();
    this.ctx = null;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : this.masterVol, this.ctx.currentTime, 0.03);
    }
  }

  setMasterVolume(v: number) {
    this.masterVol = v;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.03);
    }
  }

  setMusicVolume(v: number) {
    this.musicVol = v;
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
    }
  }

  setSfxVolume(v: number) {
    this.sfxVol = v;
    if (this.sfxBus && this.ctx) {
      this.sfxBus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
    }
  }

  setMode(mode: Mode) {
    switch (mode) {
      case "ambient":
        this.targetIntensity = 0.2;
        this.boss = false;
        break;
      case "battle":
        this.targetIntensity = 0.72;
        this.boss = false;
        break;
      case "boss":
        this.targetIntensity = 1;
        this.boss = true;
        break;
      case "defeat":
        this.targetIntensity = 0.05;
        this.boss = false;
        break;
    }
  }

  addCombo(n: number) {
    this.combo = n;
  }

  private tempo() {
    if (this.boss) return 132;
    if (this.intensity < 0.25) return 96;
    return 112;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.intensity += (this.targetIntensity - this.intensity) * 0.05;
    const spb = 60 / this.tempo() / 4;
    while (this.nextTime < ctx.currentTime + 0.14) {
      this.playStep(this.step, this.bar, this.nextTime);
      this.nextTime += spb;
      this.step++;
      if (this.step >= 16) {
        this.step = 0;
        this.bar++;
      }
    }
  }

  private playStep(step: number, bar: number, t: number) {
    const inten = this.intensity;
    const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
    const eighth = step % 2 === 0;
    const beat = step % 4;

    this.pad(chord, bar, t, inten);

    if (inten > 0.12 && eighth) {
      this.bass(midi(chord.bass - 12 + (BASS_PATTERN[step] ?? 0)), t, inten);
    }

    if (inten > 0.45) {
      const idx = ARP_SEQ[step];
      const oct = this.combo >= 25 ? 24 : this.combo >= 10 ? 12 : 0;
      this.arp(midi(chord.tones[idx % chord.tones.length] + 12 + oct), t, inten);
    }

    if (this.boss && beat === 0) this.drone(t, inten);

    if (step % 4 === 0) {
      this.kick(t, inten);
    } else if (inten > 0.35) {
      if (step % 2 === 0 && step % 4 === 2) this.snare(t, inten);
      if (step % 2 === 1) this.hat(t, inten);
    }
  }

  private pad(chord: Chord, bar: number, t: number, inten: number) {
    const ctx = this.ctx!;
    const dur = 2 * (60 / this.tempo());
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05 + inten * 0.05, t + dur * 0.3);
    g.gain.setTargetAtTime(0, t + dur * 0.6, dur * 0.25);
    g.connect(this.musicBus!);
    for (const n of chord.tones) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = midi(n - 12);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 500 + inten * 900;
      f.Q.value = 0.8;
      o.connect(f);
      f.connect(g);
      o.start(t);
      o.stop(t + dur);
    }
    // soft movement
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1 + bar % 4;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 300;
    const lfoF = ctx.createBiquadFilter();
    lfoF.type = "lowpass";
    lfoF.frequency.value = 600;
    lfo.connect(lfoG);
    lfoG.connect(lfoF.frequency);
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = midi(chord.bass - 24);
    o2.connect(lfoF);
    lfoF.connect(g);
    o2.start(t);
    o2.stop(t + dur);
    lfo.start(t);
    lfo.stop(t + dur);
  }

  private bass(freq: number, t: number, inten: number) {
    const ctx = this.ctx!;
    const dur = 60 / this.tempo() / 2;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(120 + inten * 500, t);
    f.frequency.exponentialRampToValueAtTime(80, t + dur);
    f.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * inten + 0.03, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(this.musicBus!);
    o.start(t);
    o.stop(t + dur);
  }

  private arp(freq: number, t: number, inten: number) {
    const ctx = this.ctx!;
    const dur = 60 / this.tempo() / 4;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1600 + inten * 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 * inten, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9);
    o.connect(f);
    f.connect(g);
    g.connect(this.musicBus!);
    o.start(t);
    o.stop(t + dur);
  }

  private kick(t: number, inten: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.55 * (0.4 + inten * 0.6), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g);
    g.connect(this.musicBus!);
    o.start(t);
    o.stop(t + 0.14);
  }

  private snare(t: number, inten: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1900;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3 * inten, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(f);
    f.connect(g);
    g.connect(this.musicBus!);
    src.start(t);
    src.stop(t + 0.18);
  }

  private hat(t: number, inten: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 8000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06 * inten, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(f);
    f.connect(g);
    g.connect(this.musicBus!);
    src.start(t);
    src.stop(t + 0.06);
  }

  private drone(t: number, inten: number) {
    const ctx = this.ctx!;
    const dur = 2 * (60 / this.tempo());
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07 + inten * 0.06, t + 0.4);
    g.gain.setTargetAtTime(0.0001, t + dur - 0.4, 0.3);
    g.connect(this.musicBus!);
    for (const det of [-8, 8]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = midi(38);
      o.detune.value = det;
      o.connect(g);
      o.start(t);
      o.stop(t + dur);
    }
  }

  playSfx(name: SfxName) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    switch (name) {
      case "slash":
        this.noiseHit(0.05, 600, 3000, 0.12, 0.12);
        break;
      case "shuriken":
        this.blip(midi(88), "triangle", 0.12, 0.12);
        break;
      case "special":
        this.noiseHit(0.25, 200, 2000, 0.4, 0.35);
        this.blip(midi(52), "sawtooth", 0.4, 0.3);
        break;
      case "dash":
        this.noiseSweep(0.15, 300, 6000, 0.16);
        break;
      case "jump":
        this.blip(midi(72 + Math.floor(Math.random() * 6)), "sine", 0.06, 0.05);
        break;
      case "hit":
        this.blip(midi(78 + Math.floor(Math.random() * 4)), "square", 0.08, 0.05);
        break;
      case "kill":
        this.blip(midi(70), "square", 0.12, 0.12);
        this.blip(midi(58), "square", 0.2, 0.12);
        break;
      case "hurt":
        this.noiseHit(0.2, 300, 900, 0.25, 0.2);
        this.blip(midi(40), "sawtooth", 0.25, 0.18);
        break;
      case "bossPhase":
        this.blip(midi(45), "sawtooth", 0.6, 0.35);
        this.blip(midi(48), "sawtooth", 0.9, 0.35);
        this.noiseHit(0.3, 100, 400, 0.5, 0.4);
        break;
      case "win":
        for (let i = 0; i < 4; i++) {
          this.blip(midi(72 + i * 3), "triangle", 0.3, 0.28, ctx.currentTime + i * 0.16);
        }
        break;
      case "dead":
        this.blip(midi(50), "sawtooth", 1.0, 0.4);
        this.blip(midi(46), "sawtooth", 1.0, 0.4);
        break;
      case "parry":
        // Crisp high-metal deflection ping + sub punch
        this.blip(midi(96), "sine", 0.35, 0.22);
        this.blip(midi(84), "triangle", 0.3, 0.18);
        this.noiseHit(0.22, 1200, 6500, 0.14, 0.002);
        this.blip(midi(36), "sawtooth", 0.4, 0.2);
        break;
      case "perk":
        // Uplifting tech arpeggio
        this.blip(midi(60), "sine", 0.2, 0.14, ctx.currentTime);
        this.blip(midi(67), "sine", 0.22, 0.14, ctx.currentTime + 0.08);
        this.blip(midi(72), "triangle", 0.25, 0.2, ctx.currentTime + 0.16);
        this.blip(midi(79), "triangle", 0.3, 0.3, ctx.currentTime + 0.24);
        break;
      case "achievement":
        // Cyberpunk synth fanfare
        this.blip(midi(57), "sawtooth", 0.25, 0.25, ctx.currentTime);
        this.blip(midi(64), "sawtooth", 0.28, 0.25, ctx.currentTime + 0.1);
        this.blip(midi(69), "sawtooth", 0.3, 0.3, ctx.currentTime + 0.2);
        this.blip(midi(76), "sine", 0.4, 0.5, ctx.currentTime + 0.3);
        break;
      case "styleUp":
        this.blip(midi(76), "sine", 0.18, 0.1);
        this.blip(midi(81), "triangle", 0.2, 0.12, ctx.currentTime + 0.05);
        this.blip(midi(88), "sine", 0.24, 0.18, ctx.currentTime + 0.1);
        break;
    }
  }

  private noiseHit(vol: number, f0: number, f1: number, dur: number, atk = 0.005) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private noiseSweep(vol: number, f0: number, f1: number, dur: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private blip(freq: number, type: OscillatorType, vol: number, dur: number, at?: number) {
    const ctx = this.ctx!;
    const t = at ?? ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.sfxBus!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
}
