// A tiny, self-contained ambient music generator built on the Web Audio API.
// No audio files to ship — the whole soundtrack is synthesized in the browser,
// so it works offline, adds zero bytes to the bundle, and has no licensing worries.
//
// It layers a slow, evolving chord pad through a moving low-pass filter with a
// gentle feedback delay for space, and sprinkles soft pentatonic bell notes on
// top so the result always sounds consonant and calm.

type Ctx = AudioContext;

// Frequencies (Hz) — a warm, lush progression: Fmaj7 → Am7 → Dm7 → G7
const CHORDS: number[][] = [
  [174.61, 220.0, 261.63, 329.63], // F3  A3  C4  E4
  [220.0, 261.63, 329.63, 392.0], // A3  C4  E4  G4
  [146.83, 174.61, 220.0, 261.63], // D3  F3  A3  C4
  [196.0, 246.94, 293.66, 349.23], // G3  B3  D4  F4
];

// A minor pentatonic across two octaves — any note here sounds sweet over the pad.
const ARP_SCALE = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

export class AmbientEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private chordTimer: ReturnType<typeof setInterval> | null = null;
  private arpTimer: ReturnType<typeof setInterval> | null = null;
  private chordIndex = 0;
  private arpIndex = 0;
  private started = false;
  private muted = false;
  private targetVol = 0.16;

  get isStarted() {
    return this.started;
  }
  get isMuted() {
    return this.muted;
  }

  /** Must be called from a user gesture (autoplay policy). Safe to call twice. */
  async start(): Promise<void> {
    if (this.started) {
      await this.ctx?.resume();
      return;
    }
    const AC =
      typeof window !== "undefined"
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!AC) return;

    const ctx = new AC();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    // Feedback delay → a soft sense of space without shipping an impulse response.
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.45;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    master.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(ctx.destination);

    this.master = master;

    const now = ctx.currentTime;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(this.muted ? 0.0001 : this.targetVol, now + 4);

    this.started = true;

    const chordDurMs = 8000;
    const playNextChord = () => {
      if (!this.ctx) return;
      this.playChord(CHORDS[this.chordIndex % CHORDS.length], this.ctx.currentTime + 0.1, chordDurMs / 1000);
      this.chordIndex++;
    };
    playNextChord();
    this.chordTimer = setInterval(playNextChord, chordDurMs);

    const playNextArp = () => {
      if (!this.ctx || !this.master) return;
      // Wander through the scale so it never sounds mechanical.
      this.arpIndex = (this.arpIndex + (Math.random() < 0.5 ? 1 : 2)) % ARP_SCALE.length;
      this.playBell(ARP_SCALE[this.arpIndex], this.ctx.currentTime + 0.05);
    };
    this.arpTimer = setInterval(playNextArp, 1650);
  }

  private playChord(freqs: number[], time: number, dur: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.9, time + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 6;
    filter.frequency.setValueAtTime(480, time);
    filter.frequency.linearRampToValueAtTime(1500, time + dur * 0.5);
    filter.frequency.linearRampToValueAtTime(560, time + dur);

    g.connect(filter);
    filter.connect(master);

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = Math.random() * 8 - 4; // subtle chorus-like shimmer
      const og = ctx.createGain();
      og.gain.value = (0.22 / freqs.length) * (i === 0 ? 1.5 : 1);
      osc.connect(og);
      og.connect(g);
      osc.start(time);
      osc.stop(time + dur + 0.2);
    });
  }

  private playBell(freq: number, time: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.16, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);
    osc.connect(g);
    g.connect(master);
    osc.start(time);
    osc.stop(time + 2);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : this.targetVol, now + 0.6);
  }

  stop() {
    if (this.chordTimer) clearInterval(this.chordTimer);
    if (this.arpTimer) clearInterval(this.arpTimer);
    this.chordTimer = null;
    this.arpTimer = null;
    this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.started = false;
  }
}

// Single shared instance so navigation between routes keeps one continuous track.
let engine: AmbientEngine | null = null;
export function getAmbientEngine(): AmbientEngine {
  if (!engine) engine = new AmbientEngine();
  return engine;
}
