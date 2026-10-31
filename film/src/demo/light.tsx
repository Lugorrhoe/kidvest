import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, fadeIn, fadeOut, tw } from '../motion';
import { HEIGHT, WIDTH } from '../timeline';

/* TUM chair palette (from the pitch deck theme). */
export const TUM = { blue: '#0065BD', magenta: '#CC1A8C', pink: '#FF7ECE', blue2: '#64A0C8', blue3: '#98C6EA' };

/** The product screen: a 1440 px wide page shown in a 1600 x 900 frame. */
export const SCREEN = { x: 160, y: 90, w: 1600, h: 900, inner: 1440, scale: 1600 / 1440, innerH: 900 / (1600 / 1440) };

/** Page coordinates (1440 px wide, scrolled by `scrollY`) to stage coordinates. */
export const toStage = (px: number, py: number, scrollY = 0) => ({ x: SCREEN.x + px * SCREEN.scale, y: SCREEN.y + (py - scrollY) * SCREEN.scale });

export function LightStage({ children }: { children: ReactNode }) {
  return (
    <AbsoluteFill style={{ background: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 55% at 50% 48%, rgba(152,198,234,.22), rgba(255,255,255,0) 70%)` }} />
      {children}
    </AbsoluteFill>
  );
}

/** Enter and exit of a page: opacity and a very small scale. */
export function pageState(frame: number, enter: number, exit: number, d = 12) {
  const o = Math.min(fadeIn(frame, enter, d), fadeOut(frame, exit, d));
  const s = tw(frame, enter, enter + d, 0.985, 1, EASE.out) * tw(frame, exit - d, exit, 1, 1.008, EASE.out);
  return { o, s, visible: frame >= enter - 1 && frame < exit };
}

export function Screen({ children, opacity = 1, scale = 1, header, scrollY = 0 }: { children: ReactNode; opacity?: number; scale?: number; header?: ReactNode; scrollY?: number }) {
  return (
    <div style={{ position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: SCREEN.w, height: SCREEN.h, borderRadius: 24, overflow: 'hidden', background: '#f8f9fa', border: '1px solid #e3ebf3', boxShadow: '0 30px 80px rgba(0,101,189,.14), 0 2px 6px rgba(0,40,80,.06)', opacity, transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: SCREEN.inner, height: SCREEN.innerH, transform: `scale(${SCREEN.scale})`, transformOrigin: '0 0', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: SCREEN.inner, transform: `translateY(${-scrollY}px)` }}>{children}</div>
        {header && <div style={{ position: 'absolute', left: 0, top: 0, width: SCREEN.inner }}>{header}</div>}
      </div>
    </div>
  );
}

/** A modal that covers only the screen frame; content is in product pixels and scaled like the page. */
export function ScreenModal({ start, end, width = 720, fit = 1, children }: { start: number; end: number; width?: number; fit?: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const o = Math.min(fadeIn(frame, start, 12), fadeOut(frame, end, 10));
  const s = tw(frame, start, start + 14, 0.97, 1, EASE.enter) * tw(frame, end - 10, end, 1, 0.985, EASE.out);
  const dy = tw(frame, start, start + 14, 12, 0, EASE.enter);
  return (
    <div style={{ position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: SCREEN.w, height: SCREEN.h, borderRadius: 24, overflow: 'hidden', background: `rgba(20,23,29,${0.4 * o})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width, overflow: 'hidden', opacity: o, transform: `translateY(${dy}px) scale(${SCREEN.scale * s * fit})`, boxShadow: '0 40px 90px rgba(0,0,0,.35)' }}>
        {children}
      </div>
    </div>
  );
}

/** Thin progress line along the bottom: light blue track, TUM blue fill, magenta head. */
export function ProgressLine({ total }: { total: number }) {
  const frame = useCurrentFrame();
  const x0 = SCREEN.x, x1 = SCREEN.x + SCREEN.w, y = HEIGHT - 44;
  const p = Math.min(1, frame / total);
  const x = x0 + (x1 - x0) * p;
  return (
    <svg style={{ position: 'absolute', inset: 0 }} width={WIDTH} height={HEIGHT}>
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={TUM.blue3} strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
      <line x1={x0} x2={x} y1={y} y2={y} stroke={TUM.blue} strokeWidth="2" strokeLinecap="round" />
      <circle cx={x} cy={y} r="5" fill={TUM.magenta} />
    </svg>
  );
}

/** Eased piecewise scroll position. */
export function scrollAt(frame: number, keys: { f: number; y: number }[]): number {
  if (frame <= keys[0].f) return keys[0].y;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame <= b.f) return tw(frame, a.f, b.f, a.y, b.y, EASE.inOut);
  }
  return keys[keys.length - 1].y;
}

export const absFill: CSSProperties = { position: 'absolute', inset: 0 };
