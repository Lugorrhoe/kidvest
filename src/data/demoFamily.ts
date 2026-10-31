import { DEFAULT_SCENARIOS } from './scenarios';
import { WORLDS } from './worlds';
import { resolveAssets } from '../engine/assets';
import { advance, buy, contextFor, marketFor, newGame } from '../engine/game';
import type { AssetDef, Bracket, Game, WorldId } from '../engine/types';

/**
 * The demo family starts in the middle of a round so the worlds are already full of life.
 * Plans: [assetId, units at the start], then every year part of the new cash is invested again.
 */
export interface DemoChild {
  name: string;
  avatar: string;
  bracket: Bracket;
  world: WorldId;
  seasons: number;
  start: [string, number][];
  yearly: [string, number][];
}

export const DEMO_FAMILY: DemoChild[] = [
  { name: 'Thanja', avatar: '🦊', bracket: 1, world: 'farm', seasons: 20, start: [['farm.cow', 2], ['farm.tree', 1], ['farm.hens', 2], ['farm.pig', 1]], yearly: [['farm.cow', 0.5], ['farm.hens', 0.3]] },
  { name: 'Noah', avatar: '🐼', bracket: 2, world: 'space', seasons: 16, start: [['space.greenhouse', 1.5], ['space.solar', 1], ['space.rocket', 2], ['space.satellites', 1.6], ['space.crystal', 0.6]], yearly: [['space.greenhouse', 0.4], ['space.rocket', 0.2]] },
  { name: 'Emilia', avatar: '🦉', bracket: 3, world: 'city', seasons: 12, start: [['city.cityacc', 6], ['city.bonds', 5], ['city.gold', 1.5], ['city.startup', 2]], yearly: [['city.cityacc', 0.5], ['city.bonds', 0.25]] },
];

/** Pure: builds a demo child's game state deterministically (no persistence). */
export function buildDemoGame(d: DemoChild, profileId: string, custom: AssetDef[] = []): Game {
  const sc = DEFAULT_SCENARIOS.find((s) => s.id === WORLDS[d.world].defaultScenarioId)!;
  const ctx = contextFor(d);
  let g = newGame(profileId, sc, resolveAssets(sc, custom));
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
  return g;
}
