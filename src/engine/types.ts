import type { SeriesKey } from '../data/history';

export type Bracket = 1 | 2 | 3;
export type WorldId = 'farm' | 'space' | 'city';

/** How an asset's price moves. */
export type AssetModel =
  | { kind: 'series'; series: SeriesKey; leverage?: number }
  | { kind: 'custom'; annualReturn: number; volatility: number };

/** A fully resolved asset as the game uses it. */
export interface AssetDef {
  id: string;
  name: string;
  emoji: string;
  /** One short line, written for the child. */
  tagline: string;
  /** Two or three sentences, written for the child. */
  description: string;
  /** Real-world category, shown from bracket 3 on and to parents. */
  realLabel: string;
  model: AssetModel;
  /** Annual payout as a share of price (0.02 = 2 % per year, paid each season). */
  payoutYield: number;
  /** If true the payout comes on top of the series return (e.g. rent); otherwise it is part of it. */
  payoutOnTop?: boolean;
  /** Word for what the asset pays out ("milk", "dividend"). */
  payoutWord?: string;
  /** Annual running cost as a share of value (0.002 = 0.2 %). */
  fee: number;
  /** 1 (very calm) to 5 (very wild). */
  risk: 1 | 2 | 3 | 4 | 5;
  /** Price in game money at the start of a round. */
  basePrice: number;
  custom?: boolean;
}

export type ChallengeType =
  | 'own_kinds'
  | 'hold_through_storm'
  | 'reach_goal'
  | 'collect_payouts'
  | 'invested_share'
  | 'play_years'
  | 'low_fees'
  | 'beat_inflation'
  | 'calm_year'
  | 'balanced';

export interface ChallengeDef {
  id: string;
  type: ChallengeType;
  target: number;
  title: string;
  description: string;
  xp: number;
}

export interface ScenarioEvent {
  /** Season (1-based) at whose end the event appears. */
  season: number;
  title: string;
  text: string;
  /** Optional extra price shock, e.g. -0.2 for minus 20 %. */
  shock?: number;
  /** Asset id the shock applies to, or 'all'. */
  target?: string;
}

export interface Goal {
  name: string;
  emoji: string;
  /** Price in today's money at the start; it rises with inflation during the round. */
  amount: number;
}

export interface Scenario {
  id: string;
  name: string;
  world: WorldId;
  bracket: Bracket;
  description: string;
  /** Calendar year replayed in season 1, or 'random'. Children never see it. */
  startYear: number | 'random';
  years: number;
  seed: number;
  startCash: number;
  incomePerSeason: number;
  /** Fixed fee per order (0 = none). */
  tradeFee: number;
  assets: string[];
  goal: Goal;
  events: ScenarioEvent[];
  challenges: ChallengeDef[];
  /** Keep playing after the history window ends (new chapters). Default true. */
  endless?: boolean;
  builtIn?: boolean;
}

export interface Trade {
  season: number;
  assetId: string;
  side: 'buy' | 'sell';
  units: number;
  price: number;
  fee: number;
}

export interface Snapshot {
  season: number;
  total: number;
  cash: number;
  invested: number;
  contributions: number;
  /** Contributions grown with inflation: the break-even line in real terms. */
  contribAdj: number;
  cpi: number;
  spent?: number;
}

export type LogKind = 'income' | 'payout' | 'storm' | 'sun' | 'news' | 'achievement' | 'challenge' | 'goal' | 'trade' | 'level';

export interface LogItem {
  season: number;
  kind: LogKind;
  text: string;
  amount?: number;
  emoji?: string;
}

export interface TalkPrompt {
  season: number;
  title: string;
  question: string;
}

export interface Game {
  profileId: string;
  scenario: Scenario;
  assets: AssetDef[];
  startYear: number;
  /** Calendar year replayed in each game year; grows when a new chapter starts. */
  yearSeq: number[];
  /** Timestamp up to which real time has been converted into seasons. */
  lastTick: number;
  chapters: number;
  /** Index into the goal ladder; bought goals become decorations. */
  goalIndex: number;
  owned: { name: string; emoji: string; season: number; cost: number }[];
  spent: number;
  goalNotified?: number;
  /** Day stamps (YYYY-MM-DD) on which the child opened the game; used by check-in rewards. */
  checkins?: string[];
  /** Daily mode: the local day (YYYY-MM-DD) on which the current year was completed. */
  lastYearDay?: string;
  /** Daily mode: year index whose forecast report the child has already seen. */
  forecastSeen?: number;
  season: number;
  cash: number;
  holdings: Record<string, number>;
  costBasis: Record<string, number>;
  heldSince: Record<string, number>;
  contributions: number;
  contribAdj: number;
  payoutsTotal: number;
  tradeCount: number;
  trades: Trade[];
  history: Snapshot[];
  log: LogItem[];
  achievements: Record<string, number>;
  challengesDone: Record<string, number>;
  xp: number;
  /** Open storm watch: risky holdings at the moment a storm hit. */
  storm?: { season: number; assets: string[] };
  stormsSurvived: number;
  /** Bracket 1 collects payouts during the year and reports them as one harvest in winter. */
  harvest?: Record<string, number>;
  soldInStorm: number;
  peak: number;
  hadDrawdown: boolean;
  goalReachedAt?: number;
  talk: TalkPrompt[];
  finished: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  bracket: Bracket;
  world: WorldId;
  scenarioId: string;
  /**
   * How time moves. 'daily' (default): one virtual year of four seasons per real day, unlocked at unlockHour.
   * 'manual': unlimited "Next season" presses. 'realtime': seasons tick by themselves every `pace` ms.
   */
  mode?: 'daily' | 'manual' | 'realtime';
  /** Hour of the day (0 to 23) at which the next year unlocks in daily mode. Default 10. */
  unlockHour?: number;
  /** Real milliseconds per season in realtime mode; 0 or undefined = manual. */
  pace?: number;
  createdAt: number;
}
