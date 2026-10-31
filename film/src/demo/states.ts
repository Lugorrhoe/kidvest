import { buildDemoGame, DEMO_FAMILY, type DemoChild } from '../../../src/data/demoFamily';
import { WORLDS } from '../../../src/data/worlds';
import { dailyState, dayKey, type DailyState } from '../../../src/engine/daily';
import { advance, buy, contextFor, marketFor, type Context, type SeasonReport } from '../../../src/engine/game';
import type { Market } from '../../../src/engine/market';
import { evaluateRewards, makeBaseline, type Reward } from '../../../src/engine/rewards';
import type { Game, Profile } from '../../../src/engine/types';

/** The demo is filmed on a fixed morning so daily-mode copy is deterministic. */
export const NOW = new Date(2026, 10, 3, 9, 0, 0);
const TODAY = dayKey(NOW);

export interface DemoKid {
  profile: Profile;
  ctx: Context;
  market: Market;
  /** Game state per season (post-purchase for the first one). */
  at: Game[];
  report: (SeasonReport | undefined)[];
  /** State before the demo purchase, for the order ticket. */
  pre: Game;
  daily: (season: number) => DailyState;
}

function profileOf(d: DemoChild): Profile {
  return { id: `demo_${d.world}`, name: d.name, avatar: d.avatar, bracket: d.bracket, world: d.world, scenarioId: WORLDS[d.world].defaultScenarioId, mode: 'daily', unlockHour: 10, pace: 0, createdAt: NOW.getTime() - 40 * 86_400_000 };
}

function build(d: DemoChild, purchase: [string, number] | null, extra: number): DemoKid {
  const profile = profileOf(d);
  const ctx = contextFor(profile);
  const pre = buildDemoGame(d, profile.id);
  const market = marketFor(pre);
  let g = pre;
  if (purchase) {
    const r = buy(g, market, purchase[0], purchase[1], ctx);
    if (r.ok) g = r.game;
  }
  const at: Game[] = [];
  const report: (SeasonReport | undefined)[] = [];
  at[g.season] = g;
  for (let i = 0; i < extra; i++) {
    const r = advance(g, market, ctx);
    g = r.game;
    at[g.season] = g;
    report[g.season] = r.report;
  }
  // in daily mode the fourth season of a year closes the day: the next year unlocks tomorrow
  const last = at.length - 1;
  if (extra > 0 && last % 4 === 0) at[last] = { ...at[last], lastYearDay: TODAY };
  return { profile, ctx, market, at, report, pre, daily: (s) => dailyState(at[s], profile, NOW) };
}

export const thanja = build(DEMO_FAMILY[0], ['farm.hens', 1], 4); // buys one hen, then plays 2008
export const noah = build(DEMO_FAMILY[1], null, 0);
export const emilia = build(DEMO_FAMILY[2], null, 0);
export const KIDS = [thanja, noah, emilia];

/** The parents' real-life reward, set before the stormy year and evaluated by the engine. */
const REWARD_CREATED = NOW.getTime() - 12 * 86_400_000;
const baseReward: Reward = {
  id: 'demo_reward_icecream',
  profileId: thanja.profile.id,
  title: 'Ice cream outing',
  emoji: '🍦',
  kind: 'experience',
  condition: { type: 'no_panic', target: 1, seasons: 4 },
  createdAt: REWARD_CREATED,
  baseline: makeBaseline(thanja.at[20], thanja.market),
  status: 'active',
};

export function rewardAt(season: number): Reward {
  let r = baseReward;
  for (let s = 21; s <= season; s++) {
    const { changed } = evaluateRewards([r], thanja.at[s], thanja.market, NOW.getTime());
    if (changed[0]) r = changed[0];
  }
  return r;
}
