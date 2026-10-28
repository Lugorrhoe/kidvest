import type { ReactNode } from 'react';
import type { Context } from '../engine/game';
import type { Market } from '../engine/market';
import type { Game } from '../engine/types';
import { Plot, slotFor, type PlotTheme } from './Plot';
import type { AssetDelta } from './Scene';

type Kind = 'solar' | 'greenhouse' | 'hangar' | 'dishes' | 'pad' | 'crystal' | 'fuel' | 'module';

const KIND_BY_ID: Record<string, Kind> = {
  'space.solar': 'solar',
  'space.greenhouse': 'greenhouse',
  'space.premium': 'hangar',
  'space.satellites': 'dishes',
  'space.rocket': 'pad',
  'space.crystal': 'crystal',
  'space.fuel': 'fuel',
};

const STAGE_NAME: Record<Kind, string[]> = {
  solar: ['', 'one solar wing', 'a double array', 'a triple array', 'a full solar farm'],
  greenhouse: ['', 'a seed dome', 'a growing dome', 'two domes', 'a dome cluster'],
  hangar: ['', 'a rented bay', 'a small hangar', 'a big hangar', 'a flagship hangar'],
  dishes: ['', 'one dish', 'two dishes', 'three dishes', 'a relay network'],
  pad: ['', 'a test stand', 'a launch pad', 'a tall gantry', 'twin launch pads'],
  crystal: ['', 'a crystal shard', 'a crystal cluster', 'a mining rig', 'a crystal cavern'],
  fuel: ['', 'one tank', 'two tanks', 'three tanks', 'a tank farm'],
  module: ['', 'a small module', 'a standard module', 'a large module', 'a station wing'],
};

/* ------------------------------------------------------------------ modules (viewBox 200 x 120, platform at y = 108) */
function Platform({ w = 170 }: { w?: number }) {
  return (
    <g>
      <rect x={100 - w / 2} y="108" width={w} height="5" rx="2.5" fill="#2f2a63" />
      <rect x={100 - w / 2} y="108" width={w} height="2" rx="1" fill="#6c63c7" />
    </g>
  );
}

function SolarArray({ stage }: { stage: number }) {
  const pw = 34 + stage * 4;
  return (
    <g>
      <rect x="97" y={96 - (stage - 1) * 14} width="6" height={12 + stage * 14} fill="#8d99c4" />
      {Array.from({ length: stage }, (_, i) => {
        const y = 94 - i * 14;
        return (
          <g key={i}>
            <rect x={97 - pw} y={y} width={pw - 4} height="10" rx="1.5" fill="#2b6fd4" stroke="#9ecbff" strokeWidth="1" />
            <rect x={107} y={y} width={pw - 4} height="10" rx="1.5" fill="#2b6fd4" stroke="#9ecbff" strokeWidth="1" />
            <path d={`M${97 - pw / 2 - 2} ${y} v10 M${107 + (pw - 4) / 2} ${y} v10`} stroke="#9ecbff" strokeWidth=".8" />
          </g>
        );
      })}
      {stage >= 4 && <circle className="twinkle" cx="100" cy={92 - 3 * 14 - 5} r="3.5" fill="#ffd43b" />}
      <Platform w={130} />
    </g>
  );
}

function Greenhouse({ stage }: { stage: number }) {
  const dome = (cx: number, r: number, i = 0) => (
    <g key={i}>
      <path d={`M${cx - r} 108 A ${r} ${r} 0 0 1 ${cx + r} 108 Z`} fill="rgba(102,217,232,.25)" stroke="#66d9e8" strokeWidth="1.5" />
      <path d={`M${cx} ${108 - r} V108 M${cx - r * 0.6} ${108 - r * 0.55} V108 M${cx + r * 0.6} ${108 - r * 0.55} V108`} stroke="#66d9e8" strokeWidth=".8" opacity=".6" />
      <circle cx={cx - r * 0.4} cy="103" r={r * 0.16} fill="#51cf66" />
      <circle cx={cx + r * 0.3} cy="101" r={r * 0.2} fill="#2f9e44" />
      <circle cx={cx} cy="104" r={r * 0.13} fill="#94d82d" />
    </g>
  );
  const tube = (x1: number, x2: number) => <rect x={x1} y="98" width={x2 - x1} height="8" rx="4" fill="rgba(102,217,232,.3)" stroke="#66d9e8" strokeWidth="1" />;
  return (
    <g>
      {stage === 1 && dome(100, 26)}
      {stage === 2 && dome(100, 36)}
      {stage === 3 && <g>{tube(90, 115)}{dome(68, 32)}{dome(136, 25)}</g>}
      {stage >= 4 && <g>{tube(76, 92)}{tube(130, 142)}{dome(52, 27)}{dome(106, 36)}{dome(162, 22)}</g>}
      <Platform w={176} />
    </g>
  );
}

function starPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

function Hangar({ stage }: { stage: number }) {
  const w = 66 + stage * 16;
  const x = 100 - w / 2;
  const h = 42;
  const y = 108 - h;
  return (
    <g>
      {stage >= 3 && <path d={`M${x - 28} 108 V${y + 28} Q${x - 28} ${y + 14} ${x - 14} ${y + 14} H${x}`} fill="#44487a" stroke="#8a8fc9" strokeWidth="1" />}
      <path d={`M${x} 108 V${y + 14} Q${x} ${y} ${x + 16} ${y} H${x + w - 16} Q${x + w} ${y} ${x + w} ${y + 14} V108 Z`} fill="#565a8f" stroke="#8a8fc9" strokeWidth="1" />
      <rect x="84" y={y + 16} width="32" height={h - 16} fill="#1c1b3a" stroke="#8a8fc9" strokeWidth="1" />
      <path d={`M100 ${y + 16} V108`} stroke="#8a8fc9" strokeWidth="1" opacity=".6" />
      <polygon points={starPoints(100, y + 9, 6.5)} fill="#ffd43b" />
      {stage >= 2 && <g><circle cx={x + 12} cy={y + 22} r="3.5" fill="#9ecbff" /><circle cx={x + w - 12} cy={y + 22} r="3.5" fill="#9ecbff" /></g>}
      {stage >= 4 && (
        <g>
          <rect x={x + w - 4} y={y - 16} width="3" height="18" fill="#8d99c4" />
          <polygon points={`${x + w - 1},${y - 16} ${x + w + 17},${y - 13} ${x + w - 1},${y - 9}`} fill="#e64980" />
          <circle className="twinkle" cx={100} cy={y - 5} r="3" fill="#ffd43b" />
        </g>
      )}
      <Platform w={Math.min(180, w + 44)} />
    </g>
  );
}

function Dishes({ stage }: { stage: number }) {
  const xs = stage === 1 ? [100] : stage === 2 ? [72, 128] : stage === 3 ? [52, 100, 148] : [44, 86, 128, 168];
  return (
    <g>
      {stage >= 4 && <path d={`M${xs[0]} 86 Q100 70 ${xs[xs.length - 1]} 86`} fill="none" stroke="#9ecbff" strokeWidth="1" strokeDasharray="3 4" opacity=".7" />}
      {xs.map((cx, i) => (
        <g key={i}>
          <rect x={cx - 2} y="86" width="4" height="22" fill="#8d99c4" />
          <g transform={`translate(${cx} 82) rotate(${i % 2 ? 26 : -26})`}>
            <ellipse rx="15" ry="6" fill="#c3c9f5" stroke="#8a8fc9" strokeWidth="1" />
            <rect x="-1" y="-9" width="2" height="9" fill="#8a8fc9" />
            <circle cy="-10" r="2" fill="#e64980" />
          </g>
        </g>
      ))}
      <Platform w={170} />
    </g>
  );
}

function LaunchPad({ stage }: { stage: number }) {
  const th = 30 + stage * 12;
  const ty = 108 - th;
  return (
    <g>
      <rect x="58" y={ty} width="12" height={th} fill="#3f4677" stroke="#8a8fc9" strokeWidth="1" />
      {Array.from({ length: Math.floor(th / 12) }, (_, i) => <path key={i} d={`M58 ${ty + i * 12} l12 12 M70 ${ty + i * 12} l-12 12`} stroke="#8a8fc9" strokeWidth=".8" opacity=".7" />)}
      <rect x="70" y={ty + 4} width="26" height="4" fill="#8d99c4" />
      <rect x="80" y="100" width="52" height="8" rx="2" fill="#4a5080" />
      {stage >= 2 && <rect x="136" y="92" width="14" height="16" rx="2" fill="#565a8f" stroke="#8a8fc9" strokeWidth="1" />}
      {stage >= 3 && [86, 98, 110, 122].map((lx) => <circle key={lx} className="twinkle" cx={lx} cy="98" r="1.8" fill="#ffd43b" />)}
      {stage >= 4 && (
        <g>
          <rect x="152" y="86" width="8" height="22" fill="#3f4677" stroke="#8a8fc9" strokeWidth="1" />
          <rect x="146" y="102" width="34" height="6" rx="2" fill="#4a5080" />
        </g>
      )}
      <Platform w={160} />
    </g>
  );
}

function CrystalRig({ stage }: { stage: number }) {
  const shard = (cx: number, h: number, w: number, i = 0) => (
    <g key={i}>
      <circle cx={cx} cy={100 - h / 2} r={h * 0.7} fill="#e599f7" opacity=".14" />
      <polygon points={`${cx - w},104 ${cx - w * 0.4},${104 - h} ${cx + w * 0.3},${104 - h * 0.8} ${cx + w},104`} fill="#da77f2" stroke="#be4bdb" strokeWidth="1" />
      <polygon points={`${cx - w * 0.4},${104 - h} ${cx},${104 - h * 0.5} ${cx - w * 0.5},104 ${cx - w},104`} fill="#f3d9fa" opacity=".55" />
    </g>
  );
  return (
    <g>
      <path d="M28 108 Q38 86 68 90 Q92 74 122 86 Q152 78 166 96 Q174 108 162 108 Z" fill="#4b5273" />
      {shard(100, 34 + stage * 4, 11)}
      {stage >= 2 && shard(68, 24, 8, 1)}
      {stage >= 3 && shard(136, 28, 9, 2)}
      {stage >= 4 && shard(50, 16, 6, 3)}
      {stage >= 3 && (
        <g>
          <path d="M56 108 L80 56 H126 L148 108" fill="none" stroke="#8d99c4" strokeWidth="3" />
          <path d="M103 56 V66" stroke="#8d99c4" strokeWidth="2" />
          <circle cx="103" cy="69" r="3" fill="#ffd43b" />
        </g>
      )}
      <Platform w={176} />
    </g>
  );
}

function FuelDepot({ stage }: { stage: number }) {
  const xs = stage === 1 ? [100] : stage === 2 ? [78, 122] : stage === 3 ? [58, 100, 142] : [48, 84, 120, 156];
  return (
    <g>
      {stage >= 2 && <rect x={xs[0]} y="103" width={xs[xs.length - 1] - xs[0]} height="3" fill="#8d99c4" />}
      {xs.map((cx, i) => (
        <g key={i}>
          <rect x={cx - 14} y="72" width="28" height="36" rx="6" fill="#ff922b" stroke="#d9480f" strokeWidth="1" />
          <rect x={cx - 14} y="86" width="28" height="7" fill="#d9480f" />
          <ellipse cx={cx} cy="72" rx="14" ry="5" fill="#ffa94d" stroke="#d9480f" strokeWidth="1" />
          <circle cx={cx + 7} cy="79" r="2.5" fill="#fff4e6" opacity=".8" />
        </g>
      ))}
      <Platform w={170} />
    </g>
  );
}

function Module({ stage }: { stage: number }) {
  const w = 60 + stage * 16;
  const x = 100 - w / 2;
  return (
    <g>
      <rect x={x} y="76" width={w} height="32" rx="12" fill="#565a8f" stroke="#8a8fc9" strokeWidth="1" />
      {Array.from({ length: stage + 1 }, (_, i) => <circle key={i} cx={x + 16 + i * ((w - 32) / Math.max(1, stage))} cy="90" r="5" fill="#9ecbff" stroke="#8a8fc9" strokeWidth="1" />)}
      <rect x="98" y="62" width="4" height="14" fill="#8d99c4" />
      <circle className="twinkle" cx="100" cy="59" r="3" fill="#ffd43b" />
      <Platform w={Math.min(176, w + 36)} />
    </g>
  );
}

const BUILDING: Record<Kind, (p: { stage: number }) => ReactNode> = {
  solar: SolarArray, greenhouse: Greenhouse, hangar: Hangar, dishes: Dishes, pad: LaunchPad, crystal: CrystalRig, fuel: FuelDepot, module: Module,
};

/** Where the floating emoji sit, in percent of the plot. */
function spotsFor(kind: Kind, n: number): [number, number][] {
  const row = (y: number, count: number, x0: number, x1: number) => Array.from({ length: count }, (_, i) => [x0 + ((x1 - x0) * (i + 0.5)) / count, y] as [number, number]);
  if (kind === 'dishes' || kind === 'fuel' || kind === 'pad') return [...row(34, Math.min(n, 5), 8, 92), ...row(18, Math.max(0, n - 5), 14, 86)];
  return Array.from({ length: n }, (_, i) => [14 + ((i * 37) % 72), 16 + ((i * 23) % 32)] as [number, number]);
}

const SPACE_THEME: PlotTheme = {
  dark: true,
  nameTag: { background: 'rgba(16,12,52,.75)', color: '#fff', border: '1px solid rgba(180,160,255,.45)' },
  sign: { background: 'rgba(16,12,52,.85)', border: '1px solid rgba(180,160,255,.6)', color: '#fff' },
  emptyText: 'not part of your fleet yet',
};

export function SpacePlots({ deltas, game, market, ctx, showDelta, n, onOpen }: { deltas: AssetDelta[]; game: Game; market: Market; ctx: Context; showDelta: boolean; n: number; onOpen: (id: string) => void }) {
  return (
    <div className="relative h-full w-full">
      {deltas.map((d, i) => {
        const kind = KIND_BY_ID[d.asset.id] ?? 'module';
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
            spots={(count) => spotsFor(kind, count)}
            anim="anim-drift"
            iconSize={22}
            theme={SPACE_THEME}
          />
        );
      })}
    </div>
  );
}

/** The starbase core that holds the credits. */
export function StationCore() {
  return (
    <svg viewBox="0 0 160 130" className="w-[150px]" aria-hidden>
      <ellipse cx="80" cy="78" rx="74" ry="16" fill="none" stroke="#b197fc" strokeOpacity=".45" strokeWidth="5" />
      <circle cx="80" cy="70" r="40" fill="#3b2a85" stroke="#8a8fc9" strokeWidth="2" />
      <path d="M44 56 A40 40 0 0 1 116 56 L 112 64 A 34 34 0 0 0 48 64 Z" fill="#5f3dc4" />
      <circle cx="80" cy="74" r="15" fill="#15aabf" opacity=".9" />
      <circle cx="80" cy="74" r="9" fill="#99e9f2" className="twinkle" />
      {[56, 68, 80, 92, 104].map((x) => <rect key={x} x={x - 2.5} y="92" width="5" height="7" rx="1" fill="#ffd43b" opacity=".9" />)}
      <rect x="78" y="16" width="4" height="16" fill="#8d99c4" />
      <circle cx="80" cy="13" r="4" fill="#e64980" className="twinkle" />
      <rect x="20" y="118" width="120" height="6" rx="3" fill="#2f2a63" />
      <rect x="36" y="110" width="8" height="10" fill="#4a5080" />
      <rect x="116" y="110" width="8" height="10" fill="#4a5080" />
    </svg>
  );
}
