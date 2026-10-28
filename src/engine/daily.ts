import type { Game, Profile } from './types';

export type Mode = 'daily' | 'manual' | 'realtime';

export function modeOf(p: Pick<Profile, 'mode' | 'pace'>): Mode {
  if (p.mode) return p.mode;
  return p.pace && p.pace > 0 ? 'realtime' : 'manual';
}

export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DailyState {
  /** Seasons the child may still play right now. */
  seasonsLeft: number;
  /** Seasons already played in the current year (0 to 3). */
  inYear: number;
  /** True when the year is finished and the next one has not unlocked yet. */
  locked: boolean;
  /** When the next year unlocks (ms since epoch), if locked. */
  unlockAt?: number;
  /** True when a fresh year is available and its forecast has not been shown. */
  newYear: boolean;
  yearIndex: number;
}

/** Work out what the child may do today in daily mode. */
export function dailyState(g: Game, p: Pick<Profile, 'mode' | 'pace' | 'unlockHour'>, now = new Date()): DailyState {
  const inYear = g.season % 4;
  const yearIndex = Math.floor(g.season / 4);
  if (modeOf(p) !== 'daily') return { seasonsLeft: Infinity, inYear, locked: false, newYear: false, yearIndex };
  const hour = p.unlockHour ?? 10;
  if (inYear > 0) return { seasonsLeft: 4 - inYear, inYear, locked: false, newYear: false, yearIndex };
  // at a year boundary: locked if the previous year was completed today, or completed yesterday but the unlock hour has not come yet
  const today = dayKey(now);
  const last = g.lastYearDay;
  let locked = false;
  let unlockAt: number | undefined;
  if (last) {
    const lastDate = new Date(`${last}T00:00:00`);
    const unlock = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1, hour, 0, 0, 0);
    if (last === today || now.getTime() < unlock.getTime()) {
      locked = true;
      unlockAt = unlock.getTime();
    }
  }
  return { seasonsLeft: locked ? 0 : 4, inYear: 0, locked, unlockAt, newYear: !locked && g.forecastSeen !== yearIndex, yearIndex };
}

export function fmtUnlock(ts: number, now = new Date()): string {
  const d = new Date(ts);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const dayDiff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  return `${dayDiff <= 0 ? 'today' : dayDiff === 1 ? 'tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long' })} at ${time}`;
}
