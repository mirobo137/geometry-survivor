import { Howl, Howler } from 'howler';
import generalThemeUrl from '../assets/audio/music/general-theme.mp3?url';

/** Owns only background music. It deliberately creates Howl after a gesture. */
export class HowlerMusicBackend {
  private track: Howl | null = null;
  private trackId: number | null = null;
  private volume = 1;
  private playRequested = false;
  private playPending = false;

  public async unlock(): Promise<AudioContext | null> {
    this.ensureTrack();
    const context = Howler.ctx;
    if (!context) return null;
    try {
      if (context.state !== 'running') await context.resume();
      return context.state === 'running' ? context : null;
    } catch {
      return null;
    }
  }

  public configure(volume: number, fadeMs = 0): void {
    this.volume = volume;
    const track = this.track;
    if (!track) return;
    if (fadeMs > 0 && volume > 0 && track.playing()) track.fade(track.volume(), volume, fadeMs);
    else track.volume(volume);
  }

  public play(): void {
    this.playRequested = true;
    const track = this.track;
    if (!track || this.playPending || track.playing()) return;
    this.playPending = true;
    this.trackId = this.trackId === null ? track.play() : track.play(this.trackId);
  }

  public pause(): void {
    this.playRequested = false;
    if (this.playPending || this.track?.playing()) this.track?.pause(this.trackId ?? undefined);
  }

  public stop(): void {
    this.playRequested = false;
    this.playPending = false;
    this.track?.stop();
    this.trackId = null;
  }

  public shutdown(): void {
    this.playRequested = false;
    this.playPending = false;
    this.track?.unload();
    this.track = null;
    this.trackId = null;
  }

  private ensureTrack(): void {
    if (this.track) return;
    const track = new Howl({
      src: [generalThemeUrl],
      format: ['mp3'],
      // Six-minute music must not become a full decoded stereo AudioBuffer.
      // The shared Howler context remains available exclusively for short SFX.
      html5: true,
      loop: true,
      preload: false,
      volume: this.volume,
      pool: 1,
      onplay: () => {
        if (this.track !== track) return;
        this.playPending = false;
        // Loading may finish after pause/background. Respect the current gate.
        if (!this.playRequested) track.pause(this.trackId ?? undefined);
      },
      onpause: () => {
        if (this.track !== track) return;
        this.playPending = false;
        // A pause queued while loading may arrive after a newer resume.
        if (this.playRequested) this.play();
      },
      onloaderror: () => this.releaseFailedTrack(track),
      onplayerror: () => this.releaseFailedTrack(track)
    });
    this.track = track;
  }

  private releaseFailedTrack(track: Howl): void {
    if (this.track !== track) return;
    this.track = null;
    this.trackId = null;
    this.playPending = false;
    track.unload(); // Drop queued plays; retry only on a later user gesture.
  }
}
