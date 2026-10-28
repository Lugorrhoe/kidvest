import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../../db/db';
import { annualReturn, FIRST_YEAR, LAST_YEAR, SERIES_KEYS, SERIES_LABEL, type SeriesKey } from '../../data/history';
import { WORLD_LIST, worldAssets } from '../../data/worlds';
import { typicalSwing } from '../../engine/market';
import { uid } from '../../engine/rng';
import type { AssetDef, WorldId } from '../../engine/types';
import { cx, Emoji, Modal } from '../../lib/ui';
import { Field, Num, Seg } from './fields';

const pctS = (v: number, d = 1) => `${(v * 100).toFixed(d)} %`;

function longRunReturn(a: AssetDef): number {
  if (a.model.kind === 'custom') return a.model.annualReturn;
  let g = 1;
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) g *= 1 + annualReturn(a.model.series, y) * (a.model.leverage ?? 1);
  return g ** (1 / (LAST_YEAR - FIRST_YEAR + 1)) - 1;
}

function blankAsset(): AssetDef {
  return {
    id: uid('custom'), custom: true, name: 'New asset', emoji: '🐑',
    tagline: 'A short sentence for the child.', description: 'Explain in two or three sentences what this is and what can happen.',
    realLabel: 'Custom', model: { kind: 'series', series: 'stocks' }, payoutYield: 0, fee: 0.002, risk: 3, basePrice: 20,
  };
}

export function AssetsTab() {
  const custom = useLiveQuery(() => db.customAssets.toArray(), []);
  const [world, setWorld] = useState<WorldId>('farm');
  const [edit, setEdit] = useState<AssetDef | null>(null);
  if (!custom) return null;
  const builtIns = worldAssets(world);
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Assets</h2>
          <p className="text-sm text-ink-600">Every asset is a child-friendly mask over a real return series. Built-in assets are fixed; you can create your own and add them to a custom scenario.</p>
        </div>
        <button className="btn btn-dark btn-md" onClick={() => setEdit(blankAsset())}>＋ Create asset</button>
      </div>

      <div className="card card-pad">
        <div className="mb-4 flex gap-2">
          {WORLD_LIST.map((w) => (
            <button key={w.id} className={cx('btn btn-md', world === w.id ? 'btn-dark' : 'btn-ghost')} onClick={() => setWorld(w.id)}><Emoji e={w.emoji} /> {w.name}</button>
          ))}
        </div>
        <AssetTable assets={builtIns} />
      </div>

      <div className="card card-pad mt-6">
        <h3 className="mb-3 font-bold">Your custom assets</h3>
        {custom.length === 0 ? (
          <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-500">None yet. Example idea: a "Sheep" for the farm that follows gold, or a "Lucky Llama" with a custom return of 4 % and a swing of 30 %.</div>
        ) : (
          <AssetTable assets={custom} onEdit={setEdit} onDelete={async (a) => { if (confirm(`Delete ${a.name}? Scenarios that use it will skip it in new rounds.`)) await db.customAssets.delete(a.id); }} />
        )}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} width="max-w-3xl">
        {edit && <AssetEditor a={edit} onChange={setEdit} onCancel={() => setEdit(null)} onSave={async () => { await db.customAssets.put(edit); setEdit(null); }} />}
      </Modal>
    </div>
  );
}

function AssetTable({ assets, onEdit, onDelete }: { assets: AssetDef[]; onEdit?: (a: AssetDef) => void; onDelete?: (a: AssetDef) => void }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-ink-500">
          <th className="pb-2 font-semibold">Asset</th>
          <th className="pb-2 font-semibold">Real background</th>
          <th className="pb-2 text-right font-semibold">Long-run return</th>
          <th className="pb-2 text-right font-semibold">Yearly swing</th>
          <th className="pb-2 text-right font-semibold">Payout</th>
          <th className="pb-2 text-right font-semibold">Fee</th>
          <th className="pb-2 text-right font-semibold">Risk</th>
          {onEdit && <th />}
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-100">
        {assets.map((a) => (
          <tr key={a.id}>
            <td className="py-2.5"><div className="flex items-center gap-2"><Emoji e={a.emoji} className="text-xl" /><span className="font-semibold">{a.name}</span></div></td>
            <td className="py-2.5 text-ink-600">
              <div>{a.realLabel}</div>
              <div className="text-xs text-ink-400">{a.model.kind === 'series' ? `${SERIES_LABEL[a.model.series]}${a.model.leverage && a.model.leverage !== 1 ? ` × ${a.model.leverage}` : ''}` : 'Custom random model'}</div>
            </td>
            <td className="num py-2.5 text-right">{pctS(longRunReturn(a))}</td>
            <td className="num py-2.5 text-right">±{pctS(typicalSwing(a), 0)}</td>
            <td className="num py-2.5 text-right">{a.payoutYield ? pctS(a.payoutYield) : '–'}</td>
            <td className="num py-2.5 text-right">{pctS(a.fee, 2)}</td>
            <td className="num py-2.5 text-right">{a.risk}/5</td>
            {onEdit && (
              <td className="py-2.5 text-right">
                <button className="btn btn-ghost btn-md" onClick={() => onEdit(a)}>Edit</button>{' '}
                <button className="btn btn-danger btn-md" onClick={() => onDelete?.(a)}>Delete</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AssetEditor({ a, onChange, onSave, onCancel }: { a: AssetDef; onChange: (a: AssetDef) => void; onSave: () => void; onCancel: () => void }) {
  const set = (p: Partial<AssetDef>) => onChange({ ...a, ...p });
  return (
    <div className="p-7">
      <h3 className="text-xl font-extrabold">Custom asset</h3>
      <div className="mt-5 grid grid-cols-[90px_1fr_1fr] gap-3">
        <Field label="Emoji"><input className="input text-center text-2xl" value={a.emoji} onChange={(e) => set({ emoji: e.target.value })} /></Field>
        <Field label="Name"><input className="input" value={a.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Real label (ages 12+ and parents)"><input className="input" value={a.realLabel} onChange={(e) => set({ realLabel: e.target.value })} /></Field>
      </div>
      <div className="mt-3 space-y-3">
        <Field label="Tagline (one line for the child)"><input className="input" value={a.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
        <Field label="Description"><textarea className="input h-20" value={a.description} onChange={(e) => set({ description: e.target.value })} /></Field>
      </div>
      <div className="mt-5 rounded-2xl border border-ink-100 p-4">
        <Field label="How does the price move?">
          <Seg value={a.model.kind} onChange={(k) => set({ model: k === 'series' ? { kind: 'series', series: 'stocks' } : { kind: 'custom', annualReturn: 0.05, volatility: 0.2 } })} options={[{ v: 'series', label: 'Follow real history' }, { v: 'custom', label: 'Custom random model' }]} />
        </Field>
        {a.model.kind === 'series' ? (
          <div className="mt-3 grid grid-cols-[1fr_160px] gap-3">
            <Field label="Real series">
              <select className="input" value={a.model.series} onChange={(e) => set({ model: { kind: 'series', series: e.target.value as SeriesKey, leverage: a.model.kind === 'series' ? a.model.leverage : 1 } })}>
                {SERIES_KEYS.filter((k) => k !== 'cpi').map((k) => <option key={k} value={k}>{SERIES_LABEL[k]}</option>)}
              </select>
            </Field>
            <Field label="Multiplier" hint="2 = moves twice as strongly">
              <Num value={a.model.leverage ?? 1} step={0.1} min={0.2} max={3} onChange={(v) => a.model.kind === 'series' && set({ model: { ...a.model, leverage: Math.max(0.2, Math.min(3, v)) } })} />
            </Field>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Expected return per year"><Num value={Math.round(a.model.annualReturn * 1000) / 10} step={0.5} suffix="%" onChange={(v) => a.model.kind === 'custom' && set({ model: { ...a.model, annualReturn: v / 100 } })} /></Field>
            <Field label="Yearly swing (volatility)"><Num value={Math.round(a.model.volatility * 100)} suffix="%" onChange={(v) => a.model.kind === 'custom' && set({ model: { ...a.model, volatility: Math.max(0, v) / 100 } })} /></Field>
          </div>
        )}
        <div className="mt-3 text-xs text-ink-500">Long-run return ≈ {pctS(longRunReturn(a))} per year, typical yearly swing ±{pctS(typicalSwing(a), 0)}.</div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-3">
        <Field label="Payout / year"><Num value={Math.round(a.payoutYield * 1000) / 10} step={0.5} suffix="%" onChange={(v) => set({ payoutYield: Math.max(0, v) / 100 })} /></Field>
        <Field label="Payout word"><input className="input" placeholder="wool" value={a.payoutWord ?? ''} onChange={(e) => set({ payoutWord: e.target.value || undefined })} /></Field>
        <Field label="Fee / year"><Num value={Math.round(a.fee * 10000) / 100} step={0.1} suffix="%" onChange={(v) => set({ fee: Math.max(0, v) / 100 })} /></Field>
        <Field label="Risk (1 to 5)"><Num value={a.risk} min={1} max={5} onChange={(v) => set({ risk: Math.max(1, Math.min(5, Math.round(v))) as AssetDef['risk'] })} /></Field>
        <Field label="Start price"><Num value={a.basePrice} onChange={(v) => set({ basePrice: Math.max(0.5, v) })} /></Field>
      </div>
      <div className="mt-7 flex justify-end gap-2">
        <button className="btn btn-ghost btn-md" onClick={onCancel}>Cancel</button>
        <button className="btn btn-dark btn-md" onClick={onSave}>Save asset</button>
      </div>
    </div>
  );
}
