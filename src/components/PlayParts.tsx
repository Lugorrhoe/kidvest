import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { achievementsFor, assetById, type Context, type SeasonReport } from '../engine/game';
import { currentGoal, goalsFor } from '../engine/achievements';
import { challengeProgress, goalCost, investedValue, levelOf, LEVEL_XP, portfolioRisk, totalValue, weightedFee } from '../engine/achievements';
import { typicalSwing, type Market } from '../engine/market';
import { money, pct, units as fmtUnits } from '../engine/format';
import type { AssetDef, Game, LogItem } from '../engine/types';
import { cx, Emoji, Progress, SectionTitle } from '../lib/ui';
import { AssetIcon, Delta, RiskBadge, Sparkline, weatherOf } from './bits';
import { fmtUnlock, type DailyState } from '../engine/daily';

type P = { game: Game; market: Market; ctx: Context };

/* ------------------------------------------------------------------ hero */
export function fmtDuration(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return 'less than a minute';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60} min`;
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}

export function Hero({ game, market, ctx, onNext, onYear, busy, pace, now, daily, onReport }: P & { onNext: () => void; onYear: () => void; busy: boolean; pace?: number; now: number; daily?: DailyState; onReport?: () => void }) {
  const { bracket, world } = ctx;
  const dark = world.id !== 'farm';
  const tot = totalValue(game, market);
  const inv = investedValue(game, market);
  const gain = tot + (game.spent ?? 0) - game.contributions;
  const gainPct = game.contributions > 0 ? gain / game.contributions : 0;
  const realPct = game.contribAdj > 0 ? tot / game.contribAdj - 1 : 0;
  const chapterLen = game.scenario.years * 4;
  const inChapter = game.season - (game.chapters ?? 0) * chapterLen;
  const live = !!pace && pace > 0;
  const nextIn = live ? game.lastTick + pace! - now : 0;
  const seasonProgress = live ? Math.min(1, Math.max(0, (now - game.lastTick) / pace!)) : 0;
  const m = (v: number, o?: { sign?: boolean }) => money(v, world, bracket, o);
  return (
    <div className={cx('relative overflow-hidden rounded-3xl p-7 shadow-card', dark ? 'text-white' : 'text-ink-900')} style={{ background: world.colors.hero }}>
      <div className="pointer-events-none absolute -right-6 -top-10 select-none text-[180px] opacity-10"><Emoji e={world.emoji} /></div>
      <div className="relative flex items-start justify-between gap-8">
        <div className="min-w-0">
          <div className={cx('text-sm font-semibold', dark ? 'text-white/70' : 'text-ink-600')}>
            {bracket === 1 ? `${world.portfolioName} is worth` : 'Total value'}
          </div>
          <div className={cx('num mt-1 font-extrabold tracking-tight', bracket === 1 ? 'text-6xl' : 'text-5xl')}>
            {bracket === 1 && <Emoji e="🪙" className="mr-2 text-5xl" />}
            {m(tot)}
          </div>
          <div className={cx('mt-3 text-sm', dark ? 'text-white/80' : 'text-ink-700')}>
            {bracket === 1 ? (
              gain >= 0.5 ? (
                <>You put in {m(game.contributions)}. Your {world.id === 'farm' ? 'farm' : 'money'} made <b>{m(gain)}</b> more! 🎉</>
              ) : gain <= -0.5 ? (
                <>You put in {m(game.contributions)}. Right now it is {m(-gain)} less. Storms pass, stay calm. 🌈</>
              ) : (
                <>You have {m(game.contributions)} to start your farm. Buy something at the market!</>
              )
            ) : (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span>Paid in <b className="num">{m(game.contributions)}</b></span>
                {(game.spent ?? 0) > 0 && <span>Spent on goals <b className="num">{m(game.spent)}</b></span>}
                <span>
                  {bracket === 2 ? 'Gain' : 'Return'}{' '}
                  <b className={cx('num', gain >= 0 ? (dark ? 'text-emerald-300' : 'text-gain') : dark ? 'text-rose-300' : 'text-loss')}>
                    {m(gain, { sign: true })} ({pct(gainPct, bracket)})
                  </b>
                </span>
                {bracket === 3 && (
                  <span>
                    After inflation <b className={cx('num', realPct >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{pct(realPct, bracket)}</b>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="mt-5 flex gap-3">
            {[
              { label: world.cashName, v: game.cash, e: bracket === 1 ? '🏡' : '💳' },
              { label: world.investedName, v: inv, e: bracket === 1 ? '🌾' : '📊' },
            ].map((b) => (
              <div key={b.label} className={cx('rounded-2xl px-4 py-3', dark ? 'bg-white/10' : 'bg-white/70')}>
                <div className={cx('text-xs font-semibold', dark ? 'text-white/70' : 'text-ink-500')}><Emoji e={b.e} /> {b.label}</div>
                <div className="num mt-0.5 text-xl font-bold">{m(b.v)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex w-72 shrink-0 flex-col items-stretch gap-3">
          <div className={cx('rounded-2xl px-4 py-3', dark ? 'bg-white/10' : 'bg-white/70')}>
            <div className="text-lg font-bold">{world.seasonLabel(game.season)}</div>
            <div className={cx('mb-2 text-xs', dark ? 'text-white/70' : 'text-ink-500')}>
              Chapter {(game.chapters ?? 0) + 1} · {world.seasonWord === 'season' ? 'season' : 'quarter'} {inChapter} of {chapterLen}
            </div>
            <Progress value={inChapter / chapterLen} color={dark ? '#fff' : 'var(--accent)'} className={dark ? 'h-2 bg-white/20' : 'h-2'} />
          </div>
          {daily && daily.seasonsLeft !== Infinity ? (
            <>
              <div className={cx('rounded-2xl px-4 py-3', dark ? 'bg-white/10' : 'bg-white/70')}>
                <div className="flex items-center justify-between">
                  <span className={cx('text-xs font-semibold', dark ? 'text-white/70' : 'text-ink-500')}>Today's {world.seasonWord}s</span>
                  <span className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => <span key={i} className={cx('h-3 w-3 rounded-full', i < daily.inYear || daily.locked ? (dark ? 'bg-white' : 'bg-[var(--accent)]') : dark ? 'bg-white/25' : 'bg-ink-200')} />)}
                  </span>
                </div>
                {daily.locked ? (
                  <>
                    <div className="mt-1 text-sm font-bold">Year done. {world.portfolioName} rests. 🌙</div>
                    <div className={cx('text-xs', dark ? 'text-white/70' : 'text-ink-600')}>Next year unlocks {daily.unlockAt ? fmtUnlock(daily.unlockAt, new Date(now)) : 'tomorrow'}</div>
                  </>
                ) : (
                  <div className={cx('mt-1 text-xs', dark ? 'text-white/70' : 'text-ink-600')}>{daily.seasonsLeft} of 4 left today. Think before each one!</div>
                )}
              </div>
              <button className={cx('btn btn-lg', dark ? 'bg-white text-ink-900 hover:bg-white/90' : 'btn-accent')} disabled={busy || game.finished || daily.locked} onClick={onNext}>
                {daily.locked ? '🔒 Come back tomorrow' : bracket === 1 ? 'Next season ▶' : `Next ${world.seasonWord} ▶`}
              </button>
              <button className={cx('btn btn-md', dark ? 'bg-white/10 text-white hover:bg-white/20' : 'btn-outline')} onClick={onReport}>📋 This year's report</button>
            </>
          ) : live ? (
            <div className={cx('rounded-2xl px-4 py-3', dark ? 'bg-white/10' : 'bg-white/70')}>
              <div className={cx('text-xs font-semibold', dark ? 'text-white/70' : 'text-ink-500')}>⏳ Next {world.seasonWord} in</div>
              <div className="num text-2xl font-extrabold">{fmtDuration(nextIn)}</div>
              <Progress value={seasonProgress} color={dark ? '#fff' : 'var(--accent)'} className={cx('mt-2', dark ? 'h-1.5 bg-white/20' : 'h-1.5')} />
              <div className={cx('mt-2 text-xs', dark ? 'text-white/70' : 'text-ink-500')}>
                {bracket === 1 ? 'Time passes by itself, like on a real farm. Come back later and see what happened!' : 'Time runs on its own, like a real portfolio. Check in from time to time.'}
              </div>
            </div>
          ) : (
            <>
              <button className={cx('btn btn-lg', dark ? 'bg-white text-ink-900 hover:bg-white/90' : 'btn-accent')} disabled={busy || game.finished} onClick={onNext}>
                {game.finished ? 'Round finished' : bracket === 1 ? 'Next season ▶' : `Next ${world.seasonWord} ▶`}
              </button>
              <button className={cx('btn btn-md', dark ? 'bg-white/10 text-white hover:bg-white/20' : 'btn-outline')} disabled={busy || game.finished} onClick={onYear}>
                ⏩ Skip one year
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ holdings */
export function Holdings({ game, market, ctx, onOpen }: P & { onOpen: (id: string) => void }) {
  const { bracket, world } = ctx;
  const rows = Object.entries(game.holdings).map(([id, u]) => {
    const a = assetById(game, id)!;
    const value = u * market.prices[id][game.season];
    const cost = game.costBasis[id] ?? 0;
    return { a, u, value, cost, pl: value - cost, plPct: cost > 0 ? value / cost - 1 : 0 };
  }).sort((x, y) => y.value - x.value);
  const m = (v: number, o?: { sign?: boolean }) => money(v, world, bracket, o);
  return (
    <div className="card card-pad">
      <SectionTitle right={<span className="text-xs text-ink-500">{rows.length} {rows.length === 1 ? 'kind' : 'kinds'}</span>}>{world.portfolioName}</SectionTitle>
      {rows.length === 0 ? (
        <div className="rounded-xl bg-ink-50 p-6 text-center text-sm text-ink-500">
          {bracket === 1 ? 'Your farm is still empty. Buy your first animal at the farm market below! 👇' : `Nothing here yet. Pick something in the ${world.marketName} below.`}
        </div>
      ) : (
        <div className="divide-y divide-ink-100">
          {bracket === 3 && (
            <div className="grid grid-cols-[minmax(0,1fr)_72px_96px_104px_170px] gap-3 pb-2 text-xs font-semibold text-ink-400">
              <span>Position</span><span className="text-right">Shares</span><span className="text-right">Avg. price</span><span className="text-right">Value</span><span className="text-right">P/L</span>
            </div>
          )}
          {rows.map(({ a, u, value, cost, pl, plPct }) => (
            <button key={a.id} onClick={() => onOpen(a.id)} className="w-full py-3 text-left transition hover:bg-ink-50/60">
              {bracket === 1 ? (
                <div className="flex items-center gap-4">
                  <AssetIcon asset={a} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-bold">{a.name} <span className="text-ink-400">× {fmtUnits(u, 1)}</span></div>
                    <div className="mt-0.5 truncate text-xl leading-none"><Emoji e={a.emoji.repeat(Math.min(8, Math.round(u)))} /></div>
                  </div>
                  <div className="text-right">
                    <div className="num text-lg font-bold">{m(value)}</div>
                    <div className="text-sm">
                      {Math.round(pl) >= 1 ? <span className="font-semibold text-gain">📈 {money(Math.round(pl), world, 1)} more than you paid</span> : Math.round(pl) <= -1 ? <span className="font-semibold text-loss">📉 {money(Math.round(-pl), world, 1)} less than you paid</span> : <span className="text-ink-500">about what you paid</span>}
                    </div>
                  </div>
                </div>
              ) : bracket === 2 ? (
                <div className="flex items-center gap-4">
                  <AssetIcon asset={a} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{a.name}</div>
                    <div className="text-xs text-ink-500">{fmtUnits(u, 2)} units · paid {m(cost)}</div>
                  </div>
                  <div className="text-right">
                    <div className="num font-bold">{m(value)}</div>
                    <Delta value={pl} text={pct(plPct, 2)} className="text-sm" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_72px_96px_104px_170px] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <AssetIcon asset={a} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{a.name}</div>
                      <div className="truncate text-xs text-ink-500">{a.realLabel}</div>
                    </div>
                  </div>
                  <span className="num text-right text-sm">{fmtUnits(u, 3)}</span>
                  <span className="num text-right text-sm">{m(cost / u)}</span>
                  <span className="num text-right text-sm font-bold">{m(value)}</span>
                  <span className="whitespace-nowrap text-right text-sm"><Delta value={pl} text={`${m(pl, { sign: true })} (${pct(plPct, 3)})`} /></span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ market */
export function MarketList({ game, market, ctx, onOpen }: P & { onOpen: (id: string) => void }) {
  const { bracket, world } = ctx;
  const s = game.season;
  const m = (v: number) => money(v, world, bracket, { ceil: bracket === 1 });
  if (bracket === 1) {
    return (
      <div className="card card-pad">
        <SectionTitle>{world.marketName}</SectionTitle>
        <div className="grid grid-cols-3 gap-4">
          {game.assets.map((a) => {
            const w = weatherOf(a.risk);
            const prev = market.prices[a.id][Math.max(0, s - 1)];
            const now = market.prices[a.id][s];
            return (
              <div key={a.id} className="flex flex-col rounded-2xl border border-ink-100 p-4 transition hover:shadow-card">
                <div className="flex items-start justify-between">
                  <Emoji e={a.emoji} className="text-5xl" />
                  <span className="chip" style={{ background: w.bg, color: w.color }}><Emoji e={w.emoji} /> {w.label}</span>
                </div>
                <div className="mt-3 text-lg font-bold">{a.name}</div>
                <div className="mt-1 flex-1 text-sm text-ink-600">{a.tagline}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="num text-lg font-bold">{m(now)} <span className="text-sm font-normal text-ink-500">each</span></div>
                  {s > 0 && <span className="text-xl" title="Since last season">{now > prev * 1.005 ? '📈' : now < prev * 0.995 ? '📉' : '➖'}</span>}
                </div>
                {a.payoutWord && <div className="mt-1 text-xs font-semibold text-ink-500">🪙 {a.payoutWord.charAt(0).toUpperCase() + a.payoutWord.slice(1)} sold for coins every year</div>}
                <button className="btn btn-accent btn-md mt-3" disabled={game.finished} onClick={() => onOpen(a.id)}>Look &amp; buy</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="card card-pad">
      <SectionTitle>{world.marketName}</SectionTitle>
      <div className="divide-y divide-ink-100">
        {game.assets.map((a) => {
          const series = market.prices[a.id].slice(Math.max(0, s - 12), s + 1);
          const r = s > 0 ? market.prices[a.id][s] / market.prices[a.id][s - 1] - 1 : 0;
          return (
            <button key={a.id} onClick={() => onOpen(a.id)} className="grid w-full grid-cols-[1fr_104px_110px_92px] items-center gap-4 py-3 text-left transition hover:bg-ink-50/60">
              <div className="flex min-w-0 items-center gap-3">
                <AssetIcon asset={a} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold">{a.name}</span>
                    {a.payoutWord && <span className="chip bg-ink-100 text-ink-600">pays {a.payoutWord}</span>}
                  </div>
                  <div className="truncate text-xs text-ink-500">{bracket === 3 ? a.realLabel : a.tagline}</div>
                  <div className="mt-1"><RiskBadge risk={a.risk} bracket={bracket} swing={bracket === 3 ? typicalSwing(a) : undefined} /></div>
                </div>
              </div>
              <Sparkline values={series} width={104} />
              <div className="text-right">
                <div className="num text-sm font-bold">{money(market.prices[a.id][s], world, bracket)}</div>
                <Delta value={r} text={s > 0 ? pct(r, bracket) : '—'} className="text-xs" />
              </div>
              <span className="btn btn-ghost btn-md">Trade</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ recap */
function itemTone(k: LogItem['kind']) {
  if (k === 'storm') return 'bg-rose-50';
  if (k === 'sun' || k === 'goal') return 'bg-emerald-50';
  if (k === 'achievement' || k === 'challenge' || k === 'level') return 'bg-amber-50';
  if (k === 'news') return 'bg-sky-50';
  return 'bg-ink-50';
}

export function Recap({ game, ctx, report }: { game: Game; ctx: Context; report: SeasonReport | null }) {
  const { bracket, world } = ctx;
  const m = (v: number, o?: { sign?: boolean }) => money(v, world, bracket, o);
  if (game.season === 0) {
    const welcome = game.scenario.events.find((e) => e.season === 0);
    return (
      <div className="card card-pad">
        <SectionTitle>{welcome?.title ?? 'Welcome'}</SectionTitle>
        <p className="text-sm leading-relaxed text-ink-700">{welcome?.text ?? game.scenario.description}</p>
        <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'var(--soft)' }}>
          <b>How to play:</b> {bracket === 1 ? 'Buy animals or trees, then press "Next season" and see what happens. You can always sell again.' : `Pick investments in the ${world.marketName}, then move time forward. Every ${world.seasonWord} brings payouts, pocket money and surprises.`}
        </div>
      </div>
    );
  }
  const items = report ? report.items : game.log.filter((l) => l.season === game.season && l.kind !== 'trade');
  const change = report?.change;
  return (
    <div className="card card-pad">
      <SectionTitle right={<span className="text-xs text-ink-500">{world.seasonLabel(game.season)}</span>}>What happened</SectionTitle>
      {change !== undefined && (
        <div className="mb-3 flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--soft)' }}>
          <span className="text-sm font-semibold">{bracket === 1 ? 'Your investments' : `Market effect`}</span>
          {bracket === 1 ? (
            <span className="text-sm font-bold">{change > 0.5 ? `📈 grew by ${m(change)}` : change < -0.5 ? `📉 shrank by ${m(-change)}` : '➖ stayed the same'}</span>
          ) : (
            <Delta value={change} text={`${m(change, { sign: true })} (${pct(report!.changePct, bracket)})`} className="text-sm" />
          )}
        </div>
      )}
      <div className="space-y-2">
        {items.length === 0 && <div className="text-sm text-ink-500">A quiet {world.seasonWord}.</div>}
        {items.slice(0, 7).map((it, i) => (
          <div key={i} className={cx('flex items-start gap-3 rounded-xl px-3 py-2', itemTone(it.kind))}>
            <Emoji e={it.emoji ?? '•'} className="mt-0.5 text-lg" />
            <div className="min-w-0 flex-1 text-sm leading-snug">{it.text}</div>
            {it.amount !== undefined && <span className="num text-sm font-bold text-gain">{m(it.amount, { sign: true })}</span>}
          </div>
        ))}
        {items.length > 7 && <div className="text-xs text-ink-500">and {items.length - 7} more</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ goal */
export function GoalCard({ game, market, ctx, onBuy }: P & { onBuy: () => void }) {
  const { bracket, world } = ctx;
  const g = currentGoal(game);
  const ladder = goalsFor(game);
  const tot = totalValue(game, market);
  const m = (v: number) => money(v, world, bracket, { ceil: bracket === 1 });
  if (!g) {
    return (
      <div className="card card-pad">
        <SectionTitle>My goals</SectionTitle>
        <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">🏆 You bought everything on your list. Amazing saver!</div>
      </div>
    );
  }
  const cost = goalCost(game, market);
  const rose = cost - g.amount;
  const canBuy = game.cash + 1e-6 >= cost;
  return (
    <div className="card card-pad">
      <SectionTitle right={<span className="text-xs text-ink-500">{game.goalIndex + 1} of {ladder.length}</span>}>My goal</SectionTitle>
      <div className="flex items-center gap-4">
        <Emoji e={g.emoji} className="text-5xl" />
        <div className="min-w-0 flex-1">
          <div className="font-bold">{g.name}</div>
          <div className="num text-sm text-ink-600">{tot >= cost ? m(cost) : money(tot, world, bracket)} of {m(cost)}</div>
          <Progress value={tot / cost} className="mt-2 h-3" />
        </div>
      </div>
      {canBuy ? (
        <button className="btn btn-accent btn-md mt-3 w-full" onClick={onBuy}>🛍️ Buy {g.name} for {m(cost)}</button>
      ) : tot >= cost ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          {bracket === 1 ? `Your farm is worth enough! To buy it, sell some animals so the coins are in your farmhouse chest.` : `Your total is enough, but the money is invested. Sell something to free up ${m(cost - game.cash)}, or keep investing for something bigger.`}
        </div>
      ) : rose > 0.5 ? (
        <div className="mt-3 text-xs leading-relaxed text-ink-600">
          {bracket === 1 ? `The ${g.name.toLowerCase()} costs ${m(rose)} more than at the start. Things get a little more expensive every year.` : `Inflation: the price rose by ${m(rose)} (${pct(cost / g.amount - 1, bracket)}) since the start.`}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {ladder.map((x, i) => (
          <span key={x.name} title={x.name} className={cx('chip', i < game.goalIndex ? 'bg-emerald-100 text-emerald-800' : i === game.goalIndex ? 'bg-amber-100 text-amber-800' : 'bg-ink-100 text-ink-500')}>
            <Emoji e={x.emoji} className={i > game.goalIndex ? 'opacity-50 grayscale' : ''} /> {i < game.goalIndex ? '✓' : i === game.goalIndex ? 'now' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ allocation */
export function AllocationCard({ game, market, ctx }: P) {
  const { bracket, world } = ctx;
  const tot = totalValue(game, market);
  const slices = [
    ...Object.entries(game.holdings).map(([id, u], i) => {
      const a = assetById(game, id) as AssetDef;
      return { name: a.name, emoji: a.emoji, value: u * market.prices[id][game.season], color: world.colors.chart[i % world.colors.chart.length] };
    }),
    { name: world.cashName, emoji: '💳', value: game.cash, color: '#ced4da' },
  ].filter((x) => x.value > 0.0001);
  const risk = portfolioRisk(game, market);
  const fee = weightedFee(game, market);
  const w = weatherOf(Math.max(1, Math.round(risk)));
  return (
    <div className="card card-pad">
      <SectionTitle>{bracket === 1 ? 'My mix' : 'Allocation & risk'}</SectionTitle>
      <div className="flex items-center gap-4">
        <div className="h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" innerRadius={38} outerRadius={60} paddingAngle={2} stroke="none" isAnimationActive={false}>
                {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              {bracket > 1 && <Tooltip formatter={(v: number) => money(v, world, bracket)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />}
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {slices.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="min-w-0 truncate"><Emoji e={s.emoji} /> {s.name}</span>
              {bracket > 1 && <span className="num ml-auto shrink-0 whitespace-nowrap pl-1 text-ink-500">{pct(s.value / tot, bracket, false)}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl p-3" style={{ background: 'var(--soft)' }}>
        {bracket === 1 ? (
          <div className="flex items-center gap-3 text-sm">
            <Emoji e={risk < 0.5 ? '😴' : w.emoji} className="text-2xl" />
            <span>{risk < 0.5 ? `Your ${world.currency.word} are resting. Safe, but they do not grow.` : w.label === 'Calm' ? `${world.portfolioName} is calm. Storms will not hurt it much.` : w.label === 'Bumpy' ? `${world.portfolioName} is a bit bumpy. It can grow, and sometimes shrink.` : `${world.portfolioName} is wild! Big wins and big storms are possible.`}</span>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-ink-600">{bracket === 3 ? 'Portfolio risk (incl. cash)' : 'Risk of my mix'}</span>{bracket === 3 ? <span className="num font-semibold">{risk.toFixed(1)} / 5</span> : <RiskBadge risk={Math.max(1, Math.round(risk)) as 1} bracket={bracket} />}</div>
            <Progress value={risk / 5} color={risk < 2 ? '#2f9e44' : risk < 3.2 ? '#f59f00' : '#e03131'} />
            <div className="flex items-center justify-between"><span className="text-ink-600">{bracket === 2 ? 'Yearly running costs' : 'Weighted TER'}</span><span className="num font-semibold">{pct(fee, 3, false)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ challenges */
export function ChallengesCard({ game, market }: P) {
  const list = game.scenario.challenges;
  if (!list.length) return null;
  return (
    <div className="card card-pad">
      <SectionTitle right={<span className="text-xs text-ink-500">{Object.keys(game.challengesDone).length}/{list.length} done</span>}>Challenges</SectionTitle>
      <div className="space-y-3">
        {list.map((c) => {
          const done = game.challengesDone[c.id] !== undefined;
          const p = challengeProgress(c, game, market);
          return (
            <div key={c.id} className={cx('rounded-xl border p-3', done ? 'border-emerald-200 bg-emerald-50' : 'border-ink-100')}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold">{done ? '✅ ' : '🎯 '}{c.title}</div>
                <span className="chip bg-amber-100 text-amber-800">+{c.xp} XP</span>
              </div>
              <div className="mt-1 text-xs text-ink-600">{c.description}</div>
              {!done && <Progress value={p} className="mt-2 h-1.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ achievements */
export function AchievementsCard({ game, ctx }: { game: Game; ctx: Context }) {
  const { world, bracket } = ctx;
  const lv = levelOf(game.xp);
  const list = achievementsFor(bracket);
  const nextXp = lv.next ?? LEVEL_XP[LEVEL_XP.length - 1];
  return (
    <div className="card card-pad">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold text-white" style={{ background: 'var(--accent)' }}>{lv.level + 1}</div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">{world.levelTitles[lv.level]}</div>
          <div className="num text-xs text-ink-500">{game.xp} XP{lv.next ? ` · ${lv.next - game.xp} to ${world.levelTitles[lv.level + 1]}` : ' · top level!'}</div>
          <Progress value={lv.next ? (game.xp - lv.prev) / (nextXp - lv.prev) : 1} className="mt-1.5 h-1.5" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {list.map((a) => {
          const got = game.achievements[a.id] !== undefined;
          return (
            <div key={a.id} title={`${a.title}: ${a.description}`} className={cx('group relative flex aspect-square flex-col items-center justify-center rounded-xl border text-center', got ? 'border-amber-200 bg-amber-50' : 'border-ink-100 bg-ink-50')}>
              <Emoji e={a.emoji} className={cx('text-2xl', !got && 'opacity-30 grayscale')} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-44 -translate-x-1/2 rounded-lg bg-ink-900 p-2 text-left text-xs text-white group-hover:block">
                <b>{a.title}</b><br />{a.description}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-ink-500">{Object.keys(game.achievements).length} of {list.length} badges</div>
    </div>
  );
}

export { fmtUnits };
