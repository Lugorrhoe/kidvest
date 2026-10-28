import { annualReturn } from '../../data/history';
import { historyNote } from '../../data/historyNotes';
import type { World } from '../../data/worlds';
import { money, pct } from '../../engine/format';
import type { Market } from '../../engine/market';
import type { Game } from '../../engine/types';
import { cx, Emoji } from '../../lib/ui';

const KIND_STYLE = {
  crash: { bg: 'bg-red-50', dot: 'bg-red-500', emoji: '⛈️' },
  boom: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', emoji: '☀️' },
  event: { bg: 'bg-amber-50', dot: 'bg-amber-500', emoji: '📰' },
  none: { bg: 'bg-white', dot: 'bg-ink-300', emoji: '' },
};

/** Parents only: which real years the child lived through, what the market did, and how the child behaved. */
export function HistoryTimeline({ game, market, world }: { game: Game; market: Market; world: World }) {
  const years = Math.min(Math.ceil(game.season / 4), game.yearSeq.length);
  if (years === 0) return null;
  const at = (s: number) => game.history.find((h) => h.season === s);
  const fmt = (v: number, o?: { sign?: boolean }) => money(v, world, 3, o);
  const rows = Array.from({ length: years }, (_, k) => {
    const real = game.yearSeq[k] ?? market.years[k * 4 + 1];
    const note = historyNote(real);
    const stocks = annualReturn('stocks', real);
    const cpi = annualReturn('cpi', real);
    const start = at(k * 4) ?? game.history[0];
    const done = game.season >= (k + 1) * 4;
    const end = done ? at((k + 1) * 4) : game.history[game.history.length - 1];
    const trades = game.trades.filter((t) => t.season >= k * 4 && t.season < (k + 1) * 4);
    const buys = trades.filter((t) => t.side === 'buy').length;
    const sells = trades.filter((t) => t.side === 'sell').length;
    let change: number | null = null;
    let changePct: number | null = null;
    if (start && end) {
      change = end.total - start.total - (end.contributions - start.contributions) + ((end.spent ?? 0) - (start.spent ?? 0));
      changePct = start.total > 0 ? change / start.total : null;
    }
    const rough = stocks <= -0.1;
    const behaviour = !start || start.invested <= 0
      ? buys > 0 ? `first investments: ${buys} ${buys === 1 ? 'order' : 'orders'}` : 'nothing invested yet'
      : rough && sells === 0
        ? 'held on through the storm 💪'
        : rough && sells > 0
          ? `sold during the fall (${sells} ${sells === 1 ? 'order' : 'orders'})`
          : buys + sells === 0
            ? 'held, no orders'
            : `${buys} ${buys === 1 ? 'buy' : 'buys'}, ${sells} ${sells === 1 ? 'sale' : 'sales'}`;
    return { k, real, note, stocks, cpi, change, changePct, done, behaviour };
  });
  return (
    <div className="card card-pad">
      <h3 className="font-bold">📜 What your child actually lived through</h3>
      <p className="mb-4 mt-1 text-sm text-ink-600">Each game year replays one real calendar year. Only you see the real dates; use them as stories to tell.</p>
      <div className="relative space-y-2">
        <div className="absolute bottom-3 left-[7px] top-3 w-0.5 bg-ink-100" aria-hidden />
        {rows.map((r) => {
          const st = KIND_STYLE[r.note?.kind ?? 'none'];
          return (
            <div key={r.k} className="relative flex gap-3 pl-6">
              <span className={cx('absolute left-0 top-3 h-4 w-4 rounded-full border-2 border-white shadow-sm', st.dot)} />
              <div className={cx('flex-1 rounded-xl border border-ink-100 px-3 py-2.5', st.bg)}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Year {r.k + 1}</span>
                    <span className="ml-2 font-extrabold">{r.real}</span>
                    {!r.done && <span className="ml-2 text-xs text-ink-500">in progress</span>}
                  </div>
                  <div className="num whitespace-nowrap text-xs text-ink-600">
                    Stocks <b className={r.stocks >= 0 ? 'text-gain' : 'text-loss'}>{pct(r.stocks, 3)}</b> · Inflation <b>{pct(r.cpi, 3)}</b>
                  </div>
                </div>
                {r.note && <div className="mt-1 text-sm text-ink-800">{st.emoji && <Emoji e={st.emoji} className="mr-1" />}{r.note.text}</div>}
                <div className="mt-1 flex items-baseline justify-between gap-3 text-xs text-ink-600">
                  <span>Your child: <b className="text-ink-800">{r.behaviour}</b></span>
                  {r.change !== null && <span className="num whitespace-nowrap">Result <b className={r.change >= 0 ? 'text-gain' : 'text-loss'}>{fmt(r.change, { sign: true })}{r.changePct !== null ? ` (${pct(r.changePct, 3)})` : ''}</b></span>}
                </div>
                {r.note?.talk && r.done && <div className="mt-1.5 rounded-lg bg-white/70 px-2 py-1 text-xs text-amber-800">💬 Talk about it: {r.note.talk}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
