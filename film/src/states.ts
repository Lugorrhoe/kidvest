import { buildDemoGame, DEMO_FAMILY, type DemoChild } from '../../src/data/demoFamily';
import { WORLDS } from '../../src/data/worlds';
import { totalValue } from '../../src/engine/achievements';
import { money } from '../../src/engine/format';
import { advance, contextFor, marketFor, type Context, type SeasonReport } from '../../src/engine/game';
import type { Market } from '../../src/engine/market';
import { evaluateRewards, makeBaseline, type Reward } from '../../src/engine/rewards';
import type { Game, Profile } from '../../src/engine/types';

export interface Child {
  profile: Profile;
  ctx: Context;
  market: Market;
  /** Game state after each season, indexed by season number. Seasons below the demo start are undefined. */
  at: Game[];
  /** Season report produced by the advance into that season. */
  report: (SeasonReport | undefined)[];
  heroValue: (season: number) => string;
}

function profileOf(d: DemoChild): Profile {
  return { id: `film_${d.world}`, name: d.name, avatar: d.avatar, bracket: d.bracket, world: d.world, scenarioId: WORLDS[d.world].defaultScenarioId, mode: 'manual', unlockHour: 10, pace: 0, createdAt: 0 };
}

/** Deterministic: the demo child's state, then `extra` more seasons advanced with the real engine. */
function build(d: DemoChild, extra: number): Child {
  const profile = profileOf(d);
  const ctx = contextFor(profile);
  let g = buildDemoGame(d, profile.id);
  const market = marketFor(g);
  const at: Game[] = [];
  const report: (SeasonReport | undefined)[] = [];
  at[g.season] = g;
  for (let i = 0; i < extra; i++) {
    const r = advance(g, market, ctx);
    g = r.game;
    at[g.season] = g;
    report[g.season] = r.report;
  }
  return { profile, ctx, market, at, report, heroValue: (s) => money(totalValue(at[s], market), ctx.world, ctx.bracket) };
}

export const thanja = build(DEMO_FAMILY[0], 8); // seasons 20 .. 28 (2008 and 2009)
export const noah = build(DEMO_FAMILY[1], 0);
export const emilia = build(DEMO_FAMILY[2], 0);

/** A real-life reward set by the parents before the stormy year, evaluated by the real engine season by season. */
const REWARD_CREATED = Date.UTC(2026, 9, 20, 18, 0, 0);
const baseReward: Reward = {
  id: 'film_reward_icecream',
  profileId: thanja.profile.id,
  title: 'Ice cream outing',
  emoji: '🍦',
  kind: 'experience',
  condition: { type: 'no_panic', target: 1, seasons: 4 },
  createdAt: REWARD_CREATED,
  baseline: makeBaseline(thanja.at[20], thanja.market),
  status: 'active',
};

/** Reward state as the child would see it after reaching `season`. */
export function rewardAt(season: number): Reward {
  let r = baseReward;
  for (let s = 21; s <= season; s++) {
    const { changed } = evaluateRewards([r], thanja.at[s], thanja.market, REWARD_CREATED + (s - 20) * 86_400_000);
    if (changed[0]) r = changed[0];
  }
  return r;
}

/** First season at which the reward is achieved (or undefined). */
export const REWARD_SEASON = [21, 22, 23, 24, 25, 26, 27, 28].find((s) => rewardAt(s).status === 'achieved');
