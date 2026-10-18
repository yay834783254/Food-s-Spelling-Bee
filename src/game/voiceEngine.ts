// Web Speech API + Web Audio API Sound & Pronouncer Engine for Food's Spelling Bee

class VoiceAndSoundEngine {
  private audioCtx: AudioContext | null = null;
  private muted = false;
  private preferredVoiceURI: string | null = null;
  private defaultRate = 0.92;
  private onSpeakingChangeCallbacks = new Set<(speaking: boolean, label: string) => void>();

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.notifySpeaking(false, '');
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setRate(rate: number) {
    this.defaultRate = Math.max(0.55, Math.min(1.4, rate));
  }

  public getRate(): number {
    return this.defaultRate;
  }

  public setPreferredVoice(uri: string) {
    this.preferredVoiceURI = uri;
  }

  public getPreferredVoice(): string | null {
    return this.preferredVoiceURI;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return englishVoices.length > 0 ? englishVoices : voices;
  }

  public subscribeSpeaking(cb: (speaking: boolean, label: string) => void): () => void {
    this.onSpeakingChangeCallbacks.add(cb);
    return () => {
      this.onSpeakingChangeCallbacks.delete(cb);
    };
  }

  private notifySpeaking(speaking: boolean, label: string) {
    for (const cb of this.onSpeakingChangeCallbacks) {
      cb(speaking, label);
    }
  }

  public speakText(text: string, options?: { rate?: number; pitch?: number; label?: string }) {
    if (this.muted) return;

    // Play a subtle acoustic pronouncer bell cue so sound is always audible even before speech starts
    this.playPronouncerBell();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.notifySpeaking(true, options?.label || 'Pronouncing word');
      setTimeout(() => this.notifySpeaking(false, ''), 900);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = this.getAvailableVoices();

      if (this.preferredVoiceURI) {
        const match = voices.find((v) => v.voiceURI === this.preferredVoiceURI);
        if (match) utterance.voice = match;
      } else if (voices.length > 0) {
        // Prefer high-clarity natural English voices
        const preferred =
          voices.find((v) => /natural|google|samantha|daniel|premium/i.test(v.name)) || voices[0];
        utterance.voice = preferred;
      }

      utterance.rate = options?.rate ?? this.defaultRate;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = 1.0;

      const label = options?.label || 'Speaking word';
      this.notifySpeaking(true, label);

      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          this.notifySpeaking(false, '');
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
      // Safety fallback in case headless browser does not fire onend
      setTimeout(finish, Math.max(1400, text.length * 85));
    } catch {
      this.notifySpeaking(false, '');
    }
  }

  public pronounceWord(word: string, mode: 'normal' | 'slow' | 'full_card', details?: {
    partOfSpeech: string;
    origin: string;
    definition: string;
    sentence: string;
    syllables: string;
  }) {
    if (mode === 'slow') {
      const spaced = details?.syllables ? details.syllables.replace(/-/g, ' ... ') : word;
      this.speakText(`${word}. Slowly: ${spaced}.`, {
        rate: 0.62,
        pitch: 0.98,
        label: `Slow Pronunciation · 0.62x`
      });
      return;
    }

    if (mode === 'full_card' && details) {
      const filledSentence = details.sentence.replace('[ _____ ]', word);
      this.speakText(
        `${word}. Part of speech: ${details.partOfSpeech}. Language of origin: ${details.origin}. Definition: ${details.definition} Used in a sentence: ${filledSentence}`,
        {
          rate: this.defaultRate,
          label: 'Reading Official Pronouncer Card'
        }
      );
      return;
    }

    this.speakText(word, {
      rate: this.defaultRate,
      label: 'Pronouncing Target Word'
    });
  }

  public playPronouncerBell() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5 warm stage bell
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.29);
  }

  public playKeystroke(isCorrect: boolean, charIndex: number) {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isCorrect) {
      osc.type = 'triangle';
      const baseFreq = 320 + Math.min(charIndex * 14, 420);
      osc.frequency.setValueAtTime(baseFreq, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(155, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.11);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    }
  }

  public playWordSuccess() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.27);
    });
  }

  public playRunVictory() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }
}

export const voiceEngine = new VoiceAndSoundEngine();
