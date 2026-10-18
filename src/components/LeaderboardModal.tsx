import React, { useState, useMemo } from 'react';
import { X, Volume2, Play, Search } from 'lucide-react';
import {
  LeaderboardRecord,
  WordSpeedRecord,
  LeaderboardTimeframe,
  filterLeaderboardByTimeframe,
  rankHighestWpmByWord
} from '../game/spellingLogic';
import { DifficultyTier, WORD_BANK, SpellingWord } from '../game/wordBank';
import { voiceEngine } from '../game/voiceEngine';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LeaderboardTimeframe;
  entries: LeaderboardRecord[];
  wordRecords: WordSpeedRecord[];
  currentUserId: string;
  onChallengeWord: (wordObj: SpellingWord) => void;
  onOpenSignUp: () => void;
}

const TIMEFRAME_TABS: { id: LeaderboardTimeframe; label: string; subtitle: string }[] = [
  { id: 'day', label: 'Today', subtitle: 'Top players over the past 24 hours' },
  { id: 'week', label: 'This Week', subtitle: 'Top players over the past 7 days' },
  { id: 'month', label: 'This Month', subtitle: 'Top players over the past 30 days' },
  { id: 'year', label: 'This Year', subtitle: 'Top players of the 2026 championship season' },
  { id: 'all', label: 'All Time', subtitle: 'All-time Hall of Fame top players' },
  {
    id: 'word_records',
    label: 'Highest WPM by Word',
    subtitle: 'Fastest recorded typing WPM on each specific word'
  }
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'all',
  entries,
  wordRecords,
  currentUserId,
  onChallengeWord,
  onOpenSignUp
}) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTimeframe>(initialTab);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyTier | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const nowMs = Date.now();

  const filteredTimeframeEntries = useMemo(() => {
    if (activeTab === 'word_records') return [];
    const base = filterLeaderboardByTimeframe(entries, activeTab, nowMs);
    return base.filter((item) => {
      if (difficultyFilter !== 'all' && item.difficulty !== difficultyFilter) {
        return false;
      }
      if (
        searchQuery.trim() &&
        !item.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase()) &&
        !item.fastestWord.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [entries, activeTab, difficultyFilter, searchQuery, nowMs]);

  const filteredWordRecords = useMemo(() => {
    return rankHighestWpmByWord(wordRecords, difficultyFilter, searchQuery);
  }, [wordRecords, difficultyFilter, searchQuery]);

  // Overall fastest single word record across the entire arena
  const crownWordRecord = useMemo(() => {
    const allRanked = rankHighestWpmByWord(wordRecords, 'all', '');
    return allRanked[0] || null;
  }, [wordRecords]);

  if (!isOpen) return null;

  const handleChallengeWordString = (wordStr: string) => {
    const found =
      WORD_BANK.find((w) => w.word.toLowerCase() === wordStr.toLowerCase()) || WORD_BANK[0];
    onClose();
    onChallengeWord(found);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-[#45362B] bg-[#181310] text-[#FBF8F3] shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#332720] px-6 py-4">
          <div>
            <p className="text-xs font-medium text-[#D97706]">
              Food’s Spelling Bee · Official Global Standings
            </p>
            <h2
              id="leaderboard-modal-title"
              className="mt-0.5 font-serif text-2xl font-bold tracking-tight text-[#FBF8F3]"
            >
              Championship Leaderboards & Word WPM Records
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSignUp();
              }}
              className="rounded-lg border border-[#574334] bg-[#261E1A] px-3.5 py-2 text-xs font-medium text-[#FDE68A] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
            >
              Sign Up / Edit Handle
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Leaderboard Modal"
              className="rounded-lg border border-[#3B2E25] bg-[#261E1A] p-2 text-[#C8B9A6] hover:border-[#F59E0B] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* All-Time Highest WPM on What Word Spotlight Banner */}
        {crownWordRecord && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#332720] bg-[#211A15] px-6 py-3">
            <div className="text-xs text-[#C8B9A6]">
              <span>All-Time Highest WPM on a Single Word:</span>{' '}
              <strong className="font-mono text-sm font-bold tabular-nums text-[#F59E0B]">
                {crownWordRecord.wpm} WPM
              </strong>{' '}
              <span>on</span>{' '}
              <strong className="font-mono text-sm text-[#FBF8F3]">
                “{crownWordRecord.word}”
              </strong>{' '}
              <span>
                ({crownWordRecord.charCount} letters · {(crownWordRecord.durationMs / 1000).toFixed(2)}s)
              </span>{' '}
              <span>by</span>{' '}
              <strong className="text-[#FDE68A]">{crownWordRecord.displayName}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => voiceEngine.speakText(crownWordRecord.word)}
                className="flex items-center gap-1.5 rounded-md border border-[#45362B] bg-[#181310] px-2.5 py-1 text-xs font-medium text-[#E5D9C8] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Hear Word</span>
              </button>
              <button
                type="button"
                onClick={() => handleChallengeWordString(crownWordRecord.word)}
                className="flex items-center gap-1.5 rounded-md bg-[#D97706] px-2.5 py-1 text-xs font-semibold text-[#120E0C] hover:bg-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Challenge Record</span>
              </button>
            </div>
          </div>
        )}

        {/* Controls Bar: Timeframe Tabs + Difficulty & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#332720] px-6 py-3">
          <div
            className="flex flex-wrap items-center gap-1 rounded-lg bg-[#110D0B] p-1 border border-[#2D231C]"
            role="tablist"
            aria-label="Leaderboard Timeframes"
          >
            {TIMEFRAME_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#D97706] text-[#120E0C]'
                      : 'text-[#C8B9A6] hover:text-[#FBF8F3]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Leaderboard by Difficulty"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyTier | 'all')}
              className="rounded-lg border border-[#3B2E25] bg-[#110D0B] px-3 py-1.5 text-xs text-[#E5D9C8] focus:border-[#F59E0B] focus:outline-none"
            >
              <option value="all">All Difficulty Tiers</option>
              <option value="easy">Easy (4–6 Letters)</option>
              <option value="medium">Medium (7–10 Letters)</option>
              <option value="hard">Hard (11–15 Letters)</option>
              <option value="verylong">Very Long (16–45 Letters)</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8C7A6B] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search player or word"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player or word..."
                className="w-44 sm:w-52 rounded-lg border border-[#3B2E25] bg-[#110D0B] pl-8 pr-3 py-1.5 text-xs text-[#FBF8F3] placeholder-[#78685A] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab !== 'word_records' ? (
            filteredTimeframeEntries.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#A39281]">
                No runs recorded for this filter yet. Spell a round to claim the #1 spot!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#332720] text-[11px] font-semibold text-[#A39281]">
                      <th className="py-2.5 pr-3">Rank</th>
                      <th className="py-2.5 px-3">Player</th>
                      <th className="py-2.5 px-3 text-right">Avg WPM</th>
                      <th className="py-2.5 px-3 text-right">Highest Word WPM</th>
                      <th className="py-2.5 px-3">Fastest Word Spelled</th>
                      <th className="py-2.5 px-3 text-right">Accuracy</th>
                      <th className="py-2.5 pl-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#261E1A] text-sm">
                    {filteredTimeframeEntries.map((row, idx) => {
                      const isCurrentUser = row.userId === currentUserId;
                      return (
                        <tr
                          key={row.id}
                          className={`${
                            isCurrentUser ? 'bg-[#2B2118]' : 'hover:bg-[#1F1814]'
                          } transition-colors`}
                        >
                          <td className="py-3 pr-3 font-mono font-bold tabular-nums text-[#F59E0B]">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#FBF8F3]">
                              {row.displayName}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs font-normal text-[#F59E0B]">
                                  · You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#A39281]">
                              {row.titleBadge} · {row.wordsSpelled} words
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-base font-bold tabular-nums text-[#FBF8F3]">
                            {row.wpm} <span className="text-xs font-normal text-[#A39281]">WPM</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-base font-bold tabular-nums text-[#F59E0B]">
                            {row.peakWpm}{' '}
                            <span className="text-xs font-normal text-[#A39281]">WPM</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-[#FDE68A]">
                                {row.fastestWord}
                              </span>
                              <button
                                type="button"
                                onClick={() => voiceEngine.speakText(row.fastestWord)}
                                aria-label={`Listen to ${row.fastestWord}`}
                                className="rounded p-1 text-[#A39281] hover:bg-[#332720] hover:text-[#F59E0B] transition-colors"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-[#8C7A6B]">
                              {row.fastestWord.length} letters · {row.difficulty}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-[#E5D9C8]">
                            {row.accuracy}%
                          </td>
                          <td className="py-3 pl-3 text-right font-mono font-semibold tabular-nums text-[#FBF8F3]">
                            {row.score.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : filteredWordRecords.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#A39281]">
              No word WPM records recorded yet. Spell a round to set the first record!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#332720] text-[11px] font-semibold text-[#A39281]">
                    <th className="py-2.5 pr-3">Rank</th>
                    <th className="py-2.5 px-3">Word & Length</th>
                    <th className="py-2.5 px-3 text-right">Highest WPM</th>
                    <th className="py-2.5 px-3 text-right">Spell Time</th>
                    <th className="py-2.5 px-3">Record Holder</th>
                    <th className="py-2.5 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#261E1A] text-sm">
                  {filteredWordRecords.map((rec, idx) => (
                    <tr key={rec.word} className="hover:bg-[#1F1814] transition-colors">
                      <td className="py-3 pr-3 font-mono font-bold tabular-nums text-[#F59E0B]">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#FBF8F3]">
                            {rec.word}
                          </span>
                          <button
                            type="button"
                            onClick={() => voiceEngine.speakText(rec.word)}
                            aria-label={`Pronounce ${rec.word}`}
                            className="rounded p-1 text-[#A39281] hover:bg-[#332720] hover:text-[#F59E0B] transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-[#A39281]">
                          {rec.charCount} letters · {rec.difficulty} tier
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-base font-bold tabular-nums text-[#F59E0B]">
                        {rec.wpm} <span className="text-xs font-normal text-[#A39281]">WPM</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#E5D9C8]">
                        {(rec.durationMs / 1000).toFixed(2)}s
                      </td>
                      <td className="py-3 px-3 font-medium text-[#FDE68A]">{rec.displayName}</td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleChallengeWordString(rec.word)}
                          className="rounded-lg border border-[#574334] bg-[#261E1A] px-3 py-1.5 text-xs font-semibold text-[#FBF8F3] hover:border-[#F59E0B] hover:bg-[#D97706] hover:text-[#120E0C] transition-colors whitespace-nowrap"
                        >
                          Challenge Word
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
