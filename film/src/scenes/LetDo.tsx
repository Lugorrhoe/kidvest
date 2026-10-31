import { useCurrentFrame } from 'remotion';
import { Hero } from '../../../src/components/PlayParts';
import { Scene } from '../../../src/components/Scene';
import { Camera, Caption, Cursor, ProductFrame, Stage, rainVars } from '../motion';
import { HEIGHT, SHOT, WIDTH } from '../timeline';
import { thanja } from '../states';

const noop = () => {};
const R = SHOT.s7[0];
const rel = (abs: number) => abs - R;
const [s7] = [SHOT.s7].map(([a, b]) => [rel(a), rel(b)] as const);

/* Play layout: Hero above the Scene, 24 px apart, 1240 wide, vertically centred on the stage. */
const TOP = 56;
const NEXT_BTN = { x: WIDTH / 2 + 447, y: TOP + 150 }; // tuned against stills

function Play({ season, since }: { season: number; since: number }) {
  const frame = useCurrentFrame();
  return (
    <ProductFrame world="farm" y={TOP} style={rainVars(frame)}>
      <div className="space-y-6">
        <Hero game={thanja.at[season]} market={thanja.market} ctx={thanja.ctx} onNext={noop} onYear={noop} busy={false} pace={0} now={0} />
        <Scene game={thanja.at[season]} market={thanja.market} ctx={thanja.ctx} since={since} onOpen={noop} onBuyGoal={noop} />
      </div>
    </ProductFrame>
  );
}

/** S7: the first "Next season" press of 2008. */
export function LetDoChapter() {
  const frame = useCurrentFrame();
  const click = s7[0] + 48;
  const season = frame < click + 2 ? 20 : 21;
  return (
    <Stage accent="farm">
      <Camera keys={[{ frame: s7[0], scale: 1, x: 0, y: 0 }, { frame: s7[0] + 60, scale: 1, x: 0, y: 0 }, { frame: s7[1], scale: 1.05, x: 0, y: -10 }]}>
        <Play season={season} since={20} />
      </Camera>
      <Cursor start={s7[0]} end={s7[1]} clicks={[click]} path={[{ frame: s7[0], x: NEXT_BTN.x - 220, y: NEXT_BTN.y + 160 }, { frame: click - 6, x: NEXT_BTN.x, y: NEXT_BTN.y }, { frame: s7[1], x: NEXT_BTN.x, y: NEXT_BTN.y }]} />
      <Caption text="She presses Next season." start={s7[0] + 30} end={s7[0] + 120} size="m" y={HEIGHT - 128} />
    </Stage>
  );
}
