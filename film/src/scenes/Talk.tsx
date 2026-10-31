import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { HistoryTimeline } from '../../../src/components/parent/HistoryTimeline';
import { WORLDS } from '../../../src/data/worlds';
import { describeCondition } from '../../../src/engine/rewards';
import { money } from '../../../src/engine/format';
import { Emoji, Logo } from '../../../src/lib/ui';
import { Camera, Caption, Cursor, EASE, Stage, fadeIn, fadeOut, tw, within, type CamKey } from '../motion';
import { rewardAt, thanja } from '../states';
import { HEIGHT, SHOT, WIDTH } from '../timeline';
import { Play } from './LetDo';

const R = SHOT.s11[0];
const rel = (abs: number) => abs - R;
const [s11, s12, s13] = [SHOT.s11, SHOT.s12, SHOT.s13].map(([a, b]) => [rel(a), rel(b)] as const);

/* Copy from lib/talk.ts (which depends on the database and is not imported here). */
const TALK_AGENDA = [
  'Look at the world and the chart together (5 min).',
  'Ask: What was the scariest moment this month? What are you proud of?',
  'Go through the conversation prompts in Parent area → Reports.',
  'Ask: What would you do differently next month?',
  'Agree on one small thing to try. Praise patience, not results.',
];

const TL_X = 880;
const TL_W = 960;
const TL_TOP = 170;
/** Vertical position of the "Year 6 · 2008" row inside the timeline card (tuned against stills). */
const ROW_2008_Y = 0.745;
/* The three parent cards are laid out at 1387 px and scaled up so body text reads on a projector. */
const CARDS_SCALE = 1.28;
const CARDS_W = 1387;
const CARDS_TOP = 140;

function PinGate({ filled }: { filled: number }) {
  return (
    <div className="card" style={{ width: 420, padding: 32 }}>
      <Logo />
      <h1 className="mt-6 text-2xl font-extrabold">Parent area</h1>
      <p className="mt-1 text-sm text-ink-600">Enter your PIN to manage children, scenarios and assets.</p>
      <div className="input num mt-6 flex items-center justify-center gap-4 text-2xl" style={{ height: 52 }}>
        {[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 14, height: 14, borderRadius: 7, background: i < filled ? '#14171d' : '#dfe3e8' }} />)}
      </div>
      <button className="btn btn-dark btn-lg mt-3 w-full">Unlock</button>
    </div>
  );
}

function ReportsHeader({ opacity }: { opacity: number }) {
  return (
    <div style={{ position: 'absolute', left: TL_X, top: 64, width: TL_W, opacity, color: '#fff' }}>
      <div className="flex items-center gap-3">
        <span className="chip" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>🔒 Parent area</span>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>Reports · 🦊 Thanja</span>
      </div>
      <h2 className="mt-3 text-3xl font-extrabold">Reports</h2>
      <p className="mt-1 text-base" style={{ color: 'rgba(255,255,255,.65)' }}>See what your child did, which real years were replayed, and get conversation prompts. Show, let do, then talk.</p>
    </div>
  );
}

function PromptsCard() {
  const world = WORLDS.farm;
  const game = thanja.at[26];
  const prompts = [...game.talk].filter((t) => t.season >= 21).reverse().slice(0, 2);
  const year = (s: number) => `${thanja.market.years[s]} Q${((s - 1) % 4) + 1}`;
  return (
    <div className="card card-pad">
      <h3 className="mb-3 font-bold">💬 Then talk: conversation prompts</h3>
      <div className="space-y-3">
        {prompts.map((t, i) => (
          <div key={i} className="rounded-xl border border-ink-100 p-3">
            <div className="flex items-center justify-between text-xs text-ink-500"><span>{world.seasonLabel(t.season)}</span><span>{year(t.season)}</span></div>
            <div className="mt-1 font-semibold">{t.title}</div>
            <div className="mt-1 text-sm text-ink-700">{t.question}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TalkCard({ clicked }: { clicked: boolean }) {
  return (
    <div className="card card-pad">
      <h3 className="text-lg font-bold">💬 Monthly money talk</h3>
      <p className="mt-1 text-sm text-ink-600">The game is the "let do" part; the talk is where learning sticks. Once a month, 15 minutes, no judgement.</p>
      <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-ink-700">
        {TALK_AGENDA.map((a) => <li key={a}>{a}</li>)}
      </ol>
      <button className="btn btn-outline btn-md mt-4 w-full" data-film="ics">📅 Add monthly reminder to my calendar</button>
      <div className="mt-2 text-xs text-ink-500" style={{ opacity: clicked ? 1 : 0 }}>⬇️ kidvest-money-talk.ics · repeats monthly · reminder one hour before</div>
    </div>
  );
}

function RewardRow() {
  const r = rewardAt(26);
  const fmt = (v: number) => money(v, thanja.ctx.world, 3);
  return (
    <div className="card card-pad">
      <h3 className="mb-3 font-bold">🎁 Real-life rewards · Thanja</h3>
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3">
        <div className="flex items-start gap-3">
          <Emoji e={r.emoji} className="text-3xl" />
          <div className="min-w-0 flex-1">
            <div className="font-bold leading-tight">{r.title}</div>
            <div className="mt-0.5 text-xs text-ink-600">{describeCondition(r, 1, 'season', fmt)}</div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">✓ achieved</div>
          </div>
        </div>
        <button className="btn btn-dark btn-md mt-3 w-full">Mark as delivered</button>
      </div>
      <p className="mt-3 text-xs text-ink-500">Conditions favour behaviour (holding through storms, diversifying, saving) over outcomes.</p>
    </div>
  );
}

export function TalkChapter() {
  const frame = useCurrentFrame();
  // S11: the stormy farm docks left, the PIN gate opens, the Reports header appears
  const dock = tw(frame, s11[0], s11[0] + 40, 0, 1, EASE.inOut);
  const farmScale = 1 - dock * 0.54;
  const farmX = -dock * 520;
  const farmY = dock * 40;
  const pinO = Math.min(fadeIn(frame, s11[0] + 24, 16), fadeOut(frame, s11[0] + 100, 14));
  const filled = [34, 42, 50, 58].filter((f) => frame >= s11[0] + f).length;
  const headerO = within(frame, s11[0] + 96, s12[0] + 70) ? Math.min(fadeIn(frame, s11[0] + 96, 18), fadeOut(frame, s12[0] + 70, 20)) : 0;
  // while the camera pushes into the 2008 row, the docked farm recedes so the two views never overlap
  const recede = tw(frame, s12[0] + 30, s12[0] + 90, 0, 1, EASE.inOut);
  // S12: the timeline slides in and the camera pushes into the 2008 row
  const tlIn = tw(frame, s12[0] - 20, s12[0] + 24, 0, 1, EASE.enter);
  const rowFocus = { x: TL_X + TL_W / 2, y: TL_TOP + 760 * ROW_2008_Y };
  const cam: CamKey[] = [
    { frame: s12[0] + 30, scale: 1, x: 0, y: 0 },
    { frame: s12[0] + 90, scale: 1.45, x: (WIDTH / 2 - rowFocus.x) * 1.45, y: (HEIGHT / 2 - rowFocus.y) * 1.45 },
    { frame: s12[1] - 30, scale: 1.45, x: (WIDTH / 2 - rowFocus.x) * 1.45, y: (HEIGHT / 2 - rowFocus.y) * 1.45 },
    { frame: s13[0], scale: 1, x: 0, y: 0 },
  ];
  const tlOut = fadeOut(frame, s13[0] + 10, 16);
  // S13: three parent cards
  const cardIn = (i: number) => ({ o: fadeIn(frame, s13[0] + 10 + i * 18, 18), dy: tw(frame, s13[0] + 10 + i * 18, s13[0] + 34 + i * 18, 60, 0, EASE.enter) });
  const icsClick = s13[0] + 110;
  const showCards = frame >= s13[0];
  const farmVisible = frame < s13[0] + 10;
  return (
    <Stage accent="none">
      {farmVisible && (
        <div style={{ position: 'absolute', inset: 0, transform: `translate(${farmX - recede * 420}px, ${farmY}px) scale(${farmScale})`, transformOrigin: '50% 50%', opacity: Math.min(fadeOut(frame, s13[0] + 10, 16), 1 - recede * 0.6) }}>
          <Play season={24} since={23} style={{ filter: 'drop-shadow(0 40px 80px rgba(0,0,0,.5))' }} />
        </div>
      )}
      {pinO > 0 && (
        <div style={{ position: 'absolute', left: TL_X + TL_W / 2 - 210, top: HEIGHT / 2 - 190, opacity: pinO, transform: `scale(${tw(frame, s11[0] + 24, s11[0] + 44, 0.96, 1, EASE.enter)})` }}>
          <PinGate filled={filled} />
        </div>
      )}
      <ReportsHeader opacity={headerO} />
      {frame >= s12[0] - 20 && frame < s13[0] + 20 && (
        <Camera keys={cam}>
          <div className="text-[15px]" style={{ position: 'absolute', left: TL_X, top: TL_TOP, width: TL_W, opacity: Math.min(tlIn, tlOut), transform: `translateX(${(1 - tlIn) * 80}px)`, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.45))' }}>
            <HistoryTimeline game={thanja.at[26]} market={thanja.market} world={WORLDS.farm} />
          </div>
        </Camera>
      )}
      {showCards && (
        <div className="text-[15px]" style={{ position: 'absolute', left: (WIDTH - CARDS_W) / 2, width: CARDS_W, top: CARDS_TOP, transform: `scale(${CARDS_SCALE})`, transformOrigin: '50% 0', display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 28, alignItems: 'start' }}>
          {[<PromptsCard key="p" />, <TalkCard key="t" clicked={frame >= icsClick + 8} />, <RewardRow key="r" />].map((card, i) => {
            const a = cardIn(i);
            return <div key={i} style={{ opacity: a.o, transform: `translateY(${a.dy}px)`, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.45))' }}>{card}</div>;
          })}
        </div>
      )}
      {showCards && <Cursor start={s13[0] + 70} end={s13[1] - 20} clicks={[icsClick]} path={[{ frame: s13[0] + 70, x: 1180, y: 760 }, { frame: icsClick - 8, x: 985, y: 441 }, { frame: s13[1], x: 985, y: 441 }]} />}

      <Caption text="Then talk." start={s11[0] + 60} end={s11[0] + 140} size="l" y={HEIGHT - 170} />
      <Caption text="Parents see the real years." start={s12[0] + 60} end={s12[0] + 180} y={HEIGHT - 128} />
      <Caption text="Children never do." start={s12[0] + 180} end={s12[1]} y={HEIGHT - 128} />
      <Caption text="A conversation, once a month. That is where it sticks." start={s13[0] + 60} end={s13[1] - 10} y={HEIGHT - 128} size="m" />
      <AbsoluteFill style={{ background: '#14171d', opacity: tw(frame, s13[1] - 20, s13[1], 0, 1), pointerEvents: 'none' }} />
    </Stage>
  );
}
