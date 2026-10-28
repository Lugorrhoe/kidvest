import type { World } from '../data/worlds';
import type { Bracket } from './types';

export function money(v: number, world: World, bracket: Bracket, opts: { sign?: boolean; ceil?: boolean } = {}): string {
  const decimals = bracket === 3 ? 2 : 0;
  let x = v;
  if (decimals === 0) x = opts.ceil ? Math.ceil(v - 1e-9) : bracket === 1 && !opts.sign ? Math.floor(v + 1e-9) : Math.round(v);
  const abs = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = x < 0 ? '−' : opts.sign && x > 0 ? '+' : '';
  const { symbol, prefix } = world.currency;
  const sym = symbol === 'coins' && Math.abs(x) === 1 ? 'coin' : symbol;
  return prefix ? `${sign}${symbol}${abs}` : `${sign}${abs} ${sym}`;
}

export function pct(v: number, bracket: Bracket, sign = true): string {
  const d = bracket === 3 ? 1 : 0;
  const s = (Math.abs(v) * 100).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pre = v < -0.00005 ? '−' : sign && v > 0.00005 ? '+' : '';
  return `${pre}${s} %`;
}

export function units(u: number, bracket: Bracket): string {
  if (bracket === 1) return String(Math.round(u));
  const d = bracket === 2 ? 2 : 3;
  return u.toLocaleString('en-US', { maximumFractionDigits: d });
}
