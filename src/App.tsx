import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Trophy,
  UserPlus,
  BookOpen,
  Play,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  DifficultyTier,
  GameModeTier,
  SpellingWord,
  DIFFICULTY_META,
  WORD_BANK
} from './game/wordBank';
import {
  calculateWordWpm,
  calculateAccuracy,
  evaluateLetterStates,
  calculateWordScore,
  buildSessionWordQueue,
  filterLeaderboardByTimeframe,
  rankHighestWpmByWord,
  LeaderboardRecord,
  WordSpeedRecord,
  LeaderboardTimeframe
} from './game/spellingLogic';
import { createSeedLeaderboardEntries, createSeedWordRecords, TITLE_BADGES } from './game/seedData';
import { voiceEngine } from './game/voiceEngine';
import {
  auth,
  onAuthStateChanged,
  signInWithGooglePopup,
  signOutUser,
  fetchGlobalLeaderboards,
  syncUserProfileToFirestore,
  submitRunToFirestore
} from './firebase';
import { TitleEmblemSvg, HoneyPipSvg, SoundWaveIconSvg } from './components/TitleEmblemSvg';
import { SignUpModal, ChallengerProfile } from './components/SignUpModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { WordCompendiumModal } from './components/WordCompendiumModal';

type GameLifecycleState = 'title' | 'playing' | 'paused' | 'gameover';

interface CompletedWordLog {
  word: string;
  difficulty: DifficultyTier;
  wpm: number;
  durationMs: number;
  accuracy: number;
  score: number;
}

interface FrozenRunSnapshot {
  avgWpm: number;
  peakWpm: number;
  fastestWord: string;
  totalScore: number;
  wordsSpelled: number;
  accuracy: number;
  difficulty: GameModeTier;
  newWordRecordsCount: number;
}

const LOCAL_PROFILE_KEY = 'foods_spelling_bee_profile_v1';
const LOCAL_ENTRIES_KEY = 'foods_spelling_bee_entries_v2';
const LOCAL_WORD_RECORDS_KEY = 'foods_spelling_bee_word_records_v2';

export default function App() {
  // Check ?autostart=1 on initial mount
  const initialAutoStart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1';
  }, []);

  const [gameState, setGameState] = useState<GameLifecycleState>(
    initialAutoStart ? 'playing' : 'title'
  );
  const [selectedMode, setSelectedMode] = useState<GameModeTier>('progressive');
  const [wordQueue, setWordQueue] = useState<SpellingWord[]>(() =>
    buildSessionWordQueue('progressive', 8)
  );
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  // Typing & WPM state
  const [typedInput, setTypedInput] = useState('');
  const [wordStartTimeMs, setWordStartTimeMs] = useState<number | null>(null);
  const [liveWpm, setLiveWpm] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errorKeystrokes, setErrorKeystrokes] = useState(0);
  const [vitalityPips, setVitalityPips] = useState<('full' | 'cracked' | 'empty')[]>([
    'full',
    'full',
    'full'
  ]);
  const [streak, setStreak] = useState(0);
  const [completedWords, setCompletedWords] = useState<CompletedWordLog[]>([]);
  const [frozenSummary, setFrozenSummary] = useState<FrozenRunSnapshot | null>(null);

  // Assist & Teleprompter state
  const [revealEdgeLetters, setRevealEdgeLetters] = useState(false);
  const [revealSyllables, setRevealSyllables] = useState(false);
  const [teleprompterVisible, setTeleprompterVisible] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Audio & Voice state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingLabel, setSpeakingLabel] = useState('');
  const [voiceRate, setVoiceRate] = useState(0.92);

  // Modals
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardInitialTab, setLeaderboardInitialTab] = useState<LeaderboardTimeframe>('all');
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);

  // Player Profile
  const [profile, setProfile] = useState<ChallengerProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore storage errors
      }
    }
    return {
      userId: 'challenger_local',
      displayName: 'Guest Speller',
      titleBadge: TITLE_BADGES[0],
      isGoogleLinked: false,
      email: null,
      bestWpm: 0,
      bestWord: '—',
      totalWordsSpelled: 0,
      totalScore: 0
    };
  });

  // Leaderboards (Start empty; clear legacy v1 localStorage keys)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardRecord[]>(() => {
    const seeds = createSeedLeaderboardEntries(Date.now());
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('foods_spelling_bee_entries_v1');
        const saved = localStorage.getItem(LOCAL_ENTRIES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as LeaderboardRecord[];
          return [...parsed, ...seeds];
        }
      } catch {
        // ignore
      }
    }
    return seeds;
  });

  const [wordRecords, setWordRecords] = useState<WordSpeedRecord[]>(() => {
    const seeds = createSeedWordRecords(Date.now());
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('foods_spelling_bee_word_records_v1');
        const saved = localStorage.getItem(LOCAL_WORD_RECORDS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as WordSpeedRecord[];
          return [...parsed, ...seeds];
        }
      } catch {
        // ignore
      }
    }
    return seeds;
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentWord = wordQueue[currentWordIdx] || WORD_BANK[0];

  // Mirror state to document.body.dataset.state as required by Game Shell contract
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Subscribe to voiceEngine speaking indicator
  useEffect(() => {
    return voiceEngine.subscribeSpeaking((speaking, label) => {
      setIsSpeaking(speaking);
      setSpeakingLabel(label);
    });
  }, []);

  // Firebase Auth listener & Cloud Leaderboard sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setProfile((prev) => {
          const updated: ChallengerProfile = {
            ...prev,
            userId: user.uid,
            displayName:
              prev.displayName !== 'Guest Speller'
                ? prev.displayName
                : user.displayName || 'Bee Challenger',
            isGoogleLinked: true,
            email: user.email
          };
          try {
            localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      }
    });

    // Fetch live Firestore leaderboard entries & word records and merge with seeds
    fetchGlobalLeaderboards()
      .then(({ entries: cloudEntries, wordRecords: cloudWords }) => {
        if (cloudEntries.length > 0) {
          setLeaderboardEntries((prev) => {
            const byId = new Map<string, LeaderboardRecord>();
            for (const item of [...cloudEntries, ...prev]) {
              byId.set(item.id, item);
            }
            return Array.from(byId.values());
          });
        }
        if (cloudWords.length > 0) {
          setWordRecords((prev) => {
            const merged = [...cloudWords, ...prev];
            return rankHighestWpmByWord(merged, 'all', '');
          });
        }
      })
      .catch(() => {
        // Offline or permissions fallback keeps deterministic seeds active
      });

    return () => unsub();
  }, []);

  // Live WPM ticker while actively typing a word
  useEffect(() => {
    if (gameState !== 'playing' || !wordStartTimeMs || typedInput.length === 0) {
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - wordStartTimeMs;
      setLiveWpm(calculateWordWpm(typedInput.length, elapsed));
    }, 120);
    return () => clearInterval(interval);
  }, [gameState, wordStartTimeMs, typedInput.length]);

  // Start or restart a Spelling Bee run
  const startSpellingRun = useCallback(
    (modeOverride?: GameModeTier, firstWordOverride?: SpellingWord) => {
      const targetMode = modeOverride || selectedMode;
      if (modeOverride) setSelectedMode(modeOverride);

      const targetCount = targetMode === 'verylong' ? 16 : 8;
      const newQueue = buildSessionWordQueue(targetMode, targetCount, firstWordOverride);
      setWordQueue(newQueue);
      setCurrentWordIdx(0);
      setTypedInput('');
      setWordStartTimeMs(null);
      setLiveWpm(0);
      setTotalKeystrokes(0);
      setErrorKeystrokes(0);
      setVitalityPips(['full', 'full', 'full']);
      setStreak(0);
      setCompletedWords([]);
      setFrozenSummary(null);
      setRevealEdgeLetters(false);
      setRevealSyllables(false);
      setFeedbackBanner(null);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      document.body.dataset.state = 'playing';
      setGameState('playing');

      const firstWord = newQueue[0];
      if (firstWord) {
        setTimeout(() => {
          voiceEngine.pronounceWord(firstWord.word, 'normal', {
            partOfSpeech: firstWord.partOfSpeech,
            origin: firstWord.origin,
            definition: firstWord.definition,
            sentence: firstWord.sentence,
            syllables: firstWord.syllables
          });
          inputRef.current?.focus();
        }, 80);
      }
    },
    [selectedMode]
  );

  // Auto-pronounce first word if booted via ?autostart=1
  useEffect(() => {
    if (initialAutoStart && wordQueue[0]) {
      const first = wordQueue[0];
      voiceEngine.pronounceWord(first.word, 'normal', {
        partOfSpeech: first.partOfSpeech,
        origin: first.origin,
        definition: first.definition,
        sentence: first.sentence,
        syllables: first.syllables
      });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [initialAutoStart]);

  // Complete and record a run into Leaderboards (Today, Week, Month, Year, All Time, and Word WPM Records)
  const finalizeAndRecordRun = useCallback(
    (logs: CompletedWordLog[]) => {
      const effectiveLogs =
        logs.length > 0
          ? logs
          : [
              {
                word: currentWord.word,
                difficulty: currentWord.difficulty,
                wpm: liveWpm > 0 ? liveWpm : 75,
                durationMs: 2400,
                accuracy: calculateAccuracy(totalKeystrokes, errorKeystrokes),
                score: 450
              }
            ];

      const sumWpm = effectiveLogs.reduce((acc, item) => acc + item.wpm, 0);
      const avgWpm = Math.round(sumWpm / effectiveLogs.length);
      const bestLog = effectiveLogs.reduce(
        (best, item) => (item.wpm > best.wpm ? item : best),
        effectiveLogs[0]
      );
      const totalScore = effectiveLogs.reduce((acc, item) => acc + item.score, 0);
      const avgAccuracy = Math.round(
        effectiveLogs.reduce((acc, item) => acc + item.accuracy, 0) / effectiveLogs.length
      );

      let brokenWordRecords = 0;
      const nowMs = Date.now();

      // Update per-word WPM records
      setWordRecords((prev) => {
        const map = new Map<string, WordSpeedRecord>();
        for (const r of prev) {
          map.set(r.word.toLowerCase(), r);
        }
        for (const log of effectiveLogs) {
          const key = log.word.toLowerCase();
          const existing = map.get(key);
          if (!existing || log.wpm > existing.wpm) {
            brokenWordRecords += 1;
            map.set(key, {
              word: log.word,
              difficulty: log.difficulty,
              wpm: log.wpm,
              userId: profile.userId,
              displayName: profile.displayName,
              charCount: log.word.length,
              durationMs: log.durationMs,
              updatedAtMs: nowMs
            });
          }
        }
        const updatedList = Array.from(map.values()).sort((a, b) => b.wpm - a.wpm);
        try {
          localStorage.setItem(LOCAL_WORD_RECORDS_KEY, JSON.stringify(updatedList));
        } catch {
          // ignore
        }
        return updatedList;
      });

      const newEntry: LeaderboardRecord = {
        id: `run_${nowMs}_${Math.random().toString(36).slice(2, 7)}`,
        userId: profile.userId,
        displayName: profile.displayName,
        titleBadge: profile.titleBadge,
        wpm: avgWpm,
        peakWpm: bestLog.wpm,
        fastestWord: bestLog.word,
        difficulty: selectedMode,
        score: totalScore,
        wordsSpelled: effectiveLogs.length,
        accuracy: avgAccuracy,
        playedAtMs: nowMs
      };

      setLeaderboardEntries((prev) => {
        const updated = [newEntry, ...prev];
        try {
          localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(updated.slice(0, 80)));
        } catch {
          // ignore
        }
        return updated;
      });

      // Update local Challenger Profile career metrics
      setProfile((prev) => {
        const isNewBest = bestLog.wpm > prev.bestWpm;
        const nextProfile: ChallengerProfile = {
          ...prev,
          bestWpm: isNewBest ? bestLog.wpm : prev.bestWpm,
          bestWord: isNewBest ? bestLog.word : prev.bestWord,
          totalWordsSpelled: prev.totalWordsSpelled + effectiveLogs.length,
          totalScore: prev.totalScore + totalScore
        };
        try {
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(nextProfile));
        } catch {
          // ignore
        }
        return nextProfile;
      });

      // Sync to Firestore if signed in with verified Google account
      submitRunToFirestore({
        entryId: newEntry.id,
        userId: profile.userId,
        displayName: profile.displayName,
        titleBadge: profile.titleBadge,
        wpm: avgWpm,
        peakWpm: bestLog.wpm,
        fastestWord: bestLog.word,
        difficulty: selectedMode,
        score: totalScore,
        wordsSpelled: effectiveLogs.length,
        accuracy: avgAccuracy,
        playedAtMs: nowMs,
        wordResults: effectiveLogs.map((l) => ({
          word: l.word,
          difficulty: l.difficulty,
          wpm: l.wpm,
          durationMs: l.durationMs
        }))
      }).catch(() => {});

      syncUserProfileToFirestore({
        userId: profile.userId,
        displayName: profile.displayName,
        titleBadge: profile.titleBadge,
        bestWpm: Math.max(profile.bestWpm, bestLog.wpm),
        bestWord: bestLog.wpm >= profile.bestWpm ? bestLog.word : profile.bestWord,
        totalWordsSpelled: effectiveLogs.length,
        totalScore
      }).catch(() => {});

      setFrozenSummary({
        avgWpm,
        peakWpm: bestLog.wpm,
        fastestWord: bestLog.word,
        totalScore,
        wordsSpelled: effectiveLogs.length,
        accuracy: avgAccuracy,
        difficulty: selectedMode,
        newWordRecordsCount: brokenWordRecords
      });

      voiceEngine.playRunVictory();
      document.body.dataset.state = 'gameover';
      setGameState('gameover');
    },
    [
      currentWord,
      liveWpm,
      totalKeystrokes,
      errorKeystrokes,
      profile,
      selectedMode
    ]
  );

  // Advance to next word or finish run
  const advanceToNextWord = useCallback(
    (updatedLogs: CompletedWordLog[]) => {
      const nextIdx = currentWordIdx + 1;
      if (nextIdx >= wordQueue.length) {
        finalizeAndRecordRun(updatedLogs);
        return;
      }
      setCurrentWordIdx(nextIdx);
      setTypedInput('');
      setWordStartTimeMs(null);
      setLiveWpm(0);
      setTotalKeystrokes(0);
      setErrorKeystrokes(0);
      setRevealEdgeLetters(false);
      setRevealSyllables(false);

      const nextWord = wordQueue[nextIdx];
      if (nextWord) {
        setTimeout(() => {
          voiceEngine.pronounceWord(nextWord.word, 'normal', {
            partOfSpeech: nextWord.partOfSpeech,
            origin: nextWord.origin,
            definition: nextWord.definition,
            sentence: nextWord.sentence,
            syllables: nextWord.syllables
          });
          inputRef.current?.focus();
        }, 180);
      }
    },
    [currentWordIdx, wordQueue, finalizeAndRecordRun]
  );

  // Handle typing changes on the spelling input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;
    const rawVal = e.target.value.replace(/\s+/g, '');
    const now = Date.now();

    let activeStartMs = wordStartTimeMs;
    if (!activeStartMs && rawVal.length > 0) {
      activeStartMs = now;
      setWordStartTimeMs(now);
    }

    if (rawVal.length > typedInput.length) {
      const newCharIdx = rawVal.length - 1;
      const typedChar = rawVal[newCharIdx]?.toLowerCase();
      const targetChar = currentWord.word[newCharIdx]?.toLowerCase();
      const isCharCorrect = typedChar === targetChar;

      setTotalKeystrokes((prev) => prev + 1);
      if (!isCharCorrect) {
        setErrorKeystrokes((prev) => prev + 1);
      }
      voiceEngine.playKeystroke(isCharCorrect, newCharIdx);
    }

    setTypedInput(rawVal);

    if (activeStartMs && rawVal.length > 0) {
      const duration = Math.max(200, now - activeStartMs);
      setLiveWpm(calculateWordWpm(rawVal.length, duration));
    }
  };

  // Submit current word spelling
  const handleSubmitWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (gameState !== 'playing') return;

    const cleanTyped = typedInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();

    if (!cleanTyped) {
      voiceEngine.pronounceWord(currentWord.word, 'normal', {
        partOfSpeech: currentWord.partOfSpeech,
        origin: currentWord.origin,
        definition: currentWord.definition,
        sentence: currentWord.sentence,
        syllables: currentWord.syllables
      });
      setFeedbackBanner({
        type: 'info',
        message: 'Listening to pronouncer... Type the word and press Enter.'
      });
      return;
    }

    const durationMs = Math.max(220, wordStartTimeMs ? Date.now() - wordStartTimeMs : 1200);
    const wordWpm = calculateWordWpm(cleanTarget.length, durationMs);
    const wordAcc = calculateAccuracy(Math.max(cleanTarget.length, totalKeystrokes), errorKeystrokes);

    if (cleanTyped === cleanTarget) {
      const nextStreak = streak + 1;
      const usedHint = revealEdgeLetters || revealSyllables || teleprompterVisible;
      const wordScore = calculateWordScore({
        wordLength: cleanTarget.length,
        difficulty: currentWord.difficulty,
        wpm: wordWpm,
        accuracy: wordAcc,
        streak: nextStreak,
        usedHint
      });

      const newLog: CompletedWordLog = {
        word: currentWord.word,
        difficulty: currentWord.difficulty,
        wpm: wordWpm,
        durationMs,
        accuracy: wordAcc,
        score: wordScore
      };

      const nextLogs = [...completedWords, newLog];
      setCompletedWords(nextLogs);
      setStreak(nextStreak);
      voiceEngine.playWordSuccess();
      setFeedbackBanner({
        type: 'success',
        message: `Correct! “${currentWord.word}” spelled at ${wordWpm} WPM (+${wordScore.toLocaleString()} pts)`
      });

      advanceToNextWord(nextLogs);
    } else {
      // Incorrect submission damages a honeycomb vitality pip
      setStreak(0);
      setErrorKeystrokes((prev) => prev + 1);
      voiceEngine.playKeystroke(false, 0);

      setVitalityPips((prev) => {
        const next = [...prev];
        const fullIdx = next.lastIndexOf('full');
        if (fullIdx !== -1) {
          next[fullIdx] = 'cracked';
        } else {
          const crackedIdx = next.lastIndexOf('cracked');
          if (crackedIdx !== -1) {
            next[crackedIdx] = 'empty';
          }
        }
        return next;
      });

      setFeedbackBanner({
        type: 'error',
        message: `Not quite! Click “Repeat Word” to listen closely and try again.`
      });
    }
  };

  // Global keyboard shortcuts (Title start via Enter/Space, Pause via Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSignUpOpen || isLeaderboardOpen || isCompendiumOpen) return;

      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea';

      if (gameState === 'title' && !isInputFocused) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startSpellingRun();
        }
      } else if (gameState === 'playing') {
        if (e.key === 'Escape') {
          e.preventDefault();
          document.body.dataset.state = 'paused';
          setGameState('paused');
        }
      } else if (gameState === 'paused') {
        if (e.key === 'Escape') {
          e.preventDefault();
          document.body.dataset.state = 'playing';
          setGameState('playing');
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isSignUpOpen, isLeaderboardOpen, isCompendiumOpen, startSpellingRun]);

  // Computed metrics for HUD
  const runAvgWpm = useMemo(() => {
    if (completedWords.length === 0) return liveWpm;
    const sum = completedWords.reduce((acc, w) => acc + w.wpm, 0);
    return Math.round(sum / completedWords.length);
  }, [completedWords, liveWpm]);

  const runPeakWord = useMemo(() => {
    if (completedWords.length === 0) {
      return { wpm: liveWpm, word: typedInput.length > 0 ? currentWord.word : '—' };
    }
    const best = completedWords.reduce(
      (max, w) => (w.wpm > max.wpm ? w : max),
      completedWords[0]
    );
    return { wpm: best.wpm, word: best.word };
  }, [completedWords, liveWpm, typedInput.length, currentWord.word]);

  const runTotalScore = useMemo(
    () => completedWords.reduce((acc, w) => acc + w.score, 0),
    [completedWords]
  );

  const letterStates = useMemo(
    () => evaluateLetterStates(currentWord.word, typedInput),
    [currentWord.word, typedInput]
  );

  const currentWordRecord = useMemo(
    () => wordRecords.find((r) => r.word.toLowerCase() === currentWord.word.toLowerCase()),
    [wordRecords, currentWord.word]
  );

  const topAllTimePlayers = useMemo(
    () => filterLeaderboardByTimeframe(leaderboardEntries, 'all', Date.now()).slice(0, 4),
    [leaderboardEntries]
  );

  const topWordRecords = useMemo(
    () => rankHighestWpmByWord(wordRecords, 'all', '').slice(0, 4),
    [wordRecords]
  );

  const handleToggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const next = !isMuted;
    setIsMuted(next);
    voiceEngine.setMuted(next);
  };

  const handleSaveProfile = (displayName: string, titleBadge: string) => {
    setProfile((prev) => {
      const updated: ChallengerProfile = {
        ...prev,
        displayName,
        titleBadge
      };
      try {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      syncUserProfileToFirestore({
        userId: updated.userId,
        displayName: updated.displayName,
        titleBadge: updated.titleBadge,
        bestWpm: updated.bestWpm,
        bestWord: updated.bestWord === '—' ? 'bistro' : updated.bestWord,
        totalWordsSpelled: updated.totalWordsSpelled,
        totalScore: updated.totalScore
      }).catch(() => {});
      return updated;
    });
  };

  const handleGoogleSignIn = async () => {
    const user = await signInWithGooglePopup();
    setProfile((prev) => {
      const updated: ChallengerProfile = {
        ...prev,
        userId: user.uid,
        displayName:
          prev.displayName !== 'Guest Speller'
            ? prev.displayName
            : user.displayName || 'Bee Challenger',
        isGoogleLinked: true,
        email: user.email
      };
      try {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleSignOut = async () => {
    await signOutUser();
    setProfile((prev) => ({
      ...prev,
      isGoogleLinked: false,
      email: null
    }));
  };

  const openLeaderboardWithTab = (tab: LeaderboardTimeframe) => {
    setLeaderboardInitialTab(tab);
    setIsLeaderboardOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#14100E] text-[#FBF8F3] flex flex-col justify-between selection:bg-[#D97706] selection:text-[#120E0C]">
      {/* TITLE SCREEN STATE */}
      {gameState === 'title' && (
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between px-4 py-6 sm:px-8 sm:py-10">
          {/* Top Utility Strip inside Game Shell */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 border-b border-[#2D231C] pb-4">
            <div className="flex items-center gap-3 shrink-0">
              <TitleEmblemSvg className="w-10 h-10" />
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-[#FBF8F3] whitespace-nowrap">
                  Food’s Spelling Bee
                </span>
                <span className="hidden xl:inline text-xs text-[#A39281] ml-3 whitespace-nowrap">
                  Audio-Driven Championship Arena · Real-Time WPM Telemetry
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  voiceEngine.speakText(
                    "Welcome to Food's Spelling Bee. Your sound is active and ready for championship play.",
                    { label: 'Audio Sound Check' }
                  )
                }
                className="flex items-center gap-1.5 rounded-lg border border-[#3B2E25] bg-[#1F1814] px-3 py-2 text-xs font-medium text-[#E5D9C8] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <SoundWaveIconSvg active={isSpeaking} className="w-4 h-4 text-[#F59E0B]" />
                <span>{isSpeaking ? 'Sound Active...' : 'Test Stage Voice'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCompendiumOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#3B2E25] bg-[#1F1814] px-3 py-2 text-xs font-medium text-[#E5D9C8] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                <span>Word Dictionary ({WORD_BANK.length})</span>
              </button>

              <button
                type="button"
                onClick={() => openLeaderboardWithTab('all')}
                className="flex items-center gap-1.5 rounded-lg border border-[#3B2E25] bg-[#1F1814] px-3 py-2 text-xs font-medium text-[#E5D9C8] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                <span>Leaderboards</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSignUpOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#2A2019] border border-[#574334] px-3.5 py-2 text-xs font-semibold text-[#FDE68A] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 text-[#F59E0B]" />
                <span>
                  {profile.displayName === 'Guest Speller'
                    ? 'Sign Up'
                    : `Challenger: ${profile.displayName}`}
                </span>
              </button>
            </div>
          </div>

          {/* Centerpiece Stage Lockup */}
          <div className="my-6 grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
            {/* Left 7 Columns: Title Emblem, Difficulty Selector, and Primary Start CTA */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#362A21] bg-[#1A1411] p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-4">
                  <TitleEmblemSvg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#D97706]">
                      Sound Required · Easy (4 Letters) to Very Long (45 Letters)
                    </p>
                    <h1 className="mt-1 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FBF8F3]">
                      Food’s Spelling Bee
                    </h1>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#D8CBB8]">
                  Listen closely as the stage voice pronounces culinary, botanical, and championship
                  marathon words. Type each word with precision to clock your live{' '}
                  <strong className="text-[#FBF8F3]">Words Per Minute (WPM)</strong> and compete on
                  the global leaderboards for Today, This Week, This Month, This Year, All Time, and
                  the <strong className="text-[#FDE68A]">Highest WPM by Word</strong>.
                </p>

                {/* Difficulty Tier Selector */}
                <div className="mt-6">
                  <div className="text-xs font-semibold text-[#C8B9A6] mb-2.5">
                    Select Spelling Bee Difficulty Tier:
                  </div>
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                    role="radiogroup"
                    aria-label="Difficulty Tier"
                  >
                    {(
                      ['easy', 'medium', 'hard', 'verylong', 'progressive'] as GameModeTier[]
                    ).map((tier) => {
                      const meta = DIFFICULTY_META[tier];
                      const active = selectedMode === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSelectedMode(tier)}
                          className={`flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                            active
                              ? 'border-[#F59E0B] bg-[#2B2017] text-[#FBF8F3]'
                              : 'border-[#332720] bg-[#14100E] text-[#C8B9A6] hover:border-[#574334]'
                          }`}
                        >
                          <span className="text-xs font-bold text-[#FBF8F3] whitespace-nowrap">
                            {meta.label}
                          </span>
                          <span className="mt-0.5 font-mono text-[11px] text-[#F59E0B] whitespace-nowrap">
                            {meta.rangeLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-[#A39281]">
                    {DIFFICULTY_META[selectedMode].description}
                  </p>
                </div>

                {/* Sample Voice Pronunciation Showcase from Easy to Very Long */}
                <div className="mt-5 rounded-xl border border-[#2D231C] bg-[#14100E] p-3.5">
                  <div className="text-xs font-semibold text-[#C8B9A6]">
                    Preview Stage Pronunciation (Click to Hear Easy → Very Long Words):
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { word: 'bistro', tag: 'Easy · 6L' },
                      { word: 'croissant', tag: 'Medium · 9L' },
                      { word: 'bouillabaisse', tag: 'Hard · 13L' },
                      { word: 'pneumonoultramicroscopicsilicovolcanoconiosis', tag: 'Very Long · 45L' }
                    ].map((sample) => (
                      <button
                        key={sample.word}
                        type="button"
                        onClick={() => voiceEngine.speakText(sample.word)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#3B2E25] bg-[#1C1613] px-2.5 py-1.5 text-xs text-[#FBF8F3] hover:border-[#F59E0B] transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                        <span className="font-mono font-semibold">{sample.word}</span>
                        <span className="text-[10px] text-[#A39281]">({sample.tag})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Start CTA + Secondary Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-[#2D231C]">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startSpellingRun()}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-[#D97706] px-7 py-3.5 text-base font-bold text-[#120E0C] hover:bg-[#F59E0B] transition-colors whitespace-nowrap shadow-lg"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Spelling Bee</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSignUpOpen(true)}
                  className="rounded-xl border border-[#4A3A2E] bg-[#241C17] px-5 py-3.5 text-sm font-semibold text-[#FBF8F3] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
                >
                  Sign Up for Leaderboard
                </button>
              </div>
            </div>

            {/* Right 5 Columns: Live Championship Standings & Highest WPM on What Word Preview */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#362A21] bg-[#1A1411] p-6">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[#2D231C] pb-3">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#FBF8F3]">
                      Global Leaderboards
                    </h2>
                    <p className="text-xs text-[#A39281]">
                      Click any timeframe to inspect full standings
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLeaderboardWithTab('all')}
                    className="text-xs font-semibold text-[#F59E0B] hover:underline whitespace-nowrap"
                  >
                    Open Full Board →
                  </button>
                </div>

                {/* Quick Timeframe Launcher Buttons */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'day', label: 'Today' },
                      { id: 'week', label: 'This Week' },
                      { id: 'month', label: 'This Month' },
                      { id: 'year', label: 'This Year' },
                      { id: 'all', label: 'All Time' },
                      { id: 'word_records', label: 'Highest WPM by Word' }
                    ] as { id: LeaderboardTimeframe; label: string }[]
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openLeaderboardWithTab(t.id)}
                      className="rounded-md border border-[#3B2E25] bg-[#14100E] px-2.5 py-1 text-xs font-medium text-[#E5D9C8] hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors whitespace-nowrap"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* All-Time Top Players Mini Table */}
                <div className="mt-4">
                  <div className="text-xs font-semibold text-[#C8B9A6] mb-2">
                    All-Time Top Spellers · Peak WPM & Word
                  </div>
                  <div className="divide-y divide-[#281F1A] rounded-xl border border-[#2D231C] bg-[#14100E]">
                    {topAllTimePlayers.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[#A39281]">
                        No runs recorded on the global leaderboard yet. Start a Spelling Bee run to
                        claim the #1 spot!
                      </div>
                    ) : (
                      topAllTimePlayers.map((p, i) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-[#FBF8F3] truncate">
                              <span className="font-mono text-[#F59E0B] mr-1.5">#{i + 1}</span>
                              {p.displayName}
                            </div>
                            <div className="text-[11px] text-[#8C7A6B] truncate">
                              Fastest:{' '}
                              <span className="font-mono text-[#E5D9C8]">{p.fastestWord}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono shrink-0">
                            <div className="font-bold tabular-nums text-[#F59E0B]">
                              {p.peakWpm} WPM
                            </div>
                            <div className="text-[11px] tabular-nums text-[#A39281]">
                              Avg {p.wpm} WPM
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Highest WPM on What Word Mini Spotlight */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#C8B9A6] mb-2">
                    <span>Highest WPM on What Word</span>
                    <button
                      type="button"
                      onClick={() => openLeaderboardWithTab('word_records')}
                      className="text-[11px] text-[#F59E0B] hover:underline"
                    >
                      All Word Records →
                    </button>
                  </div>
                  <div className="divide-y divide-[#281F1A] rounded-xl border border-[#2D231C] bg-[#14100E]">
                    {topWordRecords.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[#A39281]">
                        No word WPM records yet. Spell any word to set the first record!
                      </div>
                    ) : (
                      topWordRecords.slice(0, 3).map((rec) => (
                        <div
                          key={rec.word}
                          className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-[#FDE68A] truncate">
                              {rec.word}
                            </div>
                            <div className="text-[11px] text-[#8C7A6B]">
                              {rec.charCount} letters · by {rec.displayName}
                            </div>
                          </div>
                          <div className="font-mono font-bold tabular-nums text-[#F59E0B] shrink-0">
                            {rec.wpm} WPM
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flat Bottom Control Hint Line per Game Shell spec */}
          <div className="text-center text-xs text-[#8C7A6B] pt-2">
            Enter / Space Start Spelling Bee · Type Letters to Clock Live WPM · Esc Pause · Sound
            Synthesizer Enabled
          </div>
        </main>
      )}

      {/* PLAYING & PAUSED & GAMEOVER ARENA SHELL */}
      {gameState !== 'title' && (
        <main
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between px-4 py-4 sm:px-8 sm:py-6"
          data-current-word={currentWord.word}
        >
          {/* Unified Perimeter HUD Bar */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 rounded-xl border border-[#362A21] bg-[#1A1411] px-4 py-2.5">
            {/* Left Cluster: Brand + Mode Selector + Vitality Pips */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  document.body.dataset.state = 'title';
                  setGameState('title');
                }}
                className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
              >
                <TitleEmblemSvg className="w-8 h-8" />
                <span className="font-serif text-base font-bold text-[#FBF8F3] whitespace-nowrap">
                  Food’s Spelling Bee
                </span>
              </button>

              <div className="flex items-center gap-1" aria-label="Honeycomb Vitality">
                {vitalityPips.map((st, idx) => (
                  <HoneyPipSvg key={idx} state={st} />
                ))}
                <span className="ml-1.5 text-xs font-medium text-[#C8B9A6] whitespace-nowrap">
                  Word {currentWordIdx + 1} / {wordQueue.length}
                </span>
              </div>
            </div>

            {/* Center Telemetry Cluster: Hero-to-Kicker 3:1 Scale with tabular-nums */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-[#A39281] whitespace-nowrap">
                  LIVE WPM
                </div>
                <div className="font-mono text-xl font-bold tabular-nums text-[#F59E0B]">
                  {liveWpm}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-wider text-[#A39281] whitespace-nowrap">
                  RUN AVG WPM
                </div>
                <div className="font-mono text-xl font-bold tabular-nums text-[#FBF8F3]">
                  {runAvgWpm}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-wider text-[#A39281] whitespace-nowrap">
                  PEAK WORD WPM
                </div>
                <div className="font-mono text-xl font-bold tabular-nums text-[#FDE68A]">
                  {runPeakWord.wpm}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-wider text-[#A39281] whitespace-nowrap">
                  SCORE · STREAK
                </div>
                <div className="font-mono text-xl font-bold tabular-nums text-[#FBF8F3] whitespace-nowrap">
                  {runTotalScore.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#F59E0B]">({streak}x)</span>
                </div>
              </div>
            </div>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                aria-label="Leaderboards"
                onClick={() => openLeaderboardWithTab('all')}
                className="flex items-center gap-1.5 rounded-lg border border-[#3B2E25] bg-[#14100E] px-3 py-2 text-xs font-medium text-[#E5D9C8] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                <span className="hidden sm:inline">Leaderboards</span>
              </button>

              <button
                type="button"
                aria-label="Sign Up"
                onClick={() => setIsSignUpOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#3B2E25] bg-[#14100E] px-3 py-2 text-xs font-medium text-[#FDE68A] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 text-[#F59E0B]" />
                <span className="hidden sm:inline">
                  {profile.displayName === 'Guest Speller' ? 'Sign Up' : profile.displayName}
                </span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Unmute Stage Voice' : 'Mute Stage Voice'}
                className="rounded-lg border border-[#3B2E25] bg-[#14100E] p-2 text-[#E5D9C8] hover:border-[#F59E0B] transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-[#EF4444]" /> : <Volume2 className="w-4 h-4 text-[#F59E0B]" />}
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  document.body.dataset.state = 'paused';
                  setGameState('paused');
                }}
                aria-label="Pause Game"
                className="rounded-lg border border-[#3B2E25] bg-[#14100E] p-2 text-[#E5D9C8] hover:border-[#F59E0B] transition-colors"
              >
                <Pause className="w-4 h-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  startSpellingRun();
                }}
                aria-label="Restart Run"
                className="rounded-lg border border-[#3B2E25] bg-[#14100E] p-2 text-[#E5D9C8] hover:border-[#F59E0B] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Difficulty Mode Switcher Strip */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['easy', 'medium', 'hard', 'verylong', 'progressive'] as GameModeTier[]).map(
                (tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => startSpellingRun(tier)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      selectedMode === tier
                        ? 'bg-[#D97706] text-[#120E0C]'
                        : 'border border-[#332720] bg-[#1A1411] text-[#C8B9A6] hover:border-[#574334] hover:text-white'
                    }`}
                  >
                    {DIFFICULTY_META[tier].label} ({DIFFICULTY_META[tier].rangeLabel})
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCompendiumOpen(true)}
                className="rounded-lg border border-[#3B2E25] bg-[#1A1411] px-3 py-1.5 text-xs font-medium text-[#E5D9C8] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                Pick Specific Word
              </button>
              <button
                type="button"
                onClick={() => finalizeAndRecordRun(completedWords)}
                className="rounded-lg border border-[#574334] bg-[#261E1A] px-3 py-1.5 text-xs font-semibold text-[#FDE68A] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                Finish & Record Run
              </button>
            </div>
          </div>

          {/* Central Spelling Stage */}
          <div className="my-4 grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
            {/* Left 5 Columns: Official Voice Pronouncer Deck & Lexicon Clues */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#362A21] bg-[#1A1411] p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#D97706]">
                    Official Voice Pronouncer · {DIFFICULTY_META[currentWord.difficulty].label} Tier
                  </span>
                  <span className="font-mono text-xs text-[#C8B9A6]">
                    {currentWord.partOfSpeech}
                  </span>
                </div>

                {/* Primary Repeat / Speak Word Buttons */}
                <div className="mt-4 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      voiceEngine.pronounceWord(currentWord.word, 'normal', {
                        partOfSpeech: currentWord.partOfSpeech,
                        origin: currentWord.origin,
                        definition: currentWord.definition,
                        sentence: currentWord.sentence,
                        syllables: currentWord.syllables
                      });
                      inputRef.current?.focus();
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-[#D97706] px-5 py-4 text-left text-[#120E0C] hover:bg-[#F59E0B] transition-colors shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <SoundWaveIconSvg active={isSpeaking} className="w-6 h-6 text-[#120E0C]" />
                      <div>
                        <div className="text-base font-bold">
                          {isSpeaking ? speakingLabel || 'Pronouncing Word...' : 'Repeat Word'}
                        </div>
                        <div className="text-xs font-medium text-[#2D1E0B]">
                          Click to hear the stage voice read the word again
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider bg-[#120E0C]/15 px-2.5 py-1 rounded">
                      Speak
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      voiceEngine.pronounceWord(currentWord.word, 'full_card', {
                        partOfSpeech: currentWord.partOfSpeech,
                        origin: currentWord.origin,
                        definition: currentWord.definition,
                        sentence: currentWord.sentence,
                        syllables: currentWord.syllables
                      });
                      inputRef.current?.focus();
                    }}
                    className="w-full rounded-lg border border-[#3B2E25] bg-[#14100E] px-3 py-2.5 text-xs font-semibold text-[#E5D9C8] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
                  >
                    Read Definition & Sentence Aloud
                  </button>
                </div>

                {/* Official Pronouncer Clue Details */}
                <div className="mt-5 space-y-3 border-t border-[#2D231C] pt-4 text-sm">
                  <div className="text-xs text-[#A39281]">
                    Origin: <strong className="text-[#FBF8F3]">{currentWord.origin}</strong> ·
                    Category: <strong className="text-[#FBF8F3]">{currentWord.category}</strong>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-[#A39281]">Definition</div>
                    <p className="mt-0.5 text-sm leading-relaxed text-[#FBF8F3]">
                      {currentWord.definition}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-[#A39281]">Sentence Context</div>
                    <p className="mt-0.5 text-sm italic text-[#D8CBB8]">“{currentWord.sentence}”</p>
                  </div>
                </div>
              </div>

              {/* Word Speed Record Benchmark Footer */}
              <div className="mt-5 flex items-center justify-between border-t border-[#2D231C] pt-3 text-xs text-[#A39281]">
                <span>World Record on this Word:</span>
                {currentWordRecord ? (
                  <span className="font-mono font-semibold tabular-nums text-[#F59E0B]">
                    {currentWordRecord.wpm} WPM by {currentWordRecord.displayName}
                  </span>
                ) : (
                  <span className="font-mono text-[#E5D9C8]">Unclaimed — Set the Record!</span>
                )}
              </div>
            </div>

            {/* Right 7 Columns: Pure Audio Spelling Stage & Real-Time WPM Input */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#362A21] bg-[#1A1411] p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D231C] pb-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#FBF8F3]">
                      Spelling Stage
                    </h2>
                    <p className="text-xs text-[#A39281]">
                      Listen to the pronouncer and type the word · WPM timer starts on first keystroke
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      voiceEngine.pronounceWord(currentWord.word, 'normal', {
                        partOfSpeech: currentWord.partOfSpeech,
                        origin: currentWord.origin,
                        definition: currentWord.definition,
                        sentence: currentWord.sentence,
                        syllables: currentWord.syllables
                      });
                      inputRef.current?.focus();
                    }}
                    className="flex items-center gap-2 rounded-xl border border-[#F59E0B] bg-[#2B2017] px-4 py-2.5 text-xs font-bold text-[#FDE68A] hover:bg-[#D97706] hover:text-[#120E0C] transition-colors whitespace-nowrap"
                  >
                    <Volume2 className="w-4 h-4 text-[#F59E0B]" />
                    <span>Repeat Word</span>
                  </button>
                </div>

                {/* Typing Input Form */}
                <form onSubmit={handleSubmitWord} className="mt-6">
                  <label
                    htmlFor="spelling-stage-input"
                    className="block text-xs font-semibold text-[#C8B9A6]"
                  >
                    Type Spelling Below (Press Enter to Submit Word):
                  </label>
                  <div className="mt-2.5 flex flex-col sm:flex-row gap-2.5">
                    <input
                      ref={inputRef}
                      id="spelling-stage-input"
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={typedInput}
                      onChange={handleInputChange}
                      placeholder="Type the word you hear..."
                      className="flex-1 rounded-xl border border-[#574334] bg-[#110D0B] px-4 py-4 font-mono text-lg font-bold tracking-wide text-[#FBF8F3] placeholder-[#6E5D4F] focus:border-[#F59E0B] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#D97706] px-6 py-4 text-sm font-bold text-[#120E0C] hover:bg-[#F59E0B] transition-colors whitespace-nowrap"
                    >
                      <span>Submit Word</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Non-Hue-Only Status Banner */}
                {feedbackBanner && (
                  <div
                    role="status"
                    className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium ${
                      feedbackBanner.type === 'success'
                        ? 'border-[#059669] bg-[#0B291E] text-[#A7F3D0]'
                        : feedbackBanner.type === 'error'
                        ? 'border-[#DC2626] bg-[#301212] text-[#FCA5A5]'
                        : 'border-[#D97706] bg-[#261D15] text-[#FDE68A]'
                    }`}
                  >
                    {feedbackBanner.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#F59E0B]" />
                    )}
                    <span>{feedbackBanner.message}</span>
                  </div>
                )}
              </div>

              {/* Bottom Stage Controls: Repeat Word, Accuracy & Skip Word */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#2D231C] pt-4 text-xs">
                <span className="font-mono text-[#A39281] tabular-nums">
                  Accuracy: {calculateAccuracy(totalKeystrokes, errorKeystrokes)}%
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => advanceToNextWord(completedWords)}
                    className="rounded-lg border border-[#3B2E25] bg-[#14100E] px-3 py-1.5 text-xs font-medium text-[#C8B9A6] hover:border-[#F59E0B] hover:text-white transition-colors whitespace-nowrap"
                  >
                    Skip to Next Word →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Bottom Strip: Quick Leaderboard Access */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2D231C] bg-[#17120F] px-4 py-2.5 text-xs text-[#A39281]">
            <div>
              <span>Leaderboards:</span>{' '}
              {(
                [
                  { id: 'day', label: 'Today' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'year', label: 'This Year' },
                  { id: 'all', label: 'All Time' },
                  { id: 'word_records', label: 'Highest WPM by Word' }
                ] as { id: LeaderboardTimeframe; label: string }[]
              ).map((tab, idx) => (
                <React.Fragment key={tab.id}>
                  {idx > 0 && <span className="mx-1.5 text-[#574334]">·</span>}
                  <button
                    type="button"
                    onClick={() => openLeaderboardWithTab(tab.id)}
                    className="font-medium text-[#E5D9C8] hover:text-[#F59E0B] hover:underline"
                  >
                    {tab.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <div>
              Active Challenger: <strong className="text-[#FDE68A]">{profile.displayName}</strong>
            </div>
          </div>
        </main>
      )}

      {/* PAUSED STATUS MODAL */}
      {gameState === 'paused' && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#45362B] bg-[#1A1411] p-6 text-center shadow-2xl">
            <p className="text-xs font-medium text-[#D97706]">Stage Paused</p>
            <h2 id="pause-modal-title" className="mt-1 font-serif text-2xl font-bold text-[#FBF8F3]">
              Food’s Spelling Bee Paused
            </h2>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#332720] bg-[#14100E] p-3">
                <div className="font-mono text-xl font-bold tabular-nums text-[#F59E0B]">
                  {runAvgWpm}
                </div>
                <div className="text-[11px] text-[#A39281]">Run Avg WPM</div>
              </div>
              <div className="rounded-xl border border-[#332720] bg-[#14100E] p-3">
                <div className="font-mono text-xl font-bold tabular-nums text-[#FBF8F3]">
                  {completedWords.length}
                </div>
                <div className="text-[11px] text-[#A39281]">Words Spelled</div>
              </div>
              <div className="rounded-xl border border-[#332720] bg-[#14100E] p-3">
                <div className="font-mono text-xl font-bold tabular-nums text-[#FDE68A]">
                  {runTotalScore.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#A39281]">Score</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  document.body.dataset.state = 'playing';
                  setGameState('playing');
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="w-full rounded-xl bg-[#D97706] py-3 text-sm font-bold text-[#120E0C] hover:bg-[#F59E0B] transition-colors"
              >
                Resume Spelling Bee
              </button>
              <button
                type="button"
                onClick={() => startSpellingRun()}
                className="w-full rounded-xl border border-[#45362B] bg-[#241C17] py-2.5 text-sm font-semibold text-[#FBF8F3] hover:border-[#F59E0B] transition-colors"
              >
                Restart Run
              </button>
              <button
                type="button"
                onClick={() => {
                  document.body.dataset.state = 'title';
                  setGameState('title');
                }}
                className="w-full rounded-xl border border-[#332720] bg-[#14100E] py-2.5 text-sm font-medium text-[#C8B9A6] hover:text-white transition-colors"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER / RUN SUMMARY VICTORY MODAL */}
      {gameState === 'gameover' && frozenSummary && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gameover-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#45362B] bg-[#1A1411] p-6 text-center shadow-2xl">
            <p className="text-xs font-medium text-[#D97706]">
              Official Championship Run Recorded · {profile.displayName}
            </p>
            <h2
              id="gameover-modal-title"
              className="mt-1 font-serif text-3xl font-bold text-[#FBF8F3]"
            >
              Spelling Bee Run Complete
            </h2>
            <p className="mt-1 text-xs text-[#A39281]">
              Your WPM and word records have been posted to Today, This Week, This Month, This Year,
              All Time, and Highest WPM by Word standings.
            </p>

            {/* 3 Tabular-Nums Mastery Metric Tiles */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#332720] bg-[#14100E] p-3.5">
                <div className="font-mono text-2xl font-bold tabular-nums text-[#F59E0B]">
                  {frozenSummary.avgWpm} WPM
                </div>
                <div className="mt-0.5 text-xs text-[#A39281]">Run Average WPM</div>
              </div>

              <div className="rounded-xl border border-[#332720] bg-[#14100E] p-3.5">
                <div className="font-mono text-2xl font-bold tabular-nums text-[#FDE68A]">
                  {frozenSummary.peakWpm} WPM
                </div>
                <div className="mt-0.5 text-xs text-[#A39281] truncate">
                  Peak: “{frozenSummary.fastestWord}”
                </div>
              </div>

              <div className="rounded-xl border border-[#332720] bg-[#14100E] p-3.5">
                <div className="font-mono text-2xl font-bold tabular-nums text-[#FBF8F3]">
                  {frozenSummary.totalScore.toLocaleString()}
                </div>
                <div className="mt-0.5 text-xs text-[#A39281]">
                  {frozenSummary.wordsSpelled} Words · {frozenSummary.accuracy}% Acc
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                data-start="true"
                onClick={() => startSpellingRun()}
                className="flex-1 rounded-xl bg-[#D97706] px-5 py-3 text-sm font-bold text-[#120E0C] hover:bg-[#F59E0B] transition-colors whitespace-nowrap"
              >
                Play Again
              </button>

              <button
                type="button"
                onClick={() => openLeaderboardWithTab('day')}
                className="rounded-xl border border-[#45362B] bg-[#241C17] px-4 py-3 text-sm font-semibold text-[#FDE68A] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                View Today’s Leaderboard
              </button>

              <button
                type="button"
                onClick={() => openLeaderboardWithTab('word_records')}
                className="rounded-xl border border-[#332720] bg-[#14100E] px-4 py-3 text-sm font-medium text-[#E5D9C8] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                Word WPM Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        initialTab={leaderboardInitialTab}
        entries={leaderboardEntries}
        wordRecords={wordRecords}
        currentUserId={profile.userId}
        onChallengeWord={(wordObj) => startSpellingRun(wordObj.difficulty, wordObj)}
        onOpenSignUp={() => setIsSignUpOpen(true)}
      />

      <WordCompendiumModal
        isOpen={isCompendiumOpen}
        onClose={() => setIsCompendiumOpen(false)}
        wordRecords={wordRecords}
        onSelectWordToSpell={(wordObj) => startSpellingRun(wordObj.difficulty, wordObj)}
      />
    </div>
  );
}
