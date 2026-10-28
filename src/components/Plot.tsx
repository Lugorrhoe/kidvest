import type { CSSProperties, ReactNode } from 'react';
import { money, pct } from '../engine/format';
import type { Context } from '../engine/game';
import type { Market } from '../engine/market';
import type { Game } from '../engine/types';
import { cx, Emoji } from '../lib/ui';
import { weatherOf } from './bits';
import type { AssetDelta } from './Scene';

export const CAP = [0, 2, 4, 6, 9];
export const NEXT_AT = [1, 2, 4, 7];

export function stageOf(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count >= 7) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  return 1;
}

/** World-specific chrome for a plot: label tag, price sign and copy. */
export interface PlotTheme {
  dark?: boolean;
  nameTag: CSSProperties;
  sign: CSSProperties;
  emptyText: string;
}

export interface PlotProps {
  d: AssetDelta;
  style: CSSProperties;
  game: Game;
  market: Market;
  ctx: Context;
  showDelta: boolean;
  n: number;
  onOpen: (id: string) => void;
  /** Renders the building SVG contents for a stage (viewBox 200 x 120, ground at y = 110). */
  building: (stage: number) => ReactNode;
  /** Stage names, index 0 unused. */
  stageNames: string[];
  /** Where the asset emoji stand, in percent of the plot (x, y from top). */
  spots: (count: number) => [number, number][];
  anim: string;
  iconSize: number;
  theme: PlotTheme;
}

export function Plot({ d, style, game, market, ctx, showDelta, n, onOpen, building, stageNames, spots, anim, iconSize, theme }: PlotProps) {
  const { bracket, world } = ctx;
  const owned = d.units > 1e-9;
  const step = Math.max(1, game.scenario.startCash / 10);
  const count = owned ? (bracket === 1 ? Math.round(d.units) : Math.max(1, Math.round(d.value / step))) : 0;
  const stage = stageOf(count);
  const shown = Math.min(count, CAP[stage]);
  const price = market.prices[d.asset.id][game.season];
  const cost = game.costBasis[d.asset.id] ?? 0;
  const pl = d.value - cost;
  const m = (v: number, o?: { sign?: boolean; ceil?: boolean }) => money(v, world, bracket, o);
  const r = bracket === 1 ? Math.round(d.delta) : d.delta;
  const chip = r > 0.004
    ? { background: '#d3f9d8', color: '#2b8a3e' }
    : r < -0.004
      ? { background: '#ffe3e3', color: '#c92a2a' }
      : theme.dark
        ? { background: 'rgba(255,255,255,.18)', color: '#fff' }
        : { background: '#e9ecef', color: '#495057' };
  const chipText = bracket === 1 ? `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r)} ${r > 0 ? '📈' : r < 0 ? '📉' : ''}` : `${m(d.delta, { sign: true })}${bracket === 3 ? ` · ${pct(d.pct, bracket)}` : ''}`;
  const w = weatherOf(d.asset.risk);
  const placed = spots(shown);
  const tipBelow = (parseFloat(String(style.top)) || 0) < 50;
  const nextAt = stage < 4 ? NEXT_AT[stage] : null;
  return (
    <button onClick={() => onOpen(d.asset.id)} className={cx('plot group absolute text-left', !owned && 'opacity-80')} style={style}>
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet" className={cx('absolute inset-x-0 top-0 w-full drop-shadow-sm', !owned && 'opacity-40 grayscale')} style={{ height: 'calc(100% - 26px)' }} aria-hidden>
        {building(Math.max(1, stage))}
      </svg>
      {owned
        ? placed.map(([x, y], i) => (
            <span key={i} className={cx('absolute -translate-x-1/2 -translate-y-1/2', anim)} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.37}s`, fontSize: iconSize }}>
              <Emoji e={d.asset.emoji} />
            </span>
          ))
        : <span className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 text-4xl opacity-40 grayscale"><Emoji e={d.asset.emoji} /></span>}
      {shown < count && <span className="absolute right-2 top-[42%] rounded-full bg-white/85 px-1.5 text-[11px] font-bold text-ink-700">+{count - shown}</span>}
      {owned && showDelta && <span key={game.season} className="chip float-up num absolute right-1.5 top-1.5 whitespace-nowrap shadow-sm" style={chip}>{chipText}</span>}
      <span className="absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[12px] font-extrabold" style={theme.nameTag}>{d.asset.name}</span>
      <span className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between rounded-lg px-2 py-0.5 text-[12px] font-bold" style={theme.sign}>
        {owned ? (
          <>
            <span className="num">{m(d.value)}</span>
            <span className="num opacity-75">×{bracket === 1 ? Math.round(d.units) : d.units.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </>
        ) : (
          <>
            <span>🏷️ {m(price, { ceil: bracket === 1 })}</span>
            <span className="opacity-80">Buy</span>
          </>
        )}
      </span>

      {/* hover card */}
      <div className={cx('plot-tip absolute left-1/2 z-30 w-64 -translate-x-1/2 rounded-2xl bg-ink-900 p-3 text-left text-white shadow-lg', tipBelow ? 'top-[88%]' : 'bottom-[88%]')}>
        <div className="flex items-center gap-2">
          <Emoji e={d.asset.emoji} className="text-2xl" />
          <div>
            <div className="text-sm font-extrabold">{d.asset.name}</div>
            <div className="text-[11px] text-white/70">{owned ? stageNames[stage] : theme.emptyText}</div>
          </div>
          <span className="ml-auto chip" style={{ background: w.bg, color: w.color }}><Emoji e={w.emoji} /> {w.label}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
          <span className="text-white/60">You own</span><span className="num text-right font-semibold">{owned ? (bracket === 1 ? Math.round(d.units) : d.units.toLocaleString('en-US', { maximumFractionDigits: 2 })) : 0}</span>
          <span className="text-white/60">Worth</span><span className="num text-right font-semibold">{m(d.value)}</span>
          {owned && <><span className="text-white/60">You paid</span><span className="num text-right font-semibold">{m(cost)}</span></>}
          {owned && <><span className="text-white/60">Since you bought</span><span className={cx('num text-right font-semibold', pl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{bracket === 1 ? `${Math.round(pl) >= 0 ? '+' : '−'}${Math.abs(Math.round(pl))} coins` : `${m(pl, { sign: true })} (${pct(cost > 0 ? pl / cost : 0, bracket)})`}</span></>}
          {owned && showDelta && <><span className="text-white/60">{n === 1 ? `This ${world.seasonWord}` : 'Since your last visit'}</span><span className={cx('num text-right font-semibold', d.delta >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{chipText}</span></>}
          <span className="text-white/60">Price each</span><span className="num text-right font-semibold">{m(price, { ceil: bracket === 1 })}</span>
          <span className="text-white/60">Gives you</span><span className="text-right font-semibold">{d.asset.payoutWord ? `${d.asset.payoutWord} every year` : 'grows instead'}</span>
        </div>
        <div className="mt-2 border-t border-white/15 pt-2 text-[11px] text-white/75">
          {d.asset.tagline}
          {owned && nextAt && <span className="block text-amber-200">{bracket === 1 ? `Buy ${nextAt - count} more to upgrade to ${stageNames[stage + 1]}.` : `Grow this to about ${m(nextAt * step)} to upgrade to ${stageNames[stage + 1]}.`}</span>}
          {owned && !nextAt && <span className="block text-amber-200">Fully built out! 🏆</span>}
        </div>
      </div>
    </button>
  );
}

/** Evenly spread slot rectangles for n plots in two rows, in percent of the plots area. */
export function slotFor(i: number, n: number): CSSProperties {
  const cols = Math.max(1, Math.ceil(n / 2));
  const row = i >= cols ? 1 : 0;
  const col = i % cols;
  const w = 100 / cols;
  return { left: `${col * w + 0.4}%`, top: row ? '52%' : '0%', width: `${w - 0.8}%`, height: row ? '48%' : '50%' };
}
