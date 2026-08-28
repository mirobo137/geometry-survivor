export type AudioCue = 'damage' | 'level-up' | 'boss-defeated';

export interface AudioSettings {
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly muted: boolean;
}

export interface AudioService {
  configure(settings: AudioSettings): void;
  unlock(): Promise<void>;
  pause(): void;
  resume(): void;
  startMusic(): void;
  stopMusic(): void;
  playCue(cue: AudioCue): void;
  shutdown(): void;
}

interface AudioContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const MUSIC_NOTES = [220, 277.18, 329.63, 277.18, 196, 246.94, 293.66, 246.94] as const;
const MUSIC_STEP_SECONDS = 0.625;
const MUSIC_LOOP_SECONDS = MUSIC_NOTES.length * MUSIC_STEP_SECONDS;

const CUE_NOTES: Record<AudioCue, readonly number[]> = {
  damage: [150],
  'level-up': [440, 554.37, 659.25],
  'boss-defeated': [261.63, 329.63, 392, 523.25]
};

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

const getAudioContextConstructor = (): typeof AudioContext | undefined => {
  if (typeof window === 'undefined') return undefined;
  const audioWindow = window as AudioContextWindow;
  return window.AudioContext ?? audioWindow.webkitAudioContext;
};

const createTone = (
  context: AudioContext,
  destination: AudioNode,
  when: number,
  frequency: number,
  peak: number,
  duration: number
): void => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.01);
};

/** Browser Web Audio adapter. It creates no context until the user interacts. */
export class WebAudioService implements AudioService {
  private settings: AudioSettings = { musicVolume: 1, sfxVolume: 1, muted: false };
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicActive = false;
  private lifecyclePaused = false;
  private graphConnected = false;

  public configure(settings: AudioSettings): void {
    this.settings = {
      musicVolume: clamp(settings.musicVolume),
      sfxVolume: clamp(settings.sfxVolume),
      muted: settings.muted
    };
    this.applyGains();
  }

  public async unlock(): Promise<void> {
    const context = this.ensureGraph();
    if (!context) return;
    try {
      await context.resume();
    } catch {
      return;
    }
    if (context.state === 'running') this.startMusic();
  }

  public pause(): void {
    this.lifecyclePaused = true;
    this.clearMusicTimer();
    this.silence(this.musicBus);
    if (this.context?.state === 'running') {
      void this.context.suspend().catch(() => undefined);
    }
  }

  public resume(): void {
    this.lifecyclePaused = false;
    const context = this.context;
    if (!context) return;
    void context.resume().then(() => {
      if (!this.lifecyclePaused && this.musicActive && context.state === 'running') {
        this.applyGains();
        this.scheduleMusicLoop();
      }
    }).catch(() => undefined);
  }

  public startMusic(): void {
    if (!this.context || this.lifecyclePaused || this.context.state !== 'running') return;
    this.musicActive = true;
    this.applyGains();
    this.scheduleMusicLoop();
  }

  public stopMusic(): void {
    this.musicActive = false;
    this.clearMusicTimer();
    this.silence(this.musicBus);
  }

  public playCue(cue: AudioCue): void {
    if (!this.context || !this.sfxBus || this.lifecyclePaused || this.settings.muted) return;
    if (this.context.state !== 'running' || this.settings.sfxVolume <= 0) return;
    const start = this.context.currentTime + 0.01;
    const notes = CUE_NOTES[cue];
    notes.forEach((frequency, index) => {
      createTone(this.context!, this.sfxBus!, start + index * 0.07, frequency, 0.18, 0.14);
    });
  }

  public shutdown(): void {
    this.stopMusic();
    const context = this.context;
    this.context = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.lifecyclePaused = false;
    this.graphConnected = false;
    if (context) void context.close().catch(() => undefined);
  }

  private ensureGraph(): AudioContext | null {
    try {
      const AudioContextConstructor = getAudioContextConstructor();
      if (!AudioContextConstructor) return null;
      this.context ??= new AudioContextConstructor();
      this.master ??= this.context.createGain();
      this.musicBus ??= this.context.createGain();
      this.sfxBus ??= this.context.createGain();
      if (!this.graphConnected) {
        this.musicBus.connect(this.master);
        this.sfxBus.connect(this.master);
        this.master.connect(this.context.destination);
        this.graphConnected = true;
      }
      this.applyGains();
      return this.context;
    } catch {
      // Web Audio is an optional enhancement. Some browsers expose the
      // constructor but reject it (permissions, private mode, resource
      // limits); audio must never turn the first input into an unhandled
      // rejection or prevent gameplay from starting.
      this.shutdown();
      return null;
    }
  }

  private applyGains(): void {
    if (!this.context || !this.master || !this.musicBus || !this.sfxBus) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.settings.muted ? 0 : 0.65, now, 0.01);
    this.musicBus.gain.setTargetAtTime(
      this.musicActive && !this.lifecyclePaused ? this.settings.musicVolume * 0.4 : 0,
      now,
      0.01
    );
    this.sfxBus.gain.setTargetAtTime(this.settings.sfxVolume * 0.6, now, 0.01);
  }

  private scheduleMusicLoop(): void {
    if (!this.context || !this.musicBus || !this.musicActive || this.lifecyclePaused) return;
    this.clearMusicTimer();
    const start = this.context.currentTime + 0.05;
    MUSIC_NOTES.forEach((frequency, index) => {
      createTone(this.context!, this.musicBus!, start + index * MUSIC_STEP_SECONDS, frequency, 0.16, 0.48);
    });
    this.musicTimer = window.setTimeout(() => this.scheduleMusicLoop(), MUSIC_LOOP_SECONDS * 1000 - 80);
  }

  private clearMusicTimer(): void {
    if (this.musicTimer === null) return;
    window.clearTimeout(this.musicTimer);
    this.musicTimer = null;
  }

  private silence(bus: GainNode | null): void {
    if (!bus || !this.context) return;
    bus.gain.setTargetAtTime(0, this.context.currentTime, 0.01);
  }
}
