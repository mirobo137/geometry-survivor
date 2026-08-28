import { Howl, Howler } from 'howler';
import { createPrototypeMusicWavDataUri } from './PrototypeMusicSource';

/** Owns only background music. It deliberately creates Howl after a gesture. */
export class HowlerMusicBackend {
  private track: Howl | null = null;
  private trackId: number | null = null;
  private volume = 1;

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

  public configure(volume: number): void {
    this.volume = volume;
    this.track?.volume(volume);
  }

  public play(): void {
    const track = this.track;
    if (!track || track.playing()) return;
    this.trackId = this.trackId === null ? track.play() : track.play(this.trackId);
  }

  public pause(): void {
    this.track?.pause(this.trackId ?? undefined);
  }

  public stop(): void {
    this.track?.stop();
    this.trackId = null;
  }

  public shutdown(): void {
    this.track?.unload();
    this.track = null;
    this.trackId = null;
  }

  private ensureTrack(): void {
    if (this.track) return;
    this.track = new Howl({
      src: [createPrototypeMusicWavDataUri()],
      format: ['wav'],
      loop: true,
      preload: false,
      volume: this.volume,
      pool: 1,
      onloaderror: () => { this.trackId = null; },
      onplayerror: () => { this.trackId = null; }
    });
  }
}
