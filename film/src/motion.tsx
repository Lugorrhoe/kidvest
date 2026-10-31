import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { Emoji, Logo } from '../../src/lib/ui';
import { HEIGHT, WIDTH } from './timeline';

/* ------------------------------------------------------------------ easing and tweens */
export const EASE = {
  enter: Easing.bezier(0.2, 0.7, 0.1, 1),
  inOut: Easing.bezier(0.45, 0, 0.15, 1),
  out: Easing.out(Easing.cubic),
  linear: Easing.linear,
};

/** Clamped interpolation between two frames. */
export function tw(frame: number, from: number, to: number, a: number, b: number, easing = EASE.inOut) {
  if (to <= from) return frame >= to ? b : a;
  return interpolate(frame, [from, to], [a, b], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
}

export const fadeIn = (frame: number, start: number, d = 18) => tw(frame, start, start + d, 0, 1, EASE.out);
export const fadeOut = (frame: number, end: number, d = 15) => tw(frame, end - d, end, 1, 0, EASE.out);
export const within = (frame: number, start: number, end: number) => frame >= start && frame < end;

/* ------------------------------------------------------------------ stage */
const ACCENT: Record<string, string> = { farm: 'rgba(47,158,68,.22)', space: 'rgba(95,61,196,.28)', city: 'rgba(12,133,153,.22)', none: 'rgba(0,0,0,0)' };

export function Stage({ accent = 'none', children, style }: { accent?: 'farm' | 'space' | 'city' | 'none'; children?: ReactNode; style?: CSSProperties }) {
  return (
    <AbsoluteFill style={{ background: '#14171d', fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif', overflow: 'hidden', ...style }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 55%, ${ACCENT[accent]}, rgba(0,0,0,0) 70%)` }} />
      {children}
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ camera */
export interface CamKey { frame: number; scale: number; x: number; y: number }

/** Piecewise camera between keyframes (scale about the stage centre, then translate). */
export function camAt(frame: number, keys: CamKey[]): { scale: number; x: number; y: number } {
  if (frame <= keys[0].frame) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame <= b.frame) {
      return { scale: tw(frame, a.frame, b.frame, a.scale, b.scale), x: tw(frame, a.frame, b.frame, a.x, b.x), y: tw(frame, a.frame, b.frame, a.y, b.y) };
    }
  }
  return keys[keys.length - 1];
}

/** Translate needed to bring stage point (px, py) to the centre at a given scale. */
export const focus = (px: number, py: number, scale: number) => ({ x: (WIDTH / 2 - px) * scale, y: (HEIGHT / 2 - py) * scale });

export function Camera({ keys, children }: { keys: CamKey[]; children: ReactNode }) {
  const frame = useCurrentFrame();
  const c = camAt(frame, keys);
  return (
    <AbsoluteFill style={{ transform: `translate(${c.x}px, ${c.y}px) scale(${c.scale})`, transformOrigin: '50% 50%' }}>
      {children}
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ product frame */
const WORLD_VARS: Record<string, CSSProperties> = {
  farm: { '--accent': '#2f9e44', '--accent-dark': '#237032', '--soft': '#ebf8ee' } as CSSProperties,
  space: { '--accent': '#5f3dc4', '--accent-dark': '#43298c', '--soft': '#f1edff' } as CSSProperties,
  city: { '--accent': '#0c8599', '--accent-dark': '#0b6575', '--soft': '#e3f6f8' } as CSSProperties,
};

/** The product UI floating on the stage at its natural width, like a device-less screen. */
export function ProductFrame({ world, width = 1240, x = (WIDTH - 1240) / 2, y, children, style, bracket = 1 }: { world: 'farm' | 'space' | 'city'; width?: number; x?: number; y?: number; children: ReactNode; style?: CSSProperties; bracket?: 1 | 2 | 3 }) {
  return (
    <div className={bracket === 1 ? 'text-[17px]' : 'text-[15px]'} style={{ position: 'absolute', left: x, top: y, width, color: '#14171d', ...WORLD_VARS[world], ...style }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ typography */
const SIZE = { s: 34, m: 56, l: 72, xl: 96 };

export function Caption({ text, start, end, size = 'm', y = HEIGHT - 150, align = 'center', color = '#fff', weight = 700 }: { text: string; start: number; end: number; size?: keyof typeof SIZE; y?: number; align?: 'center' | 'left'; color?: string; weight?: number }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const words = text.split(' ');
  const out = fadeOut(frame, end);
  return (
    <div style={{ position: 'absolute', top: y, left: align === 'center' ? 0 : 120, width: align === 'center' ? WIDTH : WIDTH - 240, textAlign: align, fontSize: SIZE[size], fontWeight: weight, letterSpacing: '-0.02em', color, opacity: out, lineHeight: 1.1, textShadow: '0 2px 24px rgba(0,0,0,.35)' }}>
      {words.map((w, i) => {
        const s = start + i * 4;
        const o = fadeIn(frame, s, 14);
        const dy = tw(frame, s, s + 14, 10, 0, EASE.out);
        return <span key={i} style={{ display: 'inline-block', opacity: o, transform: `translateY(${dy}px)`, marginRight: '0.26em' }}>{w}</span>;
      })}
    </div>
  );
}

export function ChapterLabel({ text, start, end = Infinity }: { text: string; start: number; end?: number }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const o = Math.min(fadeIn(frame, start, 20), end === Infinity ? 1 : fadeOut(frame, end));
  return <div style={{ position: 'absolute', top: 48, left: 72, fontSize: 18, fontWeight: 600, letterSpacing: '0.32em', color: 'rgba(255,255,255,.6)', opacity: o }}>{text}</div>;
}

export function Wordmark({ start, end = Infinity }: { start: number; end?: number }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  return <div style={{ position: 'absolute', left: 72, bottom: 44, opacity: 0.45 * Math.min(fadeIn(frame, start, 20), end === Infinity ? 1 : fadeOut(frame, end, 16)) }}><Logo dark small /></div>;
}

/** Amber annotation styled like the Reports tab's "Real history replayed (only you see this)" tag. */
export function ParentTag({ text, start, end, x, y, small }: { text: string; start: number; end: number; x: number; y: number; small?: string }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const o = Math.min(fadeIn(frame, start, 14), fadeOut(frame, end));
  const dy = tw(frame, start, start + 14, 8, 0, EASE.out);
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o, transform: `translateY(${dy}px)`, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 14, padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,.25)', maxWidth: 420 }}>
      <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>{small ?? 'Only parents see this'}</div>
      <div style={{ fontSize: 20, color: '#78350f', fontWeight: 800, lineHeight: 1.2 }}>{text}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ cursor */
export interface CursorKey { frame: number; x: number; y: number }

/** Cursor path in stage coordinates; with `cam` the path is in scene coordinates and follows the camera. */
export function Cursor({ path, clicks = [], start, end, cam }: { path: CursorKey[]; clicks?: number[]; start: number; end: number; cam?: CamKey[] }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  let x = path[0].x, y = path[0].y;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    if (frame >= a.frame && frame <= b.frame) { x = tw(frame, a.frame, b.frame, a.x, b.x); y = tw(frame, a.frame, b.frame, a.y, b.y); break; }
    if (frame > b.frame) { x = b.x; y = b.y; }
  }
  if (cam) {
    const c = camAt(frame, cam);
    x = WIDTH / 2 + (x - WIDTH / 2) * c.scale + c.x;
    y = HEIGHT / 2 + (y - HEIGHT / 2) * c.scale + c.y;
  }
  const o = Math.min(fadeIn(frame, start, 12), fadeOut(frame, end, 12));
  const click = clicks.find((c) => frame >= c && frame < c + 16);
  const ring = click === undefined ? 0 : tw(frame, click, click + 16, 0, 1, EASE.out);
  const press = click === undefined ? 1 : tw(frame, click, click + 6, 1, 0.78, EASE.out) * (frame > click + 6 ? 1 / tw(frame, click + 6, click + 14, 1 / 0.78, 1, EASE.out) : 1);
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o, pointerEvents: 'none' }}>
      {click !== undefined && <div style={{ position: 'absolute', left: -14 - ring * 18, top: -14 - ring * 18, width: 28 + ring * 36, height: 28 + ring * 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,.9)', opacity: 1 - ring }} />}
      <div style={{ position: 'absolute', left: -11, top: -11, width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.95)', boxShadow: '0 2px 10px rgba(0,0,0,.35), 0 0 0 2px rgba(20,23,29,.25)', transform: `scale(${press})` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ frame-driven modal */
export function ModalCard({ start, end, width = 760, children }: { start: number; end: number; width?: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const inO = fadeIn(frame, start, 14);
  const outO = fadeOut(frame, end, 12);
  const s = tw(frame, start, start + 16, 0.96, 1, EASE.enter) * tw(frame, end - 12, end, 1, 0.98, EASE.out);
  const dy = tw(frame, start, start + 16, 14, 0, EASE.enter);
  return (
    <AbsoluteFill style={{ background: `rgba(20,23,29,${0.45 * Math.min(inO, outO)})`, justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ width, opacity: Math.min(inO, outO), transform: `translateY(${dy}px) scale(${s})`, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.45)' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ celebration */
const CONFETTI = ['#ffd43b', '#ff6b6b', '#4dabf7', '#51cf66', '#cc5de8', '#ff922b', '#20c997'];

/** The product's confetti burst, driven by frames (same colours and spread as components/Confetti.tsx). */
export function ConfettiBurst({ start, count = 56, duration = 84 }: { start: number; count?: number; duration?: number }) {
  const frame = useCurrentFrame();
  if (frame < start || frame > start + duration + 30) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: count }, (_, i) => {
        const delay = (i % 9) * 2.2;
        const d = duration * (0.86 + (i % 5) * 0.07);
        const t = tw(frame, start + delay, start + delay + d, 0, 1, Easing.bezier(0.2, 0.6, 0.4, 1));
        if (t <= 0) return null;
        const y = -0.12 * HEIGHT + t * 1.17 * HEIGHT;
        const sway = Math.sin((frame - start) * 0.18 + i) * 22;
        return (
          <span key={i} style={{ position: 'absolute', left: `${(i * 37 + 11) % 100}%`, top: 0, width: 6 + (i % 3) * 3, height: 10 + (i % 4) * 3, background: CONFETTI[i % CONFETTI.length], borderRadius: i % 2 ? '50%' : 2, transform: `translate(${sway}px, ${y}px) rotate(${t * 720 + i * 40}deg)`, opacity: t > 0.8 ? (1 - t) / 0.2 : 1 }} />
        );
      })}
    </AbsoluteFill>
  );
}

/** The Play page's toast, sliding in at the stage's bottom right. */
export function Toast({ start, end, emoji, title, sub }: { start: number; end: number; emoji: string; title: string; sub: string }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const o = Math.min(fadeIn(frame, start, 14), fadeOut(frame, end, 14));
  const dx = tw(frame, start, start + 18, 40, 0, EASE.enter);
  return (
    <div className="card" style={{ position: 'absolute', right: 72, bottom: 96, width: 340, padding: 18, display: 'flex', alignItems: 'center', gap: 14, opacity: o, transform: `translateX(${dx}px)`, boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
      <Emoji e={emoji} className="text-4xl" />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">{title}</div>
        <div className="text-lg font-bold">{sub}</div>
      </div>
    </div>
  );
}

/** Rain offset for the product's .rain overlay, driven by the frame instead of a CSS animation. */
export const rainVars = (frame: number) => ({ '--rain-pos': `${-frame * 2.4}px ${frame * 13}px` }) as CSSProperties;
