import { db, getSetting, setSetting } from '../db/db';
import type { Game, Profile } from '../engine/types';

export interface TalkSettings {
  /** Day of month 1 to 28. */
  day: number;
  /** Hour 0 to 23. */
  hour: number;
  lastDoneAt?: number;
  email?: string;
}

const KEY = 'talk';
export const DEFAULT_TALK: TalkSettings = { day: 1, hour: 18 };

export const getTalk = () => getSetting<TalkSettings>(KEY, DEFAULT_TALK);
export const saveTalk = (t: TalkSettings) => setSetting(KEY, t);

/** Next scheduled talk date after `from`. */
export function nextTalkDate(t: TalkSettings, from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), t.day, t.hour, 0, 0, 0);
  if (d.getTime() <= from.getTime()) d.setMonth(d.getMonth() + 1);
  return d;
}

/** A talk is due when the last one is more than ~a month ago (or never happened and the family is older than a month). */
export function talkDue(t: TalkSettings, profiles: Profile[], now = Date.now()): boolean {
  if (!profiles.length) return false;
  const anchor = t.lastDoneAt ?? Math.min(...profiles.map((p) => p.createdAt));
  return now - anchor >= 30 * 86_400_000;
}

function icsDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export const TALK_AGENDA = [
  'Look at the world and the chart together (5 min).',
  'Ask: What was the scariest moment this month? What are you proud of?',
  'Go through the conversation prompts in Parent area → Reports.',
  'Ask: What would you do differently next month?',
  'Agree on one small thing to try. Praise patience, not results.',
];

/** Build a recurring monthly calendar event with a reminder. Works in Outlook, Google Calendar, Apple Calendar. */
export function buildTalkIcs(t: TalkSettings, names: string[], appUrl: string): string {
  const start = nextTalkDate(t);
  const end = new Date(start.getTime() + 30 * 60_000);
  const who = names.length ? ` with ${names.join(', ')}` : '';
  const desc = [`Monthly Kidvest money talk${who}.`, '', 'Suggested 15 minutes:', ...TALK_AGENDA.map((a, i) => `${i + 1}. ${a}`), '', `Open Kidvest: ${appUrl}`, 'Then mark the talk as done in Parent area → Reports.'].join('\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kidvest//Money talk reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:kidvest-money-talk-${t.day}-${t.hour}@kidvest`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `RRULE:FREQ=MONTHLY;BYMONTHDAY=${t.day}`,
    `SUMMARY:${esc(`💬 Kidvest money talk${who}`)}`,
    `DESCRIPTION:${esc(desc)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Kidvest money talk today',
    'TRIGGER:-PT1H',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:EMAIL',
    `DESCRIPTION:${esc(`Time for the monthly Kidvest money talk${who}.`)}`,
    `SUMMARY:${esc('Kidvest money talk')}`,
    ...(t.email ? [`ATTENDEE:mailto:${t.email}`] : []),
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(ics: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kidvest-money-talk.ics';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Plain-text talk sheet: prompts since the last talk, per child. */
export async function buildTalkSheet(profiles: Profile[]): Promise<string> {
  const games = await db.games.toArray();
  const lines: string[] = ['Kidvest money talk sheet', `Prepared ${new Date().toLocaleDateString()}`, ''];
  for (const p of profiles) {
    const g = games.find((x) => x.profileId === p.id) as Game | undefined;
    lines.push(`== ${p.name} ==`);
    if (!g) { lines.push('No round yet.', ''); continue; }
    const prompts = g.talk.slice(-6);
    if (!prompts.length) lines.push('No conversation prompts yet.');
    for (const t of prompts) lines.push(`- ${t.title}: ${t.question}`);
    lines.push('');
  }
  lines.push('Suggested flow:', ...TALK_AGENDA.map((a, i) => `${i + 1}. ${a}`));
  return lines.join('\n');
}

export function mailtoLink(subject: string, body: string, to = ''): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
