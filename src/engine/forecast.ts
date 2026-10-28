import { annualReturn, type SeriesKey } from '../data/history';
import type { World } from '../data/worlds';
import type { Context } from './game';
import type { Market } from './market';
import { hashString, mulberry32 } from './rng';
import type { AssetDef, Bracket, Game } from './types';

export type Level = 'boom' | 'up' | 'flat' | 'down' | 'crash';

export function levelOf(r: number): Level {
  if (r >= 0.2) return 'boom';
  if (r >= 0.05) return 'up';
  if (r > -0.05) return 'flat';
  if (r > -0.2) return 'down';
  return 'crash';
}

const FLIP: Record<Level, Level> = { boom: 'crash', up: 'down', flat: 'up', down: 'up', crash: 'boom' };

export interface ForecastItem {
  emoji: string;
  names: string;
  assetIds: string[];
  text: string;
  kind: 'forecast' | 'rumour' | 'consensus';
  claimed: Level;
  actual: Level;
  truthful: boolean;
}

export interface YearReport {
  yearIndex: number;
  yearLabel: string;
  title: string;
  intro: string;
  items: ForecastItem[];
  priceNote: string;
  closing: string;
}

/** Yearly return of an asset over game year `y`, including payouts. */
export function assetYearReturn(a: AssetDef, g: Game, m: Market, y: number): number {
  if (a.model.kind === 'series') return annualReturn(a.model.series, g.yearSeq[y]) * (a.model.leverage ?? 1);
  const p = m.prices[a.id];
  const s0 = y * 4;
  const s1 = Math.min(m.seasons, s0 + 4);
  let pay = 0;
  for (let s = s0 + 1; s <= s1; s++) pay += m.payouts[a.id]?.[s] ?? 0;
  return (p[s1] + pay) / p[s0] - 1;
}

type Tpl = Record<Level, string>;
const T: Record<string, Partial<Record<SeriesKey | 'custom', Tpl>>> = {
  farm: {
    stocks: {
      boom: 'The weather people expect a wonderful year: warm sun and soft rain. Grass and fruit will grow like never before, so {names} should do very well.',
      up: 'A good farming year is expected with plenty of sunshine. {names} should grow nicely.',
      flat: 'An ordinary year: some sun, some clouds. {names} will probably stay about the same.',
      down: 'Farmer Jo smells storms coming. {names} may be worth less for a while. Storms pass.',
      crash: 'A hard year is expected with big storms. {names} could lose a lot of their value this year. Brave farmers hold on.',
    },
    small: {
      boom: 'The vet says this will be a great year for {names}: they could grow huge!',
      up: '{names} should grow well this year.',
      flat: 'Nothing special expected for {names}.',
      down: 'The vet warns that some {names} might get sick this year.',
      crash: 'The vet is worried: a sickness is going around, and {names} could shrink a lot.',
    },
    tbond: {
      boom: '{names} will lay lots of eggs and be worth more this year.',
      up: '{names} will lay eggs steadily and grow a little.',
      flat: '{names} will lay eggs as always.',
      down: '{names} will still lay eggs, but they will be worth a bit less this year.',
      crash: 'A tough year even for {names}: fewer eggs and a lower value.',
    },
    gold: {
      boom: 'Everyone wants honey this year! {names} could be worth much more.',
      up: 'Honey is popular this year. {names} should gain value.',
      flat: 'Honey sells as usual, so {names} should keep their value.',
      down: 'Fewer people want honey this year. {names} may lose some value.',
      crash: 'Nobody is buying honey this year. {names} could lose a lot.',
    },
  },
  space: {
    stocks: {
      boom: 'Mission control expects strong solar winds all year. Stations and greenhouses like {names} should grow a lot.',
      up: 'A calm, bright year ahead. {names} should grow steadily.',
      flat: 'A quiet orbit is expected. {names} will probably move little.',
      down: 'Space dust and some meteor showers are expected. {names} could lose value for a while.',
      crash: 'Red alert in the forecast: heavy meteor storms. {names} may fall hard this year.',
    },
    small: {
      boom: 'Engineers are excited: new rocket engines could make {names} shoot up.',
      up: 'A promising year for {names}.',
      flat: 'No big launches planned for {names}.',
      down: 'Several test rockets are expected to fail. {names} could fall.',
      crash: 'A dangerous year for {names}: many launches may explode on the pad.',
    },
    tbond: {
      boom: 'The council will pay generous interest. {names} should gain value.',
      up: '{names} pay their interest and should grow a little.',
      flat: '{names} will pay interest as planned.',
      down: 'Interest rates are rising, so {names} may lose a little value.',
      crash: 'Sharply rising rates: even {names} could fall this year.',
    },
    gold: {
      boom: 'Crystal fever! {names} could become very valuable.',
      up: 'Demand for crystals is growing. {names} should gain.',
      flat: 'Crystal prices should hold steady for {names}.',
      down: 'Fewer traders want crystals. {names} may lose some value.',
      crash: 'Crystal prices could collapse this year. {names} at risk.',
    },
    tbill: {
      boom: 'The Fuel Bank will pay high interest this year.',
      up: 'The Fuel Bank pays decent interest.',
      flat: 'The Fuel Bank pays a little interest.',
      down: 'The Fuel Bank pays almost no interest this year.',
      crash: 'The Fuel Bank pays almost no interest this year.',
    },
  },
  city: {
    stocks: {
      boom: 'Analysts expect a strong economy and rising profits. Broad equity funds like {names} should have an excellent year.',
      up: 'Moderate growth expected. {names} should rise.',
      flat: 'Analysts expect a sideways market. {names} may end roughly where they started.',
      down: 'Recession risk is rising. {names} could fall this year.',
      crash: 'Analysts warn of a severe downturn. {names} could lose a large part of their value.',
    },
    small: {
      boom: 'Venture capital is flowing and small companies are booming. {names} could surge.',
      up: 'A decent year for small companies. {names} should gain.',
      flat: 'Mixed outlook for small companies. {names} may move sideways.',
      down: 'Small companies are under pressure. {names} could fall.',
      crash: 'Credit is drying up for small companies. {names} may crash.',
    },
    tbond: {
      boom: 'Interest rates are expected to fall, which lifts bond prices. {names} should gain.',
      up: 'Stable rates: {names} pay their coupons and may rise slightly.',
      flat: '{names} should mostly deliver their coupons.',
      down: 'Rising interest rates would push bond prices down. {names} may lose value.',
      crash: 'Sharply rising rates: {names} could have an unusually bad year.',
    },
    gold: {
      boom: 'Investors are nervous and buying gold. {names} could rise strongly.',
      up: 'Gold demand is firm. {names} should gain.',
      flat: '{names} will likely tread water.',
      down: 'With calmer markets, gold may lose its shine. {names} could fall.',
      crash: 'Gold could drop sharply as investors move back into stocks. {names} at risk.',
    },
    realestate: {
      boom: 'House prices are expected to jump. {names} should gain strongly.',
      up: 'Property prices should rise moderately. {names} should gain.',
      flat: 'Flat housing market expected for {names}.',
      down: 'House prices may fall this year. {names} could lose value.',
      crash: 'A housing bust is feared. {names} could fall hard.',
    },
    tbill: {
      boom: 'Savings accounts will pay high interest this year.',
      up: 'Savings accounts pay solid interest.',
      flat: 'Savings accounts pay a little interest.',
      down: 'Savings accounts pay next to nothing this year.',
      crash: 'Savings accounts pay next to nothing this year.',
    },
  },
};

const CUSTOM_TPL: Tpl = {
  boom: '{names} could have an outstanding year.',
  up: '{names} should do well this year.',
  flat: '{names} will probably move little.',
  down: '{names} may lose value this year.',
  crash: '{names} could fall hard this year.',
};

function tplFor(world: World, a: AssetDef, level: Level): string {
  const key: SeriesKey | 'custom' = a.model.kind === 'series' ? a.model.series : 'custom';
  const t = T[world.id]?.[key] ?? (key === 'custom' ? CUSTOM_TPL : T.city[key]) ?? CUSTOM_TPL;
  return t[level];
}

function band(r: number): string {
  const c = Math.round((r * 100) / 5) * 5;
  const f = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x)} %`;
  return `${f(c - 10)} to ${f(c + 10)}`;
}

function levelReturn(level: Level, r: number): number {
  // a representative return for a claimed level (used when a forecast is deliberately wrong)
  if (levelOf(r) === level) return r;
  return { boom: 0.25, up: 0.1, flat: 0, down: -0.1, crash: -0.3 }[level];
}

function priceNoteFor(world: World, bracket: Bracket, cpi: number): string {
  const p = Math.round(cpi * 100);
  if (world.id === 'farm') {
    if (cpi >= 0.05) return 'Everything at the market will cost a lot more this year. Coins in the barn buy less.';
    if (cpi >= 0.025) return 'Things at the market will cost a bit more this year.';
    if (cpi <= 0) return 'Prices at the market will not rise this year.';
    return 'Prices at the market will rise only a little.';
  }
  const where = world.id === 'space' ? 'at the starbase' : 'in the shops';
  if (bracket === 2) return cpi >= 0.05 ? `Prices ${where} will rise fast this year (about ${p} %). Idle credits lose buying power.` : cpi <= 0 ? `Prices ${where} will stay flat this year.` : `Prices ${where} will rise about ${p} % this year.`;
  return cpi >= 0.05 ? `Inflation is expected to run hot, around ${p} %. Cash loses buying power quickly.` : cpi <= 0 ? 'Inflation is expected to be close to zero or negative.' : `Inflation is expected around ${p} %.`;
}

/** The report shown at the start of a game year. Deterministic for a given game and year. */
export function yearReport(g: Game, m: Market, ctx: Context, yearIndex: number): YearReport {
  const { world, bracket } = ctx;
  const y = g.yearSeq[yearIndex];
  const rand = mulberry32(hashString(`${g.scenario.seed}:forecast:${y}:${yearIndex}`));
  // group assets by series so cow and apple tree share one sentence
  const groups = new Map<string, AssetDef[]>();
  for (const a of g.assets) {
    const key = a.model.kind === 'series' ? a.model.series : `custom:${a.id}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  const items: ForecastItem[] = [];
  for (const [, as] of groups) {
    const a = as[0];
    if (a.model.kind === 'series' && a.model.series === 'tbill' && bracket === 1) continue;
    const r = assetYearReturn(a, g, m, yearIndex);
    const actual = levelOf(r);
    let claimed = actual;
    let kind: ForecastItem['kind'] = bracket === 3 ? 'consensus' : 'forecast';
    // older children get realistic, fallible forecasts
    if (bracket === 3 && a.risk >= 2 && rand() < 0.25) claimed = FLIP[actual];
    const names = as.map((x) => x.name).join(' and ');
    let text = tplFor(world, a, claimed).replace('{names}', names);
    if (bracket >= 2 && a.risk >= 2) text += ` Expected: ${band(levelReturn(claimed, r))}.`;
    items.push({ emoji: a.emoji, names, assetIds: as.map((x) => x.id), text, kind, claimed, actual, truthful: claimed === actual });
  }
  // a rumour for the middle group: may be true or false
  if (bracket === 2) {
    const risky = g.assets.filter((a) => a.risk >= 4);
    if (risky.length) {
      const a = risky[Math.floor(rand() * risky.length)];
      const r = assetYearReturn(a, g, m, yearIndex);
      const actual = levelOf(r);
      const truthful = rand() < 0.5;
      const claimed = truthful ? actual : FLIP[actual];
      const dir = claimed === 'boom' || claimed === 'up' ? 'will shoot up' : claimed === 'flat' ? 'will go nowhere' : 'will crash';
      items.push({ emoji: '🗣️', names: a.name, assetIds: [a.id], text: `Rumour in the shipyard: "${a.name} ${dir} this year!" Rumours are often wrong.`, kind: 'rumour', claimed, actual, truthful });
    }
  }
  // order: biggest movers first
  items.sort((x, y2) => Math.abs(['crash', 'down', 'flat', 'up', 'boom'].indexOf(y2.claimed) - 2) - Math.abs(['crash', 'down', 'flat', 'up', 'boom'].indexOf(x.claimed) - 2));
  const cpi = annualReturn('cpi', y);
  const stocks = g.assets.find((a) => a.model.kind === 'series' && a.model.series === 'stocks');
  const mood = stocks ? levelOf(assetYearReturn(stocks, g, m, yearIndex)) : 'flat';
  const yearLabel = `Year ${yearIndex + 1}`;
  const intro = {
    farm: { boom: 'Farmer Jo has read the clouds, the almanac and the ants. This looks like a wonderful year.', up: 'Farmer Jo expects a good year on Sunny Hill.', flat: 'Farmer Jo expects an ordinary year. Nothing to worry about.', down: 'Farmer Jo looks at the sky and frowns. Storms may come this year.', crash: 'Farmer Jo warns: this could be a very stormy year. Hold on to your animals.' },
    space: { boom: 'Mission control briefing: excellent conditions expected across the sector.', up: 'Mission control briefing: a solid year ahead.', flat: 'Mission control briefing: a quiet year with little change expected.', down: 'Mission control briefing: turbulence ahead. Keep calm, commander.', crash: 'Mission control briefing: red alert. Heavy storms are forecast for the whole year.' },
    city: { boom: 'Economic outlook: analysts are optimistic about growth, profits and jobs.', up: 'Economic outlook: moderate growth expected.', flat: 'Economic outlook: a sideways year with mixed signals.', down: 'Economic outlook: analysts see rising risks and a possible downturn.', crash: 'Economic outlook: a severe recession is feared. Expect volatility.' },
  }[world.id][mood];
  const closing = bracket === 1
    ? 'Forecasts help you plan, but remember: the farm rewards patience. Four seasons today, then the farm rests until tomorrow.'
    : bracket === 2
      ? 'You have four quarters today. Think about what you buy, hold or sell. Rumours can be wrong; plans are better than panic.'
      : 'Analysts are right roughly two out of three times. Use the outlook as one input, not an order. Four quarters today.';
  return { yearIndex, yearLabel, title: `${yearLabel} report`, intro, items, priceNote: priceNoteFor(world, bracket, cpi), closing };
}

export interface YearReview {
  yearIndex: number;
  change: number;
  changePct: number;
  perAsset: { emoji: string; name: string; r: number; delta: number }[];
  checks: { text: string; truthful: boolean; kind: ForecastItem['kind']; emoji: string; names: string }[];
}

/** What actually happened in a finished game year, compared with the report. */
export function yearReview(g: Game, m: Market, ctx: Context, yearIndex: number): YearReview {
  const s0 = yearIndex * 4;
  const s1 = s0 + 4;
  const h0 = g.history.find((h) => h.season === s0);
  const h1 = g.history.find((h) => h.season === s1);
  const income = g.scenario.incomePerSeason * 4;
  const spentDiff = (h1?.spent ?? 0) - (h0?.spent ?? 0);
  const change = h0 && h1 ? h1.total + spentDiff - h0.total - income : 0;
  const base = h0?.total ?? 1;
  const perAsset = g.assets
    .map((a) => {
      const units = g.holdings[a.id] ?? 0;
      let pay = 0;
      for (let s = s0 + 1; s <= s1; s++) pay += units * (m.payouts[a.id]?.[s] ?? 0);
      return { emoji: a.emoji, name: a.name, r: assetYearReturn(a, g, m, yearIndex), delta: units * (m.prices[a.id][s1] - m.prices[a.id][s0]) + pay, units };
    })
    .filter((x) => x.units > 0)
    .sort((a, b) => b.delta - a.delta);
  const rep = yearReport(g, m, ctx, yearIndex);
  const checks = rep.items.map((it) => ({ text: it.text, truthful: it.truthful, kind: it.kind, emoji: it.emoji, names: it.names }));
  return { yearIndex, change, changePct: base > 0 ? change / base : 0, perAsset, checks };
}
