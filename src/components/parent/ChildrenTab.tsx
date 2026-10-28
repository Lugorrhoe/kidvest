import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { allScenarios, createProfile, DAY, db, deleteProfile, fastForward, MODES, PACES, seedDemoFamily } from '../../db/db';
import { BRACKETS, WORLDS, WORLD_LIST } from '../../data/worlds';
import type { Bracket, Profile, Scenario, WorldId } from '../../engine/types';
import { Emoji, Modal } from '../../lib/ui';
import { AVATARS, Field, Seg } from './fields';

interface Draft { name: string; avatar: string; bracket: Bracket; world: WorldId; scenarioId: string; pace: number; mode: 'daily' | 'manual' | 'realtime'; unlockHour: number }

export function ChildrenTab() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray(), []);
  const scenarios = useLiveQuery(() => allScenarios(), []);
  const [edit, setEdit] = useState<{ id?: string; draft: Draft } | null>(null);
  if (!profiles || !scenarios) return null;

  const open = (p?: Profile) =>
    setEdit({
      id: p?.id,
      draft: p ? { name: p.name, avatar: p.avatar, bracket: p.bracket, world: p.world, scenarioId: p.scenarioId, pace: p.pace || DAY, mode: p.mode ?? (p.pace ? 'realtime' : 'manual'), unlockHour: p.unlockHour ?? 10 } : { name: '', avatar: AVATARS[profiles.length % AVATARS.length], bracket: 1, world: 'farm', scenarioId: 'farm-default', pace: DAY, mode: 'daily', unlockHour: 10 },
    });

  const save = async () => {
    if (!edit) return;
    const d = edit.draft;
    const sc = scenarios.find((s) => s.id === d.scenarioId);
    const world = sc?.world ?? d.world;
    if (!d.name.trim()) return alert('Please enter a name.');
    if (edit.id) {
      const old = profiles.find((p) => p.id === edit.id)!;
      const changed = old.scenarioId !== d.scenarioId || old.bracket !== d.bracket;
      if (changed && (await db.games.get(old.id)) && !confirm('Changing the age group or scenario starts a new round. The current round will be replaced. Continue?')) return;
      await db.profiles.put({ ...old, name: d.name.trim(), avatar: d.avatar, bracket: d.bracket, world, scenarioId: d.scenarioId, pace: d.mode === 'realtime' ? d.pace : 0, mode: d.mode, unlockHour: d.unlockHour });
      if (changed) await db.games.delete(old.id);
      else if (d.mode === 'realtime' && (old.pace ?? 0) !== d.pace) {
        const g = await db.games.get(old.id);
        if (g) await db.games.put({ ...g, lastTick: Date.now() });
      }
    } else {
      await createProfile({ name: d.name.trim(), avatar: d.avatar, bracket: d.bracket, world, scenarioId: d.scenarioId, pace: d.mode === 'realtime' ? d.pace : 0, mode: d.mode, unlockHour: d.unlockHour });
    }
    setEdit(null);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Children</h2>
          <p className="text-sm text-ink-600">Each child plays their own round in their own world. Age group controls how much real-world detail they see.</p>
        </div>
        <div className="flex gap-2">
          {profiles.length === 0 && <button className="btn btn-outline btn-md" onClick={() => seedDemoFamily()}>✨ Load demo family</button>}
          <button className="btn btn-dark btn-md" onClick={() => open()}>＋ Add child</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {profiles.map((p) => {
          const w = WORLDS[p.world];
          const sc = scenarios.find((s) => s.id === p.scenarioId);
          return (
            <div key={p.id} className="card card-pad">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ background: w.colors.soft }}><Emoji e={p.avatar} /></span>
                <div>
                  <div className="text-lg font-bold">{p.name}</div>
                  <div className="text-xs text-ink-500">Ages {BRACKETS[p.bracket - 1].ages} · {BRACKETS[p.bracket - 1].label}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <div><Emoji e={w.emoji} /> {w.name}</div>
                <div className="truncate text-ink-600">📜 {sc?.name ?? 'Unknown scenario'}</div>
                <div className="text-ink-600">⏱️ {(p.mode ?? 'manual') === 'daily' ? `One year a day, unlocks ${String(p.unlockHour ?? 10).padStart(2, '0')}:00` : (p.mode ?? 'manual') === 'realtime' ? `Real time · ${PACES.find((x) => x.v === p.pace)?.label ?? 'custom'}` : 'Free play'}</div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-50 p-2 text-xs">
                <span className="font-semibold text-ink-600">Move time forward:</span>
                <button className="btn btn-outline px-2 py-1 text-xs" onClick={() => fastForward(p.id, 1)}>+1 season</button>
                <button className="btn btn-outline px-2 py-1 text-xs" onClick={() => fastForward(p.id, 4)}>+1 year</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-ghost btn-md" onClick={() => open(p)}>Edit</button>
                <button className="btn btn-ghost btn-md" onClick={async () => { if (confirm(`Start a fresh round for ${p.name}?`)) await db.games.delete(p.id); }}>New round</button>
                <button className="btn btn-danger btn-md" onClick={async () => { if (confirm(`Delete ${p.name} and all progress?`)) await deleteProfile(p.id); }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} width="max-w-2xl">
        {edit && <ChildForm draft={edit.draft} scenarios={scenarios} isNew={!edit.id} onChange={(d) => setEdit({ ...edit, draft: d })} onSave={save} onCancel={() => setEdit(null)} />}
      </Modal>
    </div>
  );
}

function ChildForm({ draft, scenarios, isNew, onChange, onSave, onCancel }: { draft: Draft; scenarios: Scenario[]; isNew: boolean; onChange: (d: Draft) => void; onSave: () => void; onCancel: () => void }) {
  const set = (p: Partial<Draft>) => onChange({ ...draft, ...p });
  const worldScenarios = scenarios.filter((s) => s.world === draft.world);
  return (
    <div className="p-7">
      <h3 className="text-xl font-extrabold">{isNew ? 'Add a child' : 'Edit child'}</h3>
      <div className="mt-5 space-y-5">
        <Field label="Name"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="First name or nickname" autoFocus /></Field>
        <Field label="Avatar">
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => set({ avatar: a })} className={`flex h-11 w-11 items-center justify-center rounded-xl border text-2xl ${draft.avatar === a ? 'border-ink-900 bg-ink-50' : 'border-ink-100'}`}><Emoji e={a} /></button>
            ))}
          </div>
        </Field>
        <Field label="Age group" hint={BRACKETS[draft.bracket - 1].summary}>
          <Seg value={draft.bracket} onChange={(b) => set({ bracket: b, world: WORLD_LIST.find((w) => w.defaultBracket === b)!.id, scenarioId: WORLD_LIST.find((w) => w.defaultBracket === b)!.defaultScenarioId })} options={BRACKETS.map((b) => ({ v: b.id, label: `${b.ages} · ${b.label}` }))} />
        </Field>
        <Field label="World" hint="Each age group has a recommended world, but any child can play any world.">
          <div className="grid grid-cols-3 gap-3">
            {WORLD_LIST.map((w) => (
              <button key={w.id} type="button" onClick={() => set({ world: w.id, scenarioId: w.defaultScenarioId })} className={`rounded-2xl border-2 p-3 text-left ${draft.world === w.id ? 'border-ink-900' : 'border-ink-100'}`}>
                <Emoji e={w.emoji} className="text-2xl" />
                <div className="mt-1 text-sm font-bold">{w.name}</div>
                <div className="text-xs text-ink-500">Made for ages {w.ages}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Game rhythm" hint={MODES.find((x) => x.v === draft.mode)?.hint}>
          <Seg value={draft.mode} onChange={(v) => set({ mode: v })} options={MODES.map((x) => ({ v: x.v, label: x.label }))} />
        </Field>
        {draft.mode === 'daily' && (
          <Field label="Next year unlocks at" hint="A fixed time, e.g. after school, makes it a daily ritual. One farm year = one real day.">
            <select className="input w-40" value={draft.unlockHour} onChange={(e) => set({ unlockHour: parseInt(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </Field>
        )}
        {draft.mode === 'realtime' && (
          <Field label="Season length" hint={PACES.find((x) => x.v === draft.pace)?.hint}>
            <Seg value={draft.pace} onChange={(v) => set({ pace: v })} options={PACES.map((x) => ({ v: x.v, label: x.label }))} />
          </Field>
        )}
        <Field label="Scenario" hint="Create your own scenarios in the Scenarios tab.">
          <select className="input" value={draft.scenarioId} onChange={(e) => set({ scenarioId: e.target.value })}>
            {worldScenarios.map((s) => <option key={s.id} value={s.id}>{s.builtIn ? '★ ' : ''}{s.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-7 flex justify-end gap-2">
        <button className="btn btn-ghost btn-md" onClick={onCancel}>Cancel</button>
        <button className="btn btn-dark btn-md" onClick={onSave}>Save</button>
      </div>
    </div>
  );
}
