import type { ReactNode } from 'react';
import type { Context } from '../engine/game';
import type { Market } from '../engine/market';
import type { Game } from '../engine/types';
import { Plot, slotFor, type PlotTheme } from './Plot';
import type { AssetDelta } from './Scene';

type Kind = 'tower' | 'glass' | 'hq' | 'hall' | 'garage' | 'vault' | 'houses' | 'bank' | 'shop';

const KIND_BY_ID: Record<string, Kind> = {
  'city.cityetf': 'tower',
  'city.cityacc': 'glass',
  'city.active': 'hq',
  'city.bonds': 'hall',
  'city.startup': 'garage',
  'city.gold': 'vault',
  'city.property': 'houses',
  'city.savings': 'bank',
};

const STAGE_NAME: Record<Kind, string[]> = {
  tower: ['', 'a small office', 'a mid-rise', 'a high-rise', 'a skyline tower'],
  glass: ['', 'a glass studio', 'a glass mid-rise', 'a glass high-rise', 'a landmark tower'],
  hq: ['', 'a rented office', 'a manager suite', 'a fancy HQ', 'a gleaming tower'],
  hall: ['', 'a city kiosk', 'a city office', 'a city hall', 'a grand city hall'],
  garage: ['', 'a garage', 'a workshop', 'a startup loft', 'an innovation campus'],
  vault: ['', 'a safe box', 'a strongroom', 'a vault', 'a grand vault'],
  houses: ['', 'one house', 'two houses', 'a row of homes', 'a whole block'],
  bank: ['', 'a savings counter', 'a small branch', 'a big branch', 'a main branch'],
  shop: ['', 'a market stall', 'a corner shop', 'a big store', 'a flagship store'],
};

/* ------------------------------------------------------------------ buildings (viewBox 200 x 120, street at y = 108) */
function Street() {
  return (
    <g>
      <rect x="4" y="108" width="192" height="5" rx="2" fill="#495057" />
      {[20, 60, 100, 140, 180].map((x) => <rect key={x} x={x - 8} y="110" width="16" height="1.4" fill="#adb5bd" />)}
    </g>
  );
}

/** Deterministic lit/unlit window grid. */
function Windows({ x, y, w, h, light = '#d0ebff', dim = '#6b8299' }: { x: number; y: number; w: number; h: number; light?: string; dim?: string }) {
  const cols = Math.max(1, Math.floor((w - 6) / 10));
  const rows = Math.max(1, Math.floor((h - 6) / 12));
  return (
    <g>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return <rect key={i} x={x + 4 + c * ((w - 8) / cols) + 1} y={y + 4 + r * ((h - 8) / rows) + 1} width={(w - 8) / cols - 3} height={(h - 8) / rows - 4} rx="1" fill={(i * 7) % 10 < 7 ? light : dim} />;
      })}
    </g>
  );
}

function Tower({ stage }: { stage: number }) {
  const h = 34 + stage * 17;
  const w = 46 + stage * 7;
  const x = 100 - w / 2;
  const y = 108 - h;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#38698f" />
      <rect x={x} y={y} width={w} height="5" fill="#2b5570" />
      <Windows x={x} y={y + 5} w={w} h={h - 12} />
      <rect x={x + w / 2 - 7} y={108 - 11} width="14" height="11" fill="#1d3a4f" />
      {stage >= 3 && <rect x={x + w / 2 - 1.5} y={y - 14} width="3" height="14" fill="#2b5570" />}
      {stage >= 4 && <circle className="twinkle" cx={x + w / 2} cy={y - 17} r="2.5" fill="#ff6b6b" />}
      <Street />
    </g>
  );
}

function GlassTower({ stage }: { stage: number }) {
  const h = 30 + stage * 18;
  const w = 44 + stage * 6;
  const x = 100 - w / 2;
  const y = 108 - h;
  return (
    <g>
      <polygon points={`${x},${y + 10} ${x + w},${y} ${x + w},108 ${x},108`} fill="#4dabf7" />
      {Array.from({ length: Math.floor(w / 9) }, (_, i) => <rect key={i} x={x + 3 + i * 9} y={y + 10 - (i * 9 * 10) / w} width="3.5" height={h - 12 + (i * 9 * 10) / w} fill="#a5d8ff" opacity=".75" />)}
      <rect x={x + w / 2 - 7} y={108 - 10} width="14" height="10" fill="#1864ab" />
      {stage >= 4 && <rect x={x + w - 8} y={y - 16} width="2.5" height="18" fill="#1864ab" />}
      <Street />
    </g>
  );
}

function Hq({ stage }: { stage: number }) {
  const h = 36 + stage * 15;
  const w = 48 + stage * 5;
  const x = 100 - w / 2;
  const y = 108 - h;
  return (
    <g>
      {stage >= 3 && <rect x={x + 8} y={y - 10} width={w - 16} height="10" fill="#23272b" />}
      <rect x={x} y={y} width={w} height={h} fill="#343a40" />
      <Windows x={x} y={y + 12} w={w} h={h - 22} light="#ffe066" dim="#54595f" />
      <rect x={x + 5} y={y + 3} width={w - 10} height="8" rx="2" fill="#fcc419" />
      <rect x={x + w / 2 - 8} y={108 - 12} width="16" height="12" fill="#1b1e21" />
      {stage >= 2 && <rect x={x - 5} y={108 - 14} width={w + 10} height="3" fill="#fcc419" />}
      {stage >= 4 && <circle className="twinkle" cx={x + w / 2} cy={y - 14} r="2.5" fill="#fcc419" />}
      <Street />
    </g>
  );
}

function CityHall({ stage }: { stage: number }) {
  const w = 86 + stage * 20;
  const x = 100 - w / 2;
  const h = 36;
  const y = 108 - h;
  const cols = 3 + stage;
  return (
    <g>
      {stage >= 3 && (
        <g>
          <rect x={x - 18} y={y + 12} width="22" height={h - 12} fill="#dee2e6" />
          <rect x={x + w - 4} y={y + 12} width="22" height={h - 12} fill="#dee2e6" />
        </g>
      )}
      <rect x={x} y={y} width={w} height={h} fill="#f1f3f5" stroke="#ced4da" strokeWidth="1" />
      <polygon points={`${x - 4},${y} ${100},${y - 16} ${x + w + 4},${y}`} fill="#dee2e6" stroke="#ced4da" strokeWidth="1" />
      {Array.from({ length: cols }, (_, i) => <rect key={i} x={x + 8 + i * ((w - 20) / (cols - 1))} y={y + 5} width="5" height={h - 10} rx="2" fill="#ced4da" />)}
      <rect x={x} y={108 - 4} width={w} height="4" fill="#ced4da" />
      {stage >= 4 && (
        <g>
          <path d={`M92 ${y - 16} A 9 9 0 0 1 110 ${y - 16}`} transform="translate(-1 0)" fill="#74c0fc" />
          <rect x="99" y={y - 34} width="2" height="10" fill="#868e96" />
          <polygon points={`101,${y - 34} 113,${y - 31} 101,${y - 28}`} fill="#0c8599" />
        </g>
      )}
      <Street />
    </g>
  );
}

function Garage({ stage }: { stage: number }) {
  const w = 58 + stage * 10;
  const x = 100 - w / 2;
  return (
    <g>
      {stage >= 3 && (
        <g>
          <rect x={x} y="56" width={w} height="26" fill="#dee2e6" />
          <rect x={x + 6} y="62" width={w - 12} height="14" rx="2" fill="#99e9f2" opacity=".85" />
        </g>
      )}
      <rect x={x} y="82" width={w} height="26" fill="#ced4da" />
      <rect x={x + 8} y="88" width={w / 2 - 10} height="20" fill="#868e96" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={x + 8} y={90 + i * 4.5} width={w / 2 - 10} height="1.5" fill="#adb5bd" />)}
      {stage >= 2 && <rect x={x + w / 2 + 4} y={86 + 2} width={w / 2 - 12} height="7" rx="3.5" fill="#e64980" className="twinkle" />}
      {stage >= 4 && (
        <g>
          <rect x={x + w / 2 - 1} y="40" width="2.5" height="16" fill="#868e96" />
          <polygon points={`${x + w / 2 + 1.5},40 ${x + w / 2 + 15},43 ${x + w / 2 + 1.5},46`} fill="#e64980" />
        </g>
      )}
      <Street />
    </g>
  );
}

function Vault({ stage }: { stage: number }) {
  const w = 64 + stage * 10;
  const x = 100 - w / 2;
  const h = 34 + stage * 3;
  const y = 108 - h;
  const bar = (bx: number, by: number, i = 0) => <polygon key={i} points={`${bx},${by + 6} ${bx + 3},${by} ${bx + 17},${by} ${bx + 20},${by + 6}`} fill="#fcc419" stroke="#e0a800" strokeWidth="1" />;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#868e96" />
      <rect x={x} y={y} width={w} height="6" fill="#495057" />
      <circle cx="100" cy={y + h / 2 + 3} r="12" fill="#495057" stroke="#343a40" strokeWidth="2" />
      <circle cx="100" cy={y + h / 2 + 3} r="5" fill="#adb5bd" />
      <path d={`M100 ${y + h / 2 - 7} V${y + h / 2 + 13} M90 ${y + h / 2 + 3} H110`} stroke="#343a40" strokeWidth="2" />
      {stage >= 2 && <g>{bar(x + 6, 102)}{bar(x + 9, 96, 1)}</g>}
      {stage >= 3 && <g>{bar(x + w - 26, 102, 2)}{bar(x + w - 23, 96, 3)}{bar(x + w - 25, 90, 4)}</g>}
      {stage >= 4 && <g transform={`translate(${x + w - 6} ${y - 6})`}><rect x="-2" y="0" width="4" height="8" fill="#343a40" /><circle r="3.5" fill="#343a40" /><circle r="1.5" fill="#74c0fc" /></g>}
      <Street />
    </g>
  );
}

const HOUSE_COLORS = ['#ffc9c9', '#a5d8ff', '#b2f2bb', '#ffe08a'];

function Houses({ stage }: { stage: number }) {
  const xs = stage === 1 ? [100] : stage === 2 ? [70, 130] : stage === 3 ? [50, 100, 150] : [38, 80, 122, 164];
  return (
    <g>
      {xs.map((cx, i) => (
        <g key={i}>
          <rect x={cx - 17} y="80" width="34" height="28" fill={HOUSE_COLORS[i % 4]} stroke="#adb5bd" strokeWidth="1" />
          <polygon points={`${cx - 20},80 ${cx},66 ${cx + 20},80`} fill="#e8590c" />
          <rect x={cx - 13} y="94" width="9" height="14" fill="#6b4423" />
          <rect x={cx + 2} y="88" width="10" height="9" fill="#d0ebff" stroke="#adb5bd" strokeWidth="1" />
        </g>
      ))}
      <Street />
    </g>
  );
}

function Bank({ stage }: { stage: number }) {
  const w = 60 + stage * 8;
  const x = 100 - w / 2;
  const h = 30;
  const y = 108 - h;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#e3f6f8" stroke="#99d8e0" strokeWidth="1" />
      <polygon points={`${x - 3},${y} ${100},${y - 13} ${x + w + 3},${y}`} fill="#0c8599" />
      {(() => {
        const cols = 3 + Math.min(stage, 2);
        return Array.from({ length: cols }, (_, i) => <rect key={i} x={x + 7 + i * ((w - 18) / (cols - 1))} y={y + 4} width="4" height={h - 8} rx="2" fill="#99d8e0" />);
      })()}
      <circle cx="100" cy={y - 5} r="4" fill="#fcc419" stroke="#e0a800" strokeWidth="1" />
      <rect x={100 - 6} y={108 - 12} width="12" height="12" fill="#0b6575" />
      {stage >= 3 && <rect x={x + w + 6} y="88" width="12" height="20" rx="2" fill="#495057" />}
      {stage >= 3 && <rect x={x + w + 8.5} y="91" width="7" height="5" rx="1" fill="#74c0fc" />}
      <Street />
    </g>
  );
}

function Shop({ stage }: { stage: number }) {
  const w = 54 + stage * 12;
  const x = 100 - w / 2;
  return (
    <g>
      <rect x={x} y="78" width={w} height="30" fill="#fff4e6" stroke="#dbc2a3" strokeWidth="1" />
      {Array.from({ length: Math.floor(w / 12) }, (_, i) => <path key={i} d={`M${x - 2 + i * 12} 78 h12 v8 a6 6 0 0 1 -12 0 Z`} fill={i % 2 ? '#fa5252' : '#f8f9fa'} />)}
      <rect x={100 - 6} y="92" width="12" height="16" fill="#845ef7" />
      <rect x={x + 6} y="88" width={w / 2 - 14} height="12" fill="#d0ebff" stroke="#adb5bd" strokeWidth="1" />
      {stage >= 3 && <rect x={x + 4} y="68" width={w - 8} height="8" rx="2" fill="#e64980" />}
      <Street />
    </g>
  );
}

const BUILDING: Record<Kind, (p: { stage: number }) => ReactNode> = {
  tower: Tower, glass: GlassTower, hq: Hq, hall: CityHall, garage: Garage, vault: Vault, houses: Houses, bank: Bank, shop: Shop,
};

/** Where the emoji stand on the street, in percent of the plot. */
function spotsFor(n: number): [number, number][] {
  const row = (y: number, count: number, x0: number, x1: number) => Array.from({ length: count }, (_, i) => [x0 + ((x1 - x0) * (i + 0.5)) / count, y] as [number, number]);
  return [...row(78, Math.min(n, 5), 8, 92), ...row(64, Math.max(0, n - 5), 14, 86)];
}

const CITY_THEME: PlotTheme = {
  nameTag: { background: 'rgba(255,255,255,.85)', color: '#14171d' },
  sign: { background: '#14171d', border: '1px solid #14171d', color: '#fff' },
  emptyText: 'not in your portfolio yet',
};

export function CityPlots({ deltas, game, market, ctx, showDelta, n, onOpen }: { deltas: AssetDelta[]; game: Game; market: Market; ctx: Context; showDelta: boolean; n: number; onOpen: (id: string) => void }) {
  return (
    <div className="relative h-full w-full">
      {deltas.map((d, i) => {
        const kind = KIND_BY_ID[d.asset.id] ?? 'shop';
        const Building = BUILDING[kind];
        return (
          <Plot
            key={d.asset.id}
            d={d}
            style={slotFor(i, deltas.length)}
            game={game}
            market={market}
            ctx={ctx}
            showDelta={showDelta}
            n={n}
            onOpen={onOpen}
            building={(stage) => <Building stage={stage} />}
            stageNames={STAGE_NAME[kind]}
            spots={spotsFor}
            anim="bob"
            iconSize={24}
            theme={CITY_THEME}
          />
        );
      })}
    </div>
  );
}

/** The cash account branch that holds the money. */
export function CityBase() {
  return (
    <svg viewBox="0 0 160 130" className="w-[150px]" aria-hidden>
      <rect x="22" y="50" width="116" height="74" rx="4" fill="#f8f9fa" stroke="#ced4da" strokeWidth="2" />
      <rect x="22" y="50" width="116" height="16" rx="4" fill="#0c8599" />
      <circle cx="80" cy="58" r="6" fill="#fcc419" stroke="#e0a800" strokeWidth="1" />
      <rect x="34" y="76" width="28" height="24" rx="2" fill="#d0ebff" stroke="#99c2dd" strokeWidth="2" />
      <rect x="98" y="76" width="28" height="24" rx="2" fill="#d0ebff" stroke="#99c2dd" strokeWidth="2" />
      <rect x="68" y="80" width="24" height="44" rx="2" fill="#0b6575" />
      <circle cx="87" cy="103" r="2" fill="#fcc419" />
      <rect x="14" y="124" width="132" height="6" rx="3" fill="#ced4da" />
    </svg>
  );
}
