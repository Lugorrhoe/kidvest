import type { CSSProperties, ReactNode } from 'react';
import type { Context } from '../engine/game';
import type { Market } from '../engine/market';
import type { Game } from '../engine/types';
import { Plot, type PlotTheme } from './Plot';
import type { AssetDelta } from './Scene';

type Kind = 'barn' | 'coop' | 'pigpen' | 'hives' | 'orchard' | 'field';

const KIND_BY_ID: Record<string, Kind> = { 'farm.cow': 'barn', 'farm.hens': 'coop', 'farm.pig': 'pigpen', 'farm.bees': 'hives', 'farm.tree': 'orchard' };

/** Slot rectangles in percent of the plots area. */
const SLOTS: Record<Kind, CSSProperties> = {
  orchard: { left: '0%', top: '0%', width: '36%', height: '50%' },
  barn: { left: '37.5%', top: '0%', width: '34%', height: '50%' },
  coop: { left: '73%', top: '0%', width: '27%', height: '50%' },
  pigpen: { left: '0%', top: '52%', width: '34%', height: '48%' },
  hives: { left: '35.5%', top: '52%', width: '30%', height: '48%' },
  field: { left: '67%', top: '52%', width: '33%', height: '48%' },
};
const EXTRA_SLOTS: CSSProperties[] = [SLOTS.field, { left: '67%', top: '0%', width: '33%', height: '50%' }];

const STAGE_NAME: Record<Kind, string[]> = {
  barn: ['', 'a small shed', 'a proper barn', 'a barn with a silo', 'a big farm with two barns'],
  coop: ['', 'a tiny coop', 'a coop with a run', 'two coops', 'a large hen house'],
  pigpen: ['', 'a mud puddle', 'a fenced mud pen', 'a pen with a shelter', 'a big pig farm'],
  hives: ['', 'one hive', 'two hives', 'three hives', 'a whole bee yard'],
  orchard: ['', 'a sapling', 'two trees', 'a small orchard', 'a big orchard'],
  field: ['', 'a small plot', 'a fenced plot', 'a large plot', 'a whole field'],
};

/* ------------------------------------------------------------------ palette and shared pieces (viewBox 200 x 120, ground at y = 110) */
const C = {
  red: '#c9302c', redDark: '#8e1f1c', redLight: '#dd4a43', trim: '#fff4e6', trimShade: '#e8d6bc',
  wood: '#8c5a2b', woodLight: '#b07a43', woodDark: '#5c3a16', plank: '#d9a066', plankDark: '#b9803f',
  glass: '#bfe6ff', roof: '#7a4a20', roofLight: '#9a6230', dirt: '#cdb183', dirtDark: '#b89a68',
  leaf: '#4f9a3a', leafLight: '#6fbf5a', leafDark: '#3f8f3a', trunk: '#7a4e22',
};

function Shadow({ cx, rx, cy = 110, ry = 5 }: { cx: number; rx: number; cy?: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="rgba(40,30,10,.16)" />;
}
function Dirt({ cx, rx, cy = 108, ry = 7 }: { cx: number; rx: number; cy?: number; ry?: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={C.dirt} />
      <ellipse cx={cx - rx * 0.1} cy={cy - 1} rx={rx * 0.7} ry={ry * 0.55} fill={C.dirtDark} opacity=".35" />
    </g>
  );
}
/** Vertical plank seams across a rectangle. */
function Planks({ x, y, w, h, step = 10, color = 'rgba(0,0,0,.09)' }: { x: number; y: number; w: number; h: number; step?: number; color?: string }) {
  return <g>{Array.from({ length: Math.floor(w / step) }, (_, i) => <rect key={i} x={x + (i + 1) * step - 0.75} y={y} width="1.5" height={h} fill={color} />)}</g>;
}
function Tuft({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y} l-4 -8 M${x} ${y} l0 -10 M${x} ${y} l4 -8`} stroke={C.leaf} strokeWidth="1.6" strokeLinecap="round" fill="none" />;
}

/* ------------------------------------------------------------------ buildings */
function BarnBody({ x, y, w, h, hayloft, windows }: { x: number; y: number; w: number; h: number; hayloft: boolean; windows: boolean }) {
  const cx = x + w / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={C.red} />
      <rect x={x} y={y} width={w * 0.45} height={h} fill={C.redLight} opacity=".45" />
      <Planks x={x} y={y} w={w} h={h} />
      {/* gambrel roof */}
      <polygon points={`${x - 5},${y} ${x + w * 0.16},${y - 18} ${cx},${y - 30} ${x + w - w * 0.16},${y - 18} ${x + w + 5},${y}`} fill={C.redDark} />
      <polyline points={`${x - 5},${y} ${x + w * 0.16},${y - 18} ${cx},${y - 30}`} fill="none" stroke="#b03a34" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x={x - 6} y={y - 1} width={w + 12} height="3" fill={C.trim} />
      {/* corner boards */}
      <rect x={x} y={y} width="3" height={h} fill={C.trim} />
      <rect x={x + w - 3} y={y} width="3" height={h} fill={C.trim} />
      {/* double door */}
      <rect x={cx - 15} y={y + 15} width="30" height={h - 15} fill={C.trim} />
      <rect x={cx - 12} y={y + 18} width="24" height={h - 18} fill="#f3e3c9" />
      <path d={`M${cx - 12} ${y + 18} L${cx + 12} ${y + h} M${cx + 12} ${y + 18} L${cx - 12} ${y + h} M${cx} ${y + 18} V${y + h}`} stroke={C.red} strokeWidth="2.5" />
      {hayloft && (
        <g>
          <rect x={cx - 8} y={y - 17} width="16" height="13" fill={C.trim} />
          <rect x={cx - 6} y={y - 15} width="12" height="11" fill="#5c1a16" />
          <path d={`M${cx - 6} ${y - 15} L${cx + 6} ${y - 4} M${cx + 6} ${y - 15} L${cx - 6} ${y - 4}`} stroke={C.trim} strokeWidth="1.5" />
        </g>
      )}
      {windows && (
        <g>
          {[x + 9, x + w - 21].map((wx, i) => (
            <g key={i}>
              <rect x={wx} y={y + 14} width="12" height="12" fill={C.trim} />
              <rect x={wx + 1.5} y={y + 15.5} width="9" height="9" fill={C.glass} />
              <path d={`M${wx + 6} ${y + 15.5} V${y + 24.5} M${wx + 1.5} ${y + 20} H${wx + 10.5}`} stroke={C.trim} strokeWidth="1" />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

function Barn({ stage }: { stage: number }) {
  const w = 64 + stage * 16;
  const x = 100 - w / 2;
  const h = 46;
  const y = 110 - h;
  return (
    <g>
      <Dirt cx={100} rx={w / 2 + 34} ry={9} />
      <Shadow cx={100} rx={w / 2 + 20} ry={6} />
      {stage >= 4 && <g transform={`translate(${x - 26} ${y + 14}) scale(.62)`}><BarnBody x={0} y={0} w={64} h={46} hayloft={false} windows={false} /></g>}
      <BarnBody x={x} y={y} w={w} h={h} hayloft={stage >= 2} windows={w >= 96} />
      {stage >= 3 && (
        <g>
          <rect x={x + w + 8} y={y - 14} width="24" height="60" rx="4" fill="#aeb8c4" />
          <rect x={x + w + 8} y={y - 14} width="9" height="60" rx="4" fill="#cfd6de" opacity=".8" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={x + w + 8} y={y - 2 + i * 14} width="24" height="1.5" fill="#7b8794" opacity=".7" />)}
          <ellipse cx={x + w + 20} cy={y - 14} rx="12" ry="7" fill="#6f7a86" />
          <ellipse cx={x + w + 18} cy={y - 16} rx="7" ry="3.5" fill="#8d98a4" />
        </g>
      )}
      {stage >= 4 && (
        <g>
          <path d={`M100 ${y - 30} v-10`} stroke="#333" strokeWidth="1.5" />
          <path d={`M94 ${y - 37} h12 M100 ${y - 40} l4 2 l-4 2 z`} stroke="#333" strokeWidth="1.5" fill="#333" />
        </g>
      )}
      <Tuft x={x - 12} y={110} />
      <Tuft x={x + w + (stage >= 3 ? 40 : 12)} y={110} />
    </g>
  );
}

function Hut({ cx, w, big = false }: { cx: number; w: number; big?: boolean }) {
  const h = big ? 30 : 26;
  const y = 104 - h;
  return (
    <g>
      <rect x={cx - w / 2 + 4} y={104} width="4" height="6" fill={C.woodDark} />
      <rect x={cx + w / 2 - 8} y={104} width="4" height="6" fill={C.woodDark} />
      <rect x={cx - w / 2} y={y} width={w} height={h} fill={C.plank} />
      <Planks x={cx - w / 2} y={y} w={w} h={h} step={8} color="rgba(90,50,10,.18)" />
      <rect x={cx - w / 2 - 2} y={102} width={w + 4} height="3" fill={C.plankDark} />
      <polygon points={`${cx - w / 2 - 6},${y + 1} ${cx},${y - 16} ${cx + w / 2 + 6},${y + 1}`} fill={C.roof} />
      <polygon points={`${cx - w / 2 - 6},${y + 1} ${cx},${y - 16} ${cx},${y + 1}`} fill={C.roofLight} opacity=".55" />
      <path d={`M${cx - w / 2 - 2} ${y - 3} L${cx} ${y - 12} L${cx + w / 2 + 2} ${y - 3}`} fill="none" stroke="#5c3a16" strokeWidth="1" opacity=".5" />
      <circle cx={cx + w / 2 - 9} cy={y + 9} r="4" fill={C.trim} />
      <circle cx={cx + w / 2 - 9} cy={y + 9} r="2.5" fill={C.glass} />
      <rect x={cx - w / 2 + 6} y={y + 8} width="11" height={h - 8} rx="1" fill="#4b2e12" />
      <polygon points={`${cx - w / 2 + 7},${104} ${cx - w / 2 - 18},${110} ${cx - w / 2 - 13},${110} ${cx - w / 2 + 16},${104}`} fill={C.woodLight} />
      {[0, 1, 2].map((i) => <rect key={i} x={cx - w / 2 - 12 + i * 7} y={106.5 - i * 1.6} width="1.5" height="3" fill={C.woodDark} opacity=".7" />)}
      {big && <rect x={cx + w / 2 - 2} y={y + 14} width="8" height="10" fill={C.plankDark} />}
    </g>
  );
}

function Coop({ stage }: { stage: number }) {
  return (
    <g>
      <Dirt cx={100} rx={stage >= 2 ? 84 : 48} ry={8} />
      <Shadow cx={100} rx={stage >= 2 ? 70 : 36} />
      {stage >= 2 && (
        <g>
          {[-86, -46, -6, 34, 74].map((px) => <rect key={px} x={100 + px} y="88" width="3" height="22" rx="1" fill={C.wood} />)}
          <path d="M14 92 H188 M14 99 H188 M14 106 H188" stroke="#b08a60" strokeWidth="1" strokeDasharray="2.5 2.5" opacity=".9" />
          <path d="M14 92 L188 106 M14 106 L188 92" stroke="#b08a60" strokeWidth=".7" strokeDasharray="2 3" opacity=".5" />
        </g>
      )}
      <Hut cx={stage >= 3 ? 68 : 100} w={44 + stage * 6} big={stage >= 4} />
      {stage >= 3 && <Hut cx={142} w={36} />}
      {stage >= 4 && <g><rect x="106" y="100" width="16" height="6" rx="1" fill={C.woodDark} /><rect x="108" y="98" width="12" height="3" fill="#e9c46a" /></g>}
      <Tuft x={12} y={110} />
      <Tuft x={190} y={110} />
    </g>
  );
}

function PigPen({ stage }: { stage: number }) {
  const w = 86 + stage * 22;
  const x = 100 - w / 2;
  const posts = Math.round(w / 22) + 1;
  return (
    <g>
      <Shadow cx={100} rx={w / 2 + 4} cy={110} ry={5} />
      <ellipse cx="100" cy="98" rx={w / 2 - 8} ry={12 + stage * 2} fill="#6b4423" />
      <ellipse cx="100" cy="99" rx={w / 2 - 12} ry={9 + stage * 1.6} fill="#7d5230" />
      <ellipse className="anim-mud" cx="90" cy="97" rx={w / 4} ry={5 + stage} fill="#8f6238" />
      <ellipse cx={112} cy={101} rx={w / 7} ry={3} fill="#9db8cc" opacity=".55" />
      <ellipse cx={108} cy={100} rx={w / 12} ry="1.2" fill="#ffffff" opacity=".35" />
      {Array.from({ length: posts }, (_, i) => (
        <g key={i}>
          <rect x={x + i * 22} y="78" width="5" height="32" rx="1.5" fill={C.woodLight} />
          <rect x={x + i * 22 + 3} y="78" width="2" height="32" fill={C.wood} />
        </g>
      ))}
      <rect x={x} y="85" width={w} height="4" fill={C.woodLight} />
      <rect x={x} y="88" width={w} height="1.5" fill={C.wood} opacity=".7" />
      <rect x={x} y="96" width={w} height="4" fill={C.woodLight} />
      <rect x={x} y="99" width={w} height="1.5" fill={C.wood} opacity=".7" />
      {stage >= 2 && <g><polygon points={`${x + 6},100 ${x + 30},100 ${x + 27},108 ${x + 9},108`} fill="#4b2e12" /><rect x={x + 9} y="101" width="18" height="2.5" fill="#8a5a33" /></g>}
      {stage >= 3 && (
        <g>
          <rect x={x + w - 40} y="84" width="3" height="26" fill={C.wood} />
          <rect x={x + w - 8} y="84" width="3" height="26" fill={C.wood} />
          <polygon points={`${x + w - 46},86 ${x + w - 22},72 ${x + w + 2},86`} fill={C.roof} />
          <polygon points={`${x + w - 46},86 ${x + w - 22},72 ${x + w - 22},86`} fill={C.roofLight} opacity=".5" />
          <rect x={x + w - 42} y="86" width="38" height="2" fill="#5c3a16" />
        </g>
      )}
      {stage >= 4 && (
        <g>
          <polygon points={`${x + 40},100 ${x + 64},100 ${x + 61},108 ${x + 43},108`} fill="#4b2e12" />
          <circle cx={x + w - 24} cy="100" r="7" fill="#e9c46a" /><circle cx={x + w - 18} cy="103" r="5" fill="#f1d58a" />
        </g>
      )}
      <Tuft x={x - 10} y={110} />
    </g>
  );
}

function Hive({ cx, boxes }: { cx: number; boxes: number }) {
  const top = 104 - 6 - boxes * 11;
  return (
    <g>
      <rect x={cx - 11} y="104" width="4" height="6" fill={C.woodDark} />
      <rect x={cx + 7} y="104" width="4" height="6" fill={C.woodDark} />
      <rect x={cx - 14} y="101" width="28" height="4" fill={C.woodLight} />
      {Array.from({ length: boxes }, (_, i) => (
        <g key={i}>
          <rect x={cx - 12} y={101 - (i + 1) * 11} width="24" height="11" fill={i === boxes - 1 && boxes > 1 ? '#f3d26b' : '#fff8e8'} stroke="#d9c5a0" strokeWidth="1" />
          <rect x={cx - 12} y={101 - (i + 1) * 11} width="6" height="11" fill="#000" opacity=".06" />
        </g>
      ))}
      <rect x={cx - 15} y={top - 4} width="30" height="5" rx="1" fill={C.woodLight} />
      <rect x={cx - 15} y={top - 4} width="30" height="2" fill="#d4a46a" />
      <rect x={cx - 5} y="97" width="10" height="2.5" rx="1" fill="#3d2a14" />
      {[[-18, -8], [16, -14], [20, -4]].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={top + dy} r="1.3" fill="#3d2a14" opacity=".7" />)}
    </g>
  );
}

function Flowers({ x, n }: { x: number; n: number }) {
  const cols = ['#f783ac', '#ffd43b', '#ffffff', '#ff8787', '#da77f2'];
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <path d={`M${x + i * 6} 110 q 1 -6 0 -11`} stroke={C.leaf} strokeWidth="1.5" fill="none" />
          <circle cx={x + i * 6} cy="98" r="2.6" fill={cols[i % 5]} />
          <circle cx={x + i * 6} cy="98" r="1" fill="#fff4b3" />
        </g>
      ))}
    </g>
  );
}

function Hives({ stage }: { stage: number }) {
  const xs = stage === 1 ? [100] : stage === 2 ? [80, 122] : stage === 3 ? [62, 100, 140] : [52, 86, 120, 154];
  return (
    <g>
      <Shadow cx={100} rx={stage * 22 + 20} ry={4} />
      <ellipse cx="100" cy="109" rx={stage * 24 + 24} ry="5" fill="#86c45f" opacity=".7" />
      {xs.map((cx, i) => <Hive key={i} cx={cx} boxes={2 + ((i + stage) % 2)} />)}
      <Flowers x={16} n={3 + Math.min(stage, 2)} />
      <Flowers x={164} n={2 + Math.min(stage, 3)} />
      {stage >= 3 && <Flowers x={xs[0] + 20} n={2} />}
    </g>
  );
}

function Tree({ cx, k = 1, apples = 5 }: { cx: number; k?: number; apples?: number }) {
  const dots: [number, number][] = [[-12, -34], [6, -40], [14, -28], [-4, -24], [-16, -22], [10, -18], [0, -48]];
  return (
    <g transform={`translate(${cx} 110) scale(${k})`}>
      <ellipse cx="0" cy="0" rx="16" ry="3.5" fill="rgba(40,30,10,.16)" />
      <path d="M-3 0 L-3 -22 Q -3 -28 -8 -32 M3 0 L3 -22 Q 3 -28 8 -32" stroke={C.trunk} strokeWidth="6" strokeLinecap="round" fill="none" />
      <rect x="-4" y="-24" width="8" height="24" fill={C.trunk} />
      <ellipse cx="0" cy="-34" rx="24" ry="20" fill={C.leafDark} />
      <ellipse cx="-4" cy="-38" rx="20" ry="17" fill={C.leaf} />
      <ellipse cx="-8" cy="-42" rx="12" ry="10" fill={C.leafLight} opacity=".85" />
      {dots.slice(0, apples).map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r="2.6" fill="#e03131" />)}
      {dots.slice(0, apples).map(([dx, dy], i) => <circle key={`h${i}`} cx={dx - 0.8} cy={dy - 0.8} r="0.9" fill="#ffc9c9" />)}
    </g>
  );
}

function Orchard({ stage }: { stage: number }) {
  return (
    <g>
      <rect x="6" y="100" width="188" height="12" rx="4" fill="#86c45f" />
      {[0, 1, 2].map((r) => <path key={r} d={`M10 ${104 + r * 3} H190`} stroke="#6aa848" strokeWidth="1" opacity=".7" />)}
      {stage === 1 && (
        <g>
          <rect x="99" y="80" width="2" height="30" fill={C.trunk} />
          <ellipse cx="100" cy="78" rx="9" ry="8" fill={C.leaf} />
          <ellipse cx="97" cy="75" rx="5" ry="4" fill={C.leafLight} />
          <rect x="106" y="84" width="1.5" height="26" fill={C.woodLight} />
          <path d="M100 92 H107" stroke={C.woodLight} strokeWidth="1" />
        </g>
      )}
      {stage === 2 && <g><Tree cx={70} k={0.95} apples={4} /><Tree cx={130} k={0.95} apples={5} /></g>}
      {stage === 3 && <g><Tree cx={46} k={0.9} apples={5} /><Tree cx={100} k={1} apples={6} /><Tree cx={154} k={0.9} apples={5} /></g>}
      {stage >= 4 && <g><Tree cx={34} k={0.85} apples={5} /><Tree cx={78} k={1} apples={7} /><Tree cx={124} k={1} apples={7} /><Tree cx={168} k={0.85} apples={5} /></g>}
      {stage >= 2 && <g><ellipse cx="22" cy="106" rx="9" ry="4" fill={C.woodLight} /><rect x="13" y="98" width="18" height="8" rx="2" fill={C.woodLight} /><rect x="13" y="98" width="18" height="2" fill={C.wood} /><circle cx="18" cy="97" r="2.2" fill="#e03131" /><circle cx="23" cy="96" r="2.2" fill="#e03131" /><circle cx="27" cy="97.5" r="2.2" fill="#e03131" /></g>}
      {stage >= 4 && <g><path d="M176 108 L184 70 M190 108 L198 70" stroke={C.woodLight} strokeWidth="2" /><path d="M178 100 H192 M180 90 H194 M182 80 H196" stroke={C.woodLight} strokeWidth="2" /></g>}
    </g>
  );
}

function Field({ stage }: { stage: number }) {
  const w = 90 + stage * 22;
  const x = 100 - w / 2;
  return (
    <g>
      <Shadow cx={100} rx={w / 2} ry={4} />
      <rect x={x} y="84" width={w} height="24" rx="5" fill="#a3763f" />
      {[0, 1, 2, 3].map((r) => <rect key={r} x={x + 4} y={88 + r * 5.5} width={w - 8} height="2" rx="1" fill="#7a5222" opacity=".7" />)}
      {stage >= 2 && Array.from({ length: Math.floor(w / 9) }, (_, i) => <g key={i}><path d={`M${x + 6 + i * 9} 96 q -3 -5 -1 -8 M${x + 6 + i * 9} 96 q 3 -5 1 -8`} stroke={C.leafLight} strokeWidth="1.4" fill="none" /></g>)}
      {stage >= 3 && Array.from({ length: Math.round(w / 22) + 1 }, (_, i) => <rect key={i} x={x + i * 22} y="78" width="3" height="30" fill={C.wood} />)}
      {stage >= 3 && <rect x={x} y="83" width={w} height="2.5" fill={C.woodLight} />}
      {stage >= 4 && <g><rect x={x + w - 14} y="62" width="2" height="30" fill={C.woodLight} /><rect x={x + w - 24} y="70" width="22" height="2" fill={C.woodLight} /><circle cx={x + w - 13} cy="62" r="5" fill="#e9c46a" /><polygon points={`${x + w - 22},62 ${x + w - 13},54 ${x + w - 4},62`} fill={C.roof} /></g>}
    </g>
  );
}

const SCALE: Record<Kind, number> = { barn: 1.05, coop: 1.25, pigpen: 1.5, hives: 1.45, orchard: 1.4, field: 1.4 };
const Scaled = (K: (p: { stage: number }) => ReactNode, k: number) => ({ stage }: { stage: number }) => <g transform={`translate(100 112) scale(${k}) translate(-100 -112)`}>{K({ stage })}</g>;
const BUILDING: Record<Kind, (p: { stage: number }) => ReactNode> = { barn: Scaled(Barn, SCALE.barn), coop: Scaled(Coop, SCALE.coop), pigpen: Scaled(PigPen, SCALE.pigpen), hives: Scaled(Hives, SCALE.hives), orchard: Scaled(Orchard, SCALE.orchard), field: Scaled(Field, SCALE.field) };
const ANIM: Record<Kind, string> = { barn: 'anim-graze', coop: 'anim-peck', pigpen: 'anim-wiggle', hives: 'anim-buzz', orchard: 'anim-sway', field: 'bob' };

/** Where the animals stand, in percent of the plot (x, y from top). */
function animalSpots(kind: Kind, n: number): [number, number][] {
  const row = (y: number, count: number, x0: number, x1: number) => Array.from({ length: count }, (_, i) => [x0 + ((x1 - x0) * (i + 0.5)) / count, y] as [number, number]);
  switch (kind) {
    case 'barn': return [...row(70, Math.min(n, 5), 6, 94), ...row(58, Math.max(0, n - 5), 14, 86)];
    case 'coop': return [...row(72, Math.min(n, 5), 6, 94), ...row(61, Math.max(0, n - 5), 10, 90)];
    case 'pigpen': return [...row(70, Math.min(n, 4), 18, 82), ...row(58, Math.max(0, n - 4), 22, 78)];
    case 'hives': return Array.from({ length: n }, (_, i) => [15 + ((i * 37) % 70), 22 + ((i * 23) % 28)] as [number, number]);
    case 'orchard': return [...row(56, Math.min(n, 4), 8, 92), ...row(40, Math.max(0, n - 4), 20, 80)];
    default: return row(66, n, 8, 92);
  }
}

const FARM_THEME: PlotTheme = {
  nameTag: { background: 'rgba(255,255,255,.82)', color: '#3d2a14', boxShadow: '0 1px 2px rgba(0,0,0,.08)' },
  sign: { background: '#f6deaa', border: '2px solid #b07a43', color: '#5c3d1e', boxShadow: '0 2px 4px rgba(60,40,10,.15)' },
  emptyText: 'not on your farm yet',
};
const ICON_SIZE: Record<Kind, number> = { barn: 30, coop: 30, pigpen: 30, hives: 20, orchard: 40, field: 30 };

export function FarmPlots({ deltas, game, market, ctx, showDelta, n, onOpen }: { deltas: AssetDelta[]; game: Game; market: Market; ctx: Context; showDelta: boolean; n: number; onOpen: (id: string) => void }) {
  let extra = 0;
  return (
    <div className="relative h-full w-full">
      {deltas.map((d) => {
        const kind = KIND_BY_ID[d.asset.id] ?? 'field';
        const style = KIND_BY_ID[d.asset.id] ? SLOTS[kind] : EXTRA_SLOTS[Math.min(extra++, EXTRA_SLOTS.length - 1)];
        const Building = BUILDING[kind];
        return (
          <Plot
            key={d.asset.id}
            d={d}
            style={style}
            game={game}
            market={market}
            ctx={ctx}
            showDelta={showDelta}
            n={n}
            onOpen={onOpen}
            building={(stage) => <Building stage={stage} />}
            stageNames={STAGE_NAME[kind]}
            spots={(count) => animalSpots(kind, count)}
            anim={ANIM[kind]}
            iconSize={ICON_SIZE[kind]}
            theme={FARM_THEME}
          />
        );
      })}
    </div>
  );
}

/** The farmhouse that holds the coins. */
export function Farmhouse() {
  return (
    <svg viewBox="0 0 160 130" className="w-[150px]" aria-hidden>
      <ellipse cx="80" cy="126" rx="70" ry="5" fill="rgba(40,30,10,.16)" />
      {/* chimney and smoke */}
      <rect x="112" y="28" width="13" height="32" fill="#8c5a2b" />
      <rect x="110" y="26" width="17" height="5" fill="#6b3e1a" />
      {[0, 1, 2].map((i) => <circle key={i} className="anim-smoke" style={{ animationDelay: `${i * 1.05}s`, transformOrigin: '118px 22px' }} cx="118" cy="22" r="4.5" fill="#dfe4ea" opacity=".7" />)}
      {/* roof */}
      <polygon points="6,62 80,12 154,62" fill="#9a4a28" />
      <polygon points="6,62 80,12 80,62" fill="#b25a33" opacity=".55" />
      {[26, 40, 54].map((yy, i) => <path key={i} d={`M${80 - (yy - 12) * 1.48} ${yy} H${80 + (yy - 12) * 1.48}`} stroke="#7a3a1f" strokeWidth="1" opacity=".5" />)}
      <rect x="2" y="60" width="156" height="4" rx="1" fill="#f3e3c9" />
      {/* walls */}
      <rect x="20" y="62" width="120" height="62" fill="#fff4e6" />
      <rect x="20" y="62" width="120" height="62" fill="url(#fhwall)" opacity=".4" />
      <rect x="20" y="112" width="120" height="12" fill="#d9c3a3" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={22 + i * 15} y={i % 2 ? 118 : 113} width="12" height="5" rx="1" fill="#c4ab86" opacity=".8" />)}
      {/* door with porch step */}
      <rect x="66" y="86" width="28" height="38" rx="2" fill="#8c5a2b" />
      <rect x="69" y="89" width="22" height="18" rx="1" fill="#b07a43" opacity=".6" />
      <rect x="72" y="92" width="16" height="9" fill={'#bfe6ff'} />
      <circle cx="88" cy="110" r="2" fill="#f1c40f" />
      <rect x="60" y="122" width="40" height="4" rx="1" fill="#c4ab86" />
      {/* windows with flower boxes */}
      {[30, 106].map((wx) => (
        <g key={wx}>
          <rect x={wx - 2} y="72" width="28" height="26" rx="1" fill="#fff" />
          <rect x={wx} y="74" width="24" height="22" fill="#bfe6ff" />
          <rect x={wx} y="74" width="24" height="8" fill="#ffffff" opacity=".35" />
          <path d={`M${wx + 12} 74 V96 M${wx} 85 H${wx + 24}`} stroke="#8c5a2b" strokeWidth="2" />
          <rect x={wx - 3} y="96" width="30" height="5" rx="1" fill="#8c5a2b" />
          {[3, 9, 15, 21].map((fx, i) => <circle key={i} cx={wx + fx} cy="95" r="2.4" fill={i % 2 ? '#f783ac' : '#ff8787'} />)}
          <path d={`M${wx + 1} 96 q 4 -4 8 -1 M${wx + 13} 96 q 4 -4 8 -1`} stroke="#4f9a3a" strokeWidth="1.5" fill="none" />
        </g>
      ))}
      {/* bushes and mailbox */}
      <circle cx="12" cy="118" r="9" fill="#5e9f45" /><circle cx="6" cy="121" r="6" fill="#73b556" />
      <circle cx="150" cy="118" r="8" fill="#5e9f45" /><circle cx="155" cy="121" r="5" fill="#73b556" />
      <rect x="134" y="98" width="18" height="12" rx="3" fill="#b07a43" stroke="#6b3e1a" strokeWidth="1" />
      <rect x="141" y="110" width="3" height="14" fill="#6b3e1a" />
      <circle cx="146" cy="104" r="1.6" fill="#f1c40f" />
      <defs>
        <linearGradient id="fhwall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e8d6bc" /></linearGradient>
      </defs>
    </svg>
  );
}
