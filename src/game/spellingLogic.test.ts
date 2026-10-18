import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWordWpm,
  calculateAccuracy,
  evaluateLetterStates,
  calculateWordScore,
  getProgressiveDifficulty,
  filterLeaderboardByTimeframe,
  rankHighestWpmByWord
} from './spellingLogic.ts';
import type { LeaderboardRecord, WordSpeedRecord } from './spellingLogic.ts';

test('calculateWordWpm computes accurate WPM using 5-char word standard', () => {
  // 10 characters = 2 words. In 1000ms (1/60 min), 2 * 60 = 120 WPM
  assert.equal(calculateWordWpm(10, 1000), 120);
  // 25 characters = 5 words. In 3000ms (1/20 min), 5 * 20 = 100 WPM
  assert.equal(calculateWordWpm(25, 3000), 100);
  // Edge case: 0 characters returns 0
  assert.equal(calculateWordWpm(0, 1000), 0);
});

test('calculateAccuracy computes percentage and handles zero keystrokes', () => {
  assert.equal(calculateAccuracy(0, 0), 100);
  assert.equal(calculateAccuracy(20, 2), 90);
  assert.equal(calculateAccuracy(10, 0), 100);
});

test('evaluateLetterStates marks correct, incorrect, and pending letters accurately', () => {
  const states = evaluateLetterStates('saffron', 'safx');
  assert.deepEqual(states, [
    'correct',
    'correct',
    'correct',
    'incorrect',
    'pending',
    'pending',
    'pending'
  ]);
});

test('calculateWordScore rewards longer words, higher difficulty, and unassisted play', () => {
  const easyScore = calculateWordScore({
    wordLength: 6,
    difficulty: 'easy',
    wpm: 80,
    accuracy: 100,
    streak: 1,
    usedHint: false
  });
  const veryLongScore = calculateWordScore({
    wordLength: 28,
    difficulty: 'verylong',
    wpm: 120,
    accuracy: 100,
    streak: 4,
    usedHint: false
  });
  const hintedVeryLongScore = calculateWordScore({
    wordLength: 28,
    difficulty: 'verylong',
    wpm: 120,
    accuracy: 100,
    streak: 4,
    usedHint: true
  });

  assert.equal(veryLongScore > easyScore, true);
  assert.equal(veryLongScore > hintedVeryLongScore, true);
});

test('getProgressiveDifficulty escalates from easy to verylong across word indices', () => {
  assert.equal(getProgressiveDifficulty(0), 'easy');
  assert.equal(getProgressiveDifficulty(2), 'medium');
  assert.equal(getProgressiveDifficulty(4), 'hard');
  assert.equal(getProgressiveDifficulty(7), 'verylong');
});

test('filterLeaderboardByTimeframe filters Today, Week, Month, Year, and All Time accurately', () => {
  const now = 1792350000000;
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;

  const sampleEntries: LeaderboardRecord[] = [
    {
      id: '1',
      userId: 'u_today',
      displayName: 'Chef Lin',
      titleBadge: 'Grandmaster',
      wpm: 132,
      peakWpm: 158,
      fastestWord: 'bouillabaisse',
      difficulty: 'hard',
      score: 4200,
      wordsSpelled: 8,
      accuracy: 99,
      playedAtMs: now - 3 * HOUR
    },
    {
      id: '2',
      userId: 'u_week',
      displayName: 'Saffron Bee',
      titleBadge: 'Sommelier',
      wpm: 145,
      peakWpm: 174,
      fastestWord: 'caramelization',
      difficulty: 'hard',
      score: 5100,
      wordsSpelled: 8,
      accuracy: 100,
      playedAtMs: now - 4 * DAY
    },
    {
      id: '3',
      userId: 'u_month',
      displayName: 'Lexical Baker',
      titleBadge: 'Artisan',
      wpm: 156,
      peakWpm: 185,
      fastestWord: 'floccinaucinihilipilification',
      difficulty: 'verylong',
      score: 7800,
      wordsSpelled: 8,
      accuracy: 98,
      playedAtMs: now - 18 * DAY
    },
    {
      id: '4',
      userId: 'u_year',
      displayName: 'Orchard Keeper',
      titleBadge: 'Archivist',
      wpm: 162,
      peakWpm: 192,
      fastestWord: 'antidisestablishmentarianism',
      difficulty: 'verylong',
      score: 8400,
      wordsSpelled: 8,
      accuracy: 100,
      playedAtMs: now - 140 * DAY
    },
    {
      id: '5',
      userId: 'u_alltime',
      displayName: 'Aurelia Vance',
      titleBadge: 'Founder Crown',
      wpm: 178,
      peakWpm: 214,
      fastestWord: 'supercalifragilisticexpialidocious',
      difficulty: 'verylong',
      score: 11200,
      wordsSpelled: 8,
      accuracy: 100,
      playedAtMs: now - 500 * DAY
    }
  ];

  const today = filterLeaderboardByTimeframe(sampleEntries, 'day', now);
  assert.equal(today.length, 1);
  assert.equal(today[0].displayName, 'Chef Lin');

  const week = filterLeaderboardByTimeframe(sampleEntries, 'week', now);
  assert.equal(week.length, 2);
  assert.equal(week[0].displayName, 'Saffron Bee');

  const month = filterLeaderboardByTimeframe(sampleEntries, 'month', now);
  assert.equal(month.length, 3);
  assert.equal(month[0].displayName, 'Lexical Baker');

  const year = filterLeaderboardByTimeframe(sampleEntries, 'year', now);
  assert.equal(year.length, 4);
  assert.equal(year[0].displayName, 'Orchard Keeper');

  const allTime = filterLeaderboardByTimeframe(sampleEntries, 'all', now);
  assert.equal(allTime.length, 5);
  assert.equal(allTime[0].displayName, 'Aurelia Vance');
});

test('rankHighestWpmByWord deduplicates by word and sorts highest WPM first', () => {
  const records: WordSpeedRecord[] = [
    {
      word: 'bouillabaisse',
      difficulty: 'hard',
      wpm: 142,
      userId: 'u1',
      displayName: 'Player One',
      charCount: 13,
      durationMs: 1100,
      updatedAtMs: 1000
    },
    {
      word: 'bouillabaisse',
      difficulty: 'hard',
      wpm: 168,
      userId: 'u2',
      displayName: 'Player Two',
      charCount: 13,
      durationMs: 928,
      updatedAtMs: 2000
    },
    {
      word: 'saffron',
      difficulty: 'medium',
      wpm: 154,
      userId: 'u3',
      displayName: 'Player Three',
      charCount: 7,
      durationMs: 545,
      updatedAtMs: 1500
    }
  ];

  const ranked = rankHighestWpmByWord(records, 'all', '');
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].word, 'bouillabaisse');
  assert.equal(ranked[0].wpm, 168);
  assert.equal(ranked[0].displayName, 'Player Two');
});

test('all 16 requested ultra-long words are present in verylong tier queue', async () => {
  const { buildSessionWordQueue } = await import('./spellingLogic.ts');
  const queue = buildSessionWordQueue('verylong', 16);
  const words = queue.map((w) => w.word);
  const expectedWords = [
    'pneumoencephalography',
    'chargoggagoggmanchauggagoggchaubunagungamaugg',
    'pneumonoultramicroscopicsilicovolcanoconiosis',
    'antixerophthalmic',
    'micropachycephalosaurus',
    'polyphiloprogenitive',
    'pseudorhombicuboctahedron',
    'stereoelectroencephalography',
    'immunoelectrochemiluminescence',
    'corynebacteriumpseudotuberculosis',
    'subacutesclerosingpanencephalitis',
    'sulfoquinovosyldiacylglycerol',
    'canaliculodacryocystorhinostomy',
    'zoanthroprosopometamorphopsia',
    'xanthogranulomatouspyelonephritis',
    'bourgeoisification'
  ];
  for (const exp of expectedWords) {
    assert.equal(words.includes(exp), true, `Missing word: ${exp}`);
  }
});

test('global leaderboards start completely empty with zero seed records', async () => {
  const { createSeedLeaderboardEntries, createSeedWordRecords } = await import('./seedData.ts');
  assert.deepEqual(createSeedLeaderboardEntries(Date.now()), []);
  assert.deepEqual(createSeedWordRecords(Date.now()), []);
});

