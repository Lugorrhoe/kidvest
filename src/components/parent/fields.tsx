import type { ReactNode } from 'react';
import { cx } from '../../lib/ui';

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="label">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

export function Num({ value, onChange, step = 1, min, max, suffix }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        className="input num pr-10"
        value={Number.isFinite(value) ? value : ''}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">{suffix}</span>}
    </div>
  );
}

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={cx('rounded-xl border px-3 py-2 text-sm font-semibold transition', value === o.v ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const AVATARS = ['🦊', '🐼', '🦉', '🐯', '🐸', '🐨', '🦁', '🐰', '🐻', '🐧', '🦄', '🐙', '🐢', '🦋', '🐳', '🐝'];
