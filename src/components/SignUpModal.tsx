import React, { useState } from 'react';
import { X, LogIn, LogOut, Check, AlertCircle } from 'lucide-react';
import { TITLE_BADGES } from '../game/seedData';

export interface ChallengerProfile {
  userId: string;
  displayName: string;
  titleBadge: string;
  isGoogleLinked: boolean;
  email?: string | null;
  bestWpm: number;
  bestWord: string;
  totalWordsSpelled: number;
  totalScore: number;
}

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ChallengerProfile;
  onSaveProfile: (displayName: string, titleBadge: string) => void;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const SignUpModal: React.FC<SignUpModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onGoogleSignIn,
  onSignOut
}) => {
  const [handleInput, setHandleInput] = useState(
    profile.displayName === 'Guest Speller' ? '' : profile.displayName
  );
  const [selectedBadge, setSelectedBadge] = useState(profile.titleBadge || TITLE_BADGES[0]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busyGoogle, setBusyGoogle] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = handleInput.trim();
    if (cleaned.length < 2) {
      setValidationError('Please enter a challenger handle of at least 2 characters.');
      return;
    }
    if (cleaned.length > 40) {
      setValidationError('Challenger handle must be 40 characters or fewer.');
      return;
    }
    setValidationError(null);
    onSaveProfile(cleaned, selectedBadge);
    setStatusMessage('Challenger account saved and active for leaderboard submissions.');
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 550);
  };

  const handleGoogleClick = async () => {
    setValidationError(null);
    setBusyGoogle(true);
    try {
      await onGoogleSignIn();
      setStatusMessage('Google account connected to Food’s Spelling Bee.');
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? `Google Sign-In popup could not complete: ${err.message}. You can still register your Challenger Handle below.`
          : 'Google Sign-In was cancelled.'
      );
    } finally {
      setBusyGoogle(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#45362B] bg-[#1C1613] p-6 text-[#FBF8F3] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#332720] pb-4">
          <div>
            <p className="text-xs font-medium text-[#D97706]">
              Challenger Registration · Global Leaderboard Identity
            </p>
            <h2
              id="signup-modal-title"
              className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#FBF8F3]"
            >
              Sign Up for Food’s Spelling Bee
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sign Up Modal"
            className="rounded-lg border border-[#3B2E25] bg-[#261E1A] p-2 text-[#C8B9A6] hover:border-[#F59E0B] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="challenger-handle-input"
              className="block text-sm font-medium text-[#E5D9C8]"
            >
              Challenger Display Name
            </label>
            <p className="mt-0.5 text-xs text-[#A39281]">
              Displayed on Today, This Week, This Month, This Year, All Time, and Word WPM records.
            </p>
            <input
              id="challenger-handle-input"
              type="text"
              value={handleInput}
              onChange={(e) => {
                setHandleInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Chef Aurelia or SaffronBlitz"
              maxLength={40}
              className="mt-2 w-full rounded-lg border border-[#4A3A2E] bg-[#120E0C] px-4 py-2.5 text-base text-[#FBF8F3] placeholder-[#6E5D4F] focus:border-[#F59E0B] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="challenger-badge-select"
              className="block text-sm font-medium text-[#E5D9C8]"
            >
              Culinary-Lexical Title
            </label>
            <select
              id="challenger-badge-select"
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[#4A3A2E] bg-[#120E0C] px-4 py-2.5 text-sm text-[#FBF8F3] focus:border-[#F59E0B] focus:outline-none"
            >
              {TITLE_BADGES.map((badge) => (
                <option key={badge} value={badge}>
                  {badge}
                </option>
              ))}
            </select>
          </div>

          {validationError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-[#991B1B] bg-[#2D1212] p-3 text-xs text-[#FCA5A5]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
              <span>{validationError}</span>
            </div>
          )}

          {statusMessage && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-[#065F46] bg-[#0F291E] p-3 text-xs text-[#A7F3D0]"
            >
              <Check className="w-4 h-4 shrink-0 text-[#10B981]" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#D97706] px-5 py-2.5 text-sm font-semibold text-[#120E0C] hover:bg-[#F59E0B] transition-colors whitespace-nowrap"
            >
              Complete Sign Up
            </button>

            {!profile.isGoogleLinked ? (
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={busyGoogle}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#4A3A2E] bg-[#261E1A] px-4 py-2.5 text-sm font-medium text-[#FBF8F3] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 text-[#F59E0B]" />
                <span>{busyGoogle ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#4A3A2E] bg-[#261E1A] px-4 py-2.5 text-sm font-medium text-[#E5D9C8] hover:border-[#EF4444] hover:text-white transition-colors whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({profile.email || 'Google'})</span>
              </button>
            )}
          </div>
        </form>

        {/* Career Summary Strip */}
        <div className="mt-6 border-t border-[#332720] pt-4">
          <p className="text-xs text-[#A39281]">
            Active Challenger: <strong className="text-[#FBF8F3]">{profile.displayName}</strong> ·{' '}
            <span>{profile.titleBadge}</span>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-[#332720] bg-[#14100E] p-2.5">
              <div className="font-mono text-lg font-bold tabular-nums text-[#F59E0B]">
                {profile.bestWpm}
              </div>
              <div className="text-[11px] text-[#A39281]">Peak Word WPM</div>
            </div>
            <div className="rounded-lg border border-[#332720] bg-[#14100E] p-2.5">
              <div className="font-mono text-lg font-bold tabular-nums text-[#FBF8F3]">
                {profile.totalWordsSpelled}
              </div>
              <div className="text-[11px] text-[#A39281]">Words Spelled</div>
            </div>
            <div className="rounded-lg border border-[#332720] bg-[#14100E] p-2.5">
              <div className="truncate font-mono text-sm font-semibold text-[#FDE68A]">
                {profile.bestWord || '—'}
              </div>
              <div className="text-[11px] text-[#A39281]">Fastest Word</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
