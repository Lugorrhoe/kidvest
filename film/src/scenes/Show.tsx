import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Scene } from '../../../src/components/Scene';
import { YearReportView } from '../../../src/components/YearModals';
import { yearReport } from '../../../src/engine/forecast';
import { Camera, Caption, Cursor, EASE, ModalCard, ParentTag, ProductFrame, Stage, focus, tw, within } from '../motion';
import { HEIGHT, SHOT, WIDTH } from '../timeline';
import { emilia, noah, thanja } from '../states';

const noop = () => {};
const R = SHOT.s3[0]; // chapter-relative frame = absolute - R
const rel = (abs: number) => abs - R;
const [s3, s4, s5, s6] = [SHOT.s3, SHOT.s4, SHOT.s5, SHOT.s6].map(([a, b]) => [rel(a), rel(b)] as const);

/* Stage coordinates of the farm plots at scale 1 (ProductFrame 1240 wide, Scene 600 tall centred). */
const SCENE_TOP = (HEIGHT - 600) / 2;
const PLOTS_LEFT = (WIDTH - 1240) / 2 + 20 + 190 + 16;
const PLOTS_TOP = SCENE_TOP + 20 + 36 + 16;
const PLOTS_W = 1240 - 40 - 190 - 16;
const PLOTS_H = 444;
const barn = { x: PLOTS_LEFT + PLOTS_W * 0.545, y: PLOTS_TOP + PLOTS_H * 0.25 };
const pig = { x: PLOTS_LEFT + PLOTS_W * 0.17, y: PLOTS_TOP + PLOTS_H * 0.76 };

function FarmScene({ season, since, tip }: { season: number; since: number; tip?: string }) {
  return (
    <div data-tip={tip} style={{ position: 'absolute', inset: 0 }}>
      <ProductFrame world="farm" y={SCENE_TOP}>
        <Scene game={thanja.at[season]} market={thanja.market} ctx={thanja.ctx} since={since} onOpen={noop} onBuyGoal={noop} />
      </ProductFrame>
    </div>
  );
}

/** S3 to S5: reveal, hover cards with parent tags, the forecast. */
function FarmShots() {
  const frame = useCurrentFrame();
  const tip = within(frame, s4[0] + 30, s4[0] + 120) ? 'farm.cow' : within(frame, s4[0] + 120, s4[1] - 10) ? 'farm.pig' : undefined;
  const barnF = focus(barn.x, barn.y + 120, 1.5);
  const pigF = focus(pig.x, pig.y - 110, 1.5);
  const REST = 1.12;
  const keys = [
    { frame: s3[0], scale: 1.3, x: (WIDTH / 2 - barn.x) * 1.3, y: (HEIGHT / 2 - barn.y) * 1.3 },
    { frame: s3[0] + 120, scale: REST, x: 0, y: 0 },
    { frame: s4[0], scale: REST, x: 0, y: 0 },
    { frame: s4[0] + 50, scale: 1.5, ...barnF },
    { frame: s4[0] + 115, scale: 1.5, ...barnF },
    { frame: s4[0] + 150, scale: 1.5, ...pigF },
    { frame: s4[1] - 20, scale: 1.5, ...pigF },
    { frame: s5[0] + 10, scale: REST, x: 0, y: 0 },
    { frame: s5[0] + 60, scale: REST * 1.05, x: 0, y: 0 },
    { frame: s5[1], scale: REST * 1.05, x: 0, y: 0 },
  ];
  const reveal = tw(frame, s3[0], s3[0] + 40, 1, 0, EASE.out);
  return (
    <>
      <Camera keys={keys}>
        <FarmScene season={20} since={20} tip={tip} />
        <AbsoluteFill style={{ background: '#14171d', opacity: reveal }} />
      </Camera>
      <Cursor cam={keys} start={s4[0] + 10} end={s4[1] - 10} path={[{ frame: s4[0] + 10, x: barn.x + 40, y: barn.y + 150 }, { frame: s4[0] + 30, x: barn.x + 46, y: barn.y + 36 }, { frame: s4[0] + 118, x: barn.x + 46, y: barn.y + 36 }, { frame: s4[0] + 150, x: pig.x + 30, y: pig.y + 10 }]} />
      <ParentTag start={s4[0] + 60} end={s4[0] + 122} x={WIDTH / 2 - 440} y={HEIGHT / 2 + 70} text="Cow = equity index fund, distributing" />
      <ParentTag start={s4[0] + 142} end={s4[1] - 14} x={WIDTH / 2 + 160} y={HEIGHT / 2 + 40} text="Pig = small-cap stocks" />
      <ModalCard start={s5[0]} end={s5[1]} width={720}>
        <YearReportView report={yearReport(thanja.at[20], thanja.market, thanja.ctx, 5)} ctx={thanja.ctx} isNew onClose={noop} />
      </ModalCard>
      <ParentTag start={s5[0] + 60} end={s5[1]} x={WIDTH - 560} y={HEIGHT - 190} text="The year she is about to play: 2008" small="Only parents and you know this" />
    </>
  );
}

/** S6: the age rail across the three worlds and back. */
function AgeRail() {
  const frame = useCurrentFrame();
  const gap = 1320;
  const x = frame < s6[0] + 80 ? tw(frame, s6[0], s6[0] + 80, 0, -gap) : frame < s6[0] + 130 ? tw(frame, s6[0] + 80, s6[0] + 130, -gap, -2 * gap) : tw(frame, s6[0] + 130, s6[1], -2 * gap, 0);
  const scale = tw(frame, s6[0], s6[0] + 40, 1, 0.72);
  const cards: { child: typeof thanja; world: 'farm' | 'space' | 'city'; label: string; bracket: 1 | 2 | 3; season: number }[] = [
    { child: thanja, world: 'farm', label: '6 to 8 · coins and weather', bracket: 1, season: 20 },
    { child: noah, world: 'space', label: '9 to 11 · percentages and fees', bracket: 2, season: 16 },
    { child: emilia, world: 'city', label: '12 to 14 · ETFs, bonds, inflation', bracket: 3, season: 12 },
  ];
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${x}px)` }}>
        {cards.map((c, i) => (
          <div key={c.world} style={{ position: 'absolute', inset: 0, transform: `translateX(${i * gap}px)` }}>
            <ProductFrame world={c.world} y={SCENE_TOP} bracket={c.bracket}>
              <Scene game={c.child.at[c.season]} market={c.child.market} ctx={c.child.ctx} since={c.season} onOpen={noop} onBuyGoal={noop} />
            </ProductFrame>
            <div style={{ position: 'absolute', left: (WIDTH - 1240) / 2, top: SCENE_TOP - 86, display: 'flex', alignItems: 'baseline', gap: 22, color: '#fff' }}>
              <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(255,255,255,.7)' }}>{c.label}</span>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{c.child.heroValue(c.season)}</span>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

export function ShowChapter() {
  const frame = useCurrentFrame();
  const accent = frame < s6[0] + 70 ? 'farm' : frame < s6[0] + 125 ? 'space' : frame < s6[0] + 160 ? 'city' : 'farm';
  return (
    <Stage accent={accent}>
      {frame < s6[0] ? <FarmShots /> : <AgeRail />}
      <Caption text="You don't. You let them live through it." start={s3[0] + 60} end={s3[1] - 15} />
      <Caption text="Real markets. In disguise." start={s4[0] + 30} end={s4[0] + 180} />
      <Caption text="Three ages. One century of data." start={s6[0] + 30} end={s6[1] - 30} />
    </Stage>
  );
}
