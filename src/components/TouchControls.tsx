import React, { useRef, useState, useEffect } from "react";

interface Props {
  onMoveX: (val: number) => void;
  onAction: (action: string, isDown: boolean) => void;
}

export default function TouchControls({ onMoveX, onAction }: Props) {
  const stickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [touching, setTouching] = useState(false);

  const handleStickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouching(true);
    updateKnob(e.touches[0]);
  };

  const handleStickMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touching) return;
    updateKnob(e.touches[0]);
  };

  const handleStickEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouching(false);
    setKnobPos({ x: 0, y: 0 });
    onMoveX(0);
  };

  const updateKnob = (touch: React.Touch) => {
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = rect.width / 2 - 10;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: clampedX, y: clampedY });
    onMoveX(clampedX / maxRadius);
  };

  const triggerAction = (action: string, isDown: boolean) => {
    if (isDown && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    onAction(action, isDown);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none touch-none">
      {/* Left: Virtual Thumbstick */}
      <div className="pointer-events-auto absolute bottom-6 left-6">
        <div
          ref={stickRef}
          onTouchStart={handleStickStart}
          onTouchMove={handleStickMove}
          onTouchEnd={handleStickEnd}
          onTouchCancel={handleStickEnd}
          className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-cyan-400/40 bg-slate-950/60 shadow-[0_0_25px_rgba(56,189,248,0.25)] backdrop-blur-sm"
        >
          {/* Outer Ring Accent */}
          <div className="absolute inset-2 rounded-full border border-cyan-300/20" />
          {/* Thumb Knob */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-300 bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.6)] transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <span className="text-xs font-black tracking-tighter">⚡</span>
          </div>
        </div>
      </div>

      {/* Right: Action Buttons Cluster */}
      <div className="pointer-events-auto absolute bottom-6 right-6 flex flex-col items-end gap-3">
        {/* Top Row: Special & Shuriken */}
        <div className="flex gap-3">
          {/* Special */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerAction("special", true); }}
            onTouchEnd={(e) => { e.preventDefault(); triggerAction("special", false); }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-400/60 bg-amber-500/20 text-xl font-black text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-90"
          >
            🔥
          </button>
          {/* Shuriken */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerAction("shuriken", true); }}
            onTouchEnd={(e) => { e.preventDefault(); triggerAction("shuriken", false); }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-purple-400/60 bg-purple-500/20 text-xl font-black text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-90"
          >
            🌀
          </button>
        </div>

        {/* Middle Row: Parry & Dash */}
        <div className="flex gap-3">
          {/* Parry / Deflect */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerAction("parry", true); }}
            onTouchEnd={(e) => { e.preventDefault(); triggerAction("parry", false); }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-yellow-400 bg-yellow-500/25 text-2xl font-black text-yellow-200 shadow-[0_0_25px_rgba(250,204,21,0.4)] active:scale-90"
          >
            🛡️
          </button>
          {/* Dash */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerAction("dash", true); }}
            onTouchEnd={(e) => { e.preventDefault(); triggerAction("dash", false); }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan-400 bg-cyan-500/25 text-2xl font-black text-cyan-200 shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-90"
          >
            💨
          </button>
        </div>

        {/* Bottom Row: Jump & Slash */}
        <div className="flex gap-3">
          {/* Jump */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerAction("jump", true); }}
            onTouchEnd={(e) => { e.preventDefault(); triggerAction("jump", false); }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-sky-400 bg-sky-500/25 text-2xl font-black text-sky-200 shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-90"
          >
            ▲
          </button>
          {/* Primary Slash Attack (Prominent Large Button) */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerAction("attack", true); }}
            onTouchEnd={(e) => { e.preventDefault(); triggerAction("attack", false); }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl border-3 border-rose-400 bg-gradient-to-tr from-rose-600/40 to-pink-500/40 text-3xl font-black text-white shadow-[0_0_35px_rgba(244,63,94,0.6)] active:scale-90"
          >
            ⚔️
          </button>
        </div>
      </div>
    </div>
  );
}
