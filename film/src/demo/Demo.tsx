import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SheetBody } from '../../../src/components/AssetSheet';
import { RewardCelebration } from '../../../src/components/RewardsCard';
import { YearReportView, YearReviewView } from '../../../src/components/YearModals';
import { yearReport, yearReview } from '../../../src/engine/forecast';
import { Logo } from '../../../src/lib/ui';
import { ConfettiBurst, Cursor, EASE, fadeIn, fadeOut, tw, type CursorKey } from '../motion';
import { HEIGHT, TOTAL, WIDTH } from '../timeline';
import { LightStage, ProgressLine, SCREEN, Screen, ScreenModal, TUM, pageState, scrollAt, toStage } from './light';
import { ChildrenTabLite, HomePage, ParentHeader, ParentPage, PinGatePage, PlayHeader, PlayPage, ReportsTabLite, RewardsTabLite } from './pages';
import { emilia, noah, rewardAt, thanja } from './states';

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
  clickNoah: 1365, noahIn: 1380, noahReportIn: 1398, noahClickStart: 1480, noahTipOn: 1505, noahExit: 1600, home3In: 1615,
  clickEmilia: 1690, emIn: 1705, emReportIn: 1723, emClickStart: 1805, emTipOn: 1830, emExit: 1905, home4In: 1920,
  clickParents: 1982, pinIn: 1996, digits: [2026, 2038, 2050, 2062], clickUnlock: 2086, parentIn: 2100,
  clickReports: 2232, reportsIn: 2246,
  reportsScroll: [{ f: 2300, y: 0 }, { f: 2365, y: 560 }, { f: 2415, y: 560 }, { f: 2465, y: 820 }, { f: 2500, y: 820 }],
  clickRewards: 2506, rewardsIn: 2520, clickDeliver: 2602,
  endIn: 2648,
};

/* Page coordinates (1440 px wide) of the things the cursor visits; tuned against stills. */
const P = {
  cardThanja: { x: 340, y: 360 },
  cardNoah: { x: 720, y: 360 },
  cardEmilia: { x: 1100, y: 360 },
  parentsBtn: { x: 1228, y: 42 },
  exit: { x: 1300, y: 30 },
  nextSeason: { x: 1180, y: 214 },
  hens: { x: 1232, y: 600 },
  rocket: { x: 440, y: 720 },
  cityacc: { x: 690, y: 590 },
  reportsTab: { x: 925, y: 30 },
  rewardsTab: { x: 795, y: 30 },
  unlock: { x: 720, y: 525 },
};
/* Stage coordinates of modal buttons (centred cards). */
const M = {
  startYear: { x: 960, y: 862 },
  startYearFit: { x: 960, y: 900 },
  buy: { x: 1226, y: 784 },
  yay: { x: 960, y: 696 },
  ok: { x: 960, y: 818 },
  deliver: { x: 0, y: 0 },
};

const seasonAt = (frame: number) => F.seasons.reduce((s, f, i) => (frame >= f + 2 ? 21 + i : s), 20);

export function Demo() {
  const frame = useCurrentFrame();

  /* ---------------- page visibility */
  const home1 = pageState(frame, F.homeIn, F.playIn);
  const play1 = pageState(frame, F.playIn, F.home2In);
  const home2 = pageState(frame, F.home2In, F.noahIn);
  const playNoah = pageState(frame, F.noahIn, F.home3In);
  const home3 = pageState(frame, F.home3In, F.emIn);
  const playEm = pageState(frame, F.emIn, F.home4In);
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

  /* ---------------- cursor */
  const s = (p: { x: number; y: number }, scrollY = 0) => toStage(p.x, p.y, scrollY);
  const path: CursorKey[] = [
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
    { frame: F.clickNoah - 8, ...s(P.cardNoah) },
    { frame: F.noahIn + 10, ...s(P.cardNoah) },
    { frame: F.noahClickStart - 8, ...M.startYearFit },
    { frame: F.noahClickStart + 15, ...M.startYearFit },
    { frame: F.noahTipOn, ...s(P.rocket) },
    { frame: F.noahExit - 30, ...s(P.rocket) },
    { frame: F.noahExit - 6, ...s(P.exit) },
    { frame: F.home3In + 10, ...s(P.exit) },
    { frame: F.clickEmilia - 8, ...s(P.cardEmilia) },
    { frame: F.emIn + 10, ...s(P.cardEmilia) },
    { frame: F.emClickStart - 8, ...M.startYearFit },
    { frame: F.emClickStart + 15, ...M.startYearFit },
    { frame: F.emTipOn, ...s(P.cityacc, 150) },
    { frame: F.emExit - 30, ...s(P.cityacc, 150) },
    { frame: F.emExit - 6, ...s(P.exit) },
    { frame: F.home4In + 10, ...s(P.exit) },
    { frame: F.clickParents - 8, ...s(P.parentsBtn) },
    { frame: F.pinIn + 10, ...s(P.parentsBtn) },
    { frame: F.digits[0] - 6, ...s({ x: 690, y: 450 }) },
    { frame: F.digits[3] + 6, ...s({ x: 750, y: 450 }) },
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
  const clicks = [F.clickThanja, F.clickStart, F.clickHens, F.clickBuy, ...F.seasons, F.clickYay, F.clickOk, F.clickExit1, F.clickNoah, F.noahClickStart, F.noahExit, F.clickEmilia, F.emClickStart, F.emExit, F.clickParents, ...F.digits, F.clickUnlock, F.clickReports, F.clickRewards, F.clickDeliver];

  const introO = Math.min(fadeIn(frame, 0, 18), fadeOut(frame, F.homeIn + 22, 16));
  const endO = fadeIn(frame, F.endIn + 10, 24);
  const white = Math.min(1, fadeIn(frame, F.endIn, 18));

  return (
    <LightStage>
      {/* opening logo */}
      {frame < F.homeIn + 24 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: introO }}>
          <div style={{ transform: `scale(${2.2 * tw(frame, 0, 40, 0.96, 1, EASE.enter)})` }}><Logo /></div>
        </AbsoluteFill>
      )}

      {/* start page, four visits */}
      {[home1, home2, home3, home4].map((h, i) => h.visible && (
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

      {/* Noah and Emilia: the other two worlds */}
      {playNoah.visible && (
        <Screen opacity={playNoah.o} scale={playNoah.s} header={<PlayHeader kid={noah} game={noah.at[16]} />}>
          <PlayPage kid={noah} season={16} since={15} tip={frame >= F.noahTipOn && frame < F.noahExit - 30 ? 'space.rocket' : undefined} />
        </Screen>
      )}
      <ScreenModal start={F.noahReportIn} end={F.noahClickStart + 2} width={720} fit={0.86}>
        <YearReportView report={yearReport(noah.at[16], noah.market, noah.ctx, 4)} ctx={noah.ctx} isNew onClose={noop} />
      </ScreenModal>
      {playEm.visible && (
        <Screen opacity={playEm.o} scale={playEm.s} scrollY={scrollAt(frame, [{ f: F.emTipOn - 12, y: 0 }, { f: F.emTipOn + 8, y: 150 }])} header={<PlayHeader kid={emilia} game={emilia.at[12]} />}>
          <PlayPage kid={emilia} season={12} since={11} tip={frame >= F.emTipOn && frame < F.emExit - 30 ? 'city.cityacc' : undefined} />
        </Screen>
      )}
      <ScreenModal start={F.emReportIn} end={F.emClickStart + 2} width={720} fit={0.86}>
        <YearReportView report={yearReport(emilia.at[12], emilia.market, emilia.ctx, 3)} ctx={emilia.ctx} isNew onClose={noop} />
      </ScreenModal>

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

      <Cursor tone="light" start={100} end={F.endIn + 4} clicks={clicks} path={path} />
      <ProgressLine total={TOTAL} />

      {/* end card */}
      <AbsoluteFill style={{ background: '#fff', opacity: white, pointerEvents: 'none' }} />
      {frame >= F.endIn + 10 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: endO }}>
          <div style={{ transform: 'scale(2.2)' }}><Logo /></div>
          <div style={{ marginTop: 70, fontSize: 22, fontWeight: 700, color: TUM.blue, letterSpacing: '0.02em' }}>lugorrhoe.github.io/kidvest</div>
        </AbsoluteFill>
      )}
      {frame < 0 && <span>{WIDTH}{HEIGHT}{SCREEN.w}</span>}
    </LightStage>
  );
}
