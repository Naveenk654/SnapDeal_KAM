// ============================================================
// Low-Latency Speech Service — Browser-native STT + TTS
// Features: Instant Silence VAD Debounce, GC prevention, and snappy tempo
// ============================================================

/**
 * Speech-to-Text service with Voice Activity Silence Debounce.
 * Cuts out Chrome's 3-second wait for isFinal, triggering responses in ~650ms.
 */
export class SpeechToText {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private isStarting = false;
  private onInterimCallback: ((text: string) => void) | null = null;
  private onFinalCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private silenceTimer: any = null;
  private accumulatedText = "";
  private hasCommittedTurn = false;

  static isSupported(): boolean {
    return (
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    );
  }

  constructor() {
    this.createRecognitionInstance();
  }

  private createRecognitionInstance(): void {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn("Web Speech API not supported in this browser");
      return;
    }

    try {
      const instance = new SpeechRecognitionAPI();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = "en-IN";
      instance.maxAlternatives = 1;

      instance.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            const chunk = res[0].transcript.trim();
            if (chunk) {
              this.accumulatedText += (this.accumulatedText ? " " : "") + chunk;
            }
          } else {
            interimText += res[0].transcript;
          }
        }

        const fullSpokenText = (this.accumulatedText + " " + interimText).trim();
        if (fullSpokenText) {
          if (this.onInterimCallback) {
            this.onInterimCallback(fullSpokenText);
          }

          // Reset silence timer every time a new sound or word arrives
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
          }

          // Dynamic silence threshold:
          // Short confirmation words (<= 2 words like "yes", "no", "restart"): 900ms.
          // Sentences (3+ words): 1400ms to allow natural human breathing pauses!
          const wordCount = fullSpokenText.split(/\s+/).length;
          const silenceWaitMs = wordCount <= 2 ? 900 : 1400;

          this.silenceTimer = setTimeout(() => {
            if (this.hasCommittedTurn) return;
            const textToSend = (this.accumulatedText + " " + interimText).trim();
            if (textToSend) {
              console.log("⚡ VAD Complete Utterance Triggered:", textToSend);
              this.hasCommittedTurn = true;
              this.accumulatedText = "";
              this.stop();
              if (this.onFinalCallback) {
                this.onFinalCallback(textToSend);
              }
            }
          }, silenceWaitMs);
        }
      };

      instance.onerror = (event: Event & { error: string }) => {
        if (event.error === "no-speech") return;
        console.warn("STT warning:", event.error);
        if (event.error === "not-allowed") {
          this.isListening = false;
          if (this.onErrorCallback) {
            this.onErrorCallback("not-allowed");
          }
        }
      };

      instance.onend = () => {
        this.isListening = false;
        this.isStarting = false;
      };

      this.recognition = instance;
    } catch (e) {
      console.error("Failed to initialize SpeechRecognition:", e);
    }
  }

  start(
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (error: string) => void
  ): void {
    this.onInterimCallback = onInterim;
    this.onFinalCallback = onFinal;
    this.onErrorCallback = onError;
    this.hasCommittedTurn = false;
    this.accumulatedText = "";

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    if (!this.recognition) {
      this.createRecognitionInstance();
    }

    if (!this.recognition) {
      onError("Speech recognition not supported in this browser.");
      return;
    }

    if (this.isListening || this.isStarting) {
      return;
    }

    try {
      this.isStarting = true;
      this.recognition.start();
      this.isListening = true;
      this.isStarting = false;
      console.log("🎙️ Active Listening Started");
    } catch (err: any) {
      this.isStarting = false;
      if (err.name === "InvalidStateError") {
        this.isListening = true;
      } else {
        console.warn("Re-instantiating recognition:", err);
        this.createRecognitionInstance();
      }
    }
  }

  stop(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.accumulatedText = "";
    this.isListening = false;
    this.isStarting = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        try {
          this.recognition.stop();
        } catch {}
      }
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

/**
 * Text-to-Speech service with natural energetic tempo (rate: 1.12)
 * Eliminates garbage collection and safety freezes
 */
export class TextToSpeech {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private isSpeaking = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private safetyTimer: any = null;
  private currentResolve: (() => void) | null = null;

  static isSupported(): boolean {
    return "speechSynthesis" in window;
  }

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    const preferred =
      voices.find(
        (v) =>
          (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Neerja") || v.name.includes("Zira")) &&
          v.lang.startsWith("en")
      ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];

    if (preferred) {
      this.voice = preferred;
    }
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      // Cleanly stop and unblock any previous utterance first
      this.stop();

      const cleanText = text.replace(/[*#_~`]/g, "").trim();
      if (!cleanText) {
        resolve();
        return;
      }

      this.currentResolve = resolve;
      this.isSpeaking = true;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.activeUtterance = utterance;

      if (!this.voice) {
        this.loadVoices();
      }
      if (this.voice) {
        utterance.voice = this.voice;
      }

      utterance.rate = 1.12; // Natural, lively conversational cadence
      utterance.pitch = 1.0;

      // Timeout safety valve
      const wordCount = cleanText.split(/\s+/).length;
      const maxDurationMs = Math.max(3000, (wordCount / 2.5) * 1000 + 1500);

      const finish = () => {
        if (this.safetyTimer) {
          clearTimeout(this.safetyTimer);
          this.safetyTimer = null;
        }
        this.isSpeaking = false;
        this.activeUtterance = null;
        const res = this.currentResolve;
        this.currentResolve = null;
        if (res) {
          res();
        }
      };

      this.safetyTimer = setTimeout(finish, maxDurationMs);

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        finish();
      };

      utterance.onerror = () => {
        finish();
      };

      try {
        this.synth.speak(utterance);
        // Chromium fix: resume if paused in idle
        if (this.synth.paused) {
          this.synth.resume();
        }
      } catch (e) {
        console.error("Synth speak error:", e);
        finish();
      }
    });
  }

  stop(): void {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    this.isSpeaking = false;

    if (this.activeUtterance) {
      try {
        this.activeUtterance.volume = 0;
      } catch {}
      this.activeUtterance.onstart = null;
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }

    if (this.synth) {
      try {
        this.synth.pause();
        this.synth.cancel();
        // Chromium engine bug fix: calling resume clears stuck speech queue
        this.synth.resume();
      } catch (e) {
        console.warn("Error stopping speech synthesis:", e);
      }
    }

    // Immediately resolve any pending speak() promise so awaiting callers unblock instantly
    const res = this.currentResolve;
    this.currentResolve = null;
    if (res) {
      res();
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /** Play a subtle, pleasant 2-tone connection chime on call start */
  playConnectChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }
}
