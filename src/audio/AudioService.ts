import { HowlerMusicBackend } from './HowlerMusicBackend';
import { ZzfxSfxBackend } from './ZzfxSfxBackend';
import { type AudioCue } from '../content/audio/AudioCueDefinitions';

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
  // A new run begins with music desired; stopMusic() disables it only at run end.
  private musicRequested = true;

  public configure(settings: AudioSettings): void {
    this.settings = {
      musicVolume: clamp(settings.musicVolume),
      sfxVolume: clamp(settings.sfxVolume),
      muted: settings.muted
    };
    this.applySettings();
  }

  public async unlock(): Promise<void> {
    if (this.unlocked) {
      this.resume();
      return;
    }
    try {
      const context = await this.music.unlock();
      this.sfx = context ? new ZzfxSfxBackend(context) : null;
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
    if (!this.unlocked || this.lifecyclePaused || this.settings.muted || this.settings.sfxVolume <= 0) return;
    this.sfx?.play(cue);
  }

  public shutdown(): void {
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
