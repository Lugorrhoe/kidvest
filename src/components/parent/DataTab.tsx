import { useRef, useState } from 'react';
import { exportAll, hashPin, importAll, resetEverything, setSetting } from '../../db/db';

export function DataTab() {
  const file = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const download = async () => {
    const blob = new Blob([await exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kidvest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Data &amp; settings</h2>
        <p className="text-sm text-ink-600">Everything is stored only in this browser (IndexedDB). Nothing is sent anywhere.</p>
      </div>
      {msg && <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{msg}</div>}
      <div className="grid grid-cols-2 gap-6">
        <div className="card card-pad">
          <h3 className="font-bold">Backup</h3>
          <p className="mt-1 text-sm text-ink-600">Download all children, rounds, scenarios and assets as one file, or restore a backup. Scenario files can also be shared with other families.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-dark btn-md" onClick={download}>⬇ Export backup</button>
            <button className="btn btn-outline btn-md" onClick={() => file.current?.click()}>⬆ Import backup</button>
            <input ref={file} type="file" accept="application/json" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try { await importAll(await f.text()); setMsg('Backup imported.'); } catch (err) { alert((err as Error).message); }
              e.target.value = '';
            }} />
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="font-bold">Parent PIN</h3>
          <p className="mt-1 text-sm text-ink-600">The PIN keeps children out of the parent area. It is a simple lock, not a security feature.</p>
          <div className="mt-4 flex gap-2">
            <input className="input num w-40" inputMode="numeric" maxLength={6} placeholder="New PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            <button className="btn btn-dark btn-md" disabled={pin.length < 4} onClick={async () => { await setSetting('pinHash', await hashPin(pin)); setPin(''); setMsg('PIN changed.'); }}>Change PIN</button>
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="font-bold">About the data</h3>
          <div className="mt-2 space-y-2 text-sm text-ink-600">
            <p>Prices replay annual US market returns from 1928 to 2025 (S&amp;P 500, small caps, T-bills, 10-year Treasuries, house prices, gold) published by Aswath Damodaran, NYU Stern, and US CPI inflation from the Bureau of Labor Statistics.</p>
            <p>Each year is split into four seasons. The four seasons always compound exactly to the real annual figure; the shape inside a year is approximated (known for famous crash years, seeded otherwise). Fees and payouts are applied on top.</p>
            <p>Kidvest is an educational simulation, not financial advice.</p>
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="font-bold text-red-700">Danger zone</h3>
          <p className="mt-1 text-sm text-ink-600">Delete all children, rounds, custom scenarios, assets and the PIN from this browser.</p>
          <button className="btn btn-danger btn-md mt-4" onClick={() => { if (confirm('Really delete everything? Export a backup first if unsure.')) void resetEverything(); }}>Delete all data</button>
        </div>
      </div>
    </div>
  );
}
