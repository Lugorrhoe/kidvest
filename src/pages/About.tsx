import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FIRST_YEAR, LAST_YEAR } from '../data/history';
import { BRACKETS, WORLD_LIST } from '../data/worlds';
import { Emoji, Logo } from '../lib/ui';

const SEES: Record<number, string[]> = {
  1: ['Whole animals and trees, counted in coins', 'Weather words instead of percentages', 'Forecasts that are always true, but vague', 'A yearly "harvest" instead of quarterly payouts'],
  2: ['Percent changes and a value chart', 'Fees made visible (a famous captain costs 1.8 % a year)', 'One marked rumour per year that may be wrong', 'Risk shown as calm to very wild'],
  3: ['Real terms: ETF, bond, TER, dividend, inflation', 'Euros, order fees and an inflation-adjusted view', 'Analyst consensus that is wrong about one year in four, with a review afterwards', 'Challenges for diversification and low costs'],
};

export default function About() {
  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-[1000px] items-center justify-between px-8 py-6">
        <Link to="/"><Logo /></Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="btn btn-ghost btn-md">Play</Link>
          <Link to="/parent" className="btn btn-outline btn-md">🔒 Parents</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] space-y-8 px-8 pb-20">
        <div className="rounded-[32px] bg-ink-900 p-12 text-white">
          <div className="chip bg-white/10 text-white">How Kidvest works</div>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">Show, let do, then talk.</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Children learn to handle money by handling it. Kidvest lets them invest in a century of real market history, disguised as a farm, a space station or a city, and gives parents what they need for the conversation afterwards.
          </p>
        </div>

        <Section emoji="🎯" title="The idea">
          <p>
            Most money education for children is either a lecture or a piggy bank. Kidvest is the step in between: a safe place to <b>do</b> the thing, make mistakes, live through a crash, and discover that patience beats panic. The game is the "let do". The parent area is the "then talk": reports, the real years behind the game, conversation prompts, real-life rewards and a monthly reminder to sit down together.
          </p>
        </Section>

        <Section emoji="📈" title="Real history in disguise">
          <p>
            Every game year replays one real calendar year of US markets between {FIRST_YEAR} and {LAST_YEAR}: large and small stocks, government bonds, corporate bonds, house prices, gold and cash, plus the inflation of that year. The four seasons of a game year always compound exactly to the official annual figure; for famous years such as 1987, 2000 to 2002, 2008, 2020 and 2022 the quarterly shape follows what really happened.
          </p>
          <p>
            A cow on the farm is a distributing equity index fund. Captain Vega's Fleet is an actively managed fund with a 1.8 % fee. The Gold Vault is gold. Children never see real dates or company names, so they cannot look up the answer; parents see the real years in the Reports tab and can tell the story afterwards.
          </p>
        </Section>

        <Section emoji="🧒" title="Three worlds, three ages">
          <div className="grid grid-cols-3 gap-4">
            {WORLD_LIST.map((w) => {
              const b = BRACKETS[w.defaultBracket - 1];
              return (
                <div key={w.id} className="overflow-hidden rounded-2xl border border-ink-100">
                  <div className={w.id === 'farm' ? 'p-4 text-ink-900' : 'p-4 text-white'} style={{ background: w.colors.hero }}>
                    <Emoji e={w.emoji} className="text-3xl" />
                    <div className="mt-2 font-extrabold">{w.name}</div>
                    <div className={w.id === 'farm' ? 'text-xs text-ink-600' : 'text-xs text-white/75'}>Ages {w.ages} · {b.label}</div>
                  </div>
                  <ul className="space-y-1.5 p-4 text-sm text-ink-700">
                    {SEES[w.defaultBracket].map((s) => <li key={s} className="flex gap-2"><span className="text-ink-400">•</span><span>{s}</span></li>)}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-ink-600">The same market history runs underneath all three. A child moves up a world as they grow, and the terms get more real while the lessons stay the same.</p>
        </Section>

        <Section emoji="🧭" title="Honest by design">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
            <Li title="Patience is rewarded, trading is not.">Badges and challenges go to holding through a storm, spreading money across different things and saving towards a goal. Nothing rewards frequent trading. There are no streaks, no loot boxes and no notifications.</Li>
            <Li title="Forecasts are age-appropriate and truthful about uncertainty.">Young children get a forecast that is always right but vague. Older children meet a rumour that may be wrong, or an analyst consensus that misses about one year in four and is reviewed afterwards.</Li>
            <Li title="Luck is separated from behaviour.">The parent report shows what the market did and what the child did in the same year, so a bad result in 2008 reads as a storm survived, not a failure.</Li>
            <Li title="Time has a rhythm.">By default a child plays one game year per day and the next one unlocks tomorrow. Investing is slow; the game is too.</Li>
          </ul>
        </Section>

        <Section emoji="💬" title="Then talk: the parent area">
          <p>
            Behind a PIN, parents see each child's real-year timeline with historical notes and conversation starters, every order placed, the value chart against a savings account and against inflation, and talk prompts the game writes after storms and milestones. Parents can define real-life rewards tied to behaviour (for example an ice cream outing for holding through a storm), build custom scenarios and assets, and export a calendar reminder for a monthly money talk.
          </p>
        </Section>

        <Section emoji="🔒" title="Privacy">
          <p>
            Kidvest has no server, no accounts, no analytics and no AI inside the app. Everything is stored in this browser (IndexedDB) and can be exported and imported as a JSON file from the parent area. Nothing a child does ever leaves the device.
          </p>
        </Section>

        <Section emoji="📚" title="Data, sources and licence">
          <ul className="space-y-2 text-sm text-ink-700">
            <li>Returns: Damodaran, A. (2026). <i>Historical Returns on Stocks, Bonds and Bills: 1928-2025</i>. NYU Stern. Used for education with attribution.</li>
            <li>Inflation: U.S. Bureau of Labor Statistics, CPI-U, December over December.</li>
            <li>The data is US-only. Quarterly shapes within a year are approximations; the annual figures are exact.</li>
            <li>Code: MIT licence, <a className="underline" href="https://github.com/Lugorrhoe/kidvest" target="_blank" rel="noreferrer">github.com/Lugorrhoe/kidvest</a>.</li>
            <li>Built by Lukas Varga with Claude for the TUM seminar <i>Smart Start: Financial, Tax, and Legal Fundamentals for Entrepreneurs</i> (winter term 2026/27), topic "What is the best way for children to learn how to handle money?".</li>
          </ul>
        </Section>

        <p className="pt-4 text-center text-xs text-ink-400">Kidvest is an educational simulation, not financial advice. No real money is involved.</p>
      </main>
    </div>
  );
}

function Section({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) {
  return (
    <section className="card card-pad space-y-3 leading-relaxed text-ink-800">
      <h2 className="flex items-center gap-2 text-xl font-extrabold"><Emoji e={emoji} /> {title}</h2>
      {children}
    </section>
  );
}

function Li({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="text-sm">
      <div className="font-bold text-ink-900">{title}</div>
      <div className="mt-0.5 text-ink-700">{children}</div>
    </li>
  );
}
