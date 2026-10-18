import type { DifficultyTier, GameModeTier, SpellingWord } from './wordBank.ts';
import { WORD_BANK, DIFFICULTY_META } from './wordBank.ts';

export type LeaderboardTimeframe = 'day' | 'week' | 'month' | 'year' | 'all' | 'word_records';

export type LetterMatchState = 'correct' | 'incorrect' | 'pending';

export interface LeaderboardRecord {
  id: string;
  userId: string;
  displayName: string;
  titleBadge: string;
  wpm: number;
  peakWpm: number;
  fastestWord: string;
  difficulty: GameModeTier;
  score: number;
  wordsSpelled: number;
  accuracy: number;
  playedAtMs: number;
}

export interface WordSpeedRecord {
  word: string;
  difficulty: DifficultyTier;
  wpm: number;
  userId: string;
  displayName: string;
  charCount: number;
  durationMs: number;
  updatedAtMs: number;
}

/**
 * Standard WPM formula: (characters / 5) / (durationMs / 60000).
 * Clamps durationMs to a minimum of 200ms and maximum WPM to 420 to prevent division-by-zero spikes.
 */
export function calculateWordWpm(charCount: number, durationMs: number): number {
  if (charCount <= 0 || durationMs <= 0) return 0;
  const safeDurationMs = Math.max(durationMs, 200);
  const wordsEquivalent = charCount / 5;
  const minutes = safeDurationMs / 60000;
  const rawWpm = wordsEquivalent / minutes;
  return Math.min(420, Math.max(1, Math.round(rawWpm)));
}

/**
 * Calculates typing accuracy percentage (0-100) from total keystrokes and error keystrokes.
 */
export function calculateAccuracy(totalKeystrokes: number, errorKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 100;
  const correct = Math.max(0, totalKeystrokes - Math.max(0, errorKeystrokes));
  return Math.round((correct / totalKeystrokes) * 100);
}

/**
 * Evaluates each letter slot of the target word against the player's current typed string.
 */
export function evaluateLetterStates(targetWord: string, typedInput: string): LetterMatchState[] {
  const cleanTarget = targetWord.trim().toLowerCase();
  const cleanTyped = typedInput.toLowerCase();
  const states: LetterMatchState[] = [];

  for (let i = 0; i < cleanTarget.length; i++) {
    if (i >= cleanTyped.length) {
      states.push('pending');
    } else if (cleanTyped[i] === cleanTarget[i]) {
      states.push('correct');
    } else {
      states.push('incorrect');
    }
  }
  return states;
}

/**
 * Computes score for a correctly spelled word based on length, difficulty tier, WPM, accuracy, streak, and hint usage.
 */
export function calculateWordScore(params: {
  wordLength: number;
  difficulty: DifficultyTier;
  wpm: number;
  accuracy: number;
  streak: number;
  usedHint: boolean;
}): number {
  const { wordLength, difficulty, wpm, accuracy, streak, usedHint } = params;
  const tierMultiplier = DIFFICULTY_META[difficulty]?.multiplier ?? 1.0;
  const basePoints = wordLength * 25;
  const speedBonus = Math.round(wpm * 3.2);
  const accuracyFactor = Math.max(0.5, accuracy / 100);
  const streakBonus = Math.min(streak * 35, 350);
  const hintFactor = usedHint ? 0.75 : 1.0;

  return Math.round((basePoints + speedBonus + streakBonus) * tierMultiplier * accuracyFactor * hintFactor);
}

/**
 * Determines which difficulty tier to serve at a given word index in Progressive Bee mode.
 */
export function getProgressiveDifficulty(wordIndex: number): DifficultyTier {
  if (wordIndex < 2) return 'easy';
  if (wordIndex < 4) return 'medium';
  if (wordIndex < 6) return 'hard';
  return 'verylong';
}

/**
 * Selects a balanced sequence of words for a spelling bee session.
 */
export function buildSessionWordQueue(mode: GameModeTier, count = 8, specificFirstWord?: SpellingWord): SpellingWord[] {
  const queue: SpellingWord[] = [];
  const usedIds = new Set<string>();

  if (specificFirstWord) {
    queue.push(specificFirstWord);
    usedIds.add(specificFirstWord.id);
  }

  for (let i = queue.length; i < count; i++) {
    const targetTier: DifficultyTier = mode === 'progressive' ? getProgressiveDifficulty(i) : mode;
    const pool = WORD_BANK.filter((w) => w.difficulty === targetTier && !usedIds.has(w.id));
    const fallbackPool = WORD_BANK.filter((w) => !usedIds.has(w.id));
    const candidates = pool.length > 0 ? pool : fallbackPool;
    if (candidates.length === 0) break;
    const picked = candidates[0];
    queue.push(picked);
    usedIds.add(picked.id);
  }

  return queue;
}

/**
 * Filters and ranks leaderboard entries by timeframe:
 * - 'day': last 24 hours
 * - 'week': last 7 days
 * - 'month': last 30 days
 * - 'year': last 365 days
 * - 'all': all time
 * Deduplicates by userId so the top players leaderboard shows each player's highest WPM run in that period.
 */
export function filterLeaderboardByTimeframe(
  entries: LeaderboardRecord[],
  timeframe: Exclude<LeaderboardTimeframe, 'word_records'>,
  nowMs: number
): LeaderboardRecord[] {
  const DAY_MS = 24 * 60 * 60 * 1000;
  let cutoffMs = 0;

  if (timeframe === 'day') {
    cutoffMs = nowMs - DAY_MS;
  } else if (timeframe === 'week') {
    cutoffMs = nowMs - 7 * DAY_MS;
  } else if (timeframe === 'month') {
    cutoffMs = nowMs - 30 * DAY_MS;
  } else if (timeframe === 'year') {
    cutoffMs = nowMs - 365 * DAY_MS;
  }

  const withinWindow = entries.filter((entry) => entry.playedAtMs >= cutoffMs);

  // Group by player displayName/userId to rank top players by their best run in the window
  const bestByPlayer = new Map<string, LeaderboardRecord>();
  for (const entry of withinWindow) {
    const key = entry.userId || entry.displayName.toLowerCase();
    const existing = bestByPlayer.get(key);
    if (
      !existing ||
      entry.wpm > existing.wpm ||
      (entry.wpm === existing.wpm && entry.score > existing.score)
    ) {
      bestByPlayer.set(key, entry);
    }
  }

  return Array.from(bestByPlayer.values()).sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    if (b.peakWpm !== a.peakWpm) return b.peakWpm - a.peakWpm;
    return b.score - a.score;
  });
}

/**
 * Ranks highest WPM records per specific word, optionally filtered by difficulty tier or search substring.
 */
export function rankHighestWpmByWord(
  records: WordSpeedRecord[],
  difficultyFilter: DifficultyTier | 'all' = 'all',
  searchQuery = ''
): WordSpeedRecord[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Ensure one highest record per word
  const bestPerWord = new Map<string, WordSpeedRecord>();
  for (const rec of records) {
    const key = rec.word.toLowerCase();
    const current = bestPerWord.get(key);
    if (!current || rec.wpm > current.wpm) {
      bestPerWord.set(key, rec);
    }
  }

  return Array.from(bestPerWord.values())
    .filter((rec) => {
      if (difficultyFilter !== 'all' && rec.difficulty !== difficultyFilter) {
        return false;
      }
      if (
        normalizedQuery &&
        !rec.word.toLowerCase().includes(normalizedQuery) &&
        !rec.displayName.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      return b.charCount - a.charCount;
    });
}
