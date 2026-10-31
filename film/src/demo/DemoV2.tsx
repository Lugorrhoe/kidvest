import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SheetBody } from '../../../src/components/AssetSheet';
import { RewardCelebration } from '../../../src/components/RewardsCard';
import { Scene } from '../../../src/components/Scene';
import { YearReportView, YearReviewView } from '../../../src/components/YearModals';
import { BRACKETS } from '../../../src/data/worlds';
import { totalValue } from '../../../src/engine/achievements';
import { money } from '../../../src/engine/format';
import { yearReport, yearReview } from '../../../src/engine/forecast';
import { Emoji, Logo } from '../../../src/lib/ui';
import { ConfettiBurst, Cursor, EASE, ProductFrame, fadeIn, fadeOut, tw, type CursorKey } from '../motion';
import { HEIGHT, TOTAL, WIDTH } from '../timeline';
import { LightStage, ProgressLine, SCREEN, Screen, ScreenModal, TUM, pageState, scrollAt, toStage } from './light';
import { ChildrenTabLite, HomePage, ParentHeader, ParentPage, PinGatePage, PlayHeader, PlayPage, ReportsTabLite, RewardsTabLite } from './pages';
import { KIDS, emilia, noah, rewardAt, thanja, type DemoKid } from './states';

const noop = () => {};

/* ------------------------------------------------------------------ timeline (absolute frames, 30 fps) */
const F = {
  homeIn: 50,
  clickThanja: 180,
  playIn: 195,
  reportIn: 215, clickStart: 330,
  tipHensOn: 385, clickHens: 436,
  sheetIn: 440, clickBuy: 530,
  seasons: [600, 660, 720, 780],
  celebrateIn: 790, clickYay: 870,
  reviewIn: 900, clickOk: 1000,
  scroll: [{ f: 373, y: 0 }, { f: 393, y: 130 }, { f: 542, y: 130 }, { f: 570, y: 0 }, { f: 1020, y: 0 }, { f: 1080, y: 560 }, { f: 1135, y: 560 }, { f: 1185, y: 1080 }, { f: 1225, y: 1080 }, { f: 1262, y: 0 }],
  clickExit1: 1272, home2In: 1285,
  /* the zoomed-out world overview replaces the visits to Noah and Emilia */
  railIn: 1370, railFarmHold: 1440, railToSpace: 1500, railSpaceHold: 1620, railToCity: 1680, railCityHold: 1790, railZoomOut: 1830, railOut: 1935,
  home4In: 1945,
  clickParents: 1982, pinIn: 1996, clickPinField: 2016, digits: [2032, 2044, 2056, 2068], clickUnlock: 2090, parentIn: 2104,
  clickReports: 2222, reportsIn: 2236,
  reportsScroll: [{ f: 2286, y: 0 }, { f: 2346, y: 560 }, { f: 2392, y: 560 }, { f: 2438, y: 820 }, { f: 2470, y: 820 }],
  clickRewards: 2478, rewardsIn: 2492, clickDeliver: 2566,
  endIn: 2604, fanIn: 2612, logoIn: 2662,
};

/* Page coordinates (1440 px wide) of the things the cursor visits; tuned against stills. */
const P = {
  cardThanja: { x: 340, y: 360 },
  parentsBtn: { x: 1228, y: 42 },
  exit: { x: 1300, y: 30 },
  nextSeason: { x: 1157, y: 307 },
  hens: { x: 1232, y: 600 },
  reportsTab: { x: 925, y: 30 },
  rewardsTab: { x: 795, y: 30 },
  pinField: { x: 720, y: 428 },
  unlock: { x: 720, y: 525 },
};
/* Stage coordinates of modal buttons (centred cards). */
const M = {
  startYear: { x: 960, y: 862 },
  buy: { x: 1226, y: 784 },
  yay: { x: 960, y: 696 },
  ok: { x: 960, y: 818 },
};

const seasonAt = (frame: number) => F.seasons.reduce((s, f, i) => (frame >= f + 2 ? 21 + i : s), 20);

/* ------------------------------------------------------------------ the world rail (from the dark film, on the light stage) */
const RAIL: { kid: DemoKid; world: 'farm' | 'space' | 'city'; bracket: 1 | 2 | 3; season: number }[] = [
  { kid: thanja, world: 'farm', bracket: 1, season: 24 },
  { kid: noah, world: 'space', bracket: 2, season: 16 },
  { kid: emilia, world: 'city', bracket: 3, season: 12 },
];
const GAP = 1340;
const SCENE_TOP = (HEIGHT - 600) / 2;

function WorldRail() {
  const frame = useCurrentFrame();
  const o = Math.min(fadeIn(frame, F.railIn, 24), fadeOut(frame, F.railOut, 16));
  // camera x (rail offset) and scale
  const ZOOM = 45;
  const x = frame < F.railToSpace ? 0 : frame < F.railSpaceHold ? tw(frame, F.railToSpace, F.railSpaceHold, 0, -GAP) : frame < F.railToCity ? -GAP : frame < F.railCityHold ? tw(frame, F.railToCity, F.railCityHold, -GAP, -2 * GAP) : frame < F.railZoomOut ? -2 * GAP : tw(frame, F.railZoomOut, F.railZoomOut + ZOOM, -2 * GAP, -GAP);
  const scale = frame < F.railZoomOut ? tw(frame, F.railIn, F.railIn + 30, 0.78, 0.72) : tw(frame, F.railZoomOut, F.railZoomOut + ZOOM, 0.72, 0.4);
  const labelO = frame < F.railZoomOut ? 1 : tw(frame, F.railZoomOut, F.railZoomOut + 20, 1, 0);
  const allO = tw(frame, F.railZoomOut + ZOOM - 10, F.railZoomOut + ZOOM + 20, 0, 1);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${x}px)` }}>
          {RAIL.map((c, i) => {
            const game = c.kid.at[c.season];
            const b = BRACKETS[c.bracket - 1];
            return (
              <div key={c.world} style={{ position: 'absolute', inset: 0, transform: `translateX(${i * GAP}px)` }}>
                <div style={{ position: 'absolute', left: (WIDTH - 1240) / 2, top: SCENE_TOP, width: 1240, height: 600, borderRadius: 24, boxShadow: '0 40px 90px rgba(0,101,189,.16), 0 2px 8px rgba(0,40,80,.08)' }} />
                <ProductFrame world={c.world} y={SCENE_TOP} bracket={c.bracket}>
                  <Scene game={game} market={c.kid.market} ctx={c.kid.ctx} since={Math.max(0, c.season - 1)} onOpen={noop} onBuyGoal={noop} />
                </ProductFrame>
                <div style={{ position: 'absolute', left: (WIDTH - 1240) / 2, top: SCENE_TOP - 96, display: 'flex', alignItems: 'baseline', gap: 22, opacity: labelO }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 30, fontWeight: 700, color: '#14171d' }}><Emoji e={c.kid.ctx.world.emoji} /> {c.kid.ctx.world.name}</span>
                  <span style={{ fontSize: 26, fontWeight: 600, color: TUM.blue }}>ages {b.ages} · {b.label}</span>
                </div>
                <div style={{ position: 'absolute', right: (WIDTH - 1240) / 2, top: SCENE_TOP - 100, fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', color: '#14171d', fontVariantNumeric: 'tabular-nums', opacity: labelO }}>
                  {money(totalValue(game, c.kid.market), c.kid.ctx.world, c.kid.ctx.bracket)}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* captions for the zoomed-out view: three ages under the three worlds */}
      {RAIL.map((c, i) => {
        const b = BRACKETS[c.bracket - 1];
        const cx = WIDTH / 2 + (i - 1) * GAP * 0.4;
        return (
          <div key={c.world} style={{ position: 'absolute', top: HEIGHT / 2 + 150, left: cx - 248, width: 496, textAlign: 'center', opacity: allO }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#14171d' }}><Emoji e={c.kid.ctx.world.emoji} /> {c.kid.ctx.world.name}</div>
            <div style={{ marginTop: 4, fontSize: 22, fontWeight: 600, color: TUM.blue }}>ages {b.ages} · {b.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ closing fan (from the dark film, on the light stage) */
const FAN = [
  { kid: thanja, world: 'farm' as const, bracket: 1 as const, season: 24, tx: -860, ry: 16, tz: -260 },
  { kid: noah, world: 'space' as const, bracket: 2 as const, season: 16, tx: 0, ry: 0, tz: 0 },
  { kid: emilia, world: 'city' as const, bracket: 3 as const, season: 12, tx: 860, ry: -16, tz: -260 },
];

function EndFan() {
  const frame = useCurrentFrame();
  const cardsO = Math.min(fadeIn(frame, F.fanIn, 20), fadeOut(frame, F.logoIn + 16, 20));
  const pull = tw(frame, F.fanIn, F.logoIn + 16, 0.56, 0.46, EASE.inOut);
  const logoO = fadeIn(frame, F.logoIn + 10, 22);
  const logoS = tw(frame, F.logoIn + 10, F.logoIn + 50, 0.94, 1, EASE.enter);
  return (
    <>
      {frame < F.logoIn + 40 && (
        <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: '50% 45%', opacity: cardsO }}>
          <div style={{ position: 'absolute', inset: 0, transform: `translateY(-40px) scale(${pull})`, transformStyle: 'preserve-3d' }}>
            {FAN.map((c) => (
              <div key={c.world} style={{ position: 'absolute', inset: 0, transform: `translate3d(${c.tx * 1.3}px, 0, ${c.tz}px) rotateY(${c.ry}deg)`, transformStyle: 'preserve-3d' }}>
                <ProductFrame world={c.world} y={SCENE_TOP} bracket={c.bracket} style={{ boxShadow: '0 50px 120px rgba(0,101,189,.18)', borderRadius: 24 }}>
                  <Scene game={c.kid.at[c.season]} market={c.kid.market} ctx={c.kid.ctx} since={Math.max(0, c.season - 1)} onOpen={noop} onBuyGoal={noop} />
                </ProductFrame>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}
      {frame >= F.logoIn + 10 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: logoO }}>
          <div style={{ transform: `scale(${2.2 * logoS})` }}><Logo /></div>
          <div style={{ marginTop: 70, fontSize: 22, fontWeight: 700, color: TUM.blue, letterSpacing: '0.02em' }}>lugorrhoe.github.io/kidvest</div>
        </AbsoluteFill>
      )}
    </>
  );
}

export function DemoV2() {
  const frame = useCurrentFrame();

  /* ---------------- page visibility */
  const home1 = pageState(frame, F.homeIn, F.playIn);
  const play1 = pageState(frame, F.playIn, F.home2In);
  const home2 = pageState(frame, F.home2In, F.railIn + 12);
  const home4 = pageState(frame, F.home4In, F.pinIn);
  const pin = pageState(frame, F.pinIn, F.parentIn);
  const parent = pageState(frame, F.parentIn, F.endIn);

  /* ---------------- Thanja's playthrough state */
  const season = seasonAt(frame);
  const bought = frame >= F.clickBuy + 2;
  const lastClick = F.seasons.reduce<number | null>((c, f) => (frame >= f + 2 ? f : c), null);
  const dissolve = lastClick === null ? 1 : tw(frame, lastClick + 2, lastClick + 12, 0, 1, EASE.inOut);
  const tipThanja = frame >= F.tipHensOn && frame < F.clickHens ? 'farm.hens' : undefined;
  const scroll1 = scrollAt(frame, F.scroll);
  const reward = rewardAt(season);
  const celebrate = season >= 24;

  /* ---------------- parent area state */
  const parentTab = frame < F.clickReports + 2 ? 0 : frame < F.clickRewards + 2 ? 4 : 3;
  const parentScroll = parentTab === 4 ? scrollAt(frame, F.reportsScroll) : 0;
  const delivered = frame >= F.clickDeliver + 2;
  const pinFilled = F.digits.filter((d) => frame >= d).length;

  /* ---------------- cursor: two passes, none during the world rail */
  const s = (p: { x: number; y: number }, scrollY = 0) => toStage(p.x, p.y, scrollY);
  const path1: CursorKey[] = [
    { frame: 100, ...s({ x: 980, y: 620 }) },
    { frame: 170, ...s(P.cardThanja) },
    { frame: F.playIn + 10, ...s(P.cardThanja) },
    { frame: F.clickStart - 8, ...M.startYear },
    { frame: F.clickStart + 20, ...M.startYear },
    { frame: F.tipHensOn, ...s(P.hens, 130) },
    { frame: F.clickHens, ...s(P.hens, 130) },
    { frame: F.clickBuy - 10, ...M.buy },
    { frame: F.clickBuy + 15, ...M.buy },
    { frame: F.seasons[0] - 8, ...s(P.nextSeason) },
    { frame: F.seasons[3] + 4, ...s(P.nextSeason) },
    { frame: F.clickYay - 10, ...M.yay },
    { frame: F.clickYay + 20, ...M.yay },
    { frame: F.clickOk - 10, ...M.ok },
    { frame: F.clickOk + 15, ...M.ok },
    { frame: 1040, ...s({ x: 1380, y: 500 }) },
    { frame: 1250, ...s({ x: 1380, y: 500 }) },
    { frame: F.clickExit1 - 6, ...s(P.exit) },
    { frame: F.home2In + 10, ...s(P.exit) },
    { frame: F.railIn - 20, ...s({ x: 980, y: 620 }) },
  ];
  const clicks1 = [F.clickThanja, F.clickStart, F.clickHens, F.clickBuy, ...F.seasons, F.clickYay, F.clickOk, F.clickExit1];
  const path2: CursorKey[] = [
    { frame: F.home4In + 10, ...s({ x: 980, y: 620 }) },
    { frame: F.clickParents - 8, ...s(P.parentsBtn) },
    { frame: F.pinIn + 10, ...s(P.parentsBtn) },
    { frame: F.clickPinField - 6, ...s(P.pinField) },
    { frame: F.clickUnlock - 30, ...s(P.pinField) },
    { frame: F.clickUnlock - 6, ...s(P.unlock) },
    { frame: F.parentIn + 10, ...s(P.unlock) },
    { frame: F.parentIn + 60, ...s({ x: 500, y: 330 }) },
    { frame: F.parentIn + 100, ...s({ x: 860, y: 330 }) },
    { frame: F.clickReports - 8, ...s(P.reportsTab) },
    { frame: F.reportsIn + 20, ...s(P.reportsTab) },
    { frame: F.reportsIn + 60, ...s({ x: 1150, y: 420 }) },
    { frame: F.clickRewards - 40, ...s({ x: 1150, y: 420 }) },
    { frame: F.clickRewards - 8, ...s(P.rewardsTab) },
    { frame: F.rewardsIn + 20, ...s(P.rewardsTab) },
    { frame: F.clickDeliver - 10, ...s({ x: 230, y: 372 }) },
    { frame: F.endIn, ...s({ x: 230, y: 372 }) },
  ];
  const clicks2 = [F.clickParents, F.clickPinField, F.clickUnlock, F.clickReports, F.clickRewards, F.clickDeliver];

  const introO = Math.min(fadeIn(frame, 0, 18), fadeOut(frame, F.homeIn + 22, 16));
  const white = Math.min(1, fadeIn(frame, F.endIn, 14));

  return (
    <LightStage>
      {frame < F.homeIn + 24 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: introO }}>
          <div style={{ transform: `scale(${2.2 * tw(frame, 0, 40, 0.96, 1, EASE.enter)})` }}><Logo /></div>
        </AbsoluteFill>
      )}

      {[home1, home2, home4].map((h, i) => h.visible && (
        <Screen key={`home${i}`} opacity={h.o} scale={h.s}><HomePage /></Screen>
      ))}

      {/* Thanja: the playthrough */}
      {play1.visible && (
        <Screen opacity={play1.o} scale={play1.s} scrollY={scroll1} header={<PlayHeader kid={thanja} game={bought ? thanja.at[season] : thanja.pre} />}>
          {dissolve < 1 && lastClick !== null && <PlayPage kid={thanja} season={season - 1} since={Math.max(20, season - 2)} reward={rewardAt(season - 1)} />}
          <div style={{ position: 'absolute', inset: 0, opacity: dissolve }}>
            {bought
              ? <PlayPage kid={thanja} season={season} since={Math.max(20, season - 1)} tip={tipThanja} reward={reward} />
              : <PlayPage kid={{ ...thanja, at: Object.assign([], thanja.at, { 20: thanja.pre }) }} season={20} since={20} tip={tipThanja} reward={reward} />}
          </div>
        </Screen>
      )}
      <ScreenModal start={F.reportIn} end={F.clickStart + 2} width={720}>
        <YearReportView report={yearReport(thanja.pre, thanja.market, thanja.ctx, 5)} ctx={thanja.ctx} isNew onClose={noop} />
      </ScreenModal>
      <ScreenModal start={F.sheetIn} end={F.clickBuy + 2} width={896}>
        <SheetBody game={thanja.pre} market={thanja.market} ctx={thanja.ctx} assetId="farm.hens" onClose={noop} onTrade={() => null} />
      </ScreenModal>
      {celebrate && <ConfettiBurst start={F.celebrateIn - 4} count={64} />}
      <ScreenModal start={F.celebrateIn} end={F.clickYay + 2} width={560}>
        <RewardCelebration rewards={[rewardAt(24)]} name={thanja.profile.name} onClose={noop} />
      </ScreenModal>
      <ScreenModal start={F.reviewIn} end={F.clickOk + 2} width={640}>
        <YearReviewView review={yearReview(thanja.at[24], thanja.market, thanja.ctx, 5)} ctx={thanja.ctx} unlockAt={thanja.daily(24).unlockAt} onClose={noop} />
      </ScreenModal>

      {/* the three worlds, zoomed out */}
      {frame >= F.railIn - 2 && frame < F.railOut + 2 && <WorldRail />}

      {/* parent area */}
      {pin.visible && <Screen opacity={pin.o} scale={pin.s}><PinGatePage filled={pinFilled} /></Screen>}
      {parent.visible && (
        <Screen opacity={parent.o} scale={parent.s} scrollY={parentScroll} header={<ParentHeader tab={parentTab} />}>
          <ParentPage>
            {parentTab === 0 && <ChildrenTabLite />}
            {parentTab === 4 && <ReportsTabLite kid={thanja} season={24} />}
            {parentTab === 3 && <RewardsTabLite kid={thanja} reward={rewardAt(24)} delivered={delivered} />}
          </ParentPage>
        </Screen>
      )}

      <Cursor tone="light" start={100} end={F.railIn} clicks={clicks1} path={path1} />
      <Cursor tone="light" start={F.home4In + 10} end={F.endIn} clicks={clicks2} path={path2} />
      <ProgressLine total={TOTAL} />

      {/* closing: white, the three worlds fan out, then the logo */}
      <AbsoluteFill style={{ background: '#fff', opacity: white, pointerEvents: 'none' }} />
      {frame >= F.fanIn && <EndFan />}
      {frame < 0 && <span>{SCREEN.w}{KIDS.length}</span>}
    </LightStage>
  );
}
