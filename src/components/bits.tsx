import type { AssetDef, Bracket } from '../engine/types';
import { cx, Emoji } from '../lib/ui';

export function weatherOf(risk: number) {
  if (risk <= 2) return { emoji: '🌤️', label: 'Calm', color: '#2f9e44', bg: '#ebf8ee' };
  if (risk === 3) return { emoji: '🌦️', label: 'Bumpy', color: '#e67700', bg: '#fff4e0' };
  return { emoji: '⛈️', label: 'Wild', color: '#c92a2a', bg: '#fff0f0' };
}

const RISK_WORDS = ['', 'Very calm', 'Calm', 'Medium', 'Wild', 'Very wild'];
const RISK_COLORS = ['', '#2f9e44', '#74b816', '#f59f00', '#f76707', '#e03131'];

export function RiskBadge({ risk, bracket, swing }: { risk: number; bracket: Bracket; swing?: number }) {
  if (bracket === 1) {
    const w = weatherOf(risk);
    return (
      <span className="chip" style={{ background: w.bg, color: w.color }}>
        <Emoji e={w.emoji} /> {w.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600" title={RISK_WORDS[risk]}>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="h-2.5 w-1.5 rounded-sm" style={{ background: i <= risk ? RISK_COLORS[risk] : '#dfe3e8' }} />
        ))}
      </span>
      {bracket === 2 ? RISK_WORDS[risk] : `Risk ${risk}/5`}
      {bracket === 3 && swing !== undefined && <span className="font-normal text-ink-400">· ±{Math.round(swing * 100)} %/yr</span>}
    </span>
  );
}

export function Sparkline({ values, width = 96, height = 32, color }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (values.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 3 - ((v - min) / span) * (height - 6)]);
  const up = values[values.length - 1] >= values[0];
  const c = color ?? (up ? '#0f9d58' : '#e5484d');
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={pts.map((p) => p.join(',')).join(' ')} />
    </svg>
  );
}

export function AssetIcon({ asset, size = 'md' }: { asset: Pick<AssetDef, 'emoji'>; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const s = { sm: 'h-9 w-9 text-lg', md: 'h-11 w-11 text-2xl', lg: 'h-14 w-14 text-3xl', xl: 'h-20 w-20 text-5xl' }[size];
  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-2xl', s)} style={{ background: 'var(--soft)' }}>
      <Emoji e={asset.emoji} />
    </div>
  );
}

export function Delta({ value, text, className = '' }: { value: number; text: string; className?: string }) {
  const c = value > 0.00001 ? 'text-gain' : value < -0.00001 ? 'text-loss' : 'text-ink-500';
  return <span className={cx('num font-semibold', c, className)}>{text}</span>;
}
