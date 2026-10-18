import type { LeaderboardRecord, WordSpeedRecord } from './spellingLogic.ts';

export const TITLE_BADGES = [
  'Grandmaster Sommelier of Letters',
  'Saffron Speller',
  'Lexical Pastry Chef',
  'Polyglot Epicure',
  'Golden Apiary Champion',
  'Speed Gastronome'
];

export function createSeedLeaderboardEntries(_nowMs: number): LeaderboardRecord[] {
  return [];
}

export function createSeedWordRecords(_nowMs: number): WordSpeedRecord[] {
  return [];
}
