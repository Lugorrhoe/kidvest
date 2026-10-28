import Dexie, { type Table } from 'dexie';
import { DEFAULT_SCENARIOS } from '../data/scenarios';
import { WORLDS } from '../data/worlds';
import { resolveAssets } from '../engine/assets';
import { advance, buy, contextFor, marketFor, newGame, normalizeGame } from '../engine/game';
import { uid } from '../engine/rng';
import type { AssetDef, Bracket, Game, Profile, Scenario, WorldId } from '../engine/types';
import { evaluateRewards, type Reward } from '../engine/rewards';

interface Setting { key: string; value: unknown }

class KidvestDB extends Dexie {
  settings!: Table<Setting, string>;
  profiles!: Table<Profile, string>;
  games!: Table<Game, string>;
  customAssets!: Table<AssetDef, string>;
  customScenarios!: Table<Scenario, string>;
  rewards!: Table<Reward, string>;
  constructor() {
    super('kidvest');
    this.version(1).stores({
      settings: 'key',
      profiles: 'id, createdAt',
      games: 'profileId',
      customAssets: 'id',
      customScenarios: 'id',
    });
    this.version(2).stores({
      settings: 'key',
      profiles: 'id, createdAt',
      games: 'profileId',
      customAssets: 'id',
      customScenarios: 'id',
      rewards: 'id, profileId, status',
    });
  }
}

export const db = new KidvestDB();

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const s = await db.settings.get(key);
  return (s?.value as T) ?? fallback;
}
export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}

export async function allScenarios(): Promise<Scenario[]> {
  const custom = await db.customScenarios.toArray();
  return [...DEFAULT_SCENARIOS, ...custom];
}

export async function findScenario(id: string): Promise<Scenario | undefined> {
  return DEFAULT_SCENARIOS.find((s) => s.id === id) ?? (await db.customScenarios.get(id));
}

/** Load the profile's game, creating a fresh round if none exists. */
export async function loadOrCreateGame(profile: Profile): Promise<Game | undefined> {
  const existing = await db.games.get(profile.id);
  if (existing) return normalizeGame(existing);
  return startNewRound(profile);
}

export async function startNewRound(profile: Profile, opts: { randomHistory?: boolean } = {}): Promise<Game | undefined> {
  const scenario = await findScenario(profile.scenarioId);
  if (!scenario) return undefined;
  const custom = await db.customAssets.toArray();
  const sc = opts.randomHistory ? { ...scenario, startYear: 'random' as const, seed: Math.floor(Math.random() * 1e6), events: scenario.events.filter((e) => !e.shock && e.season === 0) } : scenario;
  const g = newGame(profile.id, sc, resolveAssets(sc, custom));
  await db.games.put(g);
  return g;
}

export async function saveGame(g: Game) {
  await db.games.put(g);
}

export const DAY = 86_400_000;
export const MODES: { v: 'daily' | 'manual' | 'realtime'; label: string; hint: string }[] = [
  { v: 'daily', label: 'One year a day (recommended)', hint: 'About ten minutes a day: a year report, four seasons to play, then the world rests until the unlock time next day.' },
  { v: 'manual', label: 'Free play', hint: 'Unlimited "Next season" presses. Good for a first look or a recorded demo.' },
  { v: 'realtime', label: 'Real time', hint: 'Seasons tick by themselves while the app is closed; the child checks in like on a real portfolio.' },
];

export const PACES: { v: number; label: string; hint: string }[] = [
  { v: 60_000, label: '1 per minute', hint: 'Demo speed: watch the world change live.' },
  { v: 3_600_000, label: '1 per hour', hint: 'A whole year in an afternoon.' },
  { v: DAY, label: '1 per day', hint: 'Recommended: check in like a real portfolio. One farm year = 4 days.' },
  { v: 3 * DAY, label: 'Every 3 days', hint: 'Calm pace: one year in under two weeks.' },
  { v: 7 * DAY, label: '1 per week', hint: 'Slow and steady: one year per month.' },
];

export async function createProfile(p: { name: string; avatar: string; bracket: Bracket; world: WorldId; scenarioId?: string; pace?: number; mode?: 'daily' | 'manual' | 'realtime'; unlockHour?: number }): Promise<Profile> {
  const profile: Profile = {
    id: uid('kid'),
    name: p.name,
    avatar: p.avatar,
    bracket: p.bracket,
    world: p.world,
    scenarioId: p.scenarioId ?? WORLDS[p.world].defaultScenarioId,
    mode: p.mode ?? 'daily',
    unlockHour: p.unlockHour ?? 10,
    pace: p.pace ?? DAY,
    createdAt: Date.now(),
  };
  await db.profiles.put(profile);
  return profile;
}

/**
 * The demo family starts in the middle of a round so the worlds are already full of life.
 * Plans: [assetId, units at the start], then every year part of the new cash is invested again.
 */
const DEMO: { name: string; avatar: string; bracket: Bracket; world: WorldId; seasons: number; start: [string, number][]; yearly: [string, number][] }[] = [
  { name: 'Thanja', avatar: '🦊', bracket: 1, world: 'farm', seasons: 20, start: [['farm.cow', 2], ['farm.tree', 1], ['farm.hens', 2], ['farm.pig', 1]], yearly: [['farm.cow', 0.5], ['farm.hens', 0.3]] },
  { name: 'Noah', avatar: '🐼', bracket: 2, world: 'space', seasons: 16, start: [['space.greenhouse', 1.5], ['space.solar', 1], ['space.rocket', 2], ['space.satellites', 1.6], ['space.crystal', 0.6]], yearly: [['space.greenhouse', 0.4], ['space.rocket', 0.2]] },
  { name: 'Emilia', avatar: '🦉', bracket: 3, world: 'city', seasons: 12, start: [['city.cityacc', 6], ['city.bonds', 5], ['city.gold', 1.5], ['city.startup', 2]], yearly: [['city.cityacc', 0.5], ['city.bonds', 0.25]] },
];

export async function seedDemoFamily() {
  const custom = await db.customAssets.toArray();
  for (const d of DEMO) {
    const p = await createProfile({ name: d.name, avatar: d.avatar, bracket: d.bracket, world: d.world });
    const sc = DEFAULT_SCENARIOS.find((s) => s.id === WORLDS[d.world].defaultScenarioId)!;
    const ctx = contextFor(p);
    let g = newGame(p.id, sc, resolveAssets(sc, custom));
    const m = marketFor(g);
    for (const [id, u] of d.start) { const r = buy(g, m, id, u, ctx); if (r.ok) g = r.game; }
    for (let s = 1; s <= d.seasons; s++) {
      g = advance(g, m, ctx).game;
      if (s % 4 === 0) {
        const cash = g.cash;
        for (const [id, share] of d.yearly) {
          const price = m.prices[id][g.season];
          let u = (cash * share - sc.tradeFee) / price;
          if (d.bracket === 1) u = Math.floor(u);
          if (u > 0) { const r = buy(g, m, id, u, ctx); if (r.ok) g = r.game; }
        }
      }
    }
    g.lastTick = Date.now();
    await db.games.put(g);
  }
}

/** Record that the child opened the game today (for check-in rewards). Returns true if it was the first visit today. */
export function recordCheckin(g: Game, now = new Date()): boolean {
  const day = now.toISOString().slice(0, 10);
  g.checkins ??= [];
  if (g.checkins.includes(day)) return false;
  g.checkins.push(day);
  return true;
}

/** Re-check a child's rewards against the current game and persist changes. */
export async function syncRewards(g: Game): Promise<Reward[]> {
  const list = await db.rewards.where('profileId').equals(g.profileId).toArray();
  const { changed, achieved } = evaluateRewards(list, g, marketFor(g));
  if (changed.length) await db.rewards.bulkPut(changed);
  return achieved;
}

/** Parents can move a child's world forward (e.g. to prepare a demo). */
export async function fastForward(profileId: string, n: number) {
  const p = await db.profiles.get(profileId);
  if (!p) return;
  let g = await loadOrCreateGame(p);
  if (!g) return;
  const ctx = contextFor(p);
  for (let i = 0; i < n && !g.finished; i++) g = advance(g, marketFor(g), ctx).game;
  await db.games.put(g);
  await syncRewards(g);
}

/** One-time migrations: demo names, and profiles created before the daily rhythm existed. */
export async function migrateDemoNames() {
  const all = await db.profiles.toArray();
  for (const p of all) {
    if (!p.mode) await db.profiles.update(p.id, { mode: p.pace === DAY || !p.pace ? 'daily' : 'realtime', unlockHour: 10 });
    if (p.name === 'Ella' && p.avatar === '🦊') await db.profiles.update(p.id, { name: 'Thanja' });
    if (p.name === 'Kim' && p.avatar === '🦉') await db.profiles.update(p.id, { name: 'Emilia' });
  }
}

export async function deleteProfile(id: string) {
  await db.transaction('rw', db.profiles, db.games, db.rewards, async () => {
    await db.profiles.delete(id);
    await db.games.delete(id);
    await db.rewards.where('profileId').equals(id).delete();
  });
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`kidvest:${pin}`);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return btoa(`kidvest:${pin}`);
}

export async function exportAll(): Promise<string> {
  const [settings, profiles, games, customAssets, customScenarios, rewards] = await Promise.all([
    db.settings.toArray(), db.profiles.toArray(), db.games.toArray(), db.customAssets.toArray(), db.customScenarios.toArray(), db.rewards.toArray(),
  ]);
  return JSON.stringify({ app: 'kidvest', version: 2, exportedAt: new Date().toISOString(), settings, profiles, games, customAssets, customScenarios, rewards }, null, 2);
}

export async function importAll(json: string) {
  const data = JSON.parse(json);
  if (data.app !== 'kidvest') throw new Error('This file is not a Kidvest backup.');
  await db.transaction('rw', [db.settings, db.profiles, db.games, db.customAssets, db.customScenarios, db.rewards], async () => {
    if (data.rewards) await db.rewards.bulkPut(data.rewards);
    if (data.profiles) await db.profiles.bulkPut(data.profiles);
    if (data.games) await db.games.bulkPut(data.games);
    if (data.customAssets) await db.customAssets.bulkPut(data.customAssets);
    if (data.customScenarios) await db.customScenarios.bulkPut(data.customScenarios);
  });
}

export async function resetEverything() {
  await db.delete();
  location.reload();
}
