import { money } from '../engine/format';
import type { Context } from '../engine/game';
import type { Market } from '../engine/market';
import { describeCondition, rewardProgress, type Reward } from '../engine/rewards';
import type { Game } from '../engine/types';
import { cx, Emoji, Progress, SectionTitle } from '../lib/ui';
import { fmtDuration } from './PlayParts';

export function RewardsCard({ rewards, game, market, ctx }: { rewards: Reward[]; game: Game; market: Market; ctx: Context }) {
  const { bracket, world } = ctx;
  const now = Date.now();
  const visible = rewards.filter((r) => r.status === 'active' || r.status === 'achieved' || (r.status === 'expired' && r.deadline && now - r.deadline < 14 * 86_400_000));
  if (!visible.length) return null;
  const fmt = (v: number) => money(v, world, bracket, { ceil: bracket === 1 });
  return (
    <div className="card card-pad border-amber-200" style={{ background: 'linear-gradient(180deg,#fffbeb,#ffffff 60%)' }}>
      <SectionTitle right={<span className="text-xs text-ink-500">from your parents</span>}>🎁 Real rewards</SectionTitle>
      <div className="space-y-3">
        {visible.map((r) => {
          const p = rewardProgress(r, game, market);
          const left = r.deadline ? r.deadline - now : null;
          return (
            <div key={r.id} className={cx('rounded-2xl border p-3', r.status === 'achieved' ? 'border-amber-300 bg-amber-100' : r.status === 'expired' ? 'border-ink-100 bg-ink-50 opacity-80' : 'border-amber-100 bg-white')}>
              <div className="flex items-start gap-3">
                <Emoji e={r.emoji} className="text-3xl" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold leading-tight">{r.title}</div>
                  <div className="mt-0.5 text-xs text-ink-600">{describeCondition(r, bracket, world.seasonWord, fmt)}</div>
                </div>
              </div>
              {r.status === 'active' && (
                <>
                  <Progress value={p} className="mt-2 h-2" color="#f59f00" />
                  <div className="mt-1 flex justify-between text-xs text-ink-500">
                    <span>{Math.round(p * 100)} %</span>
                    <span>{left === null ? 'No time limit' : left > 0 ? `⏰ ${fmtDuration(left)} left` : 'Deadline today'}</span>
                  </div>
                  {r.violated && <div className="mt-1 text-xs font-semibold text-red-600">Oops, this one slipped. Ask your parents about a new try.</div>}
                </>
              )}
              {r.status === 'achieved' && <div className="mt-2 rounded-xl bg-white/70 p-2 text-sm font-bold text-amber-900">🎉 You earned it! Show this to your parents.</div>}
              {r.status === 'expired' && <div className="mt-2 text-xs text-ink-500">Time ran out this time. That happens to real investors too. Ask for a new try!</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RewardCelebration({ rewards, name, onClose }: { rewards: Reward[]; name: string; onClose: () => void }) {
  return (
    <div className="p-8 text-center">
      <div className="text-6xl"><Emoji e="🎉" /></div>
      <h2 className="mt-3 text-2xl font-extrabold">{name}, you earned a real reward!</h2>
      <div className="mt-5 space-y-3">
        {rewards.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-left">
            <Emoji e={r.emoji} className="text-4xl" />
            <div>
              <div className="text-lg font-extrabold">{r.title}</div>
              {r.note && <div className="text-sm text-ink-600">{r.note}</div>}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-600">Show this to your parents. They will hand it over.</p>
      <button className="btn btn-accent btn-lg mt-5 w-full" onClick={onClose}>Yay!</button>
    </div>
  );
}
