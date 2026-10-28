import { useEffect, type ReactNode } from 'react';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Emoji({ e, className = '' }: { e: string; className?: string }) {
  return <span className={cx('emoji', className)} aria-hidden>{e}</span>;
}

export function Logo({ dark = false, small = false }: { dark?: boolean; small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 64 64" className={small ? 'h-7 w-7' : 'h-9 w-9'} aria-hidden>
        <rect width="64" height="64" rx="16" fill={dark ? '#ffffff' : '#14171d'} />
        <path d="M14 44 L26 30 L34 37 L50 18" stroke="#3ddc84" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="18" r="5" fill="#3ddc84" />
      </svg>
      <span className={cx('font-extrabold tracking-tight', small ? 'text-lg' : 'text-2xl', dark ? 'text-white' : 'text-ink-900')}>Kidvest</span>
    </div>
  );
}

export function Progress({ value, color = 'var(--accent)', className = 'h-2' }: { value: number; color?: string; className?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v * 100}%`, background: color }} />
    </div>
  );
}

export function Modal({ open, onClose, children, width = 'max-w-3xl' }: { open: boolean; onClose: () => void; children: ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-6 fade-in" onMouseDown={onClose}>
      <div className={cx('card pop-in w-full max-h-[92vh] overflow-auto', width)} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/** Print only one element: marks it as the print target, prints, and cleans up afterwards. */
export function printElement(el: HTMLElement | null) {
  if (!el) return;
  el.classList.add('print-target');
  document.body.classList.add('has-print-target');
  const cleanup = () => {
    el.classList.remove('print-target');
    document.body.classList.remove('has-print-target');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 1000);
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-base font-bold text-ink-900">{children}</h3>
      {right}
    </div>
  );
}
