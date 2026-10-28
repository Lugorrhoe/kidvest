import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { allScenarios, db } from '../../db/db';
import { annualReturn, FIRST_YEAR, LAST_YEAR } from '../../data/history';
import { BRACKETS, WORLDS, WORLD_LIST, worldAssets } from '../../data/worlds';
import { uid } from '../../engine/rng';
import type { ChallengeType, Scenario, WorldId } from '../../engine/types';
import { Emoji, Modal } from '../../lib/ui';
import { Field, Num, Seg } from './fields';

const CHALLENGE_TYPES: { v: ChallengeType; label: string; target: string; def: number }[] = [
  { v: 'own_kinds', label: 'Own N kinds at once', target: 'Number of kinds', def: 3 },
  { v: 'hold_through_storm', label: 'Hold through N storms', target: 'Storms', def: 1 },
  { v: 'reach_goal', label: 'Reach the savings goal', target: '(not used)', def: 1 },
  { v: 'collect_payouts', label: 'Collect payouts worth N', target: 'Amount', def: 50 },
  { v: 'invested_share', label: 'Invested share at least', target: 'Share 0 to 1 (0.6 = 60 %)', def: 0.6 },
  { v: 'play_years', label: 'Play N years', target: 'Years', def: 5 },
  { v: 'low_fees', label: 'Average yearly cost below', target: 'Share (0.005 = 0.5 %)', def: 0.005 },
  { v: 'beat_inflation', label: 'Beat inflation by', target: 'Margin (0.1 = 10 %)', def: 0.1 },
  { v: 'calm_year', label: 'A year with at most N trades', target: 'Trades', def: 2 },
  { v: 'balanced', label: 'Balanced: no position above', target: 'Max share (0.6 = 60 %)', def: 0.6 },
];

function blank(world: WorldId): Scenario {
  const w = WORLDS[world];
  return {
    id: uid('sc'),
    name: `My ${w.name} scenario`,
    world,
    bracket: w.defaultBracket,
    description: '',
    startYear: 'random',
    years: 10,
    seed: Math.floor(Math.random() * 1e6),
    startCash: world === 'farm' ? 100 : world === 'space' ? 500 : 1000,
    incomePerSeason: world === 'farm' ? 10 : world === 'space' ? 30 : 60,
    tradeFee: world === 'city' ? 1 : 0,
    assets: worldAssets(world).map((a) => a.id),
    goal: { name: 'My goal', emoji: '🎯', amount: world === 'farm' ? 400 : world === 'space' ? 2000 : 6000 },
    events: [],
    challenges: [{ id: uid('c'), type: 'own_kinds', target: 3, title: 'Mix it up', description: 'Own 3 different kinds at the same time.', xp: 80 }],
    endless: true,
  };
}

export function ScenariosTab() {
  const scenarios = useLiveQuery(() => allScenarios(), []);
  const custom = useLiveQuery(() => db.customAssets.toArray(), []);
  const [edit, setEdit] = useState<Scenario | null>(null);
  if (!scenarios || !custom) return null;

  const save = async () => {
    if (!edit) return;
    if (!edit.name.trim()) return alert('Please give the scenario a name.');
    if (!edit.assets.length) return alert('Pick at least one asset.');
    await db.customScenarios.put({ ...edit, builtIn: false });
    setEdit(null);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Scenarios</h2>
          <p className="text-sm text-ink-600">A scenario sets the history that is replayed, the money, the available assets, story events, the goal and the challenges.</p>
        </div>
        <div className="flex gap-2">
          {WORLD_LIST.map((w) => <button key={w.id} className="btn btn-outline btn-md" onClick={() => setEdit(blank(w.id))}>＋ <Emoji e={w.emoji} /> New</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        {scenarios.map((s) => {
          const w = WORLDS[s.world];
          return (
            <div key={s.id} className="card card-pad">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: w.colors.soft }}><Emoji e={w.emoji} /></span>
                  <div>
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xs text-ink-500">{w.name} · made for ages {BRACKETS[s.bracket - 1].ages}</div>
                  </div>
                </div>
                {s.builtIn ? <span className="chip bg-amber-100 text-amber-800">★ Built-in</span> : <span className="chip bg-ink-100 text-ink-600">Custom</span>}
              </div>
              <p className="mt-3 text-sm text-ink-600">{s.description || 'No description.'}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <span className="chip bg-ink-50 text-ink-700">🕰️ {s.startYear === 'random' ? `random ${s.years} years` : `replays ${s.startYear} to ${s.startYear + s.years - 1}`}</span>
                <span className="chip bg-ink-50 text-ink-700">{s.endless !== false ? '♾️ continuous' : '🏁 ends'}</span>
                <span className="chip bg-ink-50 text-ink-700">{s.assets.length} assets</span>
                <span className="chip bg-ink-50 text-ink-700">{s.events.length} story events</span>
                <span className="chip bg-ink-50 text-ink-700">{s.challenges.length} challenges</span>
                <span className="chip bg-ink-50 text-ink-700"><Emoji e={s.goal.emoji} /> {s.goal.name}</span>
              </div>
              <div className="mt-4 flex gap-2">
                {s.builtIn ? (
                  <button className="btn btn-ghost btn-md" onClick={() => setEdit({ ...structuredClone(s), id: uid('sc'), name: `${s.name} (copy)`, builtIn: false })}>Duplicate &amp; edit</button>
                ) : (
                  <>
                    <button className="btn btn-ghost btn-md" onClick={() => setEdit(structuredClone(s))}>Edit</button>
                    <button className="btn btn-ghost btn-md" onClick={() => setEdit({ ...structuredClone(s), id: uid('sc'), name: `${s.name} (copy)` })}>Duplicate</button>
                    <button className="btn btn-danger btn-md" onClick={async () => { if (confirm('Delete this scenario? Children who use it keep their current round.')) await db.customScenarios.delete(s.id); }}>Delete</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} width="max-w-5xl">
        {edit && <ScenarioEditor s={edit} customAssets={custom} onChange={setEdit} onSave={save} onCancel={() => setEdit(null)} />}
      </Modal>
    </div>
  );
}

function HistoryPreview({ start, years }: { start: number; years: number }) {
  const data = useMemo(() => {
    let st = 100, bo = 100, ca = 100, cpi = 100;
    const out = [{ y: String(start), Stocks: st, Bonds: bo, Cash: ca, Prices: cpi }];
    for (let y = start; y < start + years; y++) {
      st *= 1 + annualReturn('stocks', y);
      bo *= 1 + annualReturn('tbond', y);
      ca *= 1 + annualReturn('tbill', y);
      cpi *= 1 + annualReturn('cpi', y);
      out.push({ y: String(y + 1), Stocks: Math.round(st), Bonds: Math.round(bo), Cash: Math.round(ca), Prices: Math.round(cpi) });
    }
    return out;
  }, [start, years]);
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid vertical={false} stroke="#eceef2" />
          <XAxis dataKey="y" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line dataKey="Stocks" stroke="#0c8599" dot={false} strokeWidth={2} isAnimationActive={false} />
          <Line dataKey="Bonds" stroke="#7048e8" dot={false} strokeWidth={2} isAnimationActive={false} />
          <Line dataKey="Cash" stroke="#868e96" dot={false} strokeWidth={2} isAnimationActive={false} />
          <Line dataKey="Prices" stroke="#f08c00" dot={false} strokeWidth={2} strokeDasharray="4 3" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScenarioEditor({ s, customAssets, onChange, onSave, onCancel }: { s: Scenario; customAssets: { id: string; name: string; emoji: string; realLabel: string }[]; onChange: (s: Scenario) => void; onSave: () => void; onCancel: () => void }) {
  const set = (p: Partial<Scenario>) => onChange({ ...s, ...p });
  const w = WORLDS[s.world];
  const pool = [...worldAssets(s.world), ...customAssets];
  const seasons = s.years * 4;
  const maxStart = LAST_YEAR - s.years + 1;
  const years: number[] = [];
  for (let y = FIRST_YEAR; y <= maxStart; y++) years.push(y);
  return (
    <div className="p-7">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold"><Emoji e={w.emoji} /> Scenario editor</h3>
        <span className="text-xs text-ink-500">Changes apply to new rounds only.</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <section className="space-y-4">
          <h4 className="font-bold">Basics</h4>
          <Field label="Name"><input className="input" value={s.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Description (parents see this)"><textarea className="input h-20" value={s.description} onChange={(e) => set({ description: e.target.value })} /></Field>
          <Field label="World">
            <Seg value={s.world} onChange={(wid) => onChange({ ...s, world: wid, assets: worldAssets(wid).map((a) => a.id) })} options={WORLD_LIST.map((x) => ({ v: x.id, label: <><Emoji e={x.emoji} /> {x.name}</> }))} />
          </Field>
          <Field label="Made for age group">
            <Seg value={s.bracket} onChange={(b) => set({ bracket: b })} options={BRACKETS.map((b) => ({ v: b.id, label: b.ages }))} />
          </Field>
          <h4 className="pt-2 font-bold">Money</h4>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start money"><Num value={s.startCash} onChange={(v) => set({ startCash: Math.max(0, v) })} /></Field>
            <Field label={`Income / ${w.seasonWord}`}><Num value={s.incomePerSeason} onChange={(v) => set({ incomePerSeason: Math.max(0, v) })} /></Field>
            <Field label="Fee per order"><Num value={s.tradeFee} step={0.5} onChange={(v) => set({ tradeFee: Math.max(0, v) })} /></Field>
          </div>
          <h4 className="pt-2 font-bold">Goal</h4>
          <div className="grid grid-cols-[80px_1fr_140px] gap-3">
            <Field label="Emoji"><input className="input text-center text-xl" value={s.goal.emoji} onChange={(e) => set({ goal: { ...s.goal, emoji: e.target.value } })} /></Field>
            <Field label="Name"><input className="input" value={s.goal.name} onChange={(e) => set({ goal: { ...s.goal, name: e.target.value } })} /></Field>
            <Field label="Price today"><Num value={s.goal.amount} onChange={(v) => set({ goal: { ...s.goal, amount: Math.max(1, v) } })} /></Field>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="font-bold">History replayed (hidden from children)</h4>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start year">
              <select className="input" value={String(s.startYear)} onChange={(e) => set({ startYear: e.target.value === 'random' ? 'random' : parseInt(e.target.value) })}>
                <option value="random">Random each round</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Length (years)"><Num value={s.years} min={3} max={40} onChange={(v) => set({ years: Math.max(3, Math.min(40, Math.round(v))), startYear: s.startYear === 'random' ? 'random' : Math.min(s.startYear, LAST_YEAR - Math.round(v) + 1) })} /></Field>
            <Field label="Random seed"><Num value={s.seed} onChange={(v) => set({ seed: Math.round(v) })} /></Field>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-ink-100 p-3 text-sm">
            <input type="checkbox" checked={s.endless !== false} onChange={(e) => set({ endless: e.target.checked })} />
            <span><b>Continuous play:</b> after the last year a new chapter starts automatically (history continues, wrapping to a random earlier year after 2025).</span>
          </label>
          {s.startYear !== 'random' ? (
            <div className="rounded-2xl border border-ink-100 p-3">
              <div className="mb-1 text-xs text-ink-500">Growth of 100 from {s.startYear} to {s.startYear + s.years} (annual data, before fees)</div>
              <HistoryPreview start={s.startYear} years={s.years} />
            </div>
          ) : (
            <div className="rounded-2xl bg-ink-50 p-4 text-sm text-ink-600">A random window between 1950 and {LAST_YEAR} is drawn for every new round. Story events tied to real history are best used with a fixed start year.</div>
          )}
          <h4 className="pt-2 font-bold">Assets available</h4>
          <div className="grid max-h-56 grid-cols-2 gap-2 overflow-auto">
            {pool.map((a) => {
              const on = s.assets.includes(a.id);
              return (
                <label key={a.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-sm ${on ? 'border-ink-900 bg-ink-50' : 'border-ink-100'}`}>
                  <input type="checkbox" checked={on} onChange={() => set({ assets: on ? s.assets.filter((x) => x !== a.id) : [...s.assets, a.id] })} />
                  <Emoji e={a.emoji} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{a.name}</span>
                    <span className="block truncate text-xs text-ink-500">{a.realLabel}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-bold">Story events</h4>
          <button className="btn btn-ghost btn-md" onClick={() => set({ events: [...s.events, { season: Math.min(seasons, 4), title: 'News', text: '' }] })}>＋ Add event</button>
        </div>
        <p className="mb-3 text-xs text-ink-500">Season 0 is shown as the welcome message. An optional shock changes prices on top of history (e.g. −20 for a storm that hits only one asset).</p>
        <div className="space-y-2">
          {s.events.map((ev, i) => (
            <div key={i} className="grid grid-cols-[80px_160px_1fr_90px_170px_40px] items-center gap-2">
              <Num value={ev.season} min={0} max={seasons} onChange={(v) => set({ events: s.events.map((x, j) => (j === i ? { ...x, season: Math.max(0, Math.min(seasons, Math.round(v))) } : x)) })} />
              <input className="input" placeholder="Title" value={ev.title} onChange={(e) => set({ events: s.events.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
              <input className="input" placeholder="What happens (shown to the child)" value={ev.text} onChange={(e) => set({ events: s.events.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              <Num value={Math.round((ev.shock ?? 0) * 100)} suffix="%" onChange={(v) => set({ events: s.events.map((x, j) => (j === i ? { ...x, shock: v ? v / 100 : undefined, target: x.target ?? 'all' } : x)) })} />
              <select className="input" value={ev.target ?? 'all'} onChange={(e) => set({ events: s.events.map((x, j) => (j === i ? { ...x, target: e.target.value } : x)) })}>
                <option value="all">All risky assets</option>
                {pool.filter((a) => s.assets.includes(a.id)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button className="btn btn-danger h-9 w-9 p-0" onClick={() => set({ events: s.events.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          {!s.events.length && <div className="rounded-xl bg-ink-50 p-3 text-sm text-ink-500">No events yet.</div>}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-bold">Challenges</h4>
          <button className="btn btn-ghost btn-md" onClick={() => set({ challenges: [...s.challenges, { id: uid('c'), type: 'own_kinds', target: 3, title: 'New challenge', description: '', xp: 80 }] })}>＋ Add challenge</button>
        </div>
        <div className="space-y-2">
          {s.challenges.map((c, i) => {
            const t = CHALLENGE_TYPES.find((x) => x.v === c.type)!;
            const upd = (p: Partial<typeof c>) => set({ challenges: s.challenges.map((x, j) => (j === i ? { ...x, ...p } : x)) });
            return (
              <div key={c.id} className="grid grid-cols-[220px_120px_180px_1fr_80px_40px] items-center gap-2">
                <select className="input" value={c.type} onChange={(e) => { const nt = CHALLENGE_TYPES.find((x) => x.v === e.target.value)!; upd({ type: nt.v, target: nt.def }); }}>
                  {CHALLENGE_TYPES.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
                </select>
                <div title={t.target}><Num value={c.target} step={c.target < 1 ? 0.01 : 1} onChange={(v) => upd({ target: v })} /></div>
                <input className="input" placeholder="Title" value={c.title} onChange={(e) => upd({ title: e.target.value })} />
                <input className="input" placeholder="Description for the child" value={c.description} onChange={(e) => upd({ description: e.target.value })} />
                <Num value={c.xp} suffix="XP" onChange={(v) => upd({ xp: Math.max(0, Math.round(v)) })} />
                <button className="btn btn-danger h-9 w-9 p-0" onClick={() => set({ challenges: s.challenges.filter((_, j) => j !== i) })}>×</button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-8 flex justify-end gap-2 border-t border-ink-100 pt-5">
        <button className="btn btn-ghost btn-md" onClick={onCancel}>Cancel</button>
        <button className="btn btn-dark btn-md" onClick={onSave}>Save scenario</button>
      </div>
    </div>
  );
}
