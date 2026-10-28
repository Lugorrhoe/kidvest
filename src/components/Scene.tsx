import type { CSSProperties } from 'react';
import { currentGoal, goalCost } from '../engine/achievements';
import { money, pct } from '../engine/format';
import type { Context } from '../engine/game';
import type { Market } from '../engine/market';
import type { AssetDef, Game } from '../engine/types';
import { cx, Emoji } from '../lib/ui';
import { FarmPlots, Farmhouse } from './FarmScene';

type Weather = 'storm' | 'rain' | 'cloudy' | 'sunny';

const WEATHER_TEXT: Record<string, Record<Weather, [string, string]>> = {
  farm: { storm: ['⛈️', 'Stormy season'], rain: ['🌧️', 'Rainy season'], cloudy: ['⛅', 'Mild season'], sunny: ['☀️', 'Sunny season'] },
  space: { storm: ['☄️', 'Meteor storm'], rain: ['🌫️', 'Space dust'], cloudy: ['🌑', 'Quiet orbit'], sunny: ['🌞', 'Solar wind'] },
  city: { storm: ['⛈️', 'Market storm'], rain: ['🌧️', 'Gloomy quarter'], cloudy: ['⛅', 'Calm quarter'], sunny: ['☀️', 'Bright quarter'] },
};

export interface AssetDelta {
  asset: AssetDef;
  units: number;
  value: number;
  delta: number;
  payout: number;
  pct: number;
}

export function assetDeltas(game: Game, market: Market, from: number, to = game.season): AssetDelta[] {
  return game.assets.map((a) => {
    const units = game.holdings[a.id] ?? 0;
    const p = market.prices[a.id];
    let payout = 0;
    for (let s = from + 1; s <= to; s++) payout += units * (market.payouts[a.id]?.[s] ?? 0);
    const priceDelta = units * (p[to] - p[from]);
    const value = units * p[to];
    const delta = priceDelta + payout;
    const before = value - delta;
    return { asset: a, units, value, delta, payout, pct: before > 0 ? delta / before : 0 };
  });
}

function weatherFor(market: Market, from: number, to: number, deltas: AssetDelta[]): Weather {
  if (to === 0) return 'sunny';
  let r = 1;
  for (let s = from + 1; s <= to; s++) r *= 1 + market.stockMove[s];
  r -= 1;
  const owned = deltas.filter((d) => d.units > 0);
  const worst = owned.length ? Math.min(...owned.map((d) => d.pct)) : 0;
  if (r <= -0.08 || worst <= -0.12) return 'storm';
  if (r <= -0.02) return 'rain';
  if (r < 0.03) return 'cloudy';
  return 'sunny';
}

/* ------------------------------------------------------------------ backdrops */
const SKY: Record<string, Record<Weather, [string, string]>> = {
  farm: { sunny: ['#8fd3ff', '#e6f6ff'], cloudy: ['#b8d0e4', '#eef4f9'], rain: ['#97a9bc', '#d6dee6'], storm: ['#566476', '#a3aebb'] },
  space: { sunny: ['#0c0b2a', '#2f1e6e'], cloudy: ['#0b0a22', '#221a55'], rain: ['#0d0a20', '#2a1b4a'], storm: ['#1d0a24', '#4c1a3f'] },
  city: { sunny: ['#a8dcff', '#f1faff'], cloudy: ['#c3d5e4', '#eef3f7'], rain: ['#a2b0bd', '#dbe2e8'], storm: ['#5f6b78', '#adb7c1'] },
};

function Clouds({ dark }: { dark: boolean }) {
  const f = dark ? '#8a96a6' : '#ffffff';
  return (
    <g opacity={dark ? 0.95 : 0.9}>
      {[[180, 60, 1], [520, 40, 1.3], [880, 70, 1.1], [1080, 35, 0.9]].map(([x, y, k], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
          <ellipse cx="0" cy="0" rx="60" ry="22" fill={f} />
          <ellipse cx="-34" cy="6" rx="36" ry="16" fill={f} />
          <ellipse cx="38" cy="8" rx="40" ry="16" fill={f} />
          <ellipse cx="6" cy="-14" rx="34" ry="20" fill={f} />
        </g>
      ))}
    </g>
  );
}

function FarmBackdrop({ w }: { w: Weather }) {
  const [a, b] = SKY.farm[w];
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 470" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        <linearGradient id="fgrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fd977" /><stop offset="1" stopColor="#74b84f" /></linearGradient>
        <radialGradient id="fsun"><stop offset="0" stopColor="#fff3b0" /><stop offset=".55" stopColor="#ffd43b" /><stop offset="1" stopColor="#ffd43b" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="470" fill="url(#fsky)" />
      {w === 'sunny' && <circle cx="1090" cy="62" r="70" fill="url(#fsun)" />}
      {w !== 'sunny' && <Clouds dark={w === 'storm' || w === 'rain'} />}
      {w === 'storm' && <polyline points="760,70 735,120 760,118 738,170" fill="none" stroke="#ffe066" strokeWidth="5" strokeLinejoin="round" />}
      <path d="M0 150 C 160 95 320 120 460 105 C 640 85 760 130 900 108 C 1020 92 1120 112 1200 100 L1200 470 L0 470 Z" fill="#b9e3a1" />
      <path d="M0 175 C 200 140 380 165 600 150 C 820 135 1000 168 1200 150 L1200 470 L0 470 Z" fill="url(#fgrass)" />
      {Array.from({ length: 31 }, (_, i) => <rect key={i} x={i * 40 + 6} y="160" width="6" height="22" rx="2" fill="#b07a43" />)}
      <rect x="0" y="166" width="1200" height="4" fill="#c58f55" />
      <rect x="0" y="176" width="1200" height="4" fill="#c58f55" />
    </svg>
  );
}

function SpaceBackdrop({ w }: { w: Weather }) {
  const [a, b] = SKY.space[w];
  const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 137.5) % 1200, y: (i * 73.3) % 300, r: (i % 3) * 0.6 + 0.7, d: (i % 7) * 0.4 }));
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 470" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="ssky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        <radialGradient id="splanet" cx=".5" cy=".2" r=".8"><stop offset="0" stopColor="#9775fa" /><stop offset=".6" stopColor="#5f3dc4" /><stop offset="1" stopColor="#2b1a6e" /></radialGradient>
        <radialGradient id="sglow"><stop offset="0" stopColor="#ffd8a8" stopOpacity=".9" /><stop offset="1" stopColor="#ffd8a8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="470" fill="url(#ssky)" />
      {stars.map((s, i) => <circle key={i} className="twinkle" style={{ animationDelay: `${s.d}s` }} cx={s.x} cy={s.y} r={s.r} fill="#fff" />)}
      {w === 'sunny' && <circle cx="1120" cy="40" r="150" fill="url(#sglow)" />}
      <ellipse cx="600" cy="1010" rx="900" ry="620" fill="url(#splanet)" />
      <ellipse cx="600" cy="420" rx="760" ry="34" fill="none" stroke="#b197fc" strokeOpacity=".35" strokeWidth="6" />
    </svg>
  );
}

function CityBackdrop({ w }: { w: Weather }) {
  const [a, b] = SKY.city[w];
  const back = [60, 110, 80, 150, 95, 130, 70, 170, 120, 90, 140, 100, 160, 85, 125, 105, 145, 75, 115, 135];
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 470" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="csky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        <radialGradient id="csun"><stop offset="0" stopColor="#fff3b0" /><stop offset=".55" stopColor="#ffd43b" /><stop offset="1" stopColor="#ffd43b" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="470" fill="url(#csky)" />
      {w === 'sunny' && <circle cx="1090" cy="58" r="64" fill="url(#csun)" />}
      {w !== 'sunny' && <Clouds dark={w === 'storm' || w === 'rain'} />}
      {back.map((h, i) => <rect key={i} x={i * 62} y={200 - h} width="54" height={h + 300} fill="#7b93a8" opacity=".28" />)}
      {back.map((h, i) => <rect key={`f${i}`} x={i * 62 + 28} y={240 - h * 0.7} width="40" height={h + 300} fill="#4f6578" opacity=".22" />)}
      <rect x="0" y="440" width="1200" height="30" fill="#495057" />
      {Array.from({ length: 24 }, (_, i) => <rect key={i} x={i * 52 + 10} y="453" width="26" height="4" fill="#f1f3f5" />)}
    </svg>
  );
}

/* ------------------------------------------------------------------ pieces */
const PEN: Record<string, { owned: CSSProperties; empty: CSSProperties; text: string; sign: CSSProperties }> = {
  farm: {
    owned: { background: 'linear-gradient(180deg,#c9efae,#a6dc84)', border: '3px solid #b07a43' },
    empty: { background: 'rgba(255,255,255,.35)', border: '3px dashed #c99a6b' },
    text: 'text-[#3d2a14]',
    sign: { background: '#f6deaa', border: '2px solid #b07a43', color: '#5c3d1e' },
  },
  space: {
    owned: { background: 'rgba(130,110,255,.18)', border: '2px solid rgba(180,160,255,.75)', boxShadow: '0 0 26px rgba(140,110,255,.35), inset 0 0 18px rgba(140,110,255,.25)' },
    empty: { background: 'rgba(255,255,255,.04)', border: '2px dashed rgba(180,160,255,.35)' },
    text: 'text-white',
    sign: { background: 'rgba(16,12,52,.85)', border: '1px solid rgba(180,160,255,.6)', color: '#fff' },
  },
  city: {
    owned: { background: 'linear-gradient(180deg,#ffffff,#eef2f5)', border: '2px solid #ced4da', boxShadow: '0 6px 16px rgba(20,23,29,.12)' },
    empty: { background: 'rgba(255,255,255,.45)', border: '2px dashed #adb5bd' },
    text: 'text-ink-900',
    sign: { background: '#14171d', border: '1px solid #14171d', color: '#fff' },
  },
};

function DeltaChip({ d, ctx, dark }: { d: AssetDelta; ctx: Context; dark: boolean }) {
  const { bracket, world } = ctx;
  const r = bracket === 1 ? Math.round(d.delta) : d.delta;
  const up = r > 0.004;
  const down = r < -0.004;
  const style = up ? { background: '#d3f9d8', color: '#2b8a3e' } : down ? { background: '#ffe3e3', color: '#c92a2a' } : { background: dark ? 'rgba(255,255,255,.15)' : '#e9ecef', color: dark ? '#fff' : '#495057' };
  const text = bracket === 1
    ? `${up ? '+' : down ? '−' : '±'}${Math.abs(r)} ${up ? '📈' : down ? '📉' : ''}`
    : `${money(d.delta, world, bracket, { sign: true })}${bracket === 3 ? ` · ${pct(d.pct, bracket)}` : ''}`;
  return <span className="chip float-up num whitespace-nowrap shadow-sm" style={style} title={d.payout > 0 ? `including ${money(d.payout, world, bracket)} ${d.asset.payoutWord ?? 'payout'}` : undefined}>{text}</span>;
}

function Pen({ d, game, market, ctx, onOpen, showDelta }: { d: AssetDelta; game: Game; market: Market; ctx: Context; onOpen: (id: string) => void; showDelta: boolean }) {
  const { bracket, world } = ctx;
  const st = PEN[world.id];
  const owned = d.units > 1e-9;
  const step = Math.max(1, game.scenario.startCash / 10);
  const icons = owned ? (bracket === 1 ? Math.round(d.units) : Math.max(1, Math.min(10, Math.round(d.value / step)))) : 1;
  const shown = Math.min(icons, 10);
  const price = market.prices[d.asset.id][game.season];
  return (
    <button onClick={() => onOpen(d.asset.id)} className={cx('group relative flex min-h-0 flex-col rounded-[18px] p-2.5 text-left transition hover:-translate-y-0.5', st.text)} style={owned ? st.owned : st.empty}>
      <div className="flex items-start justify-between gap-1">
        <span className={cx('truncate text-[13px] font-extrabold leading-tight', !owned && 'opacity-70')}>{d.asset.name}</span>
        {owned && showDelta && <DeltaChip key={`${game.season}-${d.asset.id}`} d={d} ctx={ctx} dark={world.id === 'space'} />}
      </div>
      <div className={cx('flex flex-1 flex-wrap content-center items-center justify-center gap-x-1 gap-y-0.5 py-1', !owned && 'opacity-40 grayscale')}>
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className="bob" style={{ animationDelay: `${(i % 5) * 0.35}s` }}>
            <Emoji e={d.asset.emoji} className={bracket === 1 ? 'text-[30px]' : 'text-[26px]'} />
          </span>
        ))}
        {icons > 10 && <span className="text-xs font-bold">+{icons - 10}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-1 rounded-lg px-2 py-1 text-[12px] font-bold" style={owned ? st.sign : { ...st.sign, opacity: 0.75 }}>
        {owned ? (
          <>
            <span className="num">{money(d.value, world, bracket)}</span>
            <span className="num font-semibold opacity-75">{bracket === 1 ? `×${Math.round(d.units)}` : `${d.units.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}</span>
          </>
        ) : (
          <>
            <span>🏷️ {money(price, world, bracket, { ceil: bracket === 1 })}</span>
            <span className="opacity-80">Buy</span>
          </>
        )}
      </div>
    </button>
  );
}

function BaseCard({ game, ctx, since }: { game: Game; ctx: Context; since: number }) {
  const { world, bracket } = ctx;
  const dark = world.id === 'space';
  const income = game.scenario.incomePerSeason * (game.season - since);
  return (
    <div className={cx('relative flex flex-col items-center justify-end rounded-[22px] p-3 text-center', dark ? 'text-white' : 'text-ink-900')} style={world.id === 'farm' ? { background: 'rgba(255,255,255,.25)' } : world.id === 'space' ? { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(180,160,255,.4)' } : { background: 'rgba(255,255,255,.6)' }}>
      {world.id === 'farm' ? (
        <Farmhouse />
      ) : (
        <div className={cx('flex h-[110px] w-[110px] items-center justify-center rounded-full text-[64px]', dark ? 'bg-white/10 shadow-[0_0_40px_rgba(180,160,255,.5)]' : 'bg-white shadow-card')}>
          <Emoji e={world.id === 'space' ? '🪐' : '🏢'} />
        </div>
      )}
      <div className="mt-2 text-[13px] font-extrabold">{world.baseName}</div>
      <div className="num text-lg font-extrabold">{bracket === 1 && <Emoji e="🪙" className="mr-1" />}{money(game.cash, world, bracket)}</div>
      {income > 0 && game.season > 0 && <span key={game.season} className="chip float-up mt-1" style={{ background: '#d3f9d8', color: '#2b8a3e' }}>+{money(income, world, bracket)} pocket money</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ scene */
export function Scene({ game, market, ctx, since, onOpen, onBuyGoal }: { game: Game; market: Market; ctx: Context; since: number; onOpen: (id: string) => void; onBuyGoal: () => void }) {
  const { world, bracket } = ctx;
  const from = Math.max(0, Math.min(since, game.season));
  const deltas = assetDeltas(game, market, from);
  const weather = weatherFor(market, from, game.season, deltas);
  const [wEmoji, wText] = WEATHER_TEXT[world.id][weather];
  const dark = world.id === 'space';
  const n = game.season - from;
  const showDelta = n > 0;
  const goal = currentGoal(game);
  const cost = goalCost(game, market);
  const sorted = [...deltas].sort((a, b) => (b.units > 0 ? 1 : 0) - (a.units > 0 ? 1 : 0));
  const rows = sorted.length > 4 ? 2 : 1;
  const cols = Math.min(4, Math.max(2, Math.ceil(sorted.length / rows)));
  const total = deltas.reduce((s, d) => s + d.delta, 0);
  return (
    <div className={cx('scene relative overflow-hidden rounded-3xl shadow-card', world.id === 'farm' ? 'h-[600px]' : 'h-[480px]')}>
      {world.id === 'farm' ? <FarmBackdrop w={weather} /> : world.id === 'space' ? <SpaceBackdrop w={weather} /> : <CityBackdrop w={weather} />}
      {(weather === 'rain' || weather === 'storm') && world.id !== 'space' && <div className="rain pointer-events-none absolute inset-0 opacity-70" />}
      {weather === 'storm' && world.id === 'space' && [0, 0.6, 1.1, 1.5].map((dl, i) => <span key={i} className="meteor" style={{ top: `${20 + i * 40}px`, right: `${80 + i * 170}px`, animationDelay: `${dl}s` }} />)}

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <div className={cx('chip px-3 py-1.5 text-sm shadow-sm', dark ? 'bg-white/15 text-white' : 'bg-white/85 text-ink-800')}>
            <Emoji e={world.emoji} /> {world.portfolioName} · {world.seasonLabel(game.season)}
          </div>
          <div className={cx('chip px-3 py-1.5 text-sm shadow-sm', dark ? 'bg-white/15 text-white' : 'bg-white/85 text-ink-800')}>
            <Emoji e={wEmoji} /> {wText}
            {showDelta && <span className={cx('ml-2 num', total > 0.004 ? 'text-emerald-600' : total < -0.004 ? 'text-red-600' : '')} style={dark ? { color: total >= 0 ? '#8ce99a' : '#ffa8a8' } : undefined}>{bracket === 1 ? (Math.round(total) >= 1 ? `+${Math.round(total)} 🪙` : Math.round(total) <= -1 ? `−${Math.abs(Math.round(total))} 🪙` : '±0') : money(total, world, bracket, { sign: true })}</span>}
          </div>
          <div className={cx('chip px-3 py-1.5 text-xs shadow-sm', dark ? 'bg-white/15 text-white' : 'bg-white/85 text-ink-600')}>
            {n === 0 ? 'Tap an item to look closer' : n === 1 ? `Changes this ${world.seasonWord}` : `Changes since your last visit · ${n} ${world.seasonWord}s`}
          </div>
        </div>

        <div className="mt-4 grid min-h-0 flex-1 grid-cols-[190px_1fr] gap-4">
          <BaseCard game={game} ctx={ctx} since={from} />
          {world.id === 'farm' ? (
            <FarmPlots deltas={deltas} game={game} market={market} ctx={ctx} showDelta={showDelta} n={n} onOpen={onOpen} />
          ) : (
            <div className="grid min-h-0 gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))` }}>
              {sorted.slice(0, cols * rows).map((d) => <Pen key={d.asset.id} d={d} game={game} market={market} ctx={ctx} onOpen={onOpen} showDelta={showDelta} />)}
            </div>
          )}
        </div>

        <div className="mt-3 flex h-[52px] items-center gap-3">
          {game.owned.map((o, i) => (
            <span key={i} title={`${o.name} (bought in ${world.seasonLabel(o.season)})`} className={cx('flex h-[52px] items-center gap-2 rounded-2xl px-3 shadow-sm', dark ? 'bg-white/15 text-white' : 'bg-white/85')}>
              <Emoji e={o.emoji} className="bob text-3xl" />
              <span className="text-xs font-bold">{o.name}</span>
            </span>
          ))}
          {goal && (
            <button onClick={onBuyGoal} disabled={game.cash < cost} className={cx('flex h-[52px] items-center gap-2 rounded-2xl border-2 border-dashed px-3 text-left transition', dark ? 'border-white/30 text-white' : 'border-ink-300 bg-white/50 text-ink-800', game.cash >= cost && 'animate-pulse border-solid')}>
              <Emoji e={goal.emoji} className={cx('text-3xl', game.cash < cost && 'opacity-40 grayscale')} />
              <span className="text-xs">
                <span className="block font-bold">{game.cash >= cost ? `Buy ${goal.name}!` : `Next: ${goal.name}`}</span>
                <span className="num opacity-75">{money(cost, world, bracket, { ceil: bracket === 1 })}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
