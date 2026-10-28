import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssetsTab } from '../components/parent/AssetsTab';
import { ChildrenTab } from '../components/parent/ChildrenTab';
import { DataTab } from '../components/parent/DataTab';
import { ReportsTab } from '../components/parent/ReportsTab';
import { RewardsTab } from '../components/parent/RewardsTab';
import { ScenariosTab } from '../components/parent/ScenariosTab';
import { TalkDueBanner } from '../components/parent/TalkSection';
import { getSetting, hashPin, setSetting } from '../db/db';
import { cx, Logo } from '../lib/ui';

const TABS = [
  { id: 'children', label: '👨‍👩‍👧 Children' },
  { id: 'scenarios', label: '📜 Scenarios' },
  { id: 'assets', label: '🐄 Assets' },
  { id: 'rewards', label: '🎁 Rewards' },
  { id: 'reports', label: '📊 Reports' },
  { id: 'data', label: '⚙️ Data & settings' },
] as const;

const SESSION_KEY = 'kidvest-parent-unlocked';
const sessionGet = () => { try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; } };
const sessionSet = (v: boolean) => { try { v ? sessionStorage.setItem(SESSION_KEY, '1') : sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } };

export default function Parent() {
  const [unlocked, setUnlocked] = useState(sessionGet());
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('children');
  if (!unlocked) return <PinGate onOk={() => { sessionSet(true); setUnlocked(true); }} />;
  return (
    <div className="min-h-full bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-3">
          <div className="flex items-center gap-4">
            <Logo small />
            <span className="chip bg-ink-900 text-white">Parent area</span>
          </div>
          <nav className="flex rounded-xl bg-ink-100 p-1">
            {TABS.map((t) => <button key={t.id} className={cx('tab', tab === t.id && 'tab-active')} onClick={() => setTab(t.id)}>{t.label}</button>)}
          </nav>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-md" onClick={() => { sessionSet(false); setUnlocked(false); }}>🔒 Lock</button>
            <Link to="/" className="btn btn-dark btn-md">Back to kids</Link>
          </div>
        </div>
      </header>
      <TalkDueBanner />
      <main className="mx-auto max-w-[1280px] px-8 py-8">
        {tab === 'children' && <ChildrenTab />}
        {tab === 'scenarios' && <ScenariosTab />}
        {tab === 'assets' && <AssetsTab />}
        {tab === 'rewards' && <RewardsTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'data' && <DataTab />}
      </main>
    </div>
  );
}

function PinGate({ onOk }: { onOk: () => void }) {
  const [hash, setHash] = useState<string | null | undefined>(undefined);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { getSetting<string | null>('pinHash', null).then(setHash); }, []);
  if (hash === undefined) return null;
  const creating = hash === null;
  const submit = async () => {
    if (creating) {
      if (pin.length < 4) return setErr('Use at least 4 digits.');
      if (pin !== pin2) return setErr('The two PINs do not match.');
      await setSetting('pinHash', await hashPin(pin));
      onOk();
    } else if ((await hashPin(pin)) === hash) onOk();
    else { setErr('Wrong PIN.'); setPin(''); }
  };
  return (
    <div className="flex min-h-full items-center justify-center bg-ink-900 p-8">
      <div className="card w-[420px] p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">{creating ? 'Create a parent PIN' : 'Parent area'}</h1>
        <p className="mt-1 text-sm text-ink-600">{creating ? 'The PIN keeps the settings and reports away from little fingers.' : 'Enter your PIN to manage children, scenarios and assets.'}</p>
        <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <input className="input num text-center text-2xl tracking-[.5em]" type="password" inputMode="numeric" maxLength={6} autoFocus placeholder="••••" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setErr(''); }} />
          {creating && <input className="input num text-center text-2xl tracking-[.5em]" type="password" inputMode="numeric" maxLength={6} placeholder="repeat" value={pin2} onChange={(e) => { setPin2(e.target.value.replace(/\D/g, '')); setErr(''); }} />}
          {err && <div className="text-sm font-semibold text-red-600">{err}</div>}
          <button className="btn btn-dark btn-lg w-full" type="submit">{creating ? 'Save PIN and continue' : 'Unlock'}</button>
        </form>
        <Link to="/" className="mt-4 block text-center text-sm text-ink-500 hover:text-ink-800">← Back to the kids</Link>
      </div>
    </div>
  );
}
