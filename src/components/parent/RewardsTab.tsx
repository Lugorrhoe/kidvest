import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { REWARD_SUGGESTIONS, type RewardSuggestion } from '../../data/rewardSuggestions';
import { BRACKETS, WORLDS } from '../../data/worlds';
import { db, loadOrCreateGame, PACES } from '../../db/db';
import { money } from '../../engine/format';
import { contextFor, marketFor } from '../../engine/game';
import type { Market } from '../../engine/market';
import { COND_TYPES, describeCondition, DURATIONS, makeBaseline, REWARD_KINDS, rewardProgress, SUSTAINED, type Reward, type RewardCondType, type RewardKind } from '../../engine/rewards';
import { uid } from '../../engine/rng';
import type { Game, Profile } from '../../engine/types';
import { cx, Emoji, Modal, Progress } from '../../lib/ui';
import { fmtDuration } from '../PlayParts';
import { Field, Num, Seg } from './fields';

interface Draft {
  title: string;
  emoji: string;
  kind: RewardKind;
  note: string;
  type: RewardCondType;
  target: number;
  seasons: number;
  timing: 'untimed' | 'duration' | 'date';
  durationMs: number;
  date: string;
}

const STATUS_STYLE: Record<Reward['status'], string> = {
  active: 'bg-sky-100 text-sky-800',
  achieved: 'bg-amber-100 text-amber-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-ink-100 text-ink-600',
  cancelled: 'bg-ink-100 text-ink-500',
};

export function RewardsTab() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray(), []);
  const rewards = useLiveQuery(() => db.rewards.toArray(), []);
  const [sel, setSel] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const current = profiles?.find((p) => p.id === sel) ?? profiles?.[0];
  useEffect(() => {
    if (!current) return;
    let alive = true;
    loadOrCreateGame(current).then((g) => alive && setGame(g ?? null));
    return () => { alive = false; };
  }, [current?.id, rewards]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!profiles || !rewards) return null;
  if (!profiles.length) return <div className="card card-pad text-sm text-ink-500">Add a child first.</div>;
  const p = current!;
  const market = game ? marketFor(game) : null;
  const mine = rewards.filter((r) => r.profileId === p.id).sort((a, b) => b.createdAt - a.createdAt);
  const ctx = contextFor(p);
  const fmt = (v: number) => money(v, ctx.world, p.bracket, { ceil: p.bracket === 1 });

  const fresh = (s?: RewardSuggestion): Draft => ({
    title: s?.title ?? '',
    emoji: s?.emoji ?? '🎁',
    kind: s?.kind ?? 'gift',
    note: '',
    type: s?.condition.type ?? 'no_panic',
    target: s?.condition.target ?? 1,
    seasons: s?.condition.seasons ?? (s && SUSTAINED.includes(s.condition.type) ? 0 : 8),
    timing: s ? (s.days ? 'duration' : 'untimed') : 'duration',
    durationMs: s?.days ? s.days * 86_400_000 : DURATIONS[1].ms,
    date: '',
  });

  const save = async () => {
    if (!draft || !game || !market) return;
    if (!draft.title.trim()) return alert('Give the reward a name.');
    const sustained = SUSTAINED.includes(draft.type);
    let deadline: number | undefined;
    if (draft.timing === 'duration') deadline = Date.now() + draft.durationMs;
    if (draft.timing === 'date') {
      const t = new Date(draft.date).getTime();
      if (!(t > Date.now())) return alert('Pick a date in the future.');
      deadline = t;
    }
    if (sustained && !deadline && !(draft.seasons > 0)) return alert('A "keep it up" condition needs either a number of seasons or a deadline.');
    const r: Reward = {
      id: uid('rw'),
      profileId: p.id,
      title: draft.title.trim(),
      emoji: draft.emoji || '🎁',
      kind: draft.kind,
      note: draft.note.trim() || undefined,
      condition: { type: draft.type, target: draft.target, seasons: sustained && draft.seasons > 0 ? Math.round(draft.seasons) : undefined },
      createdAt: Date.now(),
      deadline,
      baseline: makeBaseline(game, market),
      status: 'active',
    };
    await db.rewards.put(r);
    setDraft(null);
  };

  const setStatus = (r: Reward, status: Reward['status']) => db.rewards.put({ ...r, status, deliveredAt: status === 'delivered' ? Date.now() : r.deliveredAt });
  const offerAgain = (r: Reward) => {
    if (!game || !market) return;
    const d = fresh();
    setDraft({ ...d, title: r.title, emoji: r.emoji, kind: r.kind, note: r.note ?? '', type: r.condition.type, target: r.condition.target, seasons: r.condition.seasons ?? 0, timing: r.deadline ? 'duration' : 'untimed', durationMs: r.deadline ? Math.max(DURATIONS[0].ms, r.deadline - r.createdAt) : DURATIONS[1].ms });
  };

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-extrabold">Real-life rewards</h2>
          <p className="text-sm text-ink-600">Promise something real for something the child does in the game. Kidvest tracks the condition and tells both of you when it is earned. You hand it over.</p>
        </div>
        <button className="btn btn-dark btn-md shrink-0" disabled={!game} onClick={() => setDraft(fresh())}>＋ New reward for {p.name}</button>
      </div>

      <div className="mb-5 flex gap-2">
        {profiles.map((x) => (
          <button key={x.id} className={cx('btn btn-md', p.id === x.id ? 'btn-dark' : 'btn-ghost')} onClick={() => setSel(x.id)}><Emoji e={x.avatar} /> {x.name}</button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6">
        <div className="space-y-3">
          {mine.length === 0 && (
            <div className="card card-pad text-sm text-ink-500">No rewards for {p.name} yet. Start from a suggestion on the right or create your own.</div>
          )}
          {mine.map((r) => {
            const prog = game && market && r.status === 'active' ? rewardProgress(r, game, market) : r.status === 'achieved' || r.status === 'delivered' ? 1 : 0;
            const left = r.deadline ? r.deadline - Date.now() : null;
            return (
              <div key={r.id} className="card card-pad">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-3xl"><Emoji e={r.emoji} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{r.title}</span>
                      <span className={cx('chip', STATUS_STYLE[r.status])}>{r.status === 'achieved' ? 'earned, hand it over' : r.status}</span>
                      <span className="chip bg-ink-100 text-ink-600">{REWARD_KINDS.find((k) => k.v === r.kind)?.label}</span>
                    </div>
                    <div className="mt-1 text-sm text-ink-700">{describeCondition(r, p.bracket, ctx.world.seasonWord, fmt)}</div>
                    <div className="mt-1 text-xs text-ink-500">
                      {r.deadline ? `Deadline ${new Date(r.deadline).toLocaleDateString()}${r.status === 'active' && left !== null ? ` (${left > 0 ? fmtDuration(left) + ' left' : 'today'})` : ''}` : 'No time limit'} · set on {new Date(r.createdAt).toLocaleDateString()}
                      {r.note && <> · note: {r.note}</>}
                    </div>
                    {r.status === 'active' && <Progress value={prog} className="mt-2 h-1.5" color="#f59f00" />}
                    {r.violated && r.status === 'active' && <div className="mt-1 text-xs text-red-600">Condition broken (sold during a storm or dropped below the share). It will count as not achieved.</div>}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {r.status === 'achieved' && <button className="btn btn-dark btn-md" onClick={() => setStatus(r, 'delivered')}>✓ Handed over</button>}
                    {r.status === 'active' && <button className="btn btn-ghost btn-md" onClick={() => { if (confirm('Cancel this reward?')) void setStatus(r, 'cancelled'); }}>Cancel</button>}
                    {(r.status === 'expired' || r.status === 'cancelled') && <button className="btn btn-outline btn-md" onClick={() => offerAgain(r)}>Offer again</button>}
                    {r.status !== 'active' && <button className="btn btn-danger btn-md" onClick={() => { if (confirm('Delete this reward from the list?')) void db.rewards.delete(r.id); }}>Delete</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="card card-pad">
            <h3 className="font-bold">Suggestions for ages {BRACKETS[p.bracket - 1].ages}</h3>
            <p className="mt-1 text-xs text-ink-500">Click one to prefill the form, then adjust.</p>
            <div className="mt-3 space-y-2">
              {REWARD_SUGGESTIONS[p.bracket].map((s) => (
                <button key={s.title} className="flex w-full items-start gap-3 rounded-xl border border-ink-100 p-2.5 text-left transition hover:border-ink-400" onClick={() => setDraft(fresh(s))}>
                  <Emoji e={s.emoji} className="text-2xl" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{s.title}</span>
                    <span className="block text-xs text-ink-600">{COND_TYPES.find((c) => c.v === s.condition.type)?.label}{s.condition.seasons ? ` for ${s.condition.seasons} seasons` : ''} · {s.days ? `${s.days >= 180 ? '6 months' : s.days >= 90 ? '3 months' : s.days >= 60 ? '2 months' : s.days >= 30 ? '1 month' : `${s.days} days`}` : 'untimed'}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="card card-pad text-sm text-ink-700">
            <h3 className="font-bold">What works, according to research</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
              <li><b>Reward behaviour, not luck.</b> Patience, diversification and saving are in the child's hands; returns are mostly the market's doing. Outcome rewards (growth, value) are fine for older children with long deadlines, and are a good moment to talk about luck versus skill.</li>
              <li><b>Small and soon beats big and far</b> for younger children. Two weeks to a month, untimed for the youngest.</li>
              <li><b>Prefer experiences and privileges to cash</b> for the small ones: money rewards for investing can make it feel like gambling. Matched savings (you add a share when they buy a goal item) mirrors how real bonuses work.</li>
              <li><b>Keep it predictable.</b> One or two active rewards at a time, and always hand over what was earned.</li>
              <li><b>A missed deadline is a conversation</b>, not a punishment. The child can see expired rewards for two weeks, with a gentle note; use "Offer again".</li>
            </ul>
          </div>
        </aside>
      </div>

      <Modal open={!!draft} onClose={() => setDraft(null)} width="max-w-2xl">
        {draft && game && market && <RewardForm draft={draft} p={p} game={game} market={market} onChange={setDraft} onSave={save} onCancel={() => setDraft(null)} />}
      </Modal>
    </div>
  );
}

function RewardForm({ draft, p, game, market, onChange, onSave, onCancel }: { draft: Draft; p: Profile; game: Game; market: Market; onChange: (d: Draft) => void; onSave: () => void; onCancel: () => void }) {
  const set = (x: Partial<Draft>) => onChange({ ...draft, ...x });
  const ct = COND_TYPES.find((c) => c.v === draft.type)!;
  const sustained = SUSTAINED.includes(draft.type);
  const ctx = contextFor(p);
  const world = WORLDS[p.world];
  const fmt = (v: number) => money(v, world, p.bracket, { ceil: p.bracket === 1 });
  const mode = p.mode ?? (p.pace ? 'realtime' : 'manual');
  const pace = mode === 'daily' ? 86_400_000 / 4 : mode === 'realtime' ? (p.pace ?? 0) : 0;
  const preview: Reward = {
    id: 'preview', profileId: p.id, title: draft.title, emoji: draft.emoji, kind: draft.kind,
    condition: { type: draft.type, target: draft.target, seasons: sustained && draft.seasons > 0 ? Math.round(draft.seasons) : undefined },
    createdAt: Date.now(), deadline: draft.timing === 'untimed' ? undefined : Date.now() + 1, baseline: makeBaseline(game, market), status: 'active',
  };
  const seasonsReal = pace && sustained && draft.seasons > 0 ? `${Math.round(draft.seasons)} ${world.seasonWord}s ≈ ${mode === 'daily' ? `${Math.ceil(draft.seasons / 4)} play days (one year a day)` : `${fmtDuration(draft.seasons * pace)} (${PACES.find((x) => x.v === pace)?.label})`}` : pace === 0 && sustained ? 'Free play: seasons pass only when the child presses "Next".' : '';
  void ctx;
  return (
    <div className="p-7">
      <h3 className="text-xl font-extrabold">Reward for {p.name}</h3>
      <div className="mt-5 grid grid-cols-[80px_1fr_200px] gap-3">
        <Field label="Emoji"><input className="input text-center text-2xl" value={draft.emoji} onChange={(e) => set({ emoji: e.target.value })} /></Field>
        <Field label="What the child gets"><input className="input" placeholder="e.g. Trip to the zoo" value={draft.title} onChange={(e) => set({ title: e.target.value })} autoFocus /></Field>
        <Field label="Kind">
          <select className="input" value={draft.kind} onChange={(e) => set({ kind: e.target.value as RewardKind })}>
            {REWARD_KINDS.map((k) => <option key={k.v} value={k.v}>{k.emoji} {k.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Note shown when earned (optional)" className="mt-3"><input className="input" placeholder="e.g. We go on the first Saturday after you earn it." value={draft.note} onChange={(e) => set({ note: e.target.value })} /></Field>

      <div className="mt-5 rounded-2xl border border-ink-100 p-4">
        <div className="label mb-2">What the child has to do in the game</div>
        <select className="input" value={draft.type} onChange={(e) => { const t = COND_TYPES.find((c) => c.v === e.target.value)!; set({ type: t.v, target: t.def, seasons: t.sustained ? 8 : 0 }); }}>
          {COND_TYPES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
        </select>
        <p className="mt-2 text-xs text-ink-500">{ct.about}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {draft.type !== 'no_panic' && <Field label={ct.targetLabel}><Num value={draft.target} step={draft.target < 1 ? 0.05 : 1} onChange={(v) => set({ target: v })} /></Field>}
          {sustained && <Field label={`Keep it up for how many ${world.seasonWord}s? (0 = until the deadline)`} hint={seasonsReal}><Num value={draft.seasons} min={0} onChange={(v) => set({ seasons: Math.max(0, v) })} /></Field>}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 p-4">
        <div className="label mb-2">Time limit (real time)</div>
        <Seg value={draft.timing} onChange={(t) => set({ timing: t })} options={[{ v: 'untimed', label: 'No limit' }, { v: 'duration', label: 'Within…' }, { v: 'date', label: 'By a date' }]} />
        {draft.timing === 'duration' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {DURATIONS.map((d) => <button key={d.ms} type="button" className={cx('rounded-xl border px-3 py-1.5 text-sm font-semibold', draft.durationMs === d.ms ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200')} onClick={() => set({ durationMs: d.ms })}>{d.label}</button>)}
          </div>
        )}
        {draft.timing === 'date' && <input type="date" className="input mt-3 w-56" value={draft.date} onChange={(e) => set({ date: e.target.value })} />}
        <p className="mt-2 text-xs text-ink-500">
          {draft.timing === 'untimed' ? 'Recommended for the youngest: no pressure, the reward waits until it is earned.' : 'A deadline adds urgency. Keep it short for small rewards and long (3 to 6 months) for big ones or outcome goals.'}
        </p>
      </div>

      <div className="mt-5 rounded-2xl p-4 text-sm" style={{ background: world.colors.soft }}>
        <div className="text-xs font-semibold text-ink-500">The child will see</div>
        <div className="mt-1 flex items-center gap-3">
          <Emoji e={draft.emoji || '🎁'} className="text-3xl" />
          <div>
            <div className="font-bold">{draft.title || 'Reward'}</div>
            <div className="text-ink-700">{describeCondition(preview, p.bracket, world.seasonWord, fmt)}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button className="btn btn-ghost btn-md" onClick={onCancel}>Cancel</button>
        <button className="btn btn-dark btn-md" onClick={onSave}>Create reward</button>
      </div>
    </div>
  );
}
