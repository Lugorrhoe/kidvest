import { investedValue, totalValue, heldKinds } from './achievements';
import type { Market } from './market';
import type { Bracket, Game } from './types';

export type RewardKind = 'money' | 'allowance' | 'gift' | 'experience' | 'privilege' | 'other';
export type RewardCondType =
  | 'value_reach'
  | 'gain_pct'
  | 'own_kinds'
  | 'invested_share'
  | 'no_panic'
  | 'badges'
  | 'challenges'
  | 'buy_goal'
  | 'checkins'
  | 'beat_inflation';

export interface RewardCondition {
  type: RewardCondType;
  /** Amount, share (0.6 = 60 %), count or margin, depending on the type. */
  target: number;
  /** For sustained conditions: how many seasons the behaviour must be kept up. */
  seasons?: number;
}

export type RewardStatus = 'active' | 'achieved' | 'delivered' | 'expired' | 'cancelled';

export interface Reward {
  id: string;
  profileId: string;
  title: string;
  emoji: string;
  kind: RewardKind;
  note?: string;
  condition: RewardCondition;
  createdAt: number;
  /** Real-time deadline (ms since epoch); undefined = untimed. */
  deadline?: number;
  baseline: {
    season: number;
    value: number;
    contributions: number;
    badges: number;
    challenges: number;
    owned: number;
    soldInStorm: number;
    checkins: number;
  };
  status: RewardStatus;
  achievedAt?: number;
  deliveredAt?: number;
  violated?: boolean;
}

export const REWARD_KINDS: { v: RewardKind; label: string; emoji: string }[] = [
  { v: 'money', label: 'Money bonus', emoji: '💶' },
  { v: 'allowance', label: 'Extra pocket money', emoji: '🪙' },
  { v: 'gift', label: 'Gift', emoji: '🎁' },
  { v: 'experience', label: 'Experience / outing', emoji: '🎟️' },
  { v: 'privilege', label: 'Privilege', emoji: '⭐' },
  { v: 'other', label: 'Other', emoji: '✨' },
];

export const SUSTAINED: RewardCondType[] = ['invested_share', 'no_panic'];

export const COND_TYPES: { v: RewardCondType; label: string; targetLabel: string; def: number; sustained?: boolean; about: string }[] = [
  { v: 'no_panic', label: 'No panic selling', targetLabel: '(no target)', def: 1, sustained: true, about: 'Keeps all investments through storms for the whole period. Rewards patience, the most important investing habit.' },
  { v: 'invested_share', label: 'Keep money invested', targetLabel: 'Share invested, 0.6 = 60 %', def: 0.6, sustained: true, about: 'At least this share of the money must be working at every check. Rewards consistency.' },
  { v: 'own_kinds', label: 'Own several kinds', targetLabel: 'Number of kinds', def: 3, about: 'Rewards diversification.' },
  { v: 'buy_goal', label: 'Save up and buy a goal item', targetLabel: 'Number of goal items', def: 1, about: 'Rewards saving towards something and the decision to spend.' },
  { v: 'badges', label: 'Earn new badges', targetLabel: 'New badges', def: 2, about: 'Badges reward behaviour, not luck.' },
  { v: 'challenges', label: 'Complete challenges', targetLabel: 'Challenges', def: 1, about: 'Scenario challenges are designed around good habits.' },
  { v: 'checkins', label: 'Check in regularly', targetLabel: 'Days with a visit', def: 8, about: 'Rewards looking after the portfolio, like watering plants.' },
  { v: 'beat_inflation', label: 'Beat inflation', targetLabel: 'Margin, 0.1 = 10 %', def: 0.05, about: 'Total value above the inflation-adjusted money paid in. Depends partly on market luck.' },
  { v: 'gain_pct', label: 'Grow the portfolio by', targetLabel: 'Growth, 0.1 = 10 % (excluding new pocket money)', def: 0.1, about: 'Outcome goal. Depends heavily on the market years being replayed; better for older children and longer periods.' },
  { v: 'value_reach', label: 'Reach a total value of', targetLabel: 'Amount in game money', def: 1000, about: 'Outcome goal. Pocket money alone can get there, so combine with a short deadline or use for small rewards.' },
];

export const DURATIONS: { label: string; ms: number }[] = [
  { label: '2 weeks', ms: 14 * 86_400_000 },
  { label: '1 month', ms: 30 * 86_400_000 },
  { label: '2 months', ms: 61 * 86_400_000 },
  { label: '3 months', ms: 91 * 86_400_000 },
  { label: '6 months', ms: 183 * 86_400_000 },
];

export function makeBaseline(g: Game, m: Market): Reward['baseline'] {
  return {
    season: g.season,
    value: totalValue(g, m),
    contributions: g.contributions,
    badges: Object.keys(g.achievements).length,
    challenges: Object.keys(g.challengesDone).length,
    owned: g.owned?.length ?? 0,
    soldInStorm: g.soldInStorm,
    checkins: g.checkins?.length ?? 0,
  };
}

/** Human-readable condition for the child. */
export function describeCondition(r: Reward, bracket: Bracket, seasonWord: string, fmtMoney: (v: number) => string): string {
  const c = r.condition;
  const seasons = c.seasons ? ` for ${c.seasons} ${seasonWord}s` : r.deadline ? ' until the deadline' : '';
  switch (c.type) {
    case 'value_reach': return `Grow your total to ${fmtMoney(c.target)}`;
    case 'gain_pct': return `Grow your money by ${Math.round(c.target * 100)} % (not counting new pocket money)`;
    case 'own_kinds': return `Own ${c.target} different kinds at the same time`;
    case 'invested_share': return `Keep at least ${Math.round(c.target * 100)} ${bracket === 1 ? 'of every 100 coins working' : '% invested'}${seasons}`;
    case 'no_panic': return `Hold on through storms, no panic selling${seasons}`;
    case 'badges': return `Earn ${c.target} new ${c.target === 1 ? 'badge' : 'badges'}`;
    case 'challenges': return `Complete ${c.target} ${c.target === 1 ? 'challenge' : 'challenges'}`;
    case 'buy_goal': return c.target === 1 ? 'Save up and buy something from your goal list' : `Buy ${c.target} items from your goal list`;
    case 'checkins': return `Look after your ${bracket === 1 ? 'farm' : 'portfolio'} on ${c.target} different days`;
    case 'beat_inflation': return `Stay ${Math.round(c.target * 100)} % ahead of inflation`;
  }
}

export function rewardProgress(r: Reward, g: Game, m: Market): number {
  const c = r.condition;
  const b = r.baseline;
  const tot = totalValue(g, m);
  const inv = investedValue(g, m);
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const elapsed = g.season - b.season;
  switch (c.type) {
    case 'value_reach': return clamp(tot / c.target);
    case 'gain_pct': {
      const base = b.value > 0 ? b.value : 1;
      const growth = (tot - (g.contributions - b.contributions)) / base - 1;
      return clamp(growth / c.target);
    }
    case 'own_kinds': return clamp(heldKinds(g).length / c.target);
    case 'invested_share':
    case 'no_panic': {
      if (r.violated) return 0;
      if (c.seasons) return clamp(elapsed / c.seasons);
      if (r.deadline) return clamp((Date.now() - r.createdAt) / (r.deadline - r.createdAt));
      return c.type === 'invested_share' ? clamp(inv / Math.max(tot, 1) / c.target) : 0.5;
    }
    case 'badges': return clamp((Object.keys(g.achievements).length - b.badges) / c.target);
    case 'challenges': return clamp((Object.keys(g.challengesDone).length - b.challenges) / c.target);
    case 'buy_goal': return clamp(((g.owned?.length ?? 0) - b.owned) / c.target);
    case 'checkins': return clamp(((g.checkins?.length ?? 0) - b.checkins) / c.target);
    case 'beat_inflation': return clamp(tot / (g.contribAdj * (1 + c.target)));
  }
}

function sustainedOk(r: Reward, g: Game, m: Market): boolean {
  const c = r.condition;
  const tot = totalValue(g, m);
  if (c.type === 'invested_share') return tot <= 0 || investedValue(g, m) / tot >= c.target - 1e-9;
  if (c.type === 'no_panic') return g.soldInStorm <= r.baseline.soldInStorm;
  return true;
}

/**
 * Re-check all active rewards. Returns the rewards that changed.
 * Call after every game change and on every real-time tick.
 */
export function evaluateRewards(rewards: Reward[], g: Game, m: Market, now = Date.now()): { changed: Reward[]; achieved: Reward[] } {
  const changed: Reward[] = [];
  const achieved: Reward[] = [];
  for (const r0 of rewards) {
    if (r0.status !== 'active') continue;
    const r = { ...r0 };
    const c = r.condition;
    const sustained = SUSTAINED.includes(c.type);
    if (sustained && g.season > r.baseline.season && !sustainedOk(r, g, m)) r.violated = true;
    let done = false;
    if (sustained) {
      const elapsed = g.season - r.baseline.season;
      if (!r.violated) {
        if (c.seasons && elapsed >= c.seasons) done = true;
        else if (!c.seasons && r.deadline && now >= r.deadline) done = true;
      }
    } else {
      done = rewardProgress(r, g, m) >= 1 - 1e-9;
    }
    if (done) {
      r.status = 'achieved';
      r.achievedAt = now;
      achieved.push(r);
    } else if ((r.deadline && now > r.deadline) || (sustained && r.violated)) {
      r.status = 'expired';
    }
    if (r.status !== r0.status || r.violated !== r0.violated) changed.push(r);
  }
  return { changed, achieved };
}
