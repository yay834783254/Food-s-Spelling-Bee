import React, { useState } from 'react';
import { X, Volume2, Play } from 'lucide-react';
import { WORD_BANK, SpellingWord, DifficultyTier, DIFFICULTY_META } from '../game/wordBank';
import { WordSpeedRecord } from '../game/spellingLogic';
import { voiceEngine } from '../game/voiceEngine';

interface WordCompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordRecords: WordSpeedRecord[];
  onSelectWordToSpell: (word: SpellingWord) => void;
}

export const WordCompendiumModal: React.FC<WordCompendiumModalProps> = ({
  isOpen,
  onClose,
  wordRecords,
  onSelectWordToSpell
}) => {
  const [selectedTier, setSelectedTier] = useState<DifficultyTier | 'all'>('all');

  if (!isOpen) return null;

  const filteredWords = WORD_BANK.filter(
    (w) => selectedTier === 'all' || w.difficulty === selectedTier
  );

  const getRecordForWord = (wordStr: string): WordSpeedRecord | undefined =>
    wordRecords.find((r) => r.word.toLowerCase() === wordStr.toLowerCase());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compendium-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-[#45362B] bg-[#181310] text-[#FBF8F3] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#332720] px-6 py-4">
          <div>
            <p className="text-xs font-medium text-[#D97706]">
              Official Pronouncer Dictionary · Easy (4 Letters) to Very Long (45 Letters)
            </p>
            <h2
              id="compendium-modal-title"
              className="mt-0.5 font-serif text-2xl font-bold tracking-tight text-[#FBF8F3]"
            >
              Word Compendium & Audio Pronunciation Studio
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Word Compendium"
            className="rounded-lg border border-[#3B2E25] bg-[#261E1A] p-2 text-[#C8B9A6] hover:border-[#F59E0B] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[#332720] px-6 py-3">
          {(['all', 'easy', 'medium', 'hard', 'verylong'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedTier === tier
                  ? 'bg-[#D97706] text-[#120E0C]'
                  : 'border border-[#3B2E25] bg-[#211A15] text-[#C8B9A6] hover:text-white'
              }`}
            >
              {tier === 'all'
                ? `All Words (${WORD_BANK.length})`
                : `${DIFFICULTY_META[tier].label} · ${DIFFICULTY_META[tier].rangeLabel}`}
            </button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-6 md:grid-cols-2">
          {filteredWords.map((item) => {
            const record = getRecordForWord(item.word);
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-[#332720] bg-[#1F1814] p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-mono text-base font-bold text-[#FBF8F3] break-all">
                        {item.word}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#A39281]">
                        {DIFFICULTY_META[item.difficulty].label} · {item.word.length} letters ·{' '}
                        {item.origin} · {item.phonetic}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        voiceEngine.pronounceWord(item.word, 'normal', {
                          partOfSpeech: item.partOfSpeech,
                          origin: item.origin,
                          definition: item.definition,
                          sentence: item.sentence,
                          syllables: item.syllables
                        })
                      }
                      aria-label={`Hear ${item.word}`}
                      className="flex items-center gap-1 rounded-lg border border-[#45362B] bg-[#14100E] px-2.5 py-1.5 text-xs font-medium text-[#FDE68A] hover:border-[#F59E0B] transition-colors shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Speak</span>
                    </button>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#D8CBB8]">{item.definition}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#2D231C] pt-3">
                  <div className="text-xs text-[#A39281] tabular-nums">
                    {record ? (
                      <>
                        Record: <strong className="text-[#F59E0B]">{record.wpm} WPM</strong> by{' '}
                        <span className="text-[#E5D9C8]">{record.displayName}</span>
                      </>
                    ) : (
                      <span>No speed record claimed yet</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectWordToSpell(item);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-[#D97706] px-3 py-1.5 text-xs font-semibold text-[#120E0C] hover:bg-[#F59E0B] transition-colors whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Spell This Word</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
