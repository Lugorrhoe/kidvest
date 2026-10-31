/**
 * Dev probe: prints what the engine does to Thanja's farm season by season (storms, badges, talk prompts).
 * Run from the repository root as a one-off vitest file, e.g. copy it to ./probe.test.ts and `npx vitest run probe.test.ts`.
 */
import { test } from 'vitest';
import { buildDemoGame, DEMO_FAMILY } from '../../src/data/demoFamily';
import { advance, contextFor, marketFor } from '../../src/engine/game';

test('probe demo farm seasons', () => {
  const d = DEMO_FAMILY[0];
  const ctx = contextFor(d);
  let g = buildDemoGame(d, 'probe');
  const m = marketFor(g);
  const out: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = advance(g, m, ctx);
    g = r.game;
    const items = r.report.items.filter((x) => x.kind === 'storm' || x.kind === 'sun' || x.kind === 'news').map((x) => `${x.kind}:${x.text.slice(0, 70)}`);
    out.push(`S${g.season} y${m.years[g.season]} storm=${JSON.stringify(g.storm)} survived=${g.stormsSurvived} ach=[${r.report.unlocks.achievements.map((a) => a.id)}] ch=[${r.report.unlocks.challenges.map((c) => c.id)}] ${items.join(' | ')}`);
  }
  console.log('PROBE\n' + out.join('\n'));
  console.log('TALK ' + JSON.stringify(g.talk));
});
