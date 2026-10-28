import { useEffect, useState } from 'react';

const COLORS = ['#ffd43b', '#ff6b6b', '#4dabf7', '#51cf66', '#cc5de8', '#ff922b', '#20c997'];

/** A short, deterministic confetti burst. Remount with a new key to fire again. */
export function Confetti({ count = 48 }: { count?: number }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDone(true), 2800);
    return () => clearTimeout(id);
  }, []);
  if (done) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="confetti absolute top-0 block"
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            width: 6 + (i % 3) * 3,
            height: 10 + (i % 4) * 3,
            background: COLORS[i % COLORS.length],
            borderRadius: i % 2 ? '50%' : 2,
            animationDelay: `${(i % 9) * 0.07}s`,
            animationDuration: `${1.9 + (i % 5) * 0.22}s`,
          }}
        />
      ))}
    </div>
  );
}
