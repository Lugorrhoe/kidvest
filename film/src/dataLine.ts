import { FIRST_YEAR, LAST_YEAR, annualReturn } from '../../src/data/history';
import { HEIGHT, WIDTH } from './timeline';

export interface Pt { x: number; y: number }

export const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
export const N = YEARS.length; // 98 points, 1928 .. 2025
export const IDX_2008 = 2008 - FIRST_YEAR;

const LINE_LEFT = 180;
const LINE_RIGHT = WIDTH - 180;
const LINE_TOP = 300;
const LINE_BOTTOM = 760;

/** Real S&P 500 cumulative growth (incl. dividends), log scale, in stage coordinates. */
export const SP_POINTS: Pt[] = (() => {
  let v = 1;
  const vals = YEARS.map((y) => (v *= 1 + annualReturn('stocks', y)));
  const lo = Math.log(Math.min(1, ...vals));
  const hi = Math.log(Math.max(...vals));
  return vals.map((val, i) => ({ x: LINE_LEFT + ((LINE_RIGHT - LINE_LEFT) * i) / (N - 1), y: LINE_BOTTOM - ((Math.log(val) - lo) / (hi - lo)) * (LINE_BOTTOM - LINE_TOP) }));
})();

export const xOfYear = (year: number) => SP_POINTS[year - FIRST_YEAR].x;

/* The farm backdrop's horizon: "M0 150 C 160 95 320 120 460 105 C 640 85 760 130 900 108 C 1020 92 1120 112 1200 100"
   in a 1200 x 470 viewBox, drawn with preserveAspectRatio slice into the 1240 x 600 scene card. */
const SLICE_SCALE = 600 / 470;
const SLICE_DX = (1240 - 1200 * SLICE_SCALE) / 2;

function cubic(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** The hill curve sampled at N points across the visible card width, in stage coordinates at camera scale 1. */
export function hillPoints(cardLeft: number, cardTop: number): Pt[] {
  const segs = [
    { x: [0, 160, 320, 460], y: [150, 95, 120, 105] },
    { x: [460, 640, 760, 900], y: [105, 85, 130, 108] },
    { x: [900, 1020, 1120, 1200], y: [108, 92, 112, 100] },
  ];
  const vx0 = -SLICE_DX / SLICE_SCALE; // viewBox x at the card's left edge
  const vx1 = (1240 - SLICE_DX) / SLICE_SCALE;
  return Array.from({ length: N }, (_, i) => {
    const vx = vx0 + ((vx1 - vx0) * i) / (N - 1);
    const s = vx < 460 ? segs[0] : vx < 900 ? segs[1] : segs[2];
    // invert x(t) numerically (x is monotonic on both segments)
    let lo = 0, hi = 1;
    for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (cubic(s.x[0], s.x[1], s.x[2], s.x[3], mid) < vx) lo = mid; else hi = mid; }
    const t = (lo + hi) / 2;
    const vy = cubic(s.y[0], s.y[1], s.y[2], s.y[3], t);
    return { x: cardLeft + SLICE_DX + vx * SLICE_SCALE, y: cardTop + vy * SLICE_SCALE };
  });
}

export const lerpPts = (a: Pt[], b: Pt[], t: number): Pt[] => a.map((p, i) => ({ x: p.x + (b[i].x - p.x) * t, y: p.y + (b[i].y - p.y) * t }));
export const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

export const STAGE_CENTER: Pt = { x: WIDTH / 2, y: HEIGHT / 2 };
