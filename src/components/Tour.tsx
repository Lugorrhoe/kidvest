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

/** Bracket- and world-aware tour of the play page: shown on a child's first visit and from the 🧭 Tour button. */
export function tourSteps(game: Game, ctx: Context): TourStep[] {
  const { world, bracket } = ctx;
  const cash = money(game.cash, world, bracket);
  const fresh = game.season === 0;
  if (bracket === 1) {
    return [
      { target: '.scene', emoji: '👋', title: `Welcome to ${world.name}!`, text: `${fresh ? `You start with ${cash} in your ${world.baseName.toLowerCase()}.` : `This is your farm. Your ${world.baseName.toLowerCase()} holds ${cash}.`} Rest your mouse on an animal or tree to see how it is doing, and tap it to buy or sell.` },
      { target: '[data-tour="next"]', emoji: '⏭️', title: 'Time moves when you say so', text: `Press this button to play the next ${world.seasonWord}. Your animals and trees grow, give you things, or sometimes shrink for a while. Four ${world.seasonWord}s make a year.` },
      { target: '[data-tour="recap"]', emoji: '📰', title: 'What happened', text: `After every ${world.seasonWord}, this card tells you what changed: milk and eggs, storms, sunshine and pocket money.` },
      { target: '[data-tour="holdings"]', emoji: '🧺', title: 'What you own', text: 'All your animals and trees in one list, with how many you have and what they are worth now.' },
      { target: '[data-tour="market"]', emoji: '🛒', title: 'The farm market', text: 'Everything you can buy. Calm animals change little; wild ones can grow a lot or shrink a lot. Tap one to buy.' },
      { target: '[data-tour="chart"]', emoji: '📈', title: 'Watch your farm grow', text: 'This picture shows how much everything is worth over time. The grey line shows what you would have if you had only saved. Lines go up and down, that is normal!' },
      { target: '[data-tour="goal"]', emoji: '🎁', title: 'Save up for something nice', text: 'When you have saved enough, you can buy your next goal. It appears in your world! Badges and challenges live here too.' },
      { target: '[data-tour="exit"]', emoji: '🔒', title: 'For your parents', text: 'Exit takes you back to the start page. There, your parents find their own area with reports and settings. You can replay this tour any time with the Tour button.' },
    ];
  }
  return [
    { target: '.scene', emoji: '👋', title: `Welcome to ${world.name}!`, text: `${fresh ? `You start with ${cash}.` : `Your ${world.baseName.toLowerCase()} holds ${cash}.`} Everything you can invest in lives here. Hover a plot for details, click it to buy or sell.` },
    { target: '[data-tour="next"]', emoji: '⏭️', title: 'You control time', text: `Nothing happens until you press this. Each ${world.seasonWord} brings price moves, payouts and pocket money. A year has four ${world.seasonWord}s.` },
    { target: '[data-tour="recap"]', emoji: '📰', title: 'What happened', text: `After every ${world.seasonWord}, this card sums up the moves, payouts, events and anything you unlocked.` },
    { target: '[data-tour="holdings"]', emoji: '📋', title: 'Your holdings', text: 'What you own, how much it is worth now and how it has done since you bought it.' },
    { target: '[data-tour="market"]', emoji: '🛒', title: world.marketName, text: `Everything you can invest in, with risk${bracket === 3 ? ', fees and payouts' : ' and payouts'}. Click one to see details and place an order.` },
    { target: '[data-tour="chart"]', emoji: '📈', title: 'Your value over time', text: `The chart compares your total with what you would have if you had only saved${bracket === 3 ? ', and can show everything after inflation' : ''}. Dips are part of the journey, patience usually wins.` },
    { target: '[data-tour="goal"]', emoji: '🎯', title: 'Goals, challenges and badges', text: 'Save towards real goals and complete challenges for XP. Spreading your money over different things earns badges too.' },
    { target: '[data-tour="exit"]', emoji: '🔒', title: 'For your parents', text: 'Exit leads to the start page, where parents have their own area with reports, real-life rewards and settings. Replay this tour any time with the Tour button.' },
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
