import { Sprite, Texture } from 'pixi.js';

const RESOLUTION = 768;

export type SvgBackgroundLoader = () => Promise<Texture | undefined>;

/** Creates one cached browser-rasterized texture per SVG source. */
export const createSvgBackgroundLoader = (url: string): SvgBackgroundLoader => {
  let cached: Promise<Texture | undefined> | undefined;
  return () => {
    if (typeof Image === 'undefined') return Promise.resolve(undefined);
    if (!cached) cached = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = RESOLUTION;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas unavailable');
          context.drawImage(image, 0, 0, RESOLUTION, RESOLUTION);
          resolve(Texture.from(canvas));
        } catch {
          cached = undefined;
          resolve(undefined);
        }
      };
      image.onerror = () => {
        cached = undefined;
        resolve(undefined);
      };
      image.src = url;
    });
    return cached;
  };
};

/** One still SVG atmosphere with shared loading, fallback and resize behavior. */
export class StaticSvgBackgroundView {
  public readonly root = new Sprite(Texture.EMPTY);
  private requested = false;
  private ready = false;
  private active = false;
  private width = 1280;
  private height = 720;

  public constructor(private readonly load: SvgBackgroundLoader) {
    this.root.anchor.set(0.5);
    this.root.visible = false;
  }

  public render(active: boolean, width: number, height: number): void {
    this.active = active;
    this.width = width;
    this.height = height;
    if (active && !this.requested) {
      this.requested = true;
      void this.load().then(texture => {
        if (this.root.destroyed) return;
        if (!texture) {
          this.requested = false;
          return;
        }
        this.root.texture = texture;
        this.ready = true;
        this.layout();
      });
    }
    this.layout();
  }

  private layout(): void {
    this.root.visible = this.active && this.ready;
    const size = Math.max(this.width, this.height);
    this.root.position.set(this.width / 2, this.height / 2);
    this.root.width = size;
    this.root.height = size;
  }
}
