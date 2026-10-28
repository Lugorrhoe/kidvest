import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../../db/db';
import { Emoji } from '../../lib/ui';
import { buildTalkIcs, buildTalkSheet, downloadIcs, getTalk, mailtoLink, nextTalkDate, saveTalk, TALK_AGENDA, talkDue, type TalkSettings } from '../../lib/talk';
import { Field } from './fields';

export function TalkSection() {
  const profiles = useLiveQuery(() => db.profiles.toArray(), []);
  const [t, setT] = useState<TalkSettings | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  useEffect(() => { getTalk().then(setT); }, []);
  if (!t || !profiles) return null;
  const due = talkDue(t, profiles);
  const next = nextTalkDate(t);
  const names = profiles.map((p) => p.name);
  const url = location.href.split('#')[0];
  const update = async (patch: Partial<TalkSettings>) => { const n = { ...t, ...patch }; setT(n); await saveTalk(n); };
  const openSheet = async () => setSheet(await buildTalkSheet(profiles));
  return (
    <div className={`card card-pad ${due ? 'border-amber-300' : ''}`} style={due ? { background: 'linear-gradient(180deg,#fffbeb,#fff 70%)' } : undefined}>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold">💬 Monthly money talk</h3>
          <p className="mt-1 text-sm text-ink-600">
            The game is the "let do" part; the talk is where learning sticks. Once a month, 15 minutes, no judgement.
            {due ? <b className="text-amber-800"> A talk is due now.</b> : t.lastDoneAt ? ` Last talk: ${new Date(t.lastDoneAt).toLocaleDateString()}.` : ''}
          </p>
        </div>
        <button className="btn btn-dark btn-md shrink-0" onClick={() => update({ lastDoneAt: Date.now() })}>✓ We talked today</button>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1fr_1.4fr] gap-4">
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="label mb-2">Reminder schedule</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Day of month">
              <select className="input" value={t.day} onChange={(e) => update({ day: parseInt(e.target.value) })}>{Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}.</option>)}</select>
            </Field>
            <Field label="Time">
              <select className="input" value={t.hour} onChange={(e) => update({ hour: parseInt(e.target.value) })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select>
            </Field>
          </div>
          <Field label="Your e-mail (for the calendar's e-mail alert)" className="mt-2"><input className="input" type="email" placeholder="you@example.com" value={t.email ?? ''} onChange={(e) => update({ email: e.target.value || undefined })} /></Field>
          <div className="mt-2 text-xs text-ink-500">Next: {next.toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="label mb-2">Get reminded</div>
          <button className="btn btn-outline btn-md w-full" onClick={() => downloadIcs(buildTalkIcs(t, names, url))}>📅 Add monthly reminder to my calendar</button>
          <p className="mt-2 text-xs text-ink-500">Downloads a recurring event (Outlook, Google, Apple Calendar) with a pop-up one hour before and an e-mail alert one day before, where your calendar supports it.</p>
          <a className="btn btn-ghost btn-md mt-2 w-full" href={mailtoLink(`Kidvest money talk with ${names.join(' and ')}: ${next.toLocaleDateString()}`, `Reminder to myself: monthly Kidvest money talk on ${next.toLocaleString()}.\n\n${TALK_AGENDA.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nOpen Kidvest: ${url}`, t.email)}>✉️ E-mail me a reminder</a>
          <p className="mt-2 text-xs text-ink-500">Kidvest runs only in your browser and cannot send mail by itself; this opens a ready-made message in your mail app.</p>
        </div>
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="label mb-2">Talk sheet</div>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-ink-700">
            {TALK_AGENDA.map((a) => <li key={a}>{a}</li>)}
          </ol>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-outline btn-md" onClick={openSheet}>📄 Prepare talk sheet</button>
          </div>
        </div>
      </div>

      {sheet && (
        <div className="mt-4 rounded-2xl bg-ink-50 p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold">Talk sheet</div>
            <div className="flex gap-2">
              <a className="btn btn-ghost btn-md" href={mailtoLink('Kidvest talk sheet', sheet, t.email)}>✉️ E-mail it to me</a>
              <button className="btn btn-ghost btn-md" onClick={() => navigator.clipboard?.writeText(sheet)}>Copy</button>
              <button className="btn btn-ghost btn-md" onClick={() => setSheet(null)}>Close</button>
            </div>
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-ink-800">{sheet}</pre>
        </div>
      )}
      {!due && <div className="mt-3 text-xs text-ink-400"><Emoji e="💡" /> The banner at the top of the parent area turns amber when a month has passed since the last talk.</div>}
    </div>
  );
}

/** Small banner shown in the parent header and on the start page when a talk is due. */
export function TalkDueBanner({ compact = false }: { compact?: boolean }) {
  const profiles = useLiveQuery(() => db.profiles.toArray(), []);
  const [t, setT] = useState<TalkSettings | null>(null);
  useEffect(() => { getTalk().then(setT); }, []);
  if (!t || !profiles || !talkDue(t, profiles)) return null;
  if (compact) return <span className="chip bg-amber-200 text-amber-900">💬 Parents: monthly money talk is due</span>;
  return (
    <div className="mx-auto max-w-[1280px] px-8 pt-4">
      <div className="flex items-center justify-between rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
        <span><b>💬 Time for the monthly money talk.</b> Go through the prompts in Reports and mark it as done afterwards.</span>
      </div>
    </div>
  );
}
