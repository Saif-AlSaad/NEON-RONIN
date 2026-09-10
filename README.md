# ⚡ NEON RONIN: Blade of the Wastes

[![Live Demo](https://img.shields.io/badge/Play_Online-GitHub_Pages-ec4899?style=for-the-badge&logo=github)](https://saif-alsaad.github.io/NEON-RONIN/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite)](https://vite.dev/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-10B981?style=for-the-badge&logo=pwa)](https://web.dev/explore/progressive-web-apps)

> **A synthwave side-scrolling cyberpunk action hack-and-slash.** Parry incoming projectiles with frame-perfect precision, chain stylish air combos, draft roguelite cyberware augmentations, and slay the tyrannical Shogun Ashi-Garu to conquer the wastes.

🌐 **Play the Live Web Build:** **[https://saif-alsaad.github.io/NEON-RONIN/](https://saif-alsaad.github.io/NEON-RONIN/)**

---

## 🎮 Features Breakdown

### 1. 🛡️ Timed Parry & Projectile Deflection
* **Frame-Perfect Defense**: Raise your blade into deflection stance (`F` / `B` / `Parry`).
* **Bullet Reflection**: Deflect archer arrows and boss laser spheres back at enemy lines with **2.5x amplified damage**, piercing velocity, and golden particle arcs.
* **Tactile Hit-Stop**: Experience a 80ms micro time-freeze and heavy sub-bass impact on every successful parry or counter.

### 2. 💠 Devil May Cry Style Rating System
* Dynamic combat grading that rates your flow and move diversity in real-time:
  $$\mathbf{D} \rightarrow \mathbf{C} \rightarrow \mathbf{B} \rightarrow \mathbf{A} \rightarrow \mathbf{S} \rightarrow \mathbf{SSS \ (NEON \ GOD)}$$
* Multiplies score up to **3.0x** when chaining slashes, shurikens, dashes, and parries without taking damage.

### 3. 🦾 Roguelite Cyberware Augmentations (Perks)
* Between combat waves, draft from a deck of **12+ cyberware modifications**:
  * **Nanite Blades**: Inflict stacking corrosive bleed damage over time.
  * **Kinetic Battery**: Perfect parries instantly restore 100% of your energy pool.
  * **Plasma Thrusters**: Dashing leaves an incinerating cyan fire trail.
  * **Critical Overdrive**: 25% chance to land a 2.5x critical finisher.
  * **Vampiric Matrix**: Siphon vital fluid on kills to heal health.
  * **Deflector Core**: Expands the parry window by 40% with +100% reflected damage.

### 4. 🌃 Cyberpunk Parallax Environment
* Multi-layer procedural canvas backdrop:
  * Distant neon skyscraper matrices with flickering window lights.
  * Holographic Japanese kanji billboards (`刀`, `ネオン`, `電脳`, `浪人`, `疾風`).
  * Flying cyber-vehicles (spinners) with dynamic headlight and engine exhaust cones.
  * Digital angled cyber-rain with expanding impact ripples on the arena floor.
  * Retro synthwave perspective ground grid.

### 5. 📱 Gamepad API, Mobile Touch HUD & PWA
* **Full Gamepad API**: Plug-and-play Xbox, PlayStation, and generic controller support with haptic rumble (`vibrationActuator`).
* **Mobile Touch HUD**: Floating virtual thumbstick for fluid analog movement and glowing neon action clusters.
* **Progressive Web App (PWA)**: Installable directly to your home screen on Android, iOS, or Chrome desktop for full-screen offline gameplay.

### 6. 🏆 In-Game Archives & Achievement System
* Track 10 achievements including *Mirror Edge*, *Ghost Runner*, *Untouchable Ronin*, and *NEON GOD*.
* Persistent lifetime statistics saved locally (total kills, parries, best wave, and high score).

---

## 🕹️ Controls Guide

| Action | Keyboard | Gamepad (Xbox / PS) | Touch (Mobile) |
| :--- | :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `←` / `→` | Left Analog Stick / D-Pad | Virtual Thumbstick |
| **Double Jump** | `Space` / `W` / `↑` | `A` / `Cross` | `▲` Button |
| **Katana Slash** | `J` | `X` / `Square` | `⚔️` Button |
| **Timed Parry / Deflect** | `F` or `S + J` | `B` / `Circle` | `🛡️` Button |
| **Throw Shuriken** | `K` | `Y` / `Triangle` | `🌀` Button |
| **Special Ability** | `L` | `LB` / `L1` or `LT` | `🔥` Button |
| **Dash (Invulnerable)** | `Shift` | `RB` / `R1` or `RT` | `💨` Button |
| **Sound / Trophies** | HUD Icons | Controller Navigation | Top Toolbar |

---

## 🥷 Playable Ronin Classes

1. **Kaze (Wind of the Wastes)** — *Agile & Weightless*
   * High mobility, rapid attack cooldowns, and the devastating **Crimson Slash** wave.
2. **Kaminari (Thunder Fist)** — *Master of Storms*
   * Balanced stats, high energy capacity, and the tri-directional **Storm Shuriken** barrage.
3. **Tetsu (Iron Demon)** — *Walking Juggernaut*
   * Massive health pool and crushing melee damage with the ground-shaking **Earthcleaver**.

---

## 🏗️ Technical Architecture

```
src/
├── components/
│   ├── NeonArena.tsx          # Master arena canvas, loop & HUD
│   ├── TitleScreen.tsx        # Synthwave title sequence & archives trigger
│   ├── CharacterSelect.tsx    # Ronin selection & stat comparison
│   ├── TouchControls.tsx      # Virtual thumbstick & glowing touch buttons
│   ├── PerkSelectModal.tsx    # Roguelite 3-card cyberware draft modal
│   ├── AchievementsModal.tsx  # Trophies showcase & lifetime statistics
│   ├── AchievementToast.tsx   # Animated slide-in unlock notifications
│   └── Starfield.tsx          # Background atmospheric star particle field
├── game/
│   ├── audio.ts               # Custom Web Audio API procedural synthwave & SFX
│   ├── background.ts          # Parallax cyber-city, rain, ripples & spinners
│   ├── input.ts               # Unified Keyboard, Gamepad API & Touch manager
│   ├── perks.ts               # Roguelite cyberware database & stat aggregator
│   ├── achievements.ts        # Persistent achievements & statistics engine
│   └── ronin.ts               # Hero stats, enemy behaviors & wave schemas
├── types.ts                   # Core TypeScript contracts
├── App.tsx                    # Top-level screen router
└── main.tsx                   # Entry point & PWA service worker registration
```

---

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/Saif-AlSaad/NEON-RONIN.git
cd NEON-RONIN

# Install dependencies
npm install

# Launch Vite dev server
npm run dev

# Build single-file production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License
Created by [Saif Al Saad](https://github.com/Saif-AlSaad). Distributed under the MIT License.
