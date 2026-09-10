import { useMemo } from "react";

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

interface Mote {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  hue: number;
}

export default function Starfield() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.2 + 0.8,
        delay: Math.random() * 5,
        duration: Math.random() * 4 + 3,
      })),
    []
  );

  const motes = useMemo<Mote[]>(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 120 + 60,
        delay: Math.random() * 8,
        duration: Math.random() * 12 + 9,
        hue: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(88,58,180,0.55),transparent_60%),radial-gradient(100%_70%_at_85%_100%,rgba(30,64,120,0.5),transparent_55%),radial-gradient(90%_70%_at_10%_90%,rgba(120,40,90,0.4),transparent_55%)]" />
      {motes.map((m) => (
        <div
          key={m.id}
          className="animate-drift absolute rounded-full"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            background: `radial-gradient(circle, hsla(${m.hue}, 85%, 65%, 0.14), transparent 70%)`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}
      {stars.map((s) => (
        <div
          key={s.id}
          className="animate-twinkle absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: "0 0 6px rgba(255,255,255,0.8)",
          }}
        />
      ))}
    </div>
  );
}
