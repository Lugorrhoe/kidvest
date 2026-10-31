import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Hero } from '../../../src/components/PlayParts';
import { RewardCelebration, RewardsCard } from '../../../src/components/RewardsCard';
import { Scene } from '../../../src/components/Scene';
import { Camera, Caption, ConfettiBurst, Cursor, EASE, ModalCard, ParentTag, ProductFrame, Stage, fadeIn, rainVars, tw, type CamKey } from '../motion';
import { REWARD_SEASON, rewardAt, thanja } from '../states';
import { HEIGHT, SHOT, WIDTH } from '../timeline';

const noop = () => {};
const R = SHOT.s7[0];
const rel = (abs: number) => abs - R;
const [s7, s8, s9, s10] = [SHOT.s7, SHOT.s8, SHOT.s9, SHOT.s10].map(([a, b]) => [rel(a), rel(b)] as const);

/* Play layout: Hero above the Scene, 24 px apart, 1240 wide. */
export const PLAY_TOP = 56;
const HERO_H = 214;
export const PLAY_SCENE_TOP = PLAY_TOP + HERO_H + 24;
const NEXT_BTN = { x: WIDTH / 2 + 447, y: PLAY_TOP + 150 };

/** The seasons the child plays through, one click each. */
const CLICKS: { frame: number; season: number }[] = [
  { frame: s7[0] + 48, season: 21 },
  { frame: s8[0], season: 22 },
  { frame: s8[0] + 72, season: 23 },
  { frame: s8[0] + 144, season: 24 },
  { frame: s9[0] + 112, season: 25 },
  { frame: s9[0] + 146, season: 26 },
];
const seasonAt = (frame: number) => CLICKS.reduce((s, c) => (frame >= c.frame + 2 ? c.season : s), 20);

export function Play({ season, since, style }: { season: number; since: number; style?: React.CSSProperties }) {
  const frame = useCurrentFrame();
  return (
    <ProductFrame world="farm" y={PLAY_TOP} style={{ ...rainVars(frame), ...style }}>
      <div className="space-y-6">
        <Hero game={thanja.at[season]} market={thanja.market} ctx={thanja.ctx} onNext={noop} onYear={noop} busy={false} pace={0} now={0} />
        <Scene game={thanja.at[season]} market={thanja.market} ctx={thanja.ctx} since={since} onOpen={noop} onBuyGoal={noop} />
      </div>
    </ProductFrame>
  );
}

export function LetDoChapter() {
  const frame = useCurrentFrame();
  const season = seasonAt(frame);
  const since = Math.max(20, season - 1);
  // the sky clears: cross-dissolve from the last storm quarter into the sunny one
  const clear = CLICKS[5].frame;
  const dissolve = frame >= clear ? tw(frame, clear, clear + 12, 0, 1, EASE.inOut) : 0;
  // push in on the whole play area during the storm (nothing cropped), then make room for the rewards card
  const PLAY_CY = PLAY_TOP + 419;
  const push = (s: number) => ({ scale: s, x: 0, y: (HEIGHT / 2 - PLAY_CY) * s });
  const cam: CamKey[] = [
    { frame: s7[0], scale: 1, x: 0, y: 0 },
    { frame: s7[0] + 60, scale: 1, x: 0, y: 0 },
    { frame: s8[0], ...push(1.02) },
    { frame: s8[1], ...push(1.12) },
    { frame: s9[0] + 100, ...push(1.12) },
    { frame: s9[1], scale: 1, x: 0, y: 0 },
    { frame: s10[0] + 10, scale: 1, x: 0, y: 0 },
    { frame: s10[0] + 40, scale: 1, x: -190, y: 0 },
    { frame: s10[1], scale: 1, x: -190, y: 0 },
  ];
  const reward = rewardAt(season);
  const celebrate = REWARD_SEASON !== undefined && season >= REWARD_SEASON;
  const darken = tw(frame, s10[1] - 40, s10[1], 0, 1, EASE.inOut);
  return (
    <Stage accent="farm">
      <Camera keys={cam}>
        {dissolve < 1 && <Play season={dissolve > 0 ? 25 : season} since={since} />}
        {dissolve > 0 && <div style={{ position: 'absolute', inset: 0, opacity: dissolve }}><Play season={26} since={25} /></div>}
      </Camera>
      <Cursor cam={cam} start={s7[0]} end={s9[1]} clicks={CLICKS.map((c) => c.frame)} path={[{ frame: s7[0], x: NEXT_BTN.x - 220, y: NEXT_BTN.y + 160 }, { frame: CLICKS[0].frame - 6, x: NEXT_BTN.x, y: NEXT_BTN.y }, { frame: s9[1], x: NEXT_BTN.x, y: NEXT_BTN.y }]} />

      <Caption text="She presses Next season." start={s7[0] + 30} end={s7[0] + 120} y={HEIGHT - 128} />
      <Caption text="Hold." start={s8[0] + 180} end={s8[1] + 6} size="xl" y={HEIGHT - 190} />

      {/* the real-life reward is achieved by the engine the moment the stormy year is held through */}
      {celebrate && <ConfettiBurst start={s9[0] + 4} count={64} />}
      {celebrate && (
        <ModalCard start={s9[0] + 6} end={s9[0] + 100} width={560}>
          <RewardCelebration rewards={[reward]} name={thanja.profile.name} onClose={noop} />
        </ModalCard>
      )}
      <Caption text="Patience pays." start={s9[0] + 150} end={s10[0] + 50} />

      {/* the child's rewards card, as it sits in the Play sidebar */}
      {frame >= s10[0] + 20 && (
        <div style={{ position: 'absolute', left: WIDTH - 72 - 420, top: 150, width: 420, opacity: fadeIn(frame, s10[0] + 20, 18), transform: `translateY(${tw(frame, s10[0] + 20, s10[0] + 40, 24, 0, EASE.enter)}px)`, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.45))' }} className="text-[17px]">
          <RewardsCard rewards={[reward]} game={thanja.at[season]} market={thanja.market} ctx={thanja.ctx} />
        </div>
      )}
      <ParentTag start={s10[0] + 70} end={s10[1] - 10} x={WIDTH - 72 - 420} y={150 + 300} text="Set by her parents. For behaviour, not luck." small="Only parents see this" />
      <Caption text="Real rewards for real behaviour." start={s10[0] + 80} end={s10[1] - 10} />

      <AbsoluteFill style={{ background: '#14171d', opacity: darken, pointerEvents: 'none' }} />
    </Stage>
  );
}
