import { describe, expect, it } from 'vitest';
import { annualReturn } from '../data/history';
import { DEFAULT_SCENARIOS } from '../data/scenarios';
import { WORLDS } from '../data/worlds';
import { resolveAssets } from './assets';
import { advance, buy, contextFor, marketFor, newGame, sell } from './game';
import { totalValue } from './achievements';

describe('market', () => {
  it('four seasons compound to the official annual return (accumulating, fee 0)', () => {
    const sc = DEFAULT_SCENARIOS[2];
    const assets = resolveAssets(sc, []).map((a) => ({ ...a, fee: 0 }));
    const g = newGame('p', sc, assets);
    const m = marketFor(g);
    const acc = m.prices['city.cityacc'];
    for (let y = 0; y < sc.years; y++) {
      const r = acc[(y + 1) * 4] / acc[y * 4] - 1;
      expect(r).toBeCloseTo(annualReturn('stocks', sc.startYear as number + y), 6);
    }
  });
  it('distributing price + payouts equals total return', () => {
    const sc = DEFAULT_SCENARIOS[2];
    const assets = resolveAssets(sc, []).map((a) => ({ ...a, fee: 0 }));
    const g = newGame('p', sc, assets);
    const m = marketFor(g);
    const p = m.prices['city.cityetf'], acc = m.prices['city.cityacc'];
    for (let s = 1; s <= 8; s++) {
      expect((p[s] + m.payouts['city.cityetf'][s]) / p[s - 1]).toBeCloseTo(acc[s] / acc[s - 1], 9);
    }
  });
});

function play(idx: number, alloc: Record<string, number>) {
  const sc = DEFAULT_SCENARIOS[idx];
  const ctx = contextFor({ bracket: sc.bracket, world: sc.world });
  let g = newGame('p', sc, resolveAssets(sc, []));
  const m = marketFor(g);
  const invest = () => {
    for (const [id, w] of Object.entries(alloc)) {
      const units = (g.cash - 2) * w / m.prices[id][g.season];
      const u = sc.bracket === 1 ? Math.floor(units) : units;
      if (u > 0) { const r = buy(g, m, id, u, ctx); if (r.ok) g = r.game; }
    }
  };
  invest();
  while (g.season < sc.years * 4) {
    g = advance(g, m, ctx).game;
    if (g.season % 4 === 0) invest();
  }
  return { g, m, total: totalValue(g, m), goal: sc.goal.amount * m.cpi[m.seasons] };
}

describe('scenarios', () => {
  it('calibration printout', () => {
    for (const [i, a] of [[0, { 'farm.cow': 1 }], [0, { 'farm.cow': 0.5, 'farm.hens': 0.5 }], [0, {}], [1, { 'space.greenhouse': 1 }], [1, { 'space.premium': 1 }], [1, { 'space.solar': 0.6, 'space.satellites': 0.4 }], [1, {}], [2, { 'city.cityacc': 1 }], [2, { 'city.cityacc': 0.6, 'city.bonds': 0.4 }], [2, { 'city.savings': 1 }], [2, {}]] as const) {
      const r = play(i, a as any);
      console.log(DEFAULT_SCENARIOS[i].id, JSON.stringify(a), 'total', r.total.toFixed(0), 'contrib', r.g.contributions, 'goal', r.goal.toFixed(0), 'reached', r.g.goalReachedAt, 'ach', Object.keys(r.g.achievements).join(','), 'ch', Object.keys(r.g.challengesDone).join(','), 'xp', r.g.xp);
    }
    expect(WORLDS.farm).toBeTruthy();
  });
  it('sell restores cash minus fee', () => {
    const sc = DEFAULT_SCENARIOS[2];
    const ctx = contextFor({ bracket: 3, world: 'city' });
    const g = newGame('p', sc, resolveAssets(sc, []));
    const m = marketFor(g);
    const b = buy(g, m, 'city.cityacc', 5, ctx);
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    const s = sell(b.game, m, 'city.cityacc', 5, ctx);
    expect(s.ok).toBe(true);
    if (s.ok) expect(s.game.cash).toBeCloseTo(1000 - 2, 6);
  });
});

import { advanceMany, buyGoal, catchUp } from './game';
import { currentGoal, goalsFor } from './achievements';

describe('continuous play', () => {
  it('starts a new chapter instead of ending, with prices continuing smoothly', () => {
    const sc = DEFAULT_SCENARIOS[0];
    const ctx = contextFor({ bracket: 1, world: 'farm' });
    let g = newGame('p', sc, resolveAssets(sc, []));
    const m = marketFor(g);
    const r = buy(g, m, 'farm.cow', 2, ctx);
    if (r.ok) g = r.game;
    g = advanceMany(g, m, ctx, 45).game;
    expect(g.finished).toBe(false);
    expect(g.chapters).toBe(1);
    expect(g.yearSeq.length).toBe(20);
    expect(g.yearSeq[10]).toBe(2013);
    const m2 = marketFor(g);
    expect(m2.prices['farm.cow'][40]).toBeCloseTo(m.prices['farm.cow'][40], 9);
    expect(g.season).toBe(45);
  });
  it('wraps to an earlier year after 2025', () => {
    const sc = DEFAULT_SCENARIOS[2];
    const ctx = contextFor({ bracket: 3, world: 'city' });
    let g = newGame('p', sc, resolveAssets(sc, []));
    g = advanceMany(g, marketFor(g), ctx, 84).game;
    expect(g.yearSeq[20]).toBe(2025);
    expect(g.yearSeq[21]).toBeLessThan(2025);
    expect(g.yearSeq[21]).toBeGreaterThanOrEqual(1950);
  });
  it('converts elapsed real time into seasons', () => {
    const sc = DEFAULT_SCENARIOS[1];
    const ctx = contextFor({ bracket: 2, world: 'space' });
    const g = newGame('p', sc, resolveAssets(sc, []));
    const day = 86_400_000;
    expect(catchUp(g, ctx, day, g.lastTick + day * 0.5)).toBeNull();
    const c = catchUp(g, ctx, day, g.lastTick + day * 3.2)!;
    expect(c.n).toBe(3);
    expect(c.game.season).toBe(3);
    expect(c.game.lastTick).toBe(g.lastTick + 3 * day);
    expect(catchUp(g, ctx, 0, g.lastTick + day * 9)).toBeNull();
  });
  it('goal ladder is sorted and buying moves to the next goal', () => {
    const sc = DEFAULT_SCENARIOS[0];
    const ctx = contextFor({ bracket: 1, world: 'farm' });
    let g = newGame('p', { ...sc, startCash: 400 }, resolveAssets(sc, []));
    const m = marketFor(g);
    const goals = goalsFor(g);
    expect(goals[0].name).toBe('Farm dog');
    expect(goals.map((x) => x.amount)).toEqual([...goals.map((x) => x.amount)].sort((a, b) => a - b));
    const r = buyGoal(g, m, ctx);
    expect(r.ok).toBe(true);
    if (r.ok) g = r.game;
    expect(g.cash).toBeCloseTo(150, 6);
    expect(g.owned[0].name).toBe('Farm dog');
    expect(currentGoal(g)?.name).toBe('Red tractor');
    expect(g.achievements.bought_goal).toBe(0);
  });
});

import { evaluateRewards, makeBaseline, type Reward } from './rewards';

function mkReward(g: ReturnType<typeof newGame>, m: ReturnType<typeof marketFor>, cond: Reward['condition'], deadline?: number): Reward {
  return { id: 'r', profileId: 'p', title: 't', emoji: '🎁', kind: 'gift', condition: cond, createdAt: 1000, deadline, baseline: makeBaseline(g, m), status: 'active' };
}

describe('real-life rewards', () => {
  const sc = DEFAULT_SCENARIOS[0];
  const ctx = contextFor({ bracket: 1, world: 'farm' });
  it('own_kinds is earned once the child holds three kinds', () => {
    let g = newGame('p', sc, resolveAssets(sc, []));
    const m = marketFor(g);
    const r = mkReward(g, m, { type: 'own_kinds', target: 3 });
    expect(evaluateRewards([r], g, m, 2000).achieved).toHaveLength(0);
    for (const [id, u] of [['farm.cow', 1], ['farm.hens', 1], ['farm.pig', 1]] as const) { const b = buy(g, m, id, u, ctx); if (b.ok) g = b.game; }
    const res = evaluateRewards([r], g, m, 2000);
    expect(res.achieved).toHaveLength(1);
    expect(res.achieved[0].status).toBe('achieved');
  });
  it('no_panic fails when the child sells during a storm and succeeds after the seasons otherwise', () => {
    let g = newGame('p', sc, resolveAssets(sc, []));
    const m = marketFor(g);
    const b = buy(g, m, 'farm.cow', 3, ctx); if (b.ok) g = b.game;
    g = advanceMany(g, m, ctx, 20).game; // 2003-2007, calm
    const r = mkReward(g, m, { type: 'no_panic', target: 1, seasons: 8 });
    g = advanceMany(g, m, ctx, 4).game; // into 2008
    expect(evaluateRewards([r], g, m).achieved).toHaveLength(0);
    const r2 = { ...r };
    g = advanceMany(g, m, ctx, 4).game;
    expect(evaluateRewards([r2], g, m).achieved).toHaveLength(1);
    // a sibling who panics
    let h = newGame('q', sc, resolveAssets(sc, []));
    const b2 = buy(h, m, 'farm.cow', 3, ctx); if (b2.ok) h = b2.game;
    h = advanceMany(h, m, ctx, 23).game;
    const r3 = mkReward(h, m, { type: 'no_panic', target: 1, seasons: 8 });
    h = advance(h, m, ctx).game; // 2008 Q4 storm
    expect(h.storm).toBeTruthy();
    const s = sell(h, m, 'farm.cow', 3, ctx); if (s.ok) h = s.game;
    const res = evaluateRewards([r3], h, m);
    expect(res.changed[0].status).toBe('expired');
    expect(res.changed[0].violated).toBe(true);
  });
  it('a timed reward expires after its deadline', () => {
    const g = newGame('p', sc, resolveAssets(sc, []));
    const m = marketFor(g);
    const r = mkReward(g, m, { type: 'badges', target: 1 }, 5000);
    expect(evaluateRewards([r], g, m, 4000).changed).toHaveLength(0);
    expect(evaluateRewards([r], g, m, 6000).changed[0].status).toBe('expired');
  });
});

import { dailyState } from './daily';
import { yearReport, yearReview, levelOf } from './forecast';

describe('daily rhythm and forecasts', () => {
  const sc = DEFAULT_SCENARIOS[0];
  const ctx = contextFor({ bracket: 1, world: 'farm' });
  const prof = { mode: 'daily' as const, unlockHour: 10, pace: 0 };
  it('allows four seasons, then locks until the unlock hour next day', () => {
    let g = newGame('p', sc, resolveAssets(sc, []));
    const m = marketFor(g);
    const d0 = dailyState(g, prof, new Date('2026-10-20T15:00:00'));
    expect(d0.seasonsLeft).toBe(4);
    expect(d0.newYear).toBe(true);
    g = advanceMany(g, m, ctx, 4).game;
    g.lastYearDay = '2026-10-20';
    expect(dailyState(g, prof, new Date('2026-10-20T20:00:00')).locked).toBe(true);
    expect(dailyState(g, prof, new Date('2026-10-21T08:00:00')).locked).toBe(true);
    const d = dailyState(g, prof, new Date('2026-10-21T10:00:00'));
    expect(d.locked).toBe(false);
    expect(d.seasonsLeft).toBe(4);
    // mid-year is never locked
    g = advance(g, m, ctx).game;
    expect(dailyState(g, prof, new Date('2026-10-21T10:30:00')).seasonsLeft).toBe(3);
  });
  it('bracket 1 forecasts are always truthful; 2008 is a storm warning', () => {
    const g = newGame('p', sc, resolveAssets(sc, []));
    const m = marketFor(g);
    const r = yearReport(g, m, ctx, 5); // 2008
    expect(r.items.every((i) => i.truthful)).toBe(true);
    const cow = r.items.find((i) => i.names.includes('Cow'))!;
    expect(cow.claimed).toBe('crash');
    expect(r.intro).toMatch(/storm/i);
    expect(levelOf(-0.3655)).toBe('crash');
  });
  it('bracket 3 forecasts can be wrong, and the review reports it', () => {
    const scC = DEFAULT_SCENARIOS[2];
    const ctxC = contextFor({ bracket: 3, world: 'city' });
    let g = newGame('p', scC, resolveAssets(scC, []));
    const m = marketFor(g);
    let wrong = 0;
    for (let y = 0; y < 20; y++) wrong += yearReport(g, m, ctxC, y).items.filter((i) => !i.truthful).length;
    expect(wrong).toBeGreaterThan(0);
    const b = buy(g, m, 'city.cityacc', 5, ctxC); if (b.ok) g = b.game;
    g = advanceMany(g, m, ctxC, 4).game;
    const rv = yearReview(g, m, ctxC, 0);
    expect(rv.perAsset[0].name).toBe('Whole City Index Fund (Acc)');
    expect(rv.checks.length).toBeGreaterThan(3);
  });
});
