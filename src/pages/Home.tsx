import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { fmtDuration } from '../components/PlayParts';
import { db, migrateDemoNames, seedDemoFamily } from '../db/db';
import { dailyState, fmtUnlock, modeOf } from '../engine/daily';
import { levelOf, totalValue } from '../engine/achievements';
import { money } from '../engine/format';
import { marketFor } from '../engine/game';
import { BRACKETS, WORLDS, WORLD_LIST } from '../data/worlds';
import type { Game, Profile } from '../engine/types';
import { Emoji, Logo, Progress } from '../lib/ui';
import { TalkDueBanner } from '../components/parent/TalkSection';

export default function Home() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray(), []);
  const games = useLiveQuery(() => db.games.toArray(), []);
  const earned = useLiveQuery(() => db.rewards.where('status').equals('achieved').toArray(), []);
  const nav = useNavigate();
  useEffect(() => { void migrateDemoNames(); }, []);
  if (!profiles || !games || !earned) return null;
  const gameOf = (id: string) => games.find((g) => g.profileId === id);

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-6">
        <Logo />
        <div className="flex items-center gap-3"><TalkDueBanner compact /><Link to="/about" className="btn btn-ghost btn-md">How it works</Link><Link to="/parent" className="btn btn-outline btn-md">🔒 Parents</Link></div>
      </header>

      <main className="mx-auto max-w-[1180px] px-8 pb-16">
        {profiles.length === 0 ? (
          <Welcome onDemo={async () => { await seedDemoFamily(); }} onParent={() => nav('/parent')} />
        ) : (
          <>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight">Who is playing today?</h1>
            <p className="mt-2 text-ink-600">Pick your profile to continue your round. First time here? Each world shows you around when you open it, and the 🧭 Tour button brings the tour back any time.</p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {profiles.map((p) => <ProfileCard key={p.id} p={p} g={gameOf(p.id)} earned={earned.filter((r) => r.profileId === p.id).length} onClick={() => nav(`/play/${p.id}`)} />)}
              <Link to="/parent" className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-ink-200 text-ink-500 transition hover:border-ink-400 hover:text-ink-700">
                <span className="text-4xl">＋</span>
                <span className="mt-2 font-semibold">Add a child (parents)</span>
              </Link>
            </div>
          </>
        )}
        <p className="mt-16 text-center text-xs text-ink-400">
          Kidvest is a learning game. Prices replay real market history from 1928 to 2025 in disguise. No real money. Not financial advice. All data stays in this browser. <Link to="/about" className="underline">How it works</Link>
        </p>
      </main>
    </div>
  );
}

function ProfileCard({ p, g, earned, onClick }: { p: Profile; g?: Game; earned: number; onClick: () => void }) {
  const w = WORLDS[p.world];
  const dark = w.id !== 'farm';
  let value: string | null = null;
  let progress = 0;
  if (g) {
    const m = marketFor(g);
    value = money(totalValue(g, m), w, p.bracket);
    progress = (g.season - (g.chapters ?? 0) * g.scenario.years * 4) / (g.scenario.years * 4);
  }
  const lv = levelOf(g?.xp ?? 0);
  return (
    <button onClick={onClick} className="group overflow-hidden rounded-3xl text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={dark ? 'p-6 text-white' : 'p-6 text-ink-900'} style={{ background: w.colors.hero }}>
        <div className="flex items-center justify-between">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-card"><Emoji e={p.avatar} /></span>
          <Emoji e={w.emoji} className="text-4xl opacity-80" />
        </div>
        {earned > 0 && <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-900">🎁 Real reward earned!</div>}
        <div className="mt-4 text-2xl font-extrabold">{p.name}</div>
        <div className={dark ? 'text-sm text-white/75' : 'text-sm text-ink-600'}>{w.name} · ages {BRACKETS[p.bracket - 1].ages}</div>
      </div>
      <div className="bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">{w.levelTitles[lv.level]}</span>
          <span className="num font-bold">{value ?? 'New round'}</span>
        </div>
        <Progress value={progress} className="mt-3 h-1.5" color={w.colors.accent} />
        <div className="mt-1 text-xs text-ink-400">{!g ? 'Not started yet' : g.finished ? 'Round finished' : modeOf(p) === 'daily' ? (() => { const d = dailyState(g, p); return d.locked && d.unlockAt ? `🌙 Resting · next year ${fmtUnlock(d.unlockAt)}` : d.inYear > 0 ? `▶ ${d.seasonsLeft} ${w.seasonWord}s left today` : '✨ A new year is ready to play!'; })() : modeOf(p) === 'realtime' && p.pace ? (Date.now() - g.lastTick >= p.pace ? '✨ Something happened! Come and look' : `Next ${w.seasonWord} in ${fmtDuration(g.lastTick + p.pace - Date.now())}`) : `Chapter ${(g.chapters ?? 0) + 1} · ${Math.round(progress * 100)} % played`}</div>
      </div>
    </button>
  );
}

function Welcome({ onDemo, onParent }: { onDemo: () => void; onParent: () => void }) {
  return (
    <div className="mt-6">
      <div className="rounded-[32px] bg-ink-900 p-12 text-white">
        <div className="max-w-2xl">
          <div className="chip bg-white/10 text-white">For children aged 6 to 14 and their parents</div>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight">Learn to invest by doing it, one season at a time.</h1>
          <p className="mt-4 text-lg text-white/75">
            Kidvest turns a century of real market history into a farm, a space station or a city. Children buy, hold and sell, live through storms and booms, and grow with the game as they grow older.
          </p>
          <div className="mt-8 flex gap-3">
            <button className="btn btn-lg bg-white text-ink-900 hover:bg-white/90" onClick={onDemo}>✨ Try the demo family</button>
            <button className="btn btn-lg bg-white/10 text-white hover:bg-white/20" onClick={onParent}>🔒 Set up as a parent</button>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          ['1', '🔒', 'Parents set up a child', 'Pick a world for their age in the parent area, or try the demo family to look around first.'],
          ['2', '🌦️', 'The child plays, one year a day', 'Four seasons of real market history in disguise: buy, hold, live through storms, save for goals.'],
          ['3', '💬', 'Then talk', 'Parents see the real years, get conversation prompts and a monthly reminder to sit down together.'],
        ].map(([n, e, title, text]) => (
          <div key={n} className="card flex items-start gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-extrabold text-white">{n}</span>
            <div>
              <div className="font-bold"><Emoji e={e} /> {title}</div>
              <div className="mt-0.5 text-sm text-ink-600">{text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-6">
        {WORLD_LIST.map((w) => (
          <div key={w.id} className="overflow-hidden rounded-3xl shadow-card">
            <div className={w.id === 'farm' ? 'p-6 text-ink-900' : 'p-6 text-white'} style={{ background: w.colors.hero }}>
              <Emoji e={w.emoji} className="text-4xl" />
              <div className="mt-3 text-xl font-extrabold">{w.name}</div>
              <div className={w.id === 'farm' ? 'text-sm text-ink-600' : 'text-sm text-white/75'}>Ages {w.ages}</div>
            </div>
            <div className="bg-white p-5 text-sm text-ink-600">
              <p>{w.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.values(w.assets).slice(0, 6).map((a) => <span key={a.name} className="chip bg-ink-50 text-ink-700"><Emoji e={a.emoji} /> {a.name}</span>)}
              </div>
              <p className="mt-3 text-xs text-ink-500">{BRACKETS[w.defaultBracket - 1].summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
