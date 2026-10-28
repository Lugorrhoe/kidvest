import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db } from '../../db/db';
import { BRACKETS, WORLDS } from '../../data/worlds';
import { totalValue } from '../../engine/achievements';
import { money, pct, units } from '../../engine/format';
import { marketFor } from '../../engine/game';
import type { Game, Profile } from '../../engine/types';
import { cx, Emoji } from '../../lib/ui';
import { TalkSection } from './TalkSection';

export function ReportsTab() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray(), []);
  const games = useLiveQuery(() => db.games.toArray(), []);
  const [sel, setSel] = useState<string | null>(null);
  if (!profiles || !games) return null;
  const current = profiles.find((p) => p.id === sel) ?? profiles[0];
  const game = current && games.find((g) => g.profileId === current.id);
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-extrabold">Reports</h2>
        <p className="text-sm text-ink-600">See what your child did, which real years were replayed, and get conversation prompts. Show, let do, then talk.</p>
      </div>
      {profiles.length > 0 && <div className="mb-6"><TalkSection /></div>}
      {profiles.length === 0 ? (
        <div className="card card-pad text-sm text-ink-500">No children yet.</div>
      ) : (
        <>
          <div className="mb-5 flex gap-2">
            {profiles.map((p) => (
              <button key={p.id} className={cx('btn btn-md', current?.id === p.id ? 'btn-dark' : 'btn-ghost')} onClick={() => setSel(p.id)}><Emoji e={p.avatar} /> {p.name}</button>
            ))}
          </div>
          {game ? <Report p={current!} g={game} /> : <div className="card card-pad text-sm text-ink-500">{current?.name} has not started a round yet.</div>}
        </>
      )}
    </div>
  );
}

function Report({ p, g }: { p: Profile; g: Game }) {
  const world = WORLDS[p.world];
  const m = marketFor(g);
  const fmt = (v: number, o?: { sign?: boolean }) => money(v, world, 3, o);
  const tot = totalValue(g, m);
  const gain = tot + (g.spent ?? 0) - g.contributions;
  const seq = g.yearSeq?.length ? g.yearSeq : [g.startYear];
  const runs: string[] = [];
  let a0 = seq[0], prev = seq[0];
  for (const y of [...seq.slice(1), NaN]) {
    if (y !== prev + 1) { runs.push(a0 === prev ? String(a0) : `${a0} to ${prev}`); a0 = y; }
    prev = y;
  }
  const year = (s: number) => (s === 0 ? `${g.startYear} start` : `${m.years[s]} Q${((s - 1) % 4) + 1}`);
  const data = g.history.map((h) => ({ s: h.season, total: h.total, paid: h.contributions, real: h.contribAdj }));
  const name = (id: string) => g.assets.find((a) => a.id === id);
  const stats = [
    ['Total value', fmt(tot)],
    ['Paid in', fmt(g.contributions)],
    ['Gain', `${fmt(gain, { sign: true })} (${pct(gain / g.contributions, 3)})`],
    ['After inflation', pct(tot / g.contribAdj - 1, 3)],
    ['Payouts received', fmt(g.payoutsTotal)],
    ['Spent on goals', `${fmt(g.spent ?? 0)}${g.owned?.length ? ` · ${g.owned.map((o) => o.emoji).join(' ')}` : ''}`],
    ['Orders', String(g.tradeCount)],
    ['Challenges', `${Object.keys(g.challengesDone).length}/${g.scenario.challenges.length}`],
  ];
  return (
    <div className="space-y-6">
      <div className="card card-pad">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold">{g.scenario.name}</div>
            <div className="text-sm text-ink-600">{world.name} · ages {BRACKETS[p.bracket - 1].ages} · {world.seasonLabel(g.season)}{g.finished ? ' · finished' : ''}</div>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-right text-sm">
            <div className="text-xs text-amber-700">Real history replayed (only you see this)</div>
            <div className="font-bold text-amber-900">{runs.join(', then ')}</div>
            <div className="text-xs text-amber-700">Now in {m.years[g.season] ?? seq[seq.length - 1]} · chapter {(g.chapters ?? 0) + 1}</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-ink-100 p-3">
              <div className="text-xs text-ink-500">{k}</div>
              <div className="num mt-1 font-bold">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#eceef2" />
              <XAxis dataKey="s" tickFormatter={(s) => (s % 16 === 0 ? String(m.years[s + 1] ?? '') : '')} interval={0} tick={{ fontSize: 11 }} />
              <YAxis width={80} tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(s: number) => year(s)} formatter={(v: number, n: string) => [fmt(v), n === 'total' ? 'Total value' : n === 'paid' ? 'Paid in' : 'Break-even after inflation']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area dataKey="total" stroke={world.colors.accent} fill={world.colors.soft} strokeWidth={2} isAnimationActive={false} />
              <Line dataKey="paid" stroke="#8a93a3" strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              <Line dataKey="real" stroke="#f08c00" strokeDasharray="2 3" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card card-pad">
          <h3 className="mb-3 font-bold">💬 Then talk: conversation prompts</h3>
          {g.talk.length === 0 ? (
            <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-500">Prompts appear after storms, big decisions and milestones.</div>
          ) : (
            <div className="space-y-3">
              {[...g.talk].reverse().map((t, i) => (
                <div key={i} className="rounded-xl border border-ink-100 p-3">
                  <div className="flex items-center justify-between text-xs text-ink-500"><span>{world.seasonLabel(t.season)}</span><span>{year(t.season)}</span></div>
                  <div className="mt-1 font-semibold">{t.title}</div>
                  <div className="mt-1 text-sm text-ink-700">{t.question}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card card-pad">
          <h3 className="mb-3 font-bold">🧾 Orders</h3>
          {g.trades.length === 0 ? (
            <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-500">No orders yet.</div>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-xs text-ink-500">
                  <tr><th className="pb-2">When</th><th className="pb-2">Asset</th><th className="pb-2">Side</th><th className="pb-2 text-right">Units</th><th className="pb-2 text-right">Price</th></tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {[...g.trades].reverse().map((t, i) => {
                    const a = name(t.assetId);
                    return (
                      <tr key={i}>
                        <td className="py-2 text-xs text-ink-500">{year(t.season)}</td>
                        <td className="py-2"><Emoji e={a?.emoji ?? '•'} /> {a?.name}</td>
                        <td className={cx('py-2 font-semibold', t.side === 'buy' ? 'text-gain' : 'text-loss')}>{t.side}</td>
                        <td className="num py-2 text-right">{units(t.units, 3)}</td>
                        <td className="num py-2 text-right">{fmt(t.price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
