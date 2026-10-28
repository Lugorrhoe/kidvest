import { WORLDS } from '../data/worlds';
import { LAST_YEAR } from '../data/history';
import { ACHIEVEMENTS, currentGoal, evaluate, goalCost, heldKinds, investedValue, levelOf, totalValue } from './achievements';
import { buildMarket, clampStartYear, yearSeqFrom, type Market } from './market';
import { hashString, mulberry32 } from './rng';
import { money, pct } from './format';
import type { AssetDef, Bracket, Game, LogItem, Profile, Scenario } from './types';

export interface Context {
  bracket: Bracket;
  world: (typeof WORLDS)[keyof typeof WORLDS];
}

export function contextFor(profile: Pick<Profile, 'bracket' | 'world'>): Context {
  return { bracket: profile.bracket, world: WORLDS[profile.world] };
}

export function resolveStartYear(s: Scenario): number {
  if (s.startYear === 'random') {
    const lo = 1950;
    const hi = 2025 - s.years + 1;
    return clampStartYear(lo + Math.floor(Math.random() * (hi - lo + 1)), s.years);
  }
  return clampStartYear(s.startYear, s.years);
}

export function newGame(profileId: string, scenario: Scenario, assets: AssetDef[], startYear?: number): Game {
  const year = startYear ?? resolveStartYear(scenario);
  const now = Date.now();
  const g: Game = {
    profileId,
    scenario: structuredClone(scenario),
    assets: structuredClone(assets),
    startYear: year,
    yearSeq: yearSeqFrom(year, scenario.years),
    lastTick: now,
    chapters: 0,
    goalIndex: 0,
    owned: [],
    spent: 0,
    season: 0,
    cash: scenario.startCash,
    holdings: {},
    costBasis: {},
    heldSince: {},
    contributions: scenario.startCash,
    contribAdj: scenario.startCash,
    payoutsTotal: 0,
    tradeCount: 0,
    trades: [],
    history: [{ season: 0, total: scenario.startCash, cash: scenario.startCash, invested: 0, contributions: scenario.startCash, contribAdj: scenario.startCash, cpi: 1 }],
    log: [],
    achievements: {},
    challengesDone: {},
    xp: 0,
    stormsSurvived: 0,
    soldInStorm: 0,
    peak: scenario.startCash,
    hadDrawdown: false,
    talk: [],
    finished: false,
    createdAt: now,
    updatedAt: now,
  };
  return g;
}

/** Fill fields added in later versions so older saved rounds keep working. */
export function normalizeGame(g: Game): Game {
  if (!g.yearSeq?.length) g.yearSeq = yearSeqFrom(g.startYear, g.scenario.years);
  g.lastTick ??= g.updatedAt ?? Date.now();
  g.chapters ??= 0;
  g.goalIndex ??= 0;
  g.owned ??= [];
  g.spent ??= 0;
  return g;
}

export function marketFor(g: Game): Market {
  normalizeGame(g);
  return buildMarket(g.scenario, g.assets, g.yearSeq);
}

/** Append a new chapter of history: continue with the next years, wrapping to a seeded random year after 2025. */
function extendChapter(g: Game) {
  const chunk = Math.max(5, g.scenario.years);
  const rand = mulberry32(hashString(`${g.scenario.seed}:chapter:${g.chapters}`));
  let y = g.yearSeq[g.yearSeq.length - 1] + 1;
  for (let i = 0; i < chunk; i++) {
    if (y > LAST_YEAR) y = 1950 + Math.floor(rand() * (LAST_YEAR - chunk - 1950 + 1));
    g.yearSeq.push(y);
    y++;
  }
}

export function assetById(g: Game, id: string): AssetDef | undefined {
  return g.assets.find((a) => a.id === id);
}

export function priceOf(g: Game, m: Market, id: string, s = g.season): number {
  return m.prices[id]?.[s] ?? 0;
}

export interface Unlocks {
  achievements: { emoji: string; title: string }[];
  challenges: { title: string }[];
  levelUp?: string;
}

function runChecks(g: Game, m: Market, ctx: Context): Unlocks {
  const before = levelOf(g.xp).level;
  const r = evaluate(g, m, ctx.bracket);
  for (const a of r.achievements) g.log.push({ season: g.season, kind: 'achievement', text: `Achievement unlocked: ${a.title}`, emoji: a.emoji });
  for (const c of r.challenges) g.log.push({ season: g.season, kind: 'challenge', text: `Challenge complete: ${c.title} (+${c.xp} XP)`, emoji: '🎯' });
  const after = levelOf(g.xp).level;
  let levelUp: string | undefined;
  if (after > before) {
    levelUp = ctx.world.levelTitles[after];
    g.log.push({ season: g.season, kind: 'level', text: `Level up! You are now: ${levelUp}`, emoji: '⭐' });
  }
  return { achievements: r.achievements.map((a) => ({ emoji: a.emoji, title: a.title })), challenges: r.challenges.map((c) => ({ title: c.title })), levelUp };
}

export type TradeResult = { ok: true; game: Game; unlocks: Unlocks } | { ok: false; error: string };

export function maxAffordableUnits(g: Game, m: Market, id: string, wholeUnits: boolean): number {
  const p = priceOf(g, m, id);
  const avail = g.cash - g.scenario.tradeFee;
  if (p <= 0 || avail <= 0) return 0;
  const u = avail / p;
  return wholeUnits ? Math.floor(u + 1e-9) : Math.floor(u * 1e6) / 1e6;
}

export function buy(game: Game, m: Market, id: string, unitsToBuy: number, ctx: Context): TradeResult {
  if (game.finished) return { ok: false, error: 'This round is over.' };
  if (!(unitsToBuy > 0)) return { ok: false, error: 'Choose an amount first.' };
  const g = structuredClone(game);
  const price = priceOf(g, m, id);
  const fee = g.scenario.tradeFee;
  const cost = unitsToBuy * price + fee;
  if (cost > g.cash + 1e-6) return { ok: false, error: 'Not enough money available.' };
  g.cash = Math.max(0, g.cash - cost);
  const had = (g.holdings[id] ?? 0) > 1e-9;
  g.holdings[id] = (g.holdings[id] ?? 0) + unitsToBuy;
  g.costBasis[id] = (g.costBasis[id] ?? 0) + unitsToBuy * price;
  if (!had) g.heldSince[id] = g.season;
  g.tradeCount++;
  g.trades.push({ season: g.season, assetId: id, side: 'buy', units: unitsToBuy, price, fee });
  const a = assetById(g, id)!;
  g.log.push({ season: g.season, kind: 'trade', text: `Bought ${a.name}`, amount: -cost, emoji: a.emoji });
  riskyPrompt(g, m, ctx);
  const unlocks = runChecks(g, m, ctx);
  g.updatedAt = Date.now();
  return { ok: true, game: g, unlocks };
}

export function sell(game: Game, m: Market, id: string, unitsToSell: number, ctx: Context): TradeResult {
  if (game.finished) return { ok: false, error: 'This round is over.' };
  const g = structuredClone(game);
  const held = g.holdings[id] ?? 0;
  if (!(unitsToSell > 0) || unitsToSell > held + 1e-9) return { ok: false, error: 'You do not own that many.' };
  const u = Math.min(unitsToSell, held);
  const price = priceOf(g, m, id);
  const fee = g.scenario.tradeFee;
  const proceeds = u * price - fee;
  if (proceeds < 0) return { ok: false, error: 'The order fee is higher than what you would get.' };
  g.cash += proceeds;
  g.costBasis[id] = (g.costBasis[id] ?? 0) * (1 - u / held);
  g.holdings[id] = held - u;
  if (g.holdings[id] <= 1e-9) {
    delete g.holdings[id];
    delete g.costBasis[id];
    delete g.heldSince[id];
  }
  g.tradeCount++;
  g.trades.push({ season: g.season, assetId: id, side: 'sell', units: u, price, fee });
  const a = assetById(g, id)!;
  g.log.push({ season: g.season, kind: 'trade', text: `Sold ${a.name}`, amount: proceeds, emoji: a.emoji });
  if (g.storm && g.storm.assets.includes(id)) {
    g.soldInStorm++;
    g.storm = undefined;
    g.talk.push({
      season: g.season,
      title: `Sold ${a.name} during a storm`,
      question: 'Ask: "What did you feel when the value dropped? What do you think would have happened if you had waited?" No judgement: selling in a panic is the most common investing mistake, and talking about the feeling is the lesson.',
    });
  }
  const unlocks = runChecks(g, m, ctx);
  g.updatedAt = Date.now();
  return { ok: true, game: g, unlocks };
}

function riskyPrompt(g: Game, m: Market, ctx: Context) {
  const tot = totalValue(g, m);
  if (tot <= 0) return;
  for (const [id, u] of Object.entries(g.holdings)) {
    const a = assetById(g, id);
    if (a && a.risk >= 4 && (u * m.prices[id][g.season]) / tot > 0.6 && !g.talk.some((t) => t.title.startsWith('Most money in'))) {
      g.talk.push({
        season: g.season,
        title: `Most money in ${a.name}`,
        question: `More than half of ${ctx.world.portfolioName.toLowerCase()} is in a very risky item. Ask: "What could happen if ${a.name} has a bad year? How would that feel?" Let the child decide, then watch together.`,
      });
    }
  }
}

export interface SeasonReport {
  season: number;
  items: LogItem[];
  change: number;
  changePct: number;
  unlocks: Unlocks;
  finished: boolean;
}

export function advance(game: Game, m: Market, ctx: Context): { game: Game; report: SeasonReport } {
  const g = structuredClone(game);
  const { world, bracket } = ctx;
  const s = g.season + 1;
  const items: LogItem[] = [];
  const prevTotal = totalValue(g, m, g.season);
  const prevInvested = investedValue(g, m, g.season);

  // 1. payouts from holdings during the season
  for (const [id, u] of Object.entries(g.holdings)) {
    const a = assetById(g, id);
    const amt = u * (m.payouts[id]?.[s] ?? 0);
    if (a && amt > 0.0001) {
      g.cash += amt;
      g.payoutsTotal += amt;
      if (bracket === 1) {
        g.harvest = g.harvest ?? {};
        g.harvest[id] = (g.harvest[id] ?? 0) + amt;
      } else {
        items.push({ season: s, kind: 'payout', text: `${a.name} paid ${a.payoutWord ?? 'a payout'}`, amount: amt, emoji: a.emoji });
      }
    }
  }
  // bracket 1: one harvest report per year (small seasonal amounts would round to zero)
  if (bracket === 1 && g.harvest && (s % 4 === 0 || s >= m.seasons)) {
    for (const [id, amt] of Object.entries(g.harvest)) {
      const a = assetById(g, id);
      if (!a) continue;
      const word = a.payoutWord ?? 'something';
      const whole = Math.round(amt);
      items.push(whole >= 1
        ? { season: s, kind: 'payout', text: `Harvest time! Your ${a.name.toLowerCase()} gave ${word} worth`, amount: amt, emoji: a.emoji }
        : { season: s, kind: 'payout', text: `Harvest time! Your ${a.name.toLowerCase()} gave a little ${word}.`, emoji: a.emoji });
    }
    g.harvest = {};
  }

  // 2. inflation and income
  g.contribAdj *= m.cpi[s] / m.cpi[s - 1];
  if (g.scenario.incomePerSeason > 0) {
    g.cash += g.scenario.incomePerSeason;
    g.contributions += g.scenario.incomePerSeason;
    g.contribAdj += g.scenario.incomePerSeason;
    items.push({ season: s, kind: 'income', text: `${world.incomeWord} arrived`, amount: g.scenario.incomePerSeason, emoji: '💶' });
  }

  // 3. weather: big moves of what the child holds
  const stormy: string[] = [];
  let anyMove = false;
  for (const [id] of Object.entries(g.holdings)) {
    const a = assetById(g, id);
    if (!a) continue;
    const r = m.prices[id][s] / m.prices[id][s - 1] - 1;
    if (r <= -0.1) {
      anyMove = true;
      items.push({
        season: s, kind: 'storm', emoji: '⛈️',
        text: bracket === 1 ? `${world.stormWord}! Your ${a.name.toLowerCase()} is worth less right now. Storms pass.` : `${world.stormWord}: ${a.name} ${pct(r, bracket)} this ${world.seasonWord}.`,
      });
    } else if (r >= 0.1) {
      anyMove = true;
      items.push({
        season: s, kind: 'sun', emoji: '☀️',
        text: bracket === 1 ? `${world.sunWord}! Your ${a.name.toLowerCase()} grew a lot.` : `${world.sunWord}: ${a.name} ${pct(r, bracket)} this ${world.seasonWord}.`,
      });
    }
    if (a.risk >= 3 && (r <= -0.12 || (r <= -0.08 && m.stockMove[s] <= -0.08))) stormy.push(id);
  }
  if (!anyMove && Math.abs(m.stockMove[s]) >= 0.1) {
    const down = m.stockMove[s] < 0;
    items.push({
      season: s, kind: down ? 'storm' : 'sun', emoji: down ? '🌧️' : '🌤️',
      text: down
        ? bracket === 1 ? 'Dark clouds over the valley this season.' : `${world.stormWord} across the market this ${world.seasonWord}.`
        : bracket === 1 ? 'The sun is shining on all the farms this season.' : `${world.sunWord} across the market this ${world.seasonWord}.`,
    });
  }

  // 4. scripted story events
  for (const ev of g.scenario.events.filter((e) => e.season === s)) {
    items.push({ season: s, kind: 'news', text: `${ev.title}: ${ev.text}`, emoji: '📰' });
  }

  g.season = s;

  // 5. storm watch
  if (g.storm && s - g.storm.season >= 4) {
    g.stormsSurvived++;
    g.talk.push({
      season: s,
      title: 'Held on through a storm',
      question: 'Ask: "Remember when things dropped a year ago? You kept going. What happened afterwards?" Praise the patience, not the result.',
    });
    g.storm = undefined;
  }
  if (!g.storm && stormy.length > 0) {
    g.storm = { season: s, assets: stormy };
    g.talk.push({
      season: s,
      title: g.stormsSurvived + g.soldInStorm > 0 ? 'Another big drop' : 'First big drop',
      question: 'Ask: "Your investments are worth less this season. What do you want to do, and why?" Explain that drops are normal and usually pass, but let the child decide.',
    });
  }

  // 6. snapshot, peak, goal
  const tot = totalValue(g, m);
  const inv = investedValue(g, m);
  g.history.push({ season: s, total: tot, cash: g.cash, invested: inv, contributions: g.contributions, contribAdj: g.contribAdj, cpi: m.cpi[s], spent: g.spent });
  if (tot < g.peak * 0.85) g.hadDrawdown = true;
  g.peak = Math.max(g.peak, tot);
  const goal = currentGoal(g);
  if (goal && g.goalNotified !== g.goalIndex && tot >= goalCost(g, m)) {
    g.goalNotified = g.goalIndex;
    if (g.goalReachedAt === undefined) g.goalReachedAt = s;
    items.push({ season: s, kind: 'goal', text: `Your ${world.portfolioName.toLowerCase()} is worth enough for your goal: ${goal.name}!`, emoji: goal.emoji });
    g.talk.push({ season: s, title: `Goal in reach: ${goal.name}`, question: 'Ask: "Do you want to buy it now, or keep your money growing for something bigger? What would you have to sell first?"' });
  }
  if (s % 4 === 0 && s / 4 === 1) {
    g.talk.push({ season: s, title: 'First year done', question: `Look at the chart together. Ask: "Which of your choices are you happy with? Which one would you change?"` });
  }

  // 7. finish
  if (s >= m.seasons) {
    if (g.scenario.endless !== false) {
      g.chapters++;
      extendChapter(g);
      items.push({ season: s, kind: 'news', text: `Chapter ${g.chapters} complete! Chapter ${g.chapters + 1} begins: ${g.scenario.years} new years of ${world.name}.`, emoji: '📖' });
      g.talk.push({ season: s, title: `Chapter ${g.chapters} complete`, question: 'Look back at the whole chapter together. Ask: "What was the scariest moment? What are you proud of? What will you do differently in the next chapter?"' });
    } else {
      g.finished = true;
      items.push({ season: s, kind: 'news', text: 'This was the last season of the round. Well played!', emoji: '🏁' });
    }
  }

  g.xp += 5;
  g.log.push(...items);
  const logBefore = g.log.length;
  const unlocks = runChecks(g, m, ctx);
  if (g.hadDrawdown && tot >= g.peak) g.hadDrawdown = false;
  g.updatedAt = Date.now();
  const change = tot - prevTotal - g.scenario.incomePerSeason;
  const base = prevTotal;
  void prevInvested;
  return {
    game: g,
    report: { season: s, items: [...items, ...g.log.slice(logBefore)], change, changePct: base > 0 ? change / base : 0, unlocks, finished: g.finished },
  };
}

/** Advance up to n seasons, merging the reports. */
export function advanceMany(game: Game, m0: Market, ctx: Context, n: number): { game: Game; report: SeasonReport } {
  let g = game;
  let m = m0;
  const all: SeasonReport[] = [];
  for (let i = 0; i < n && !g.finished; i++) {
    if (m.seasons < g.season + 1) m = marketFor(g);
    const r = advance(g, m, ctx);
    g = r.game;
    all.push(r.report);
  }
  if (m.seasons < g.season) m = marketFor(g);
  const first = totalValue(game, m0, game.season);
  const last = totalValue(g, m) - g.scenario.incomePerSeason * all.length;
  const merged: Unlocks = {
    achievements: all.flatMap((r) => r.unlocks.achievements),
    challenges: all.flatMap((r) => r.unlocks.challenges),
    levelUp: all.map((r) => r.unlocks.levelUp).filter(Boolean).pop(),
  };
  // collapse payouts and income into one line each
  const items: LogItem[] = [];
  const sumBy = (kind: 'payout' | 'income') => all.flatMap((r) => r.items).filter((x) => x.kind === kind);
  const inc = sumBy('income');
  if (inc.length) items.push({ ...inc[0], text: `${inc[0].text} ${inc.length}×`, amount: inc.reduce((a, b) => a + (b.amount ?? 0), 0) });
  const pays = sumBy('payout');
  const byText = new Map<string, LogItem>();
  for (const p of pays) {
    const e = byText.get(p.text);
    if (e) e.amount = (e.amount ?? 0) + (p.amount ?? 0);
    else byText.set(p.text, { ...p });
  }
  items.push(...byText.values());
  items.push(...all.flatMap((r) => r.items).filter((x) => x.kind !== 'payout' && x.kind !== 'income'));
  return {
    game: g,
    report: { season: g.season, items, change: last - first, changePct: first > 0 ? (last - first) / first : 0, unlocks: merged, finished: g.finished },
  };
}

/** Convert real time into seasons. Returns null when nothing is due. */
export function catchUp(game: Game, ctx: Context, pace: number | undefined, now = Date.now(), maxSeasons = 400): { game: Game; report: SeasonReport; n: number; from: number } | null {
  normalizeGame(game);
  if (!pace || pace <= 0 || game.finished) return null;
  const due = Math.floor((now - game.lastTick) / pace);
  if (due <= 0) return null;
  const n = Math.min(due, maxSeasons);
  const r = advanceMany(game, marketFor(game), ctx, n);
  r.game.lastTick = game.lastTick + due * pace;
  return { game: r.game, report: r.report, n, from: game.season };
}

export type GoalResult = { ok: true; game: Game; unlocks: Unlocks } | { ok: false; error: string };

/** Spend cash on the current goal; it becomes a decoration in the world. */
export function buyGoal(game: Game, m: Market, ctx: Context): GoalResult {
  const goal = currentGoal(game);
  if (!goal) return { ok: false, error: 'You have bought everything on your list!' };
  const cost = goalCost(game, m);
  if (game.cash + 1e-6 < cost) return { ok: false, error: `You need ${money(cost, ctx.world, ctx.bracket, { ceil: true })} available. Sell something first or wait.` };
  const g = structuredClone(game);
  g.cash -= cost;
  g.spent += cost;
  g.contribAdj = Math.max(0, g.contribAdj - cost);
  g.owned.push({ name: goal.name, emoji: goal.emoji, season: g.season, cost });
  g.goalIndex++;
  g.log.push({ season: g.season, kind: 'goal', text: `You bought: ${goal.name}!`, amount: -cost, emoji: goal.emoji });
  g.talk.push({ season: g.season, title: `Bought ${goal.name}`, question: 'Ask: "Was it worth the wait? How long did you save for it? What is next on your list?"' });
  const unlocks = runChecks(g, m, ctx);
  g.updatedAt = Date.now();
  return { ok: true, game: g, unlocks };
}

export function moneyFmt(v: number, ctx: Context, opts?: { sign?: boolean; ceil?: boolean }) {
  return money(v, ctx.world, ctx.bracket, opts);
}

export function achievementsFor(bracket: Bracket) {
  return ACHIEVEMENTS.filter((a) => !a.minBracket || bracket >= a.minBracket);
}

export { heldKinds };
