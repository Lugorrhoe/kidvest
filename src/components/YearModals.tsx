import { money, pct } from '../engine/format';
import type { Context } from '../engine/game';
import type { YearReport, YearReview } from '../engine/forecast';
import { fmtUnlock } from '../engine/daily';
import { cx, Emoji } from '../lib/ui';

export function YearReportView({ report, ctx, onClose, isNew }: { report: YearReport; ctx: Context; onClose: () => void; isNew: boolean }) {
  const { world, bracket } = ctx;
  const dark = world.id === 'space';
  return (
    <div>
      <div className={cx('rounded-t-2xl p-7', dark ? 'text-white' : 'text-ink-900')} style={{ background: world.colors.hero }}>
        <div className={cx('text-xs font-semibold uppercase tracking-wide', dark ? 'text-white/70' : 'text-ink-600')}>{world.id === 'farm' ? "Farmer Jo's almanac" : world.id === 'space' ? 'Mission control briefing' : 'Economic outlook'}</div>
        <h2 className="mt-1 text-3xl font-extrabold">📋 {report.title}</h2>
        <p className={cx('mt-2 text-base leading-relaxed', dark ? 'text-white/85' : 'text-ink-700')}>{report.intro}</p>
      </div>
      <div className="p-7">
        <div className="space-y-2.5">
          {report.items.map((it, i) => (
            <div key={i} className={cx('flex items-start gap-3 rounded-2xl border p-3', it.kind === 'rumour' ? 'border-dashed border-amber-300 bg-amber-50' : 'border-ink-100')}>
              <Emoji e={it.emoji} className="mt-0.5 text-2xl" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ink-500">{it.kind === 'rumour' ? 'Rumour' : it.kind === 'consensus' ? `Analyst consensus · ${it.names}` : it.names}</div>
                <div className={cx('leading-snug', bracket === 1 ? 'text-base' : 'text-sm')}>{it.text}</div>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-3 rounded-2xl p-3" style={{ background: 'var(--soft)' }}>
            <Emoji e="🏷️" className="mt-0.5 text-2xl" />
            <div className={cx('leading-snug', bracket === 1 ? 'text-base' : 'text-sm')}>{report.priceNote}</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-600">{report.closing}</p>
        <button className="btn btn-accent btn-lg mt-5 w-full" onClick={onClose}>{isNew ? `Start ${report.yearLabel} ▶` : 'Close'}</button>
      </div>
    </div>
  );
}

export function YearReviewView({ review, ctx, unlockAt, onClose }: { review: YearReview; ctx: Context; unlockAt?: number; onClose: () => void }) {
  const { world, bracket } = ctx;
  const m = (v: number, o?: { sign?: boolean }) => money(v, world, bracket, o);
  const up = review.change >= 0;
  const right = review.checks.filter((c) => c.truthful).length;
  return (
    <div className="p-7">
      <div className="text-center">
        <Emoji e={up ? '🌞' : '🌧️'} className="text-5xl" />
        <h2 className="mt-2 text-2xl font-extrabold">Year {review.yearIndex + 1} is over</h2>
        <p className="mt-1 text-ink-600">{bracket === 1 ? 'Four seasons played. Here is what happened on your farm.' : 'Four quarters played. Here is how the year went.'}</p>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl p-4" style={{ background: 'var(--soft)' }}>
        <span className="font-semibold">{bracket === 1 ? 'Your animals and trees' : 'Your investments this year'}</span>
        <span className={cx('num text-lg font-extrabold', up ? 'text-gain' : 'text-loss')}>
          {bracket === 1 ? (Math.round(review.change) >= 1 ? `grew by ${m(Math.round(review.change))} 📈` : Math.round(review.change) <= -1 ? `shrank by ${m(Math.abs(Math.round(review.change)))} 📉` : 'stayed about the same') : `${m(review.change, { sign: true })} (${pct(review.changePct, bracket)})`}
        </span>
      </div>
      {review.perAsset.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {review.perAsset.map((a) => (
            <div key={a.name} className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2 text-sm">
              <Emoji e={a.emoji} className="text-xl" />
              <span className="flex-1 font-semibold">{a.name}</span>
              <span className={cx('num font-bold', a.delta >= 0 ? 'text-gain' : 'text-loss')}>{bracket === 1 ? `${Math.round(a.delta) >= 0 ? '+' : '−'}${Math.abs(Math.round(a.delta))} coins` : `${m(a.delta, { sign: true })} · ${pct(a.r, bracket)}`}</span>
            </div>
          ))}
        </div>
      )}
      {bracket >= 2 && (
        <div className="mt-4">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">Forecast check · {right} of {review.checks.length} were right</div>
          <div className="space-y-1.5">
            {review.checks.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={cx('mt-0.5 shrink-0 font-bold', c.truthful ? 'text-gain' : 'text-loss')}>{c.truthful ? '✓' : '✗'}</span>
                <span className="text-ink-700"><b>{c.kind === 'rumour' ? 'Rumour' : c.names}:</b> {c.text}</span>
              </div>
            ))}
          </div>
          {right < review.checks.length && <p className="mt-2 text-xs text-ink-500">Even experts get it wrong. That is why spreading your money and holding on matter more than predictions.</p>}
        </div>
      )}
      {unlockAt && <div className="mt-5 rounded-2xl bg-ink-900 p-4 text-center text-white"><div className="text-xs text-white/70">{world.portfolioName} rests now</div><div className="text-lg font-extrabold">Next year unlocks {fmtUnlock(unlockAt)}</div></div>}
      <button className="btn btn-accent btn-lg mt-4 w-full" onClick={onClose}>OK</button>
    </div>
  );
}
