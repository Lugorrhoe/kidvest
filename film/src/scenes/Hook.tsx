import { useCurrentFrame } from 'remotion';
import { IDX_2008, N, SP_POINTS, YEARS, toPath, xOfYear } from '../dataLine';
import { Caption, EASE, Stage, fadeIn, fadeOut, tw } from '../motion';
import { HEIGHT, SHOT } from '../timeline';

const [s1, s2] = [SHOT.s1, SHOT.s2];

/** Draw progress 0..1 along the line: eases to 2008, pauses, then finishes. */
export function lineProgress(frame: number) {
  const to2008 = IDX_2008 / (N - 1);
  const a = s2[0] + 6, b = s2[0] + 60, c = b + 14, d = s2[1] - 10;
  if (frame < b) return tw(frame, a, b, 0, to2008, EASE.inOut);
  if (frame < c) return to2008;
  return tw(frame, c, d, to2008, 1, EASE.out);
}

export function DataLine({ progress, opacity = 1, marker = true }: { progress: number; opacity?: number; marker?: boolean }) {
  const frame = useCurrentFrame();
  const last = progress * (N - 1);
  const full = Math.floor(last);
  const pts = SP_POINTS.slice(0, full + 1);
  if (full < N - 1) {
    const a = SP_POINTS[full], b = SP_POINTS[full + 1], t = last - full;
    pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  const showMarker = marker && progress >= IDX_2008 / (N - 1) - 1e-6;
  const markerO = showMarker ? Math.min(fadeIn(frame, s2[0] + 60, 10), fadeOut(frame, s2[1], 12)) : 0;
  const pulse = 1 + 0.25 * Math.sin((frame - s2[0]) * 0.35);
  const m = SP_POINTS[IDX_2008];
  return (
    <svg style={{ position: 'absolute', inset: 0, opacity }} width="1920" height="1080" viewBox="0 0 1920 1080">
      {YEARS.filter((y) => y % 10 === 0).map((y) => (
        <g key={y} opacity={0.3 * Math.min(1, progress / ((y - 1928) / (N - 1) + 1e-6))}>
          <line x1={xOfYear(y)} x2={xOfYear(y)} y1={790} y2={800} stroke="#fff" strokeWidth="1.5" />
          <text x={xOfYear(y)} y={826} fill="#fff" fontSize="16" textAnchor="middle" fontFamily="Inter, 'Segoe UI', sans-serif">{y}</text>
        </g>
      ))}
      <path d={toPath(pts)} fill="none" stroke="rgba(255,255,255,.92)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {showMarker && (
        <g opacity={markerO}>
          <circle cx={m.x} cy={m.y} r={5 * pulse} fill="#ff6b6b" />
          <line x1={m.x} x2={m.x} y1={m.y + 10} y2={m.y + 70} stroke="#ff6b6b" strokeWidth="2" />
          <text x={m.x} y={m.y + 100} fill="#ff8787" fontSize="24" fontWeight="700" textAnchor="middle" fontFamily="Inter, 'Segoe UI', sans-serif">2008 · −37 %</text>
        </g>
      )}
    </svg>
  );
}

export function HookChapter() {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <Caption text="How do you explain 2008" start={s1[0] + 10} end={s1[1] - 6} size="l" y={HEIGHT / 2 - 92} />
      <Caption text="to a seven-year-old?" start={s1[0] + 34} end={s1[1] - 6} size="l" y={HEIGHT / 2 - 4} />
      {frame >= s2[0] && <DataLine progress={lineProgress(frame)} />}
      <Caption text="97 years of real market history" start={s2[0] + 16} end={s2[1]} size="s" align="left" y={HEIGHT - 150} weight={600} color="rgba(255,255,255,.6)" />
    </Stage>
  );
}
