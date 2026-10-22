/**
 * Centralised game audio. Browser-only; every method is a safe no-op on the
 * server, before the first user gesture, or when sound is disabled.
 *
 * - The AudioContext is created lazily on the first pointer/keyboard gesture,
 *   so nothing can play on page load.
 * - Sample files are fetched once and decoded once, then reused.
 * - Each sound has a minimum retrigger interval so rapid hovers never stack.
 * - Background music is generated (no files) and stays off until opted in.
 */

export type SoundName =
  | "hover"
  | "click"
  | "back"
  | "select"
  | "navigate"
  | "enter"
  | "success"
  | "achievement"
  | "error"
  | "type";

const SOUND_FILES: Record<SoundName, string> = {
  hover: "/audio/hover.wav",
  click: "/audio/click.wav",
  back: "/audio/back.wav",
  select: "/audio/select.wav",
  navigate: "/audio/navigate.wav",
  enter: "/audio/enter.wav",
  success: "/audio/success.wav",
  achievement: "/audio/achievement.wav",
  error: "/audio/error.wav",
  type: "/audio/type.wav",
};

const MIN_INTERVAL_MS: Partial<Record<SoundName, number>> = {
  hover: 70,
  type: 40,
  select: 50,
  click: 40,
};

const SOUND_GAIN: Partial<Record<SoundName, number>> = {
  hover: 0.35,
  type: 0.3,
  navigate: 0.5,
};

// Pentatonic notes (Hz) for the generative ambient score.
const SCALE = [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private raw = new Map<SoundName, Promise<ArrayBuffer | null>>();
  private buffers = new Map<SoundName, AudioBuffer | null>();
  private lastPlayed = new Map<SoundName, number>();
  private unlockBound = false;
  private musicTimer: number | null = null;
  private musicNodes: AudioNode[] = [];

  enabled = true;
  volume = 0.7;
  musicEnabled = false;
  musicVolume = 0.5;

  /** Start fetching sample bytes (no decoding, no AudioContext). */
  preload(names: SoundName[] = Object.keys(SOUND_FILES) as SoundName[]): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    return Promise.all(names.map((n) => this.fetchRaw(n))).then(() => undefined);
  }

  private fetchRaw(name: SoundName) {
    let p = this.raw.get(name);
    if (!p) {
      p = fetch(SOUND_FILES[name])
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .catch(() => null);
      this.raw.set(name, p);
    }
    return p;
  }

  /** Attach one-time gesture listeners that create/resume the AudioContext. */
  bindUnlock() {
    if (this.unlockBound || typeof window === "undefined") return;
    this.unlockBound = true;
    const unlock = () => {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const ready = () => {
        window.removeEventListener("pointerdown", unlock, true);
        window.removeEventListener("keydown", unlock, true);
        if (this.musicEnabled) this.startMusic();
      };
      if (ctx.state === "running") ready();
      else void ctx.resume().then(() => ctx.state === "running" && ready()).catch(() => undefined);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      return null;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.musicVolume * 0.6;
    this.musicBus.connect(this.master);
    return this.ctx;
  }

  private async getBuffer(name: SoundName): Promise<AudioBuffer | null> {
    if (this.buffers.has(name)) return this.buffers.get(name) ?? null;
    const ctx = this.ctx;
    if (!ctx) return null;
    const bytes = await this.fetchRaw(name);
    if (!bytes) {
      this.buffers.set(name, null);
      return null;
    }
    try {
      // decodeAudioData detaches the buffer; decode a copy so retries still work
      const buf = await ctx.decodeAudioData(bytes.slice(0));
      this.buffers.set(name, buf);
      return buf;
    } catch {
      this.buffers.set(name, null);
      return null;
    }
  }

  play(name: SoundName, opts: { pitch?: number } = {}) {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || !this.sfxBus) return;
    const now = performance.now();
    const min = MIN_INTERVAL_MS[name] ?? 30;
    if (now - (this.lastPlayed.get(name) ?? -Infinity) < min) return;
    this.lastPlayed.set(name, now);
    void this.getBuffer(name).then((buf) => {
      if (!buf || !this.sfxBus || !this.ctx) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opts.pitch ?? 1;
      const gain = this.ctx.createGain();
      gain.gain.value = SOUND_GAIN[name] ?? 1;
      src.connect(gain).connect(this.sfxBus);
      src.start();
    });
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  setMusic(on: boolean, volume: number) {
    this.musicVolume = volume;
    if (this.musicBus && this.ctx)
      this.musicBus.gain.setTargetAtTime(volume * 0.6, this.ctx.currentTime, 0.1);
    if (on === this.musicEnabled) return;
    this.musicEnabled = on;
    if (on) this.startMusic();
    else this.stopMusic();
  }

  private startMusic() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || this.musicTimer !== null) return;
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.42;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2200;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(this.musicBus!);
    lp.connect(this.musicBus!);
    lp.connect(delay);
    this.musicNodes = [delay, feedback, wet, lp];

    const note = (freq: number, when: number, len: number, vel: number) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc2.type = "triangle";
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 2;
      const g2 = ctx.createGain();
      g2.gain.value = 0.18;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(vel, when + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, when + len);
      osc.connect(g);
      osc2.connect(g2).connect(g);
      g.connect(lp);
      osc.start(when);
      osc2.start(when);
      osc.stop(when + len + 0.05);
      osc2.stop(when + len + 0.05);
    };

    let step = 0;
    const tick = () => {
      if (!this.ctx || !this.musicEnabled) return;
      const t = this.ctx.currentTime + 0.05;
      const i = Math.floor(Math.random() * (SCALE.length - 3)) + 2;
      note(SCALE[i], t, 3.2, 0.12);
      if (Math.random() < 0.45) note(SCALE[i - 2], t + 0.01, 3.6, 0.07);
      if (step % 4 === 0) note(SCALE[Math.floor(Math.random() * 3)] / 2, t, 5, 0.09);
      step++;
      this.musicTimer = window.setTimeout(tick, 1300 + Math.random() * 2400);
    };
    this.musicTimer = window.setTimeout(tick, 400);
  }

  private stopMusic() {
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    for (const n of this.musicNodes) n.disconnect();
    this.musicNodes = [];
  }
}

export const gameAudio = new GameAudio();
