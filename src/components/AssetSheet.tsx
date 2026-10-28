import { useMemo, useState, type ReactNode } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { assetById, maxAffordableUnits, type Context } from '../engine/game';
import { typicalSwing, type Market } from '../engine/market';
import { money, pct, units as fmtUnits } from '../engine/format';
import type { Game } from '../engine/types';
import { cx, Emoji, Modal } from '../lib/ui';
import { AssetIcon, RiskBadge, weatherOf } from './bits';

interface Props {
  game: Game;
  market: Market;
  ctx: Context;
  assetId: string | null;
  onClose: () => void;
  onTrade: (side: 'buy' | 'sell', id: string, units: number) => string | null;
}

export function AssetSheet(props: Props) {
  const { assetId, onClose } = props;
  return (
    <Modal open={!!assetId} onClose={onClose} width="max-w-4xl">
      {assetId && <SheetBody key={assetId} {...props} assetId={assetId} />}
    </Modal>
  );
}

function SheetBody({ game, market, ctx, assetId, onClose, onTrade }: Props & { assetId: string }) {
  const { bracket, world } = ctx;
  const a = assetById(game, assetId)!;
  const s = game.season;
  const price = market.prices[a.id][s];
  const held = game.holdings[a.id] ?? 0;
  const [side, setSide] = useState<'buy' | 'sell'>(held > 0 && game.cash < price ? 'sell' : 'buy');
  const [count, setCount] = useState(1);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'money' | 'units'>('money');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const fee = game.scenario.tradeFee;
  const m = (v: number, o?: { sign?: boolean; ceil?: boolean }) => money(v, world, bracket, o);
  const maxBuy = maxAffordableUnits(game, market, a.id, bracket === 1);
  const chart = useMemo(() => market.prices[a.id].slice(0, s + 1).map((p, i) => ({ i, p })), [market, a.id, s]);
  const swing = typicalSwing(a);
  const since = s > 0 ? price / market.prices[a.id][0] - 1 : 0;

  // units for the order
  let orderUnits = 0;
  if (bracket === 1) orderUnits = count;
  else {
    const n = parseFloat(amount.replace(',', '.'));
    if (n > 0) orderUnits = mode === 'units' && bracket === 3 ? n : n / price;
  }
  const gross = orderUnits * price;
  const total = side === 'buy' ? gross + fee : gross - fee;

  const setShare = (share: number) => {
    setError(null);
    if (side === 'buy') {
      const v = Math.max(0, (game.cash - fee) * share);
      setAmount(mode === 'units' ? (v / price).toFixed(3) : v.toFixed(bracket === 3 ? 2 : 0));
    } else {
      const u = held * share;
      setAmount(mode === 'units' ? u.toFixed(3) : (u * price).toFixed(bracket === 3 ? 2 : 0));
    }
  };

  const submit = () => {
    let u = orderUnits;
    if (side === 'sell' && u > held) u = held;
    if (side === 'sell' && Math.abs(u - held) < held * 0.002) u = held; // treat "almost all" as all
    const err = onTrade(side, a.id, u);
    if (err) setError(err);
    else {
      setDone(side === 'buy' ? `Bought ${bracket === 1 ? `${u} ${plural(a.name, u)}` : a.name}!` : `Sold ${bracket === 1 ? `${u} ${plural(a.name, u)}` : a.name}.`);
      setAmount('');
      setCount(1);
      setError(null);
    }
  };

  const canSubmit = orderUnits > 0 && (side === 'buy' ? total <= game.cash + 1e-6 : orderUnits <= held + 1e-6 && total >= 0) && !game.finished;
  const w = weatherOf(a.risk);

  return (
    <div className="grid grid-cols-[1.15fr_1fr]">
      {/* info */}
      <div className="border-r border-ink-100 p-7">
        <div className="flex items-start gap-4">
          <AssetIcon asset={a} size="xl" />
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold leading-tight">{a.name}</h2>
            {bracket === 3 && <div className="mt-1 text-sm font-semibold text-ink-500">{a.realLabel}</div>}
            <div className="mt-2"><RiskBadge risk={a.risk} bracket={bracket} swing={bracket === 3 ? swing : undefined} /></div>
          </div>
        </div>
        <p className={cx('mt-5 leading-relaxed text-ink-700', bracket === 1 ? 'text-base' : 'text-sm')}>{a.description}</p>
        <div className="mt-5 h-40 rounded-2xl p-2" style={{ background: 'var(--soft)' }}>
          {chart.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                <defs>
                  <linearGradient id="gSheet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={['auto', 'auto']} />
                {bracket > 1 && <Tooltip formatter={(v: number) => [m(v), 'Price']} labelFormatter={(i: number) => world.seasonLabel(i)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />}
                <Area type="monotone" dataKey="p" stroke="var(--accent)" strokeWidth={2} fill="url(#gSheet)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-500">The price chart appears after the first {world.seasonWord}.</div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Fact label={bracket === 1 ? 'Price now' : 'Price'} value={m(price, { ceil: bracket === 1 })} />
          {bracket === 1 ? (
            <Fact label="Weather" value={<span style={{ color: w.color }}><Emoji e={w.emoji} /> {w.label}</span>} />
          ) : (
            <Fact label="Since round start" value={<span className={since > 0.0005 ? 'text-gain' : since < -0.0005 ? 'text-loss' : ''}>{pct(since, bracket)}</span>} />
          )}
          <Fact label={bracket === 1 ? 'Gives you' : 'Payout'} value={a.payoutYield > 0 ? (bracket === 1 ? `${a.payoutWord}, sold for coins every year` : `${a.payoutWord}, about ${pct(a.payoutYield, bracket, false)} a year`) : bracket === 1 ? 'nothing now, it grows instead' : 'none (grows instead)'} />
          {bracket > 1 && <Fact label={bracket === 2 ? 'Running costs' : 'TER (yearly cost)'} value={pct(a.fee, 3, false)} />}
          {bracket === 3 && <Fact label="Typical yearly swing" value={`±${Math.round(swing * 100)} %`} />}
          <Fact label="You own" value={held > 0 ? `${fmtUnits(held, bracket)} · ${m(held * price)}` : 'none yet'} />
        </div>
      </div>

      {/* order ticket */}
      <div className="flex flex-col p-7">
        <div className="flex items-center justify-between">
          <div className="flex rounded-xl bg-ink-100 p-1">
            {(['buy', 'sell'] as const).map((x) => (
              <button key={x} disabled={x === 'sell' && held <= 0} className={cx('tab px-5 disabled:opacity-40', side === x && 'tab-active')} onClick={() => { setSide(x); setAmount(''); setCount(1); setError(null); setDone(null); }}>
                {x === 'buy' ? 'Buy' : 'Sell'}
              </button>
            ))}
          </div>
          <button className="text-2xl leading-none text-ink-400 hover:text-ink-700" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="mt-6 flex-1">
          {bracket === 1 ? (
            <div className="text-center">
              <div className="text-sm font-semibold text-ink-500">How many?</div>
              <div className="mt-3 flex items-center justify-center gap-5">
                <button className="btn btn-ghost h-14 w-14 text-3xl" onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
                <div className="num w-20 text-6xl font-extrabold">{count}</div>
                <button className="btn btn-ghost h-14 w-14 text-3xl" onClick={() => setCount((c) => Math.min(side === 'buy' ? Math.max(1, maxBuy) : Math.round(held), c + 1))}>+</button>
              </div>
              <div className="mt-3 min-h-[2.5rem] text-3xl"><Emoji e={a.emoji.repeat(Math.min(count, 10))} /></div>
              <div className="mt-2 text-sm text-ink-600">
                {side === 'buy' ? `You can buy up to ${maxBuy}.` : `You have ${Math.round(held)}.`}
              </div>
            </div>
          ) : (
            <div>
              {bracket === 3 && (
                <div className="mb-3 flex rounded-xl bg-ink-100 p-1 text-sm">
                  {(['money', 'units'] as const).map((x) => (
                    <button key={x} className={cx('tab flex-1', mode === x && 'tab-active')} onClick={() => { setMode(x); setAmount(''); }}>
                      {x === 'money' ? 'Amount (€)' : 'Shares'}
                    </button>
                  ))}
                </div>
              )}
              <label className="label">{mode === 'units' && bracket === 3 ? 'Number of shares' : side === 'buy' ? `How many ${world.currency.word} to invest` : `How many ${world.currency.word} to sell`}</label>
              <input className="input mt-1.5 num text-2xl font-bold" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => { setAmount(e.target.value); setError(null); setDone(null); }} autoFocus />
              <div className="mt-2 flex gap-2">
                {[0.25, 0.5, 1].map((x) => (
                  <button key={x} className="btn btn-ghost btn-md flex-1" onClick={() => setShare(x)}>{x === 1 ? (side === 'buy' ? 'Max' : 'All') : `${x * 100} %`}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2 rounded-2xl p-4 text-sm" style={{ background: 'var(--soft)' }}>
            {bracket > 1 && <Row k="Price" v={m(price)} />}
            {bracket > 1 && <Row k={bracket === 3 ? 'Shares' : 'Units'} v={orderUnits > 0 ? fmtUnits(orderUnits, bracket) : '—'} />}
            {fee > 0 && <Row k="Order fee" v={m(fee)} />}
            <Row k={side === 'buy' ? (bracket === 1 ? 'It costs' : 'Total cost') : bracket === 1 ? 'You get' : 'You receive'} v={<b>{orderUnits > 0 ? m(Math.max(0, total), { ceil: bracket === 1 && side === 'buy' }) : '—'}</b>} />
            <Row k={bracket === 1 ? `Coins in your chest` : `${world.cashName}`} v={m(game.cash)} />
          </div>
          {error && <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          {done && <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">✓ {done}</div>}
          {side === 'buy' && bracket === 1 && maxBuy === 0 && !done && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Not enough coins yet. Wait for more pocket money, or sell something.</div>}
        </div>

        <button className="btn btn-accent btn-lg mt-6 w-full" disabled={!canSubmit} onClick={submit}>
          {side === 'buy' ? (bracket === 1 ? `Buy ${count} ${plural(a.name, count)}` : 'Buy') : bracket === 1 ? `Sell ${count} ${plural(a.name, count)}` : 'Sell'}
        </button>
        {bracket === 3 && <p className="mt-3 text-center text-xs text-ink-400">Simulation with replayed historical data. No real money. Not financial advice.</p>}
      </div>
    </div>
  );
}

function plural(name: string, n: number) {
  const low = name.toLowerCase();
  return n === 1 || low.endsWith('s') ? low : `${low}s`;
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-100 px-3 py-2">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="num mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-600">{k}</span>
      <span className="num">{v}</span>
    </div>
  );
}
