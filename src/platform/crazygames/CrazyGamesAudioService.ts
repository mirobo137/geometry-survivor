import type { AudioService, AudioSettings } from '../../audio/AudioService';

/** Applies CrazyGames audio policy without overriding the player's own choice. */
export class CrazyGamesAudioService implements AudioService {
  private playerSettings: AudioSettings = { musicVolume: 1, sfxVolume: 1, muted: false };
  private portalMuted = false;
  private adMuted = false;

  public constructor(private readonly audio: AudioService) {}

  public configure(settings: AudioSettings): void {
    this.playerSettings = { ...settings };
    this.applySettings();
  }

  public setPortalMuted(muted: boolean): void {
    this.portalMuted = muted;
    this.applySettings();
  }

  public setAdMuted(muted: boolean): void {
    this.adMuted = muted;
    this.applySettings();
  }

  public unlock(): Promise<void> { return this.audio.unlock(); }
  public pause(): void { this.audio.pause(); }
  public resume(): void { this.audio.resume(); }
  public startMusic(scene?: Parameters<AudioService['startMusic']>[0]): void { this.audio.startMusic(scene); }
  public stopMusic(): void { this.audio.stopMusic(); }
  public playCue(cue: Parameters<AudioService['playCue']>[0]): void { this.audio.playCue(cue); }
  public shutdown(): void { this.audio.shutdown(); }

  private applySettings(): void {
    this.audio.configure({
      ...this.playerSettings,
      muted: this.playerSettings.muted || this.portalMuted || this.adMuted
    });
  }
}
