import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AssetSheet } from '../components/AssetSheet';
import { GrowthChart } from '../components/GrowthChart';
import { AchievementsCard, AllocationCard, ChallengesCard, GoalCard, Hero, Holdings, MarketList, Recap } from '../components/PlayParts';
import { assetDeltas, Scene } from '../components/Scene';
import { RewardCelebration, RewardsCard } from '../components/RewardsCard';
import { db, loadOrCreateGame, recordCheckin, saveGame, startNewRound } from '../db/db';
import { evaluateRewards, type Reward } from '../engine/rewards';
import { dailyState, dayKey, modeOf } from '../engine/daily';
import { yearReport, yearReview, type YearReview } from '../engine/forecast';
import { YearReportView, YearReviewView } from '../components/YearModals';
import { levelOf, totalValue } from '../engine/achievements';
import { money, pct } from '../engine/format';
import { advance, advanceMany, buy, buyGoal, catchUp, contextFor, marketFor, sell, type Context, type SeasonReport, type Unlocks } from '../engine/game';
import type { Market } from '../engine/market';
import type { Game, Profile } from '../engine/types';
import { Tour, tourSteps } from '../components/Tour';
import { cx, Emoji, Logo, Modal } from '../lib/ui';

interface Toast { id: number; emoji: string; title: string; sub: string }
interface Away { report: SeasonReport; n: number; from: number }

export default function Play() {
  const { profileId } = useParams();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [missing, setMissing] = useState(false);
  const [report, setReport] = useState<SeasonReport | null>(null);
  const [since, setSince] = useState(0);
  const [away, setAway] = useState<Away | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showEnd, setShowEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [celebrate, setCelebrate] = useState<Reward[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [tour, setTour] = useState(false);
  const [review, setReview] = useState<YearReview | null>(null);
  const gameRef = useRef<Game | null>(null);
  gameRef.current = game;
  const rewardsRef = useRef<Reward[]>([]);
  rewardsRef.current = rewards;

  /** Re-check real-life rewards against a game state; persists and celebrates changes. */
  const checkRewards = useCallback((g: Game) => {
    const list = rewardsRef.current;
    if (!list.length) return;
    const { changed, achieved } = evaluateRewards(list, g, marketFor(g));
    if (!changed.length) return;
    const next = list.map((r) => changed.find((c) => c.id === r.id) ?? r);
    setRewards(next);
    void db.rewards.bulkPut(changed);
    if (achieved.length) setCelebrate((c) => [...c, ...achieved]);
  }, []);

  const toast = useCallback((u: Unlocks) => {
    const list: Toast[] = [
      ...u.achievements.map((a) => ({ id: Math.random(), emoji: a.emoji, title: 'Badge unlocked!', sub: a.title })),
      ...u.challenges.map((c) => ({ id: Math.random(), emoji: '🎯', title: 'Challenge complete!', sub: c.title })),
      ...(u.levelUp ? [{ id: Math.random(), emoji: '⭐', title: 'Level up!', sub: u.levelUp }] : []),
    ];
    if (!list.length) return;
    setToasts((t) => [...t, ...list].slice(-4));
    for (const x of list) setTimeout(() => setToasts((t) => t.filter((y) => y.id !== x.id)), 4500);
  }, []);

  // load and catch up on the time that passed while the child was away
  useEffect(() => {
    (async () => {
      const p = profileId ? await db.profiles.get(profileId) : undefined;
      if (!p) return setMissing(true);
      let g = await loadOrCreateGame(p);
      if (!g) return setMissing(true);
      const ctx = contextFor(p);
      const mode = modeOf(p);
      const list = await db.rewards.where('profileId').equals(p.id).toArray();
      rewardsRef.current = list;
      setRewards(list);
      if (recordCheckin(g)) await saveGame(g);
      const c = mode === 'realtime' ? catchUp(g, ctx, p.pace) : null;
      if (c) {
        g = c.game;
        await saveGame(g);
        setAway({ report: c.report, n: c.n, from: c.from });
        setReport(c.report);
        setSince(c.from);
      } else {
        setSince(Math.max(0, g.season - 1));
      }
      if (mode === 'daily') {
        const d = dailyState(g, p);
        if (d.newYear) {
          g = { ...g, forecastSeen: d.yearIndex };
          await saveGame(g);
          setShowReport(true);
        }
      }
      setProfile(p);
      setGame(g);
      checkRewards(g);
      if (g.finished) setShowEnd(true);
      if (g.season === 0 && (g.trades?.length ?? 0) === 0 && !localStorage.getItem(`kidvest-tour-${p.id}`)) setTour(true);
    })();
  }, [profileId, checkRewards]);

  // keep the clock running while the page is open
  useEffect(() => {
    if (!profile?.pace || modeOf(profile) !== 'realtime') {
      const id = setInterval(() => setNow(Date.now()), 30_000);
      return () => clearInterval(id);
    }
    const ctx = contextFor(profile);
    const tick = () => {
      setNow(Date.now());
      const g = gameRef.current;
      if (!g) return;
      const c = catchUp(g, ctx, profile.pace);
      if (!c) { checkRewards(g); return; }
      setGame(c.game);
      void saveGame(c.game);
      checkRewards(c.game);
      setReport(c.report);
      setSince(c.from);
      toast(c.report.unlocks);
      if (c.n > 1) setAway({ report: c.report, n: c.n, from: c.from });
    };
    const id = setInterval(tick, profile.pace <= 120_000 ? 5_000 : 30_000);
    return () => clearInterval(id);
  }, [profile, toast, checkRewards]);

  const market = useMemo(() => (game ? marketFor(game) : null), [game?.createdAt, game?.profileId, game?.yearSeq?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const ctx = useMemo(() => (profile ? contextFor(profile) : null), [profile]);

  if (missing) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-lg font-semibold">This player could not be found.</div>
        <Link to="/" className="btn btn-dark btn-md">Back to start</Link>
      </div>
    );
  }
  if (!game || !market || !ctx || !profile) return <div className="flex h-full items-center justify-center text-ink-500">Loading…</div>;

  const { world, bracket } = ctx;
  const commit = (g: Game) => {
    setGame(g);
    void saveGame(g);
    checkRewards(g);
  };
  const daily = dailyState(game, profile, new Date(now));
  const isDaily = modeOf(profile) === 'daily';
  const step = (n0: number) => {
    if (game.finished) return;
    const n = isDaily ? Math.min(n0, daily.seasonsLeft) : n0;
    if (n <= 0) return;
    setBusy(true);
    const r = n === 1 ? advance(game, market, ctx) : advanceMany(game, market, ctx, n);
    if (isDaily && r.game.season % 4 === 0) {
      r.game.lastYearDay = dayKey();
      setReview(yearReview(r.game, market, ctx, r.game.season / 4 - 1));
    }
    setSince(game.season);
    commit(r.game);
    setReport(r.report);
    toast(r.report.unlocks);
    if (r.game.finished) setTimeout(() => setShowEnd(true), 500);
    setTimeout(() => setBusy(false), 180);
  };
  const trade = (side: 'buy' | 'sell', id: string, u: number): string | null => {
    const r = side === 'buy' ? buy(game, market, id, u, ctx) : sell(game, market, id, u, ctx);
    if (!r.ok) return r.error;
    commit(r.game);
    toast(r.unlocks);
    return null;
  };
  const purchaseGoal = () => {
    const r = buyGoal(game, market, ctx);
    if (!r.ok) return alert(r.error);
    commit(r.game);
    toast(r.unlocks);
  };
  const restart = async (random: boolean) => {
    const g = await startNewRound(profile, { randomHistory: random });
    if (g) {
      setGame(g);
      setReport(null);
      setSince(0);
      setShowEnd(false);
    }
  };

  const style = { '--accent': world.colors.accent, '--accent-dark': world.colors.accentDark, '--soft': world.colors.soft } as CSSProperties;
  const lv = levelOf(game.xp);

  return (
    <div style={style} className={cx('min-h-full pb-16', bracket === 1 ? 'text-[17px]' : 'text-[15px]')}>
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-3">
          <div className="flex items-center gap-4">
            <Link to="/"><Logo small /></Link>
            <span className="chip" style={{ background: 'var(--soft)', color: 'var(--accent-dark)' }}><Emoji e={world.emoji} /> {world.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-ink-50 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl shadow-card"><Emoji e={profile.avatar} /></span>
              <span className="text-sm font-bold">{profile.name}</span>
              <span className="text-xs text-ink-500">· {world.levelTitles[lv.level]}</span>
            </div>
            <button className="btn btn-outline btn-md" onClick={() => nav('/')}>Exit</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] space-y-6 px-8 pt-6">
        <Hero game={game} market={market} ctx={ctx} onNext={() => step(1)} onYear={() => step(4)} busy={busy} pace={modeOf(profile) === 'realtime' ? profile.pace : 0} now={now} daily={isDaily ? daily : undefined} onReport={() => setShowReport(true)} />
        <Scene game={game} market={market} ctx={ctx} since={since} onOpen={setSheet} onBuyGoal={purchaseGoal} />
        <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
          <div className="min-w-0 space-y-6">
            <div data-tour="chart"><GrowthChart game={game} market={market} ctx={ctx} /></div>
            <Holdings game={game} market={market} ctx={ctx} onOpen={setSheet} />
            <MarketList game={game} market={market} ctx={ctx} onOpen={setSheet} />
          </div>
          <aside className="space-y-6">
            <RewardsCard rewards={rewards} game={game} market={market} ctx={ctx} />
            <Recap game={game} ctx={ctx} report={report} />
            <div data-tour="goal"><GoalCard game={game} market={market} ctx={ctx} onBuy={purchaseGoal} /></div>
            <AllocationCard game={game} market={market} ctx={ctx} />
            <ChallengesCard game={game} market={market} ctx={ctx} />
            <AchievementsCard game={game} ctx={ctx} />
          </aside>
        </div>
        <p className="pt-4 text-center text-xs text-ink-400">Kidvest is a learning game with replayed historical market data. No real money. Not financial advice. <Link to="/about" className="underline">How it works</Link></p>
      </main>

      <AssetSheet game={game} market={market} ctx={ctx} assetId={sheet} onClose={() => setSheet(null)} onTrade={trade} />

      {tour && !showReport && !away && !review && !showEnd && !sheet && (
        <Tour steps={tourSteps(game, ctx)} onDone={() => { localStorage.setItem(`kidvest-tour-${profile.id}`, '1'); setTour(false); }} />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className="card pop-in flex items-center gap-3 p-4">
            <Emoji e={t.emoji} className="text-3xl" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">{t.title}</div>
              <div className="font-bold">{t.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!away} onClose={() => setAway(null)} width="max-w-xl">
        {away && <AwaySummary away={away} game={game} market={market} ctx={ctx} name={profile.name} onClose={() => setAway(null)} />}
      </Modal>

      <Modal open={showReport} onClose={() => setShowReport(false)} width="max-w-2xl">
        <YearReportView report={yearReport(game, market, ctx, Math.min(Math.floor(game.season / 4), game.yearSeq.length - 1))} ctx={ctx} isNew={daily.newYear || (daily.inYear === 0 && !daily.locked)} onClose={() => setShowReport(false)} />
      </Modal>

      <Modal open={!!review} onClose={() => setReview(null)} width="max-w-xl">
        {review && <YearReviewView review={review} ctx={ctx} unlockAt={dailyState(game, profile, new Date()).unlockAt} onClose={() => setReview(null)} />}
      </Modal>

      <Modal open={celebrate.length > 0} onClose={() => setCelebrate([])} width="max-w-lg">
        <RewardCelebration rewards={celebrate} name={profile.name} onClose={() => setCelebrate([])} />
      </Modal>

      <Modal open={showEnd} onClose={() => setShowEnd(false)} width="max-w-xl">
        <EndSummary game={game} market={market} ctx={ctx} onReplay={() => restart(false)} onSurprise={() => restart(true)} onHome={() => nav('/')} />
      </Modal>
    </div>
  );
}

function AwaySummary({ away, game, market, ctx, name, onClose }: { away: Away; game: Game; market: Market; ctx: Context; name: string; onClose: () => void }) {
  const { world, bracket } = ctx;
  const deltas = assetDeltas(game, market, away.from).filter((d) => d.units > 0).sort((a, b) => b.delta - a.delta);
  const m = (v: number, o?: { sign?: boolean }) => money(v, world, bracket, o);
  const news = away.report.items.filter((x) => x.kind === 'storm' || x.kind === 'sun' || x.kind === 'news' || x.kind === 'goal').slice(-5);
  const change = away.report.change;
  return (
    <div className="p-7">
      <div className="text-center">
        <Emoji e={world.emoji} className="text-5xl" />
        <h2 className="mt-2 text-2xl font-extrabold">Welcome back, {name}!</h2>
        <p className="mt-1 text-ink-600">
          {away.n} {away.n === 1 ? world.seasonWord : `${world.seasonWord}s`} passed while you were away. It is now <b>{world.seasonLabel(game.season)}</b>.
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl p-4" style={{ background: 'var(--soft)' }}>
        <span className="font-semibold">{bracket === 1 ? 'Your animals and trees' : 'Your investments'}</span>
        <span className={cx('num text-lg font-extrabold', change >= 0 ? 'text-gain' : 'text-loss')}>
          {bracket === 1 ? (Math.round(change) >= 1 ? `grew by ${Math.round(change)} coins 📈` : Math.round(change) <= -1 ? `shrank by ${Math.abs(Math.round(change))} coins 📉` : 'stayed about the same') : `${m(change, { sign: true })} (${pct(away.report.changePct, bracket)})`}
        </span>
      </div>
      {deltas.length > 0 && (
        <div className="mt-4 space-y-2">
          {deltas.map((d) => (
            <div key={d.asset.id} className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2">
              <Emoji e={d.asset.emoji} className="text-2xl" />
              <span className="flex-1 text-sm font-semibold">{d.asset.name}</span>
              <span className={cx('num text-sm font-bold', d.delta >= 0 ? 'text-gain' : 'text-loss')}>
                {bracket === 1 ? `${Math.round(d.delta) >= 0 ? '+' : '−'}${Math.abs(Math.round(d.delta))} coins` : `${m(d.delta, { sign: true })} · ${pct(d.pct, bracket)}`}
              </span>
            </div>
          ))}
        </div>
      )}
      {news.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {news.map((it, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-ink-700"><Emoji e={it.emoji ?? '•'} /> <span>{it.text}</span></div>
          ))}
        </div>
      )}
      <button className="btn btn-accent btn-lg mt-6 w-full" onClick={onClose}>Let&apos;s see {world.portfolioName.toLowerCase()} ▶</button>
      <p className="mt-2 text-center text-xs text-ink-500">Total value now: {m(totalValue(game, market))}</p>
    </div>
  );
}

function EndSummary({ game, market, ctx, onReplay, onSurprise, onHome }: { game: Game; market: Market; ctx: Context; onReplay: () => void; onSurprise: () => void; onHome: () => void }) {
  const { world, bracket } = ctx;
  const tot = totalValue(game, market);
  const gain = tot + (game.spent ?? 0) - game.contributions;
  const best = game.history.reduce((a, b) => (b.total > a.total ? b : a), game.history[0]);
  const m = (v: number, o?: { sign?: boolean }) => money(v, world, bracket, o);
  return (
    <div className="p-8 text-center">
      <Emoji e="🏁" className="text-6xl" />
      <h2 className="mt-3 text-2xl font-extrabold">Round complete!</h2>
      <p className="mt-1 text-ink-600">{game.scenario.years} years of {world.name} in the books.</p>
      <div className="mt-6 grid grid-cols-3 gap-3 text-left">
        <Stat label="Final value" value={m(tot)} />
        <Stat label="You put in" value={m(game.contributions)} />
        <Stat label={bracket === 1 ? 'Grown by' : 'Gain'} value={<span className={gain >= 0 ? 'text-gain' : 'text-loss'}>{m(gain, { sign: bracket > 1 })}</span>} />
        <Stat label="Badges" value={`${Object.keys(game.achievements).length}`} />
        <Stat label="Challenges" value={`${Object.keys(game.challengesDone).length}/${game.scenario.challenges.length}`} />
        <Stat label={bracket === 3 ? 'After inflation' : 'Best moment'} value={bracket === 3 ? pct(tot / game.contribAdj - 1, 3) : m(best.total)} />
      </div>
      <div className="mt-7 flex flex-col gap-2">
        <button className="btn btn-accent btn-lg" onClick={onSurprise}>🎲 New round with a surprise history</button>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-md flex-1" onClick={onReplay}>Replay this story</button>
          <button className="btn btn-ghost btn-md flex-1" onClick={onHome}>Back to start</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="num mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
