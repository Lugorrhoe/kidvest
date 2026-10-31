# Kidvest: handover for Claude Code

Read this first. It is the complete context for continuing work on Kidvest. The previous phase was built in a Cowork chat session (October 2026); from here on, this repository is the single source of truth.

## 1. What Kidvest is and why it exists

Kidvest is a browser game that teaches children aged 6 to 14 to invest by doing it. Real market history (annual US returns 1928 to 2025 plus US CPI) is replayed in disguise: a farm for 6 to 8 year olds, a space station for 9 to 11, a city with real financial terms for 12 to 14. Children buy, hold and sell, live through booms and crashes, chase a goal ladder, earn badges, and parents get reports, conversation prompts and a monthly reminder to talk.

It is the Exam 2 deliverable ("AI tool") of the TUM seminar *Smart Start: Financial, Tax, and Legal Fundamentals for Entrepreneurs* (WiSe 2026/27), topic T12 *What is the best way for children to learn how to handle money?*. The Exam 1 pitch's thesis is **show, let do, then talk**; Kidvest is the "let do" part, the parent area is the "then talk" part. Owner: Lukas Varga. Deadline for Moodle upload (tool name, screenshot, hosted link): **5 November 2026**. The demo is a narrated screen recording, not a live demo; the script is in `../Kidvest_Demo_Script.md` next to this folder.

"AI tool" in the seminar means built with AI (Claude), not containing AI. **Design decision: the app contains no AI model, no server, no accounts, no tracking.** Do not add an LLM feature or any network dependency without an explicit request.

## 2. Non-negotiable product principles

- No real money, no broker links, no ads. Disclaimer "educational simulation, not financial advice" stays visible.
- Children's data never leaves the browser (IndexedDB via Dexie). No analytics.
- Gamification rewards patience, diversification and saving, never trading frequency. No streaks, loot boxes or push notifications.
- Age-appropriate masks: bracket 1 sees whole items, coins, weather, no percentages; bracket 2 sees percentages, charts, fees; bracket 3 sees real terms, euros, order fees, inflation-adjusted views. Children never see real calendar years; parents do.
- Forecasts are honest by age: bracket 1 always true but vague, bracket 2 one marked rumour that may be wrong, bracket 3 analyst consensus wrong about 25 % of the time with a review afterwards.
- No "unmasking moment" and no in-app AI (both explicitly rejected by Lukas).

## 3. Stack and commands

React 18, TypeScript, Vite 5, Tailwind 3, Recharts 2, Dexie 4 (IndexedDB), react-router (HashRouter so GitHub Pages works), Vitest. Node 20+.

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # vitest, 14 engine tests
npm run build          # dist/ (relative paths, GitHub Pages ready)
npm run build:single   # dist-single/index.html, one self-contained file that runs from file://
```

Deployment: `.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages on push to `main` (Settings → Pages → Source: GitHub Actions). Not yet pushed to GitHub as of this handover; the repo has no `.git` yet. A prebuilt single file is kept next to this folder as `../Kidvest.html` for people without Node.

Emoji are rendered by the OS font (Segoe UI Emoji on Windows). Do not add a web emoji font; a COLRv1 web font was tried and removed because headless Chromium and some browsers render it blank.

## 4. Repository map

```
src/
  data/
    history.ts          annual returns 1928-2025 (Damodaran) + CPI (BLS), annualReturn(series, year)
    shapes.ts           approximate quarterly shape for famous years (1987, 2000-02, 2008-09, 2020, 2022)
    worlds.ts           the three worlds: copy, colours, currency, built-in assets (masks), goal ladders, level titles
    scenarios.ts        the three built-in scenarios (farm 2003-2012, space 1995-2009, city 2005-2024), events, challenges
    rewardSuggestions.ts per-bracket suggestions for real-life rewards
    historyNotes.ts     one-line parent-facing notes and talk starters for notable real years (1929, 1987, 2008, 2020 ...)
  engine/
    types.ts            all shared types (Game, Profile, Scenario, AssetDef, Snapshot, LogItem, TalkPrompt ...)
    market.ts           buildMarket(scenario, assets, yearSeq): price and payout paths, cpi index, stockMove; typicalSwing
    game.ts             newGame, normalizeGame, marketFor, buy, sell, advance, advanceMany, catchUp, buyGoal, extendChapter
    achievements.ts     badges, challenge progress, levels, valuation helpers, goal ladder (goalsFor, currentGoal, goalCost)
    rewards.ts          real-life rewards model, conditions, evaluateRewards, baselines
    daily.ts            daily rhythm: modeOf, dailyState (seasonsLeft, locked, unlockAt), dayKey, fmtUnlock
    forecast.ts         yearReport (age-graded forecast from the real next year) and yearReview (forecast check)
    format.ts           money/pct/units formatting per bracket and world
    rng.ts              mulberry32, gaussian, hashString, uid
    assets.ts           resolveAssets(scenario, customAssets)
    engine.test.ts      vitest suite (market exactness, trades, chapters, catch-up, goals, rewards, daily lock, forecasts)
  db/db.ts              Dexie schema v2 (settings, profiles, games, customAssets, customScenarios, rewards), demo family seeding,
                        MODES/PACES, createProfile defaults, recordCheckin, syncRewards, fastForward, migrations, backup import/export
  lib/ui.tsx            cx, Emoji, Logo, Progress, Modal, SectionTitle
  lib/talk.ts           monthly money-talk settings, .ics builder, talk sheet, mailto helper
  components/
    PlayParts.tsx       Hero (balance, countdown or daily dots), Holdings, MarketList, Recap, GoalCard, AllocationCard,
                        ChallengesCard, AchievementsCard, fmtDuration
    Scene.tsx           world scene frame: backdrops per world and weather, base card, decorations;
                        assetDeltas() computes per-asset change since a season
    Plot.tsx            shared plot used by all three scenes: stage logic (stageOf, CAP, NEXT_AT), hover card, delta chip,
                        slotFor() two-row layout; each scene supplies buildings, stage names, emoji spots and a PlotTheme
    FarmScene.tsx       farm buildings: barn, coop, mud pen, hives, orchard, farmhouse; fixed slot layout
    SpaceScene.tsx      space modules: solar array, greenhouse domes, hangar, dishes, launch pad, crystal rig, fuel depot, StationCore
    CityScene.tsx       city buildings: towers, HQ, city hall, garage, vault, row houses, bank branch, CityBase
    Tour.tsx            guided tour of the play page (8 spotlight steps on data-tour anchors, bracket-aware copy); shown on a
                        child's first visit (localStorage flag per child, any game state) and from the 🧭 Tour button in the header
    Confetti.tsx        short deterministic confetti burst (badges, level-ups, goals, rewards)
    GrowthChart.tsx     value chart with ranges (1/3/5y/all), "only saved" and "savings account" lines net of purchases,
                        inflation toggle for bracket 3
    AssetSheet.tsx      asset detail + order ticket per bracket
    RewardsCard.tsx     child-facing rewards card + celebration modal
    YearModals.tsx      year report (forecast) and year review views
    bits.tsx            RiskBadge, Sparkline, AssetIcon, Delta, weatherOf
    parent/             ChildrenTab, ScenariosTab, AssetsTab, RewardsTab, ReportsTab (+ TalkSection, HistoryTimeline), DataTab, fields
                        HistoryTimeline: per game year the real year, S&P and CPI, historical note, child behaviour, result
  pages/                Home (profile picker, first-run welcome), Play (game loop, catch-up, modals, toasts, tour, confetti),
                        Parent (PIN gate, tabs), About (#/about: methodology, age masks, honesty principles, privacy, sources)
  lib/ui.tsx            also printElement(el): prints a single element via the print-target stylesheet in index.css
```

## 5. Core mechanics (so you do not have to reverse-engineer them)

**Time.** A game year has four seasons (quarters). `Game.yearSeq` lists the real calendar year replayed in each game year; it grows when a chapter ends (`extendChapter`: continue with the next years, after 2025 jump to a seeded random year ≥ 1950). Season `s` (1-based) belongs to game year `floor((s-1)/4)`. `market.years[s]` gives the real year.

**Prices.** Each asset follows a real series (`stocks`, `small`, `tbill`, `tbond`, `baa`, `realestate`, `gold`) or a custom lognormal model. Four quarterly log returns per year always compound exactly to the official annual figure; the intra-year shape is the known pattern for famous years or seeded noise (`QUARTER_SD`). Distributing assets split total return into price change and a cash payout (`payoutYield`); `payoutOnTop` adds the payout instead (used for real estate rent). Fees (`fee`, annual TER) are deducted per season from the price. Scenario events with `shock` multiply prices at that season. Everything is deterministic given scenario seed + yearSeq, so re-building the market is cheap and safe (`marketFor(game)`), which the UI memoizes on `yearSeq.length`.

**Game state** (`Game`): cash, holdings (units), costBasis, heldSince, contributions (gross paid in), contribAdj (inflation-grown net paid in, reduced by goal purchases), spent (goal purchases), payoutsTotal, trades, history snapshots per season, log, achievements, challengesDone, xp, storm watch (`storm`, `stormsSurvived`, `soldInStorm`), peak/hadDrawdown, goal ladder (`goalIndex`, `owned`, `goalNotified`), talk prompts for parents, checkins (day stamps), `lastTick` (realtime mode), `lastYearDay` and `forecastSeen` (daily mode), chapters. `normalizeGame` back-fills fields on older saves; keep that pattern when adding fields.

**Advance** (`engine/game.ts: advance`): payouts (bracket 1 collects them into a yearly "harvest" message), inflation and pocket money, weather messages for big moves, scripted events, storm detection (risk ≥ 3 asset down ≥ 12 %, or ≥ 8 % together with the market), storm survival after 4 seasons, snapshot, goal reached notification, chapter end, XP, then `evaluate` for badges/challenges. `advanceMany` rebuilds the market when a chapter was appended. Reports (`SeasonReport`) feed the Recap card and the "Welcome back" modal.

**Rhythm modes** (`Profile.mode`): `daily` (default): `dailyState` allows the remaining seasons of the current year; once a year is completed (`lastYearDay` = today) the next one unlocks the next day at `unlockHour`. The Play page shows the year report when `newYear` and the year review after the fourth season. `manual`: unlimited. `realtime`: `catchUp` converts elapsed real time into seasons using `pace` ms per season, with a "Welcome back" summary. Parents can fast-forward any child from the Children tab.

**Goals.** `goalsFor(game)` = scenario goal + world goal ladder, sorted by price; prices grow with CPI. `buyGoal` needs cash, subtracts from `contribAdj`, adds to `spent` and `owned` (shown as decorations in the scene). The chart's "only saved" and "savings account" lines subtract purchases too.

**Rewards** (`engine/rewards.ts`). Parent-defined real-life rewards with a baseline snapshot at creation, a condition (sustained types `no_panic` and `invested_share` are violated immediately when broken; others are progress-based), optional real deadline, status machine `active → achieved → delivered`, or `expired`/`cancelled`. `evaluateRewards` runs after every game change and on ticks (`Play.checkRewards`, `db.syncRewards` in fast-forward). Check-ins are recorded in `Play` on load.

**Forecasts** (`engine/forecast.ts`). `yearReport` groups assets by series, computes the real next-year return, picks a level (boom/up/flat/down/crash) and a world/bracket template; bracket 3 flips 25 % of risky items (seeded), bracket 2 adds one rumour with 50 % truth. `yearReview` compares and reports. Everything is deterministic from seed and year, so reopening the report shows the same text.

**Talk reminder** (`lib/talk.ts`). Settings in Dexie `settings` under key `talk`; `.ics` with monthly RRULE and two VALARMs; `talkDue` after 30 days since last talk or family creation; banners in Parent header and Home.

## 6. Conventions

- Keep the engine pure and UI-free; components call engine functions and persist via `db`. New game fields: add to `types.ts`, default them in `newGame`, back-fill in `normalizeGame`, and consider `history` snapshots.
- Bracket-specific copy lives next to the logic (`bracket === 1 ? ... : ...`) and uses `money()`/`pct()` for numbers. Bracket 1: whole numbers, no percentages, "coins", weather words.
- World copy and masks live in `data/worlds.ts`; asset ids are `world.key` (e.g. `farm.cow`) and custom assets `custom_*`. `FarmScene` maps `farm.*` ids to buildings; other ids land in generic field plots.
- Tailwind utility classes; accent colours via CSS variables `--accent`, `--accent-dark`, `--soft` set per world on the Play page. Desktop only (min width 1100 px); no mobile layout yet.
- English UI, strings inline. German translation was deferred.
- Tests: extend `src/engine/engine.test.ts`; the calibration test prints outcomes of simple strategies per scenario, useful when tuning goals or fees.
- Commit only reviewed, tested code. `npm test` and `npm run build` must pass; the Pages workflow runs both.

## 6b. The pitch film (`film/`)

A 90-second product film built with Remotion 4 that renders the product's own React components from deterministic engine states (no screen recording, no mocks). Separate npm package: `cd film && npm install`, then `npm run render` writes `film/out/kidvest-90s.mp4` (1920 x 1080, 30 fps, exactly 90 s); `npm run studio` opens the Remotion studio; `npx remotion still src/index.ts KidvestFilm out/x.png --frame=N` renders a review frame. `film/TREATMENT.md` and `film/STORYBOARD.md` describe the story (SHOW, LET DO, TALK around the year 2008); `src/timeline.ts` holds every shot's frames, `src/motion.tsx` the primitives, `src/states.ts` the game states (demo family via `data/demoFamily.ts`, a real-life reward evaluated by the engine), `src/scenes/*` one file per chapter. The product's CSS animations are scrubbed per frame via `--t` in `film.css`. No audio by decision (the presenter speaks live). `film/tools/probe-demo-seasons.ts` prints what the engine does season by season.

## 7. Visual QA approach that worked

Headless Chromium is available via the npm package `@sparticuz/chromium` with `puppeteer-core` (no browser download needed). It cannot render colour emoji; for screenshots, inject a monochrome `@fontsource/noto-emoji` stylesheet (copied into `dist/t/`) and force `.emoji { font-family: 'Noto Emoji' }`. Scripts used: start `vite preview --port 4173`, drive the UI by clicking buttons by text, screenshot the `div.scene` or `.card` elements. Colour emoji were therefore never visually verified by the AI session; Lukas checks them on Windows.

## 8. Data and licences

Returns: Damodaran, *Historical Returns on Stocks, Bonds and Bills: 1928-2025* (NYU Stern, updated Jan 2026), used for education with attribution. CPI: US BLS, December over December (public domain). Quarterly shapes in `shapes.ts` are approximations from memory of S&P 500 quarterly total returns; they only shape the year, the annual figure is exact. Code: MIT. The data is US-only; if asked, say so.

## 9. Known limitations and open items

- On GitHub at https://github.com/Lugorrhoe/kidvest, Pages deploys from `main` to https://lugorrhoe.github.io/kidvest/. Put the link on Moodle.
- Demo preparation (see `../Kidvest_Demo_Script.md`): demo family starts at year boundaries (farm and city in 2008, space in 1999); set Thanja to free play and add the "Ice cream outing" reward before recording.
- No server, so no real e-mail sending; the talk reminder relies on the .ics and in-app banners.
- Desktop only; no German UI; no accessibility audit beyond semantic buttons and `aria-hidden` on decorative emoji.
- All three worlds have illustrated buildings with four build-out stages (since 28 Oct 2026). Custom assets fall back to a generic module (space) or shop (city). The farm keeps fixed slots; space and city lay plots out dynamically in two rows.
- The achievements "Storm survivor"/"Patience pays" were easy to earn early; thresholds were tightened once, re-check with the calibration test if gameplay changes.
- Custom scenarios with `startYear: 'random'` drop story events on new rounds by design.
- Backups are JSON exports; there is no cloud sync. Deleting a child deletes its rewards and game.

## 10. Backlog ideas Lukas has mentioned or approved in principle

- Bank-account add-on: current account, savings account, several accounts, card payments (teaching cash flow before investing).
- German language, mobile and tablet layout, shareable scenario library (JSON import already exists).
- A tiny backend only if real e-mail reminders become a must; keep it optional and privacy-preserving.

## 11. How Lukas likes to work

Iterative, feature by feature, with a short written confirmation of what changed. He prefers concrete, finished features over options, dislikes dashes in prose, and wants the educational purpose kept intact (patience over trading, behaviour over luck). When something cannot be done in a static app, say so plainly and offer the nearest working alternative.
