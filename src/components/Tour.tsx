import { useEffect, useState } from 'react';
import type { Context } from '../engine/game';
import type { Game } from '../engine/types';
import { money } from '../engine/format';
import { cx, Emoji } from '../lib/ui';

export interface TourStep {
  target: string;
  emoji: string;
  title: string;
  text: string;
}

/** Bracket- and world-aware steps for a child's very first visit. */
export function tourSteps(game: Game, ctx: Context): TourStep[] {
  const { world, bracket } = ctx;
  const cash = money(game.cash, world, bracket);
  if (bracket === 1) {
    return [
      { target: '.scene', emoji: '👋', title: `Welcome to ${world.name}!`, text: `You start with ${cash} in your ${world.baseName.toLowerCase()}. Tap any animal or tree to look closer and buy it with your coins.` },
      { target: '[data-tour="next"]', emoji: '⏭️', title: 'Time moves when you say so', text: `Press this button to play the next ${world.seasonWord}. Your animals and trees grow, give you things, or sometimes shrink for a while.` },
      { target: '[data-tour="chart"]', emoji: '📈', title: 'Watch your farm grow', text: 'This picture shows how much everything is worth over time. Lines go up and down, that is normal!' },
      { target: '[data-tour="goal"]', emoji: '🎁', title: 'Save up for something nice', text: 'When you have saved enough, you can buy your next goal. It will appear in your world!' },
    ];
  }
  return [
    { target: '.scene', emoji: '👋', title: `Welcome to ${world.name}!`, text: `You start with ${cash}. Everything you can invest in lives here. Click any plot to see details, risk and fees, and to buy or sell.` },
    { target: '[data-tour="next"]', emoji: '⏭️', title: 'You control time', text: `Nothing happens until you press this. Each ${world.seasonWord} brings price moves, payouts and pocket money. A year has four ${world.seasonWord}s.` },
    { target: '[data-tour="chart"]', emoji: '📈', title: 'Your value over time', text: 'The chart compares your total with what you would have if you had only saved. Dips are part of the journey, patience usually wins.' },
    { target: '[data-tour="goal"]', emoji: '🎯', title: 'Goals and challenges', text: 'Save towards real goals and complete challenges for XP. Spreading your money over different things earns badges too.' },
  ];
}

export function Tour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const step = steps[i];

  useEffect(() => {
    const el = document.querySelector(step.target);
    if (!el) {
      if (i < steps.length - 1) setI(i + 1);
      else onDone();
      return;
    }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    const id = setInterval(update, 150);
    return () => clearInterval(id);
  }, [i, step.target, steps.length, onDone]);

  if (!rect) return null;
  const pad = 8;
  const fitsBelow = rect.top + rect.height + 210 < window.innerHeight;
  const fitsAbove = rect.top > 240;
  const cardTop = fitsBelow ? rect.top + rect.height + pad + 10 : undefined;
  const cardBottom = fitsBelow ? undefined : fitsAbove ? window.innerHeight - rect.top + pad + 10 : 24;
  const cardLeft = Math.max(16, Math.min(window.innerWidth - 400, rect.left + rect.width / 2 - 192));
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label="Guided tour">
      <div
        className="absolute rounded-2xl transition-all duration-300"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: '0 0 0 9999px rgba(10,14,22,.6), 0 0 0 3px rgba(255,255,255,.9)',
        }}
      />
      <div className="card pop-in absolute w-96 p-5" style={{ top: cardTop, bottom: cardBottom, left: cardLeft }}>
        <div className="flex items-start gap-3">
          <Emoji e={step.emoji} className="text-3xl" />
          <div>
            <div className="font-extrabold">{step.title}</div>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">{step.text}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, k) => <span key={k} className={cx('h-2 w-2 rounded-full', k === i ? 'bg-ink-800' : 'bg-ink-200')} />)}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-md" onClick={onDone}>Skip</button>
            <button className="btn btn-dark btn-md" onClick={() => (i < steps.length - 1 ? setI(i + 1) : onDone())}>
              {i < steps.length - 1 ? 'Next' : "Let's play!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
