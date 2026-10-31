import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Scene } from '../../../src/components/Scene';
import { Logo } from '../../../src/lib/ui';
import { EASE, ProductFrame, Stage, fadeIn, fadeOut, tw } from '../motion';
import { emilia, noah, thanja } from '../states';
import { HEIGHT, SHOT, WIDTH } from '../timeline';

const noop = () => {};
const R = SHOT.s14[0];
const rel = (abs: number) => abs - R;
const [s14, s15] = [SHOT.s14, SHOT.s15].map(([a, b]) => [rel(a), rel(b)] as const);
const SCENE_TOP = (HEIGHT - 600) / 2;

const CARDS = [
  { child: thanja, world: 'farm' as const, bracket: 1 as const, season: 26, tx: -860, ry: 16, tz: -260 },
  { child: noah, world: 'space' as const, bracket: 2 as const, season: 16, tx: 0, ry: 0, tz: 0 },
  { child: emilia, world: 'city' as const, bracket: 3 as const, season: 12, tx: 860, ry: -16, tz: -260 },
];

export function PayoffChapter() {
  const frame = useCurrentFrame();
  const cardsO = Math.min(fadeIn(frame, s14[0], 24), fadeOut(frame, s15[0] + 24, 24));
  const pull = tw(frame, s14[0], s15[0] + 24, 0.66, 0.5, EASE.inOut);
  const words = ['SHOW', 'LET DO', 'TALK'];
  const lockupO = Math.min(1, fadeOut(frame, s15[0] + 30, 20));
  const logoO = fadeIn(frame, s15[0] + 20, 24);
  const logoS = tw(frame, s15[0] + 20, s15[0] + 70, 0.94, 1, EASE.enter);
  return (
    <Stage accent="none">
      {frame < s15[0] + 50 && (
        <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: '50% 45%', opacity: cardsO }}>
          <div style={{ position: 'absolute', inset: 0, transform: `translateY(-70px) scale(${pull})`, transformStyle: 'preserve-3d' }}>
            {CARDS.map((c) => (
              <div key={c.world} style={{ position: 'absolute', inset: 0, transform: `translate3d(${c.tx * 1.55}px, 0, ${c.tz}px) rotateY(${c.ry}deg)`, transformStyle: 'preserve-3d' }}>
                <ProductFrame world={c.world} y={SCENE_TOP} bracket={c.bracket} style={{ boxShadow: '0 50px 120px rgba(0,0,0,.55)', borderRadius: 24 }}>
                  <Scene game={c.child.at[c.season]} market={c.child.market} ctx={c.child.ctx} since={c.season} onOpen={noop} onBuyGoal={noop} />
                </ProductFrame>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}
      {frame < s15[0] + 50 && (
        <div style={{ position: 'absolute', top: HEIGHT - 230, width: WIDTH, textAlign: 'center', opacity: lockupO }}>
          {words.map((w, i) => {
            const st = s14[0] + 40 + i * 14;
            return (
              <span key={w} style={{ display: 'inline-block', margin: '0 26px', fontSize: 34, fontWeight: 700, letterSpacing: '0.34em', color: '#fff', opacity: fadeIn(frame, st, 16), transform: `translateY(${tw(frame, st, st + 16, 12, 0, EASE.out)}px)` }}>
                {w}{i < 2 && <span style={{ marginLeft: 52, color: 'rgba(255,255,255,.35)' }}>·</span>}
              </span>
            );
          })}
        </div>
      )}
      {frame >= s15[0] + 20 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: logoO }}>
          <div style={{ transform: `scale(${2.3 * logoS})`, transformOrigin: '50% 50%' }}><Logo dark /></div>
          <div style={{ marginTop: 92, fontSize: 56, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', opacity: fadeIn(frame, s15[0] + 40, 20) }}>Learn to invest by doing it.</div>
          <div style={{ marginTop: 22, fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,.6)', opacity: fadeIn(frame, s15[0] + 56, 20) }}>Real history. No real money. Nothing leaves the browser.</div>
          <div style={{ position: 'absolute', bottom: 60, fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '0.04em', opacity: fadeIn(frame, s15[0] + 70, 20) }}>lugorrhoe.github.io/kidvest</div>
        </AbsoluteFill>
      )}
    </Stage>
  );
}
