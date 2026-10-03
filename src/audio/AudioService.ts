import { HowlerMusicBackend } from './HowlerMusicBackend';
import { ZzfxSfxBackend } from './ZzfxSfxBackend';
import { AUDIO_CUE_DEFINITIONS, type AudioCue } from '../content/audio/AudioCueDefinitions';
import { MUSIC_SCENE_VOLUMES, MUSIC_SCENE_FADE_MS, type MusicScene } from '../content/audio/MusicDefinitions';

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
  startMusic(scene?: MusicScene): void;
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
  private sfxContext: AudioContext | null = null;
  private unlocked = false;
  private lifecyclePaused = false;
  // Scene requests never create audio before the first valid user gesture.
  private musicRequested = false;
  private musicScene: MusicScene = 'gameplay';
  private unlockPromise: Promise<void> | null = null;
  private shutdownRequested = false;

  public configure(settings: AudioSettings): void {
    this.settings = {
      musicVolume: clamp(settings.musicVolume),
      sfxVolume: clamp(settings.sfxVolume),
      muted: settings.muted
    };
    this.applySettings();
    this.syncMusicPlayback();
  }

  public unlock(): Promise<void> {
    if (this.shutdownRequested) return Promise.resolve();
    // Every valid gesture may recover Howler's auto-suspended context. Recovery
    // must not reopen the combat gate or resume a paused run/music.
    if (this.unlockPromise) return this.unlockPromise;
    this.unlockPromise = this.unlockFromGesture().finally(() => { this.unlockPromise = null; });
    return this.unlockPromise;
  }

  private async unlockFromGesture(): Promise<void> {
    try {
      const context = await this.music.unlock();
      if (this.shutdownRequested) return;
      if (!context) { this.unlocked = false; return; }
      const contextChanged = context !== this.sfxContext;
      if (contextChanged) {
        this.sfx?.shutdown();
        this.sfx = new ZzfxSfxBackend(context);
        this.sfxContext = context;
      }
      if (this.lifecyclePaused) this.sfx?.pause();
      else this.sfx?.resume();
      this.unlocked = true;
      // Repeated UI gestures must not cancel an in-progress scene volume fade.
      if (contextChanged) this.applySettings();
      this.syncMusicPlayback();
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
    this.syncMusicPlayback();
  }

  public startMusic(scene: MusicScene = 'gameplay'): void {
    const changed = this.musicScene !== scene;
    this.musicScene = scene;
    this.musicRequested = true;
    if (changed) this.applySettings(MUSIC_SCENE_FADE_MS);
    this.syncMusicPlayback();
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
    this.sfxContext = null;
    this.music.shutdown();
    this.unlocked = false;
  }

  private syncMusicPlayback(): void {
    if (!this.unlocked || !this.musicRequested || this.lifecyclePaused
      || this.settings.muted || this.settings.musicVolume <= 0) this.music.pause();
    else this.music.play();
  }

  private applySettings(fadeMs = 0): void {
    this.music.configure(this.settings.muted ? 0 : this.settings.musicVolume * MUSIC_SCENE_VOLUMES[this.musicScene], fadeMs);
    this.sfx?.configure(this.settings.muted ? 0 : this.settings.sfxVolume);
  }
}

/** @deprecated Kept as a compatibility name while platform adapters migrate. */
export class WebAudioService extends AudioManager {}
