import type { RewardCondition, RewardKind } from '../engine/rewards';
import type { Bracket } from '../engine/types';

export interface RewardSuggestion {
  title: string;
  emoji: string;
  kind: RewardKind;
  condition: RewardCondition;
  /** Suggested real-time duration in days; 0 = untimed. */
  days: number;
  why: string;
}

/**
 * Starting points for parents. Small rewards for short periods, bigger ones for longer periods.
 * Conditions favour behaviour (patience, diversification, saving) over market luck.
 */
export const REWARD_SUGGESTIONS: Record<Bracket, RewardSuggestion[]> = {
  1: [
    { title: 'Ice cream outing', emoji: '🍦', kind: 'experience', condition: { type: 'own_kinds', target: 3 }, days: 0, why: 'A small, quick win for spreading the coins over several animals.' },
    { title: 'Choose Sunday breakfast', emoji: '🥞', kind: 'privilege', condition: { type: 'checkins', target: 6 }, days: 30, why: 'Looking after the farm regularly, like feeding real animals.' },
    { title: 'Extra bedtime story for a week', emoji: '📚', kind: 'privilege', condition: { type: 'no_panic', target: 1, seasons: 8 }, days: 0, why: 'Holding on through a storm for two farm years. Praise the patience, not the result.' },
    { title: 'New picture book', emoji: '📖', kind: 'gift', condition: { type: 'buy_goal', target: 1 }, days: 0, why: 'Saving up for the farm dog or the tractor and deciding to buy it.' },
    { title: 'Trip to the zoo', emoji: '🦒', kind: 'experience', condition: { type: 'badges', target: 3 }, days: 183, why: 'A bigger reward over six months for three new badges.' },
  ],
  2: [
    { title: '+5 € pocket money bonus', emoji: '💶', kind: 'money', condition: { type: 'invested_share', target: 0.6 }, days: 61, why: 'Keeping credits deployed for two months rewards consistency.' },
    { title: 'Cinema with a friend', emoji: '🎬', kind: 'experience', condition: { type: 'no_panic', target: 1, seasons: 8 }, days: 0, why: 'Two mission years without panic selling.' },
    { title: 'Pick the family movie night', emoji: '🍿', kind: 'privilege', condition: { type: 'badges', target: 2 }, days: 30, why: 'Short and achievable: two new badges in a month.' },
    { title: 'Sleepover with friends', emoji: '🛏️', kind: 'experience', condition: { type: 'challenges', target: 2 }, days: 91, why: 'Challenges are built around good habits.' },
    { title: 'Lego set', emoji: '🧱', kind: 'gift', condition: { type: 'gain_pct', target: 0.15 }, days: 183, why: 'An outcome goal, so give it six months and talk about luck versus skill.' },
  ],
  3: [
    { title: '+10 € pocket money bonus', emoji: '💶', kind: 'money', condition: { type: 'invested_share', target: 0.6 }, days: 91, why: 'Three months of disciplined investing.' },
    { title: 'Concert or match ticket', emoji: '🎟️', kind: 'experience', condition: { type: 'beat_inflation', target: 0.1 }, days: 183, why: 'Staying ahead of inflation over six months; discuss that markets also play a role.' },
    { title: 'Matched savings: parents add 10 % of a goal item', emoji: '🤝', kind: 'money', condition: { type: 'buy_goal', target: 1 }, days: 0, why: 'Mirrors how employer matching or state bonuses work.' },
    { title: 'Extra screen hour on weekends for a month', emoji: '🎮', kind: 'privilege', condition: { type: 'checkins', target: 8 }, days: 30, why: 'Regular check-ins, not constant trading.' },
    { title: 'Choose the weekend trip', emoji: '🗺️', kind: 'privilege', condition: { type: 'no_panic', target: 1, seasons: 12 }, days: 0, why: 'Three years of holding through at least one crisis.' },
  ],
};
