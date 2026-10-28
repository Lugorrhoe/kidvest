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
/* ------------------------------------------------------------------ buildings (viewBox 200 x 120, ground at y = 110) */
function Barn({ stage }: { stage: number }) {
  const w = 70 + stage * 18;
  const x = 100 - w / 2;
  const h = 48;
  const y = 110 - h;
  return (
    <g>
      {stage >= 4 && <rect x={x - 34} y={y + 16} width={40} height={32} fill="#b9302a" />}
      {stage >= 4 && <polygon points={`${x - 36},${y + 18} ${x - 14},${y + 2} ${x + 8},${y + 18}`} fill="#7a1f1a" />}
      <rect x={x} y={y} width={w} height={h} fill="#d6332c" />
      <polygon points={`${x - 4},${y} ${x + w * 0.18},${y - 20} ${x + w * 0.5},${y - 30} ${x + w * 0.82},${y - 20} ${x + w + 4},${y}`} fill="#8c2420" />
      <rect x={100 - 12} y={y + 18} width={24} height={30} fill="#fff4e6" />
      <path d={`M${100 - 12} ${y + 18} L${100 + 12} ${y + 48} M${100 + 12} ${y + 18} L${100 - 12} ${y + 48}`} stroke="#d6332c" strokeWidth="3" />
      {stage >= 2 && <rect x={100 - 7} y={y - 14} width={14} height={11} fill="#fff4e6" />}
      {stage >= 3 && (
        <g>
          <rect x={x + w + 8} y={y - 12} width={22} height={60} rx="3" fill="#9aa5b1" />
          <ellipse cx={x + w + 19} cy={y - 12} rx={11} ry={7} fill="#6b7680" />
        </g>
      )}
      {stage >= 4 && <path d={`M100 ${y - 30} v-10 h8 l-4 3 l4 3 h-8`} stroke="#333" strokeWidth="1.5" fill="#333" />}
      <rect x={x - 6} y="108" width={w + 12} height="4" fill="#8c5a2b" />
    </g>
  );
}

function Coop({ stage }: { stage: number }) {
  const w = 46 + stage * 10;
  const hut = (cx: number, scale = 1) => (
    <g transform={`translate(${cx} 0) scale(${scale})`}>
      <rect x={-w / 2} y={70} width={w} height={30} fill="#c98a4b" />
      <polygon points={`${-w / 2 - 4},70 0,52 ${w / 2 + 4},70`} fill="#7a4a20" />
      <rect x={-7} y={82} width={14} height={18} fill="#4b2e12" />
      <rect x={-w / 2 + 4} y={100} width={4} height={10} fill="#6b3e1a" />
      <rect x={w / 2 - 8} y={100} width={4} height={10} fill="#6b3e1a" />
      <polygon points={`-7,100 -30,110 -26,110 -5,100`} fill="#a9743a" />
      {stage >= 4 && <rect x={w / 2 - 20} y={76} width={10} height={8} fill="#fff4e6" />}
    </g>
  );
  return (
    <g>
      {stage >= 2 && (
        <g>
          {[-85, -45, -5, 35, 75].map((px) => <rect key={px} x={100 + px} y="92" width="3" height="18" fill="#8c5a2b" />)}
          <path d="M15 96 H185 M15 104 H185" stroke="#b08a60" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      )}
      {hut(stage >= 3 ? 70 : 100)}
      {stage >= 3 && hut(140, 0.8)}
      <rect x="10" y="108" width="180" height="4" fill="#8c5a2b" />
    </g>
  );
}

function PigPen({ stage }: { stage: number }) {
  const w = 90 + stage * 22;
  const x = 100 - w / 2;
  return (
    <g>
      <ellipse cx="100" cy="98" rx={w / 2 - 10} ry={12 + stage * 2} fill="#6b4423" />
      <ellipse className="anim-mud" cx="92" cy="96" rx={w / 4} ry={6 + stage} fill="#8a5a33" />
      {Array.from({ length: Math.round(w / 22) + 1 }, (_, i) => <rect key={i} x={x + i * 22} y="80" width="4" height="30" fill="#8c5a2b" />)}
      <rect x={x} y="86" width={w} height="3" fill="#b07a43" />
      <rect x={x} y="97" width={w} height="3" fill="#b07a43" />
      {stage >= 2 && <rect x={x + 8} y="100" width="22" height="7" rx="2" fill="#4b2e12" />}
      {stage >= 3 && (
        <g>
          <polygon points={`${x + w - 44},84 ${x + w - 24},70 ${x + w - 4},84`} fill="#7a4a20" />
          <rect x={x + w - 42} y="84" width="3" height="24" fill="#8c5a2b" />
          <rect x={x + w - 9} y="84" width="3" height="24" fill="#8c5a2b" />
        </g>
      )}
      {stage >= 4 && <rect x={x + 36} y="100" width="22" height="7" rx="2" fill="#4b2e12" />}
    </g>
  );
}

function Hives({ stage }: { stage: number }) {
  const n = stage;
  const xs = n === 1 ? [100] : n === 2 ? [78, 122] : n === 3 ? [60, 100, 140] : [50, 84, 118, 152];
  return (
    <g>
      {xs.map((cx, i) => (
        <g key={i}>
          <rect x={cx - 14} y="104" width="28" height="4" fill="#6b3e1a" />
          <rect x={cx - 12} y="86" width="24" height="18" fill="#fff8e1" stroke="#c9a04a" />
          <rect x={cx - 12} y="74" width="24" height="12" fill="#ffe08a" stroke="#c9a04a" />
          <polygon points={`${cx - 15},74 ${cx},64 ${cx + 15},74`} fill="#a9743a" />
          <rect x={cx - 4} y="98" width="8" height="3" fill="#6b3e1a" />
        </g>
      ))}
      {[30, 170, 20, 180].slice(0, stage).map((fx, i) => (
        <g key={i}>
          <rect x={fx} y="96" width="2" height="14" fill="#5c9c3a" />
          <circle cx={fx + 1} cy="94" r="4" fill={i % 2 ? '#f783ac' : '#ffd43b'} />
        </g>
      ))}
      <rect x="10" y="108" width="180" height="4" fill="#7fb85a" />
    </g>
  );
}

function Orchard({ stage }: { stage: number }) {
  return (
    <g>
      <rect x="10" y="100" width="180" height="12" rx="3" fill="#7fb85a" />
      {[0, 1, 2].slice(0, stage >= 3 ? 3 : 1).map((r) => <path key={r} d={`M14 ${104 + r * 3} H186`} stroke="#6aa848" strokeWidth="1" />)}
      {stage >= 2 && <rect x="20" y="92" width="18" height="12" rx="2" fill="#b07a43" />}
      {stage >= 4 && <rect x="160" y="88" width="24" height="14" rx="2" fill="#8c5a2b" />}
    </g>
  );
}

function Field({ stage }: { stage: number }) {
  const w = 90 + stage * 22;
  const x = 100 - w / 2;
  return (
    <g>
      <rect x={x} y="86" width={w} height="22" rx="4" fill="#a6dc84" />
      {stage >= 2 && Array.from({ length: Math.round(w / 22) + 1 }, (_, i) => <rect key={i} x={x + i * 22} y="80" width="3" height="28" fill="#8c5a2b" />)}
      {stage >= 3 && <rect x={x} y="90" width={w} height="3" fill="#b07a43" />}
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
  nameTag: { background: 'rgba(255,255,255,.8)', color: '#3d2a14' },
  sign: { background: '#f6deaa', border: '2px solid #b07a43', color: '#5c3d1e' },
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
      <rect x="112" y="30" width="12" height="30" fill="#8c5a2b" />
      <circle cx="118" cy="24" r="5" fill="#dfe4ea" opacity=".8" />
      <circle cx="124" cy="15" r="4" fill="#dfe4ea" opacity=".6" />
      <polygon points="10,62 80,14 150,62" fill="#a0522d" />
      <rect x="20" y="60" width="120" height="66" fill="#fff4e6" stroke="#d9c3a3" />
      <rect x="68" y="90" width="24" height="36" fill="#8c5a2b" />
      <circle cx="87" cy="109" r="2" fill="#f1c40f" />
      <rect x="32" y="74" width="22" height="20" fill="#9fd3ff" stroke="#8c5a2b" strokeWidth="2" />
      <rect x="106" y="74" width="22" height="20" fill="#9fd3ff" stroke="#8c5a2b" strokeWidth="2" />
      <path d="M43 74 V94 M32 84 H54 M117 74 V94 M106 84 H128" stroke="#8c5a2b" strokeWidth="2" />
      <rect x="10" y="124" width="140" height="6" fill="#8c5a2b" />
      <rect x="128" y="104" width="22" height="16" rx="3" fill="#b07a43" stroke="#6b3e1a" />
      <rect x="128" y="100" width="22" height="7" rx="3" fill="#8c5a2b" />
      <circle cx="139" cy="112" r="2" fill="#f1c40f" />
    </svg>
  );
}
