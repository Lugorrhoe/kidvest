import { annualReturn, FIRST_YEAR, LAST_YEAR, type SeriesKey } from '../data/history';
import { STOCK_QUARTER_SHAPES } from '../data/shapes';
import { gaussian, hashString, mulberry32 } from './rng';
import type { AssetDef, Scenario } from './types';

/** Typical quarterly wobble (log scale) used to shape a year into four seasons. */
const QUARTER_SD: Record<SeriesKey, number> = {
  stocks: 0.06,
  small: 0.11,
  tbill: 0,
  tbond: 0.03,
  baa: 0.03,
  realestate: 0.015,
  gold: 0.06,
  cpi: 0,
};

export interface Market {
  seasons: number;
  startYear: number;
  /** prices[assetId][s] at the end of season s; s = 0 is the start. */
  prices: Record<string, number[]>;
  /** Cash paid per unit held during season s (index s, 1-based; index 0 unused). */
  payouts: Record<string, number[]>;
  /** Price level, 1 at the start. */
  cpi: number[];
  /** Broad stock market move in season s (for "weather" messages). */
  stockMove: number[];
  /** Calendar year replayed in season s (parents only). */
  years: number[];
}

/** Four quarterly log returns that compound exactly to the year's official return. */
function quarterLogs(series: SeriesKey, year: number, seed: number): number[] {
  const total = Math.log(1 + annualReturn(series, year));
  const base = total / 4;
  const shape = STOCK_QUARTER_SHAPES[year];
  let dev: number[];
  if ((series === 'stocks' || series === 'small') && shape) {
    const logs = shape.map((p) => Math.log(1 + p / 100));
    const m = logs.reduce((a, b) => a + b, 0) / 4;
    const scale = series === 'small' ? 1.4 : 1;
    dev = logs.map((l) => (l - m) * scale);
  } else {
    const sd = QUARTER_SD[series];
    if (sd === 0) return [base, base, base, base];
    const rand = mulberry32(hashString(`${seed}:${series}:${year}`));
    const z = [0, 1, 2, 3].map(() => gaussian(rand));
    const m = z.reduce((a, b) => a + b, 0) / 4;
    dev = z.map((v) => (v - m) * sd);
  }
  return dev.map((d) => base + d);
}

export function clampStartYear(start: number, years: number): number {
  return Math.max(FIRST_YEAR, Math.min(LAST_YEAR - years + 1, Math.round(start)));
}

export function yearSeqFrom(startYear: number, years: number): number[] {
  return Array.from({ length: years }, (_, i) => startYear + i);
}

export function buildMarket(scenario: Scenario, assets: AssetDef[], yearSeq: number[]): Market {
  const seasons = yearSeq.length * 4;
  const startYear = yearSeq[0];
  const years: number[] = [startYear];
  for (let s = 1; s <= seasons; s++) years.push(yearSeq[Math.floor((s - 1) / 4)]);

  const cache = new Map<string, number[]>();
  const seriesLog = (key: SeriesKey): number[] => {
    if (!cache.has(key)) {
      const out: number[] = [0];
      for (const y of yearSeq) out.push(...quarterLogs(key, y, scenario.seed));
      cache.set(key, out);
    }
    return cache.get(key)!;
  };

  const cpiLog = seriesLog('cpi');
  const cpi = [1];
  for (let s = 1; s <= seasons; s++) cpi.push(cpi[s - 1] * Math.exp(cpiLog[s]));
  const stockLog = seriesLog('stocks');
  const stockMove = stockLog.map((l, i) => (i === 0 ? 0 : Math.exp(l) - 1));

  const prices: Record<string, number[]> = {};
  const payouts: Record<string, number[]> = {};
  for (const a of assets) {
    let logs: number[];
    if (a.model.kind === 'series') {
      const lev = a.model.leverage ?? 1;
      logs = seriesLog(a.model.series).map((l) => l * lev);
    } else {
      const { annualReturn: m, volatility: v } = a.model;
      const rand = mulberry32(hashString(`${scenario.seed}:custom:${a.id}`));
      logs = [0];
      for (let s = 1; s <= seasons; s++) logs.push(Math.log(1 + m) / 4 - (v * v) / 8 + (v / 2) * gaussian(rand));
    }
    const p = [a.basePrice];
    const pay = [0];
    for (let s = 1; s <= seasons; s++) {
      const prev = p[s - 1];
      const tr = Math.exp(logs[s]) - 1;
      const payout = prev * (a.payoutYield / 4);
      let next = a.payoutOnTop ? prev * (1 + tr) : prev * (1 + tr) - payout;
      next *= 1 - a.fee / 4;
      for (const ev of scenario.events) {
        if (ev.season === s && ev.shock && (ev.target === a.id || (ev.target === 'all' && a.risk > 1))) next *= 1 + ev.shock;
      }
      p.push(Math.max(0.01, next));
      pay.push(payout);
    }
    prices[a.id] = p;
    payouts[a.id] = pay;
  }
  return { seasons, startYear, prices, payouts, cpi, stockMove, years };
}

/** Long-run yearly swing (standard deviation of annual returns 1928 to 2025) for a series. */
export function typicalSwing(a: AssetDef): number {
  if (a.model.kind === 'custom') return a.model.volatility;
  const vals: number[] = [];
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) vals.push(annualReturn(a.model.series, y) * (a.model.leverage ?? 1));
  const m = vals.reduce((x, y) => x + y, 0) / vals.length;
  return Math.sqrt(vals.reduce((x, y) => x + (y - m) ** 2, 0) / (vals.length - 1));
}
