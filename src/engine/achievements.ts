import type { Market } from './market';
import { WORLDS } from '../data/worlds';
import type { Bracket, ChallengeDef, Game, Goal } from './types';

export interface AchievementDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
  xp: number;
  minBracket?: Bracket;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_buy', emoji: '🌱', title: 'First investment', description: 'You bought your very first item.', xp: 30 },
  { id: 'three_kinds', emoji: '🧺', title: 'Mixed basket', description: 'You own three different kinds at the same time.', xp: 40 },
  { id: 'four_kinds', emoji: '🌈', title: 'Explorer', description: 'You own four different kinds at the same time.', xp: 40, minBracket: 2 },
  { id: 'half_in', emoji: '⚖️', title: 'Half in', description: 'At least half of your money is working for you.', xp: 30 },
  { id: 'harvest', emoji: '🎁', title: 'Harvest collector', description: 'Payouts added up to a quarter of your starting money.', xp: 40 },
  { id: 'storm_survivor', emoji: '⛈️', title: 'Storm survivor', description: 'A storm hit and you held on for a whole year.', xp: 60 },
  { id: 'patient', emoji: '🐢', title: 'Patience pays', description: 'You kept one investment for five years.', xp: 60 },
  { id: 'steady_hands', emoji: '🧘', title: 'Steady hands', description: 'A whole year with at most two trades.', xp: 40 },
  { id: 'comeback', emoji: '📈', title: 'Comeback', description: 'After a big drop you climbed back to your best value.', xp: 60 },
  { id: 'inflation_beater', emoji: '🛡️', title: 'Inflation beater', description: 'Your money grew faster than prices.', xp: 50 },
  { id: 'cost_cutter', emoji: '✂️', title: 'Cost cutter', description: 'Your investments cost you less than 0.3 % per year.', xp: 40, minBracket: 2 },
  { id: 'goal', emoji: '🏆', title: 'Goal reached', description: 'Your total value reached your savings goal.', xp: 80 },
  { id: 'bought_goal', emoji: '🛍️', title: 'Saved, then bought', description: 'You saved up and bought something from your goal list.', xp: 60 },
  { id: 'finisher', emoji: '🎓', title: 'Chapter complete', description: 'You played a whole chapter of history.', xp: 50 },
];

export const LEVEL_XP = [0, 200, 450, 800, 1150];

export function levelOf(xp: number): { level: number; next: number | null; prev: number } {
  let level = 0;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) level = i;
  return { level, prev: LEVEL_XP[level], next: level + 1 < LEVEL_XP.length ? LEVEL_XP[level + 1] : null };
}

/* ---------- valuation helpers ---------- */

export function investedValue(g: Game, m: Market, s = g.season): number {
  let v = 0;
  for (const [id, u] of Object.entries(g.holdings)) v += u * (m.prices[id]?.[s] ?? 0);
  return v;
}

export function totalValue(g: Game, m: Market, s = g.season): number {
  return g.cash + investedValue(g, m, s);
}

export function heldKinds(g: Game): string[] {
  return Object.entries(g.holdings).filter(([, u]) => u > 1e-9).map(([id]) => id);
}

export function weightedFee(g: Game, m: Market): number {
  const inv = investedValue(g, m);
  if (inv <= 0) return 0;
  let f = 0;
  for (const [id, u] of Object.entries(g.holdings)) {
    const a = g.assets.find((x) => x.id === id);
    if (a) f += (u * m.prices[id][g.season] * a.fee) / inv;
  }
  return f;
}

export function portfolioRisk(g: Game, m: Market): number {
  const tot = totalValue(g, m);
  if (tot <= 0) return 0;
  let r = 0;
  for (const [id, u] of Object.entries(g.holdings)) {
    const a = g.assets.find((x) => x.id === id);
    if (a) r += (u * m.prices[id][g.season] * a.risk) / tot;
  }
  return r; // cash counts as risk 0
}

/** The goal ladder: the scenario's goal plus the world's goals, cheapest first. */
export function goalsFor(g: Game): Goal[] {
  const ladder = [g.scenario.goal, ...(WORLDS[g.scenario.world]?.goalLadder ?? [])];
  const seen = new Set<string>();
  return ladder.filter((x) => (seen.has(x.name) ? false : (seen.add(x.name), true))).sort((a, b) => a.amount - b.amount);
}

export function currentGoal(g: Game): Goal | null {
  return goalsFor(g)[g.goalIndex ?? 0] ?? null;
}

export function goalCost(g: Game, m: Market, s = g.season): number {
  const goal = currentGoal(g);
  return goal ? goal.amount * m.cpi[Math.min(s, m.cpi.length - 1)] : Infinity;
}

function tradesInLastYear(g: Game): number {
  return g.trades.filter((t) => t.season > g.season - 4 && t.season <= g.season).length;
}

function maxShare(g: Game, m: Market): number {
  const inv = investedValue(g, m);
  if (inv <= 0) return 1;
  return Math.max(...Object.entries(g.holdings).map(([id, u]) => (u * m.prices[id][g.season]) / inv));
}

/* ---------- achievements ---------- */

function achieved(id: string, g: Game, m: Market): boolean {
  const s = g.season;
  const tot = totalValue(g, m);
  const inv = investedValue(g, m);
  switch (id) {
    case 'first_buy': return g.trades.some((t) => t.side === 'buy');
    case 'three_kinds': return heldKinds(g).length >= 3;
    case 'four_kinds': return heldKinds(g).length >= 4;
    case 'half_in': return tot > 0 && inv / tot >= 0.5;
    case 'harvest': return g.payoutsTotal >= g.scenario.startCash * 0.25;
    case 'storm_survivor': return g.stormsSurvived >= 1;
    case 'patient': return Object.values(g.heldSince).some((since) => s - since >= 20);
    case 'steady_hands': return s >= 8 && s % 4 === 0 && inv > 0 && tradesInLastYear(g) <= 2;
    case 'comeback': return g.hadDrawdown && tot >= g.peak && s > 0;
    case 'inflation_beater': return s >= 8 && tot > g.contribAdj * 1.1;
    case 'cost_cutter': return s >= 4 && tot > 0 && inv / tot >= 0.5 && weightedFee(g, m) < 0.003;
    case 'goal': return g.goalReachedAt !== undefined;
    case 'bought_goal': return (g.owned?.length ?? 0) > 0;
    case 'finisher': return g.finished || (g.chapters ?? 0) > 0;
    default: return false;
  }
}

/* ---------- challenges ---------- */

export function challengeProgress(c: ChallengeDef, g: Game, m: Market): number {
  const s = g.season;
  const tot = totalValue(g, m);
  const inv = investedValue(g, m);
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  if (g.challengesDone[c.id] !== undefined) return 1;
  switch (c.type) {
    case 'own_kinds': return clamp(heldKinds(g).length / c.target);
    case 'hold_through_storm': return g.storm ? clamp((s - g.storm.season) / 4) * 0.99 : clamp(g.stormsSurvived / c.target);
    case 'reach_goal': {
      // the scenario's own goal (e.g. the red tractor), not just the first item on the ladder
      if (g.owned?.some((o) => o.name === g.scenario.goal.name)) return 1;
      return clamp(tot / (g.scenario.goal.amount * m.cpi[Math.min(s, m.cpi.length - 1)]));
    }
    case 'collect_payouts': return clamp(g.payoutsTotal / c.target);
    case 'invested_share': return tot > 0 ? clamp(inv / tot / c.target) : 0;
    case 'play_years': return clamp(s / 4 / c.target);
    case 'low_fees': return s >= 4 && tot > 0 && inv / tot >= 0.5 && weightedFee(g, m) <= c.target ? 1 : clamp(inv / Math.max(tot, 1) / 0.5) * 0.5;
    case 'beat_inflation': return s >= 8 ? clamp(tot / (g.contribAdj * (1 + c.target))) : clamp(s / 8) * 0.5;
    case 'calm_year': return s >= 4 && inv > 0 && tradesInLastYear(g) <= c.target ? 1 : clamp(s / 4) * 0.5;
    case 'balanced': return heldKinds(g).length >= 3 && tot > 0 && inv / tot >= 0.5 && maxShare(g, m) <= c.target ? 1 : clamp(heldKinds(g).length / 3) * 0.6;
    default: return 0;
  }
}

/** Evaluate achievements and challenges after any change; mutates g and returns new unlock messages. */
export function evaluate(g: Game, m: Market, bracket: Bracket): { achievements: AchievementDef[]; challenges: ChallengeDef[] } {
  const newA: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (g.achievements[a.id] !== undefined) continue;
    if (a.minBracket && bracket < a.minBracket) continue;
    if (achieved(a.id, g, m)) {
      g.achievements[a.id] = g.season;
      g.xp += a.xp;
      newA.push(a);
    }
  }
  const newC: ChallengeDef[] = [];
  for (const c of g.scenario.challenges) {
    if (g.challengesDone[c.id] !== undefined) continue;
    if (challengeProgress(c, g, m) >= 1) {
      g.challengesDone[c.id] = g.season;
      g.xp += c.xp;
      newC.push(c);
    }
  }
  return { achievements: newA, challenges: newC };
}
