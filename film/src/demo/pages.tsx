import type { CSSProperties, ReactNode } from 'react';
import { HistoryTimeline } from '../../../src/components/parent/HistoryTimeline';
import { AchievementsCard, AllocationCard, ChallengesCard, GoalCard, Hero, Holdings, MarketList, Recap } from '../../../src/components/PlayParts';
import { RewardsCard } from '../../../src/components/RewardsCard';
import { Scene } from '../../../src/components/Scene';
import { REWARD_SUGGESTIONS } from '../../../src/data/rewardSuggestions';
import { DEFAULT_SCENARIOS } from '../../../src/data/scenarios';
import { BRACKETS, WORLDS } from '../../../src/data/worlds';
import { levelOf, totalValue } from '../../../src/engine/achievements';
import { money, pct } from '../../../src/engine/format';
import { describeCondition, type Reward } from '../../../src/engine/rewards';
import { cx, Emoji, Logo } from '../../../src/lib/ui';
import { ProfileCard } from '../../../src/pages/Home';
import { TalkCard } from '../scenes/Talk';
import { KIDS, NOW, type DemoKid } from './states';

const noop = () => {};
const WORLD_VARS: Record<string, CSSProperties> = {
  farm: { '--accent': '#2f9e44', '--accent-dark': '#237032', '--soft': '#ebf8ee' } as CSSProperties,
  space: { '--accent': '#5f3dc4', '--accent-dark': '#43298c', '--soft': '#f1edff' } as CSSProperties,
  city: { '--accent': '#0c8599', '--accent-dark': '#0b6575', '--soft': '#e3f6f8' } as CSSProperties,
};

/* ------------------------------------------------------------------ start page (replicates pages/Home.tsx) */
export function HomePage() {
  return (
    <div className="min-h-full" style={{ minHeight: 810, background: '#f8f9fa' }}>
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="btn btn-ghost btn-md">How it works</span>
          <span className="btn btn-outline btn-md">🔒 Parents</span>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-8 pb-16">
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight">Who is playing today?</h1>
        <p className="mt-2 text-ink-600">Pick your profile to continue your round. First time here? Each world shows you around when you open it, and the 🧭 Tour button brings the tour back any time.</p>
        <div className="mt-8 grid grid-cols-3 gap-6">
          {KIDS.map((k) => <ProfileCard key={k.profile.id} p={k.profile} g={k.at[k.pre.season]} earned={0} onClick={noop} />)}
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-ink-200 text-ink-500">
            <span className="text-4xl">＋</span>
            <span className="mt-2 font-semibold">Add a child (parents)</span>
          </div>
        </div>
        <p className="mt-16 text-center text-xs text-ink-400">Kidvest is a learning game. Prices replay real market history from 1928 to 2025 in disguise. No real money. Not financial advice. All data stays in this browser.</p>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ play page (replicates pages/Play.tsx) */
export function PlayHeader({ kid, game }: { kid: DemoKid; game: typeof kid.at[number] }) {
  const { world } = kid.ctx;
  const lv = levelOf(game.xp);
  return (
    <header className="border-b border-ink-100 bg-white/90" style={WORLD_VARS[world.id]}>
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-3">
        <div className="flex items-center gap-4">
          <Logo small />
          <span className="chip" style={{ background: 'var(--soft)', color: 'var(--accent-dark)' }}><Emoji e={world.emoji} /> {world.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-ink-50 py-1 pl-1 pr-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl shadow-card"><Emoji e={kid.profile.avatar} /></span>
            <span className="text-sm font-bold">{kid.profile.name}</span>
            <span className="text-xs text-ink-500">· {world.levelTitles[lv.level]}</span>
          </div>
          <span className="btn btn-ghost btn-md">🧭 Tour</span>
          <span className="btn btn-outline btn-md">Exit</span>
        </div>
      </div>
    </header>
  );
}

export function PlayPage({ kid, season, since, tip, reward }: { kid: DemoKid; season: number; since: number; tip?: string; reward?: Reward }) {
  const { world, bracket } = kid.ctx;
  const game = kid.at[season];
  const report = kid.report[season] ?? null;
  return (
    <div className={cx('min-h-full pb-16', bracket === 1 ? 'text-[17px]' : 'text-[15px]')} style={{ ...WORLD_VARS[world.id], background: '#f8f9fa', minHeight: 810 }} data-tip={tip}>
      <div style={{ height: 61 }} />
      <main className="mx-auto max-w-[1280px] space-y-6 px-8 pt-6">
        <Hero game={game} market={kid.market} ctx={kid.ctx} onNext={noop} onYear={noop} busy={false} pace={0} now={NOW.getTime()} daily={kid.daily(season)} onReport={noop} />
        <Scene game={game} market={kid.market} ctx={kid.ctx} since={since} onOpen={noop} onBuyGoal={noop} />
        <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
          <div className="min-w-0 space-y-6">
            <GrowthChartBox kid={kid} season={season} />
            <Holdings game={game} market={kid.market} ctx={kid.ctx} onOpen={noop} />
            <MarketList game={game} market={kid.market} ctx={kid.ctx} onOpen={noop} />
          </div>
          <aside className="space-y-6">
            {reward && <RewardsCard rewards={[reward]} game={game} market={kid.market} ctx={kid.ctx} />}
            <Recap game={game} ctx={kid.ctx} report={report} />
            <GoalCard game={game} market={kid.market} ctx={kid.ctx} onBuy={noop} />
            <AllocationCard game={game} market={kid.market} ctx={kid.ctx} />
            <ChallengesCard game={game} market={kid.market} ctx={kid.ctx} />
            <AchievementsCard game={game} ctx={kid.ctx} />
          </aside>
        </div>
        <p className="pt-4 text-center text-xs text-ink-400">Kidvest is a learning game with replayed historical market data. No real money. Not financial advice.</p>
      </main>
    </div>
  );
}

import { GrowthChart } from '../../../src/components/GrowthChart';
function GrowthChartBox({ kid, season }: { kid: DemoKid; season: number }) {
  return <GrowthChart game={kid.at[season]} market={kid.market} ctx={kid.ctx} />;
}

/* ------------------------------------------------------------------ parent area (replicates pages/Parent.tsx chrome) */
const TABS = ['👨‍👩‍👧 Children', '📜 Scenarios', '🐄 Assets', '🎁 Rewards', '📊 Reports', '⚙️ Data & settings'];

export function PinGatePage({ filled }: { filled: number }) {
  return (
    <div className="flex items-center justify-center bg-ink-900" style={{ minHeight: 810 }}>
      <div className="card w-[420px] p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">Parent area</h1>
        <p className="mt-1 text-sm text-ink-600">Enter your PIN to manage children, scenarios and assets.</p>
        <div className="mt-6 space-y-3">
          <div className="input num flex items-center justify-center gap-4 text-2xl" style={{ height: 52 }}>
            {[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 14, height: 14, borderRadius: 7, background: i < filled ? '#14171d' : '#dfe3e8' }} />)}
          </div>
          <span className="btn btn-dark btn-lg w-full">Unlock</span>
        </div>
        <div className="mt-4 block text-center text-sm text-ink-500">← Back to the kids</div>
      </div>
    </div>
  );
}

export function ParentHeader({ tab }: { tab: number }) {
  return (
    <header className="border-b border-ink-100 bg-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-3">
        <div className="flex items-center gap-4">
          <Logo small />
          <span className="chip bg-ink-900 text-white">Parent area</span>
        </div>
        <nav className="flex rounded-xl bg-ink-100 p-1">
          {TABS.map((t, i) => <span key={t} data-tab={i} className={cx('tab', tab === i && 'tab-active')}>{t}</span>)}
        </nav>
        <div className="flex gap-2">
          <span className="btn btn-ghost btn-md">🔒 Lock</span>
          <span className="btn btn-dark btn-md">Back to kids</span>
        </div>
      </div>
    </header>
  );
}

export function ParentPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-ink-50" style={{ minHeight: 810 }}>
      <div style={{ height: 61 }} />
      <main className="mx-auto max-w-[1280px] px-8 py-8">{children}</main>
    </div>
  );
}

const modeText = (p: DemoKid['profile']) => ((p.mode ?? 'manual') === 'daily' ? `One year a day, unlocks ${String(p.unlockHour ?? 10).padStart(2, '0')}:00` : 'Free play');

export function ChildrenTabLite() {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Children</h2>
          <p className="text-sm text-ink-600">Each child plays their own round in their own world. Age group controls how much real-world detail they see.</p>
        </div>
        <span className="btn btn-dark btn-md">＋ Add child</span>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {KIDS.map((k) => {
          const p = k.profile;
          const w = WORLDS[p.world];
          const sc = DEFAULT_SCENARIOS.find((s) => s.id === p.scenarioId);
          return (
            <div key={p.id} className="card card-pad">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ background: w.colors.soft }}><Emoji e={p.avatar} /></span>
                <div>
                  <div className="text-lg font-bold">{p.name}</div>
                  <div className="text-xs text-ink-500">Ages {BRACKETS[p.bracket - 1].ages} · {BRACKETS[p.bracket - 1].label}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <div><Emoji e={w.emoji} /> {w.name}</div>
                <div className="truncate text-ink-600">📜 {sc?.name ?? 'Unknown scenario'}</div>
                <div className="text-ink-600">⏱️ {modeText(p)}</div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-50 p-2 text-xs">
                <span className="font-semibold text-ink-600">Move time forward:</span>
                <span className="btn btn-outline px-2 py-1 text-xs">+1 season</span>
                <span className="btn btn-outline px-2 py-1 text-xs">+1 year</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="btn btn-ghost btn-md">Edit</span>
                <span className="btn btn-ghost btn-md">New round</span>
                <span className="btn btn-danger btn-md">Delete</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KidPicker({ current }: { current: DemoKid }) {
  return (
    <div className="mb-5 flex gap-2">
      {KIDS.map((k) => <span key={k.profile.id} className={cx('btn btn-md', current.profile.id === k.profile.id ? 'btn-dark' : 'btn-ghost')}><Emoji e={k.profile.avatar} /> {k.profile.name}</span>)}
    </div>
  );
}

export function ReportsTabLite({ kid, season }: { kid: DemoKid; season: number }) {
  const g = kid.at[season];
  const m = kid.market;
  const world = WORLDS[kid.profile.world];
  const fmt = (v: number, o?: { sign?: boolean }) => money(v, world, 3, o);
  const tot = totalValue(g, m);
  const gain = tot + (g.spent ?? 0) - g.contributions;
  const seq = g.yearSeq?.length ? g.yearSeq : [g.startYear];
  const stats = [
    ['Total value', fmt(tot)],
    ['Paid in', fmt(g.contributions)],
    ['Gain', `${fmt(gain, { sign: true })} (${pct(gain / g.contributions, 3)})`],
    ['After inflation', pct(tot / g.contribAdj - 1, 3)],
    ['Payouts received', fmt(g.payoutsTotal)],
    ['Spent on goals', fmt(g.spent ?? 0)],
    ['Orders', String(g.tradeCount)],
    ['Challenges', `${Object.keys(g.challengesDone).length}/${g.scenario.challenges.length}`],
  ];
  const prompts = [...g.talk].reverse().slice(0, 3);
  const year = (s: number) => (s === 0 ? `${g.startYear} start` : `${m.years[s]} Q${((s - 1) % 4) + 1}`);
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-extrabold">Reports</h2>
        <p className="text-sm text-ink-600">See what your child did, which real years were replayed, and get conversation prompts. Show, let do, then talk.</p>
      </div>
      <KidPicker current={kid} />
      <div className="space-y-6">
        <div className="card card-pad">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-bold">{kid.profile.name}: {g.scenario.name}</div>
              <div className="text-sm text-ink-600">{world.name} · ages {BRACKETS[kid.profile.bracket - 1].ages} · {world.seasonLabel(g.season)}</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-right text-sm">
                <div className="text-xs text-amber-700">Real history replayed (only you see this)</div>
                <div className="font-bold text-amber-900">{seq[0]} to {seq[seq.length - 1]}</div>
                <div className="text-xs text-amber-700">Now in {m.years[g.season] ?? seq[seq.length - 1]} · chapter {(g.chapters ?? 0) + 1}</div>
              </div>
              <span className="btn btn-outline btn-md shrink-0">🖨️ Print report</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {stats.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-ink-100 p-3">
                <div className="text-xs text-ink-500">{k}</div>
                <div className="num mt-1 font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <HistoryTimeline game={g} market={m} world={world} />
        <div className="grid grid-cols-2 gap-6">
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
          <TalkCard clicked={false} />
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<Reward['status'], string> = {
  active: 'bg-sky-100 text-sky-800',
  achieved: 'bg-amber-100 text-amber-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-ink-100 text-ink-600',
  cancelled: 'bg-ink-100 text-ink-500',
};

export function RewardsTabLite({ kid, reward, delivered }: { kid: DemoKid; reward: Reward; delivered: boolean }) {
  const p = kid.profile;
  const world = WORLDS[p.world];
  const fmt = (v: number) => money(v, world, p.bracket, { ceil: p.bracket === 1 });
  const status: Reward['status'] = delivered ? 'delivered' : reward.status;
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Real-life rewards</h2>
          <p className="text-sm text-ink-600">Promise something real for good habits in the game: holding through storms, spreading money, saving towards a goal. Behaviour, not luck.</p>
        </div>
        <span className="btn btn-dark btn-md">＋ New reward</span>
      </div>
      <KidPicker current={kid} />
      <div className="grid grid-cols-[1fr_380px] gap-6">
        <div className="card card-pad">
          <h3 className="mb-3 font-bold">🎁 {p.name}'s rewards</h3>
          <div className="rounded-2xl border border-ink-100 p-4">
            <div className="flex items-start gap-3">
              <Emoji e={reward.emoji} className="text-3xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-bold">{reward.title}</div>
                  <span className={cx('chip', STATUS_STYLE[status])}>{status}</span>
                </div>
                <div className="mt-0.5 text-sm text-ink-600">{describeCondition(reward, p.bracket, world.seasonWord, fmt)}</div>
                <div className="mt-1 text-xs text-ink-500">Set {new Date(reward.createdAt).toLocaleDateString('en-GB')} · Experience / outing</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {status === 'achieved' && <span className="btn btn-dark btn-md" data-deliver>✓ Mark as delivered</span>}
              {status === 'delivered' && <span className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Delivered today. Well done, both of you.</span>}
              <span className="btn btn-ghost btn-md">Edit</span>
            </div>
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="mb-1 font-bold">Suggestions for ages {BRACKETS[p.bracket - 1].ages}</h3>
          <p className="mb-3 text-xs text-ink-500">Conditions favour behaviour over outcomes.</p>
          <div className="space-y-2">
            {REWARD_SUGGESTIONS[p.bracket].slice(0, 4).map((s) => (
              <div key={s.title} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <Emoji e={s.emoji} className="text-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="truncate text-xs text-ink-500">{s.why}</div>
                </div>
                <span className="btn btn-outline px-2 py-1 text-xs">Add</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
