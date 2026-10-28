import { useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { annualReturn } from '../data/history';
import type { Context } from '../engine/game';
import { money, pct } from '../engine/format';
import type { Market } from '../engine/market';
import type { Game } from '../engine/types';
import { cx, SectionTitle } from '../lib/ui';

type Range = 4 | 12 | 20 | 0;
const RANGES: { v: Range; label: string }[] = [
  { v: 4, label: '1 year' },
  { v: 12, label: '3 years' },
  { v: 20, label: '5 years' },
  { v: 0, label: 'All' },
];

/**
 * What the same pocket money would have become without investing:
 * "saved" = kept as cash (0 % interest), "account" = a savings account paying that year's short-term rate.
 * Goal purchases are subtracted from both, exactly as they are from the invested total.
 */
function alternatives(game: Game, market: Market): { saved: number[]; account: number[] } {
  const saved: number[] = [];
  const account: number[] = [];
  let acc = game.scenario.startCash;
  let prevSpent = 0;
  for (const h of game.history) {
    const spent = h.spent ?? 0;
    const spentNow = spent - prevSpent;
    prevSpent = spent;
    if (h.season > 0) {
      const r = annualReturn('tbill', market.years[h.season] ?? market.years[market.years.length - 1]);
      acc = acc * (1 + r) ** 0.25 + game.scenario.incomePerSeason - spentNow;
    }
    saved.push(h.contributions - spent);
    account.push(acc);
  }
  return { saved, account };
}

export function GrowthChart({ game, market, ctx }: { game: Game; market: Market; ctx: Context }) {
  const { bracket, world } = ctx;
  const [mode, setMode] = useState<'nominal' | 'real'>('nominal');
  const [range, setRange] = useState<Range>(0);
  const real = bracket === 3 && mode === 'real';
  const alt = useMemo(() => alternatives(game, market), [game.history.length, game.spent, market]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = game.history.map((h, i) => ({
    s: h.season,
    total: real ? h.total / h.cpi : h.total,
    saved: real ? alt.saved[i] / h.cpi : alt.saved[i],
    account: real ? alt.account[i] / h.cpi : alt.account[i],
    breakeven: h.contribAdj,
  }));
  const data = range ? all.slice(Math.max(0, all.length - range - 1)) : all;
  const first = data[0];
  const last = data[data.length - 1];
  const fmt = (v: number) => money(v, world, bracket);
  const title = bracket === 1 ? `How ${world.portfolioName.toLowerCase()} grew` : bracket === 2 ? 'Value over time' : 'Performance';
  const diffSaved = last && first ? last.total - last.saved - (first.total - first.saved) : 0;
  const diffAccount = last && first ? last.total - last.account - (first.total - first.account) : 0;
  const names: Record<string, string> = {
    total: real ? "Invested, in today's money" : bracket === 1 ? 'My farm' : 'Invested',
    saved: real ? "Only saved, in today's money" : 'Only saved (cash)',
    account: real ? "Savings account, in today's money" : 'Savings account',
    breakeven: 'Break-even after inflation',
  };
  return (
    <div className="card card-pad">
      <SectionTitle
        right={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-ink-100 p-1">
              {RANGES.map((r) => (
                <button key={r.v} className={cx('tab px-2.5', range === r.v && 'tab-active')} onClick={() => setRange(r.v)} disabled={r.v !== 0 && game.history.length <= 1}>
                  {r.label}
                </button>
              ))}
            </div>
            {bracket === 3 && (
              <div className="flex rounded-xl bg-ink-100 p-1">
                {(['nominal', 'real'] as const).map((m) => (
                  <button key={m} className={cx('tab', mode === m && 'tab-active')} onClick={() => setMode(m)}>
                    {m === 'nominal' ? 'In euros' : 'After inflation'}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      >
        {title}
      </SectionTitle>
      {all.length < 2 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-ink-50 text-center text-ink-500">
          <div className="text-3xl">📈</div>
          <div className="mt-2 text-sm">Your chart starts after the first {world.seasonWord}.</div>
        </div>
      ) : (
        <div className={bracket === 1 ? 'h-56' : 'h-64'}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: bracket === 1 ? 8 : 0 }}>
              <defs>
                <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {bracket > 1 && <CartesianGrid vertical={false} stroke="#eceef2" />}
              <XAxis dataKey="s" hide={bracket === 1} tickFormatter={(s) => (s % 4 === 0 ? (s === 0 ? 'Start' : `Y${s / 4}`) : '')} interval={0} tick={{ fontSize: 11, fill: '#8a93a3' }} axisLine={false} tickLine={false} minTickGap={8} />
              <YAxis hide={bracket === 1} width={bracket === 3 ? 76 : 60} tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: '#8a93a3' }} axisLine={false} tickLine={false} domain={[range ? 'auto' : 0, 'auto']} />
              <Tooltip
                formatter={(v: number, n: string) => [fmt(v), names[n] ?? n]}
                labelFormatter={(s: number) => world.seasonLabel(s)}
                contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2.5} fill="url(#gArea)" isAnimationActive={false} />
              <Line type="stepAfter" dataKey="saved" stroke="#8a93a3" strokeDasharray="5 4" strokeWidth={1.75} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="account" stroke="#1c7ed6" strokeDasharray="2 3" strokeWidth={1.75} dot={false} isAnimationActive={false} />
              {bracket === 3 && !real && <Line type="monotone" dataKey="breakeven" stroke="#f08c00" strokeDasharray="1 3" strokeWidth={1.5} dot={false} isAnimationActive={false} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {all.length >= 2 && (
        <>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ background: 'var(--accent)' }} />{names.total}</span>
            <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-ink-400" />{names.saved}</span>
            <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dotted" style={{ borderColor: '#1c7ed6' }} />{names.account}</span>
            {bracket === 3 && !real && <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dotted" style={{ borderColor: '#f08c00' }} />{names.breakeven}</span>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Compare label={bracket === 1 ? 'Compared with only saving' : 'Investing vs. only saving'} diff={diffSaved} base={last.saved} ctx={ctx} />
            <Compare label={bracket === 1 ? 'Compared with a savings account' : 'Investing vs. savings account'} diff={diffAccount} base={last.account} ctx={ctx} />
          </div>
          {(game.spent ?? 0) > 0 && <p className="mt-2 text-xs text-ink-400">Things you bought from your goal list are taken off all three lines.</p>}
        </>
      )}
    </div>
  );
}

function Compare({ label, diff, base, ctx }: { label: string; diff: number; base: number; ctx: Context }) {
  const { bracket, world } = ctx;
  const up = diff >= 0;
  const r = bracket === 1 ? Math.round(diff) : diff;
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--soft)' }}>
      <div className="text-xs text-ink-500">{label}</div>
      <div className={cx('num text-sm font-bold', up ? 'text-gain' : 'text-loss')}>
        {bracket === 1
          ? Math.abs(r) < 1 ? 'about the same' : `${up ? '+' : '−'}${Math.abs(r)} coins ${up ? 'more 📈' : 'less 📉'}`
          : `${money(diff, world, bracket, { sign: true })}${base > 0 ? ` (${pct(diff / base, bracket)})` : ''}`}
      </div>
    </div>
  );
}
