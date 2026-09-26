import { HowlerMusicBackend } from './HowlerMusicBackend';
import { ZzfxSfxBackend } from './ZzfxSfxBackend';
import { AUDIO_CUE_DEFINITIONS, type AudioCue } from '../content/audio/AudioCueDefinitions';

export type { AudioCue } from '../content/audio/AudioCueDefinitions';

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

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Presentation-side audio facade. Gameplay only knows this contract; Howler
 * owns background playback and the ZzFX-compatible backend owns short SFX.
 * No AudioContext is created until unlock() is called from a user gesture.
 */
export class AudioManager implements AudioService {
  private settings: AudioSettings = { musicVolume: 1, sfxVolume: 1, muted: false };
  private readonly music = new HowlerMusicBackend();
  private sfx: ZzfxSfxBackend | null = null;
  private unlocked = false;
  private lifecyclePaused = false;
  // Music begins only when Game activates a run, never while browsing the menu.
  private musicRequested = false;
  private unlockPromise: Promise<void> | null = null;
  private shutdownRequested = false;

  public configure(settings: AudioSettings): void {
    this.settings = {
      musicVolume: clamp(settings.musicVolume),
      sfxVolume: clamp(settings.sfxVolume),
      muted: settings.muted
    };
    this.applySettings();
  }

  public unlock(): Promise<void> {
    if (this.shutdownRequested) return Promise.resolve();
    if (this.unlocked) {
      // A click in the pause panel may unlock UI SFX, but must not resume the
      // gameplay bus or music until the user explicitly resumes the run.
      if (!this.lifecyclePaused) this.resume();
      return Promise.resolve();
    }
    if (this.unlockPromise) return this.unlockPromise;
    this.unlockPromise = this.unlockFromGesture().finally(() => { this.unlockPromise = null; });
    return this.unlockPromise;
  }

  private async unlockFromGesture(): Promise<void> {
    try {
      const context = await this.music.unlock();
      if (this.shutdownRequested) return;
      this.sfx = context ? new ZzfxSfxBackend(context) : null;
      if (this.lifecyclePaused) this.sfx?.pause();
      this.unlocked = true;
      this.applySettings();
      if (this.musicRequested && !this.lifecyclePaused) this.music.play();
    } catch {
      // Audio is optional. A platform rejection must never block gameplay.
      this.unlocked = false;
    }
  }

  public pause(): void {
    this.lifecyclePaused = true;
    this.music.pause();
    this.sfx?.pause();
  }

  public resume(): void {
    this.lifecyclePaused = false;
    this.sfx?.resume();
    if (this.unlocked && this.musicRequested) this.music.play();
  }

  public startMusic(): void {
    this.musicRequested = true;
    if (this.unlocked && !this.lifecyclePaused) this.music.play();
  }

  public stopMusic(): void {
    this.musicRequested = false;
    this.music.stop();
  }

  public playCue(cue: AudioCue): void {
    const definition = AUDIO_CUE_DEFINITIONS[cue];
    if (!this.unlocked || (this.lifecyclePaused && definition.category !== 'ui')
      || this.settings.muted || this.settings.sfxVolume <= 0) return;
    this.sfx?.play(cue);
  }

  public shutdown(): void {
    this.shutdownRequested = true;
    this.musicRequested = false;
    this.lifecyclePaused = false;
    this.sfx?.shutdown();
    this.sfx = null;
    this.music.shutdown();
    this.unlocked = false;
  }

  private applySettings(): void {
    this.music.configure(this.settings.muted ? 0 : this.settings.musicVolume);
    this.sfx?.configure(this.settings.muted ? 0 : this.settings.sfxVolume);
  }
}

/** @deprecated Kept as a compatibility name while platform adapters migrate. */
export class WebAudioService extends AudioManager {}
