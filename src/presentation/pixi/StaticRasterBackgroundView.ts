import { Container, Sprite, Texture } from 'pixi.js';

export type RasterBackgroundLoader = () => Promise<Texture | undefined>;

const BASE_PLATE_MOTION = {
  xAmplitude: 12,
  yAmplitude: 10,
  xPeriod: 28,
  yPeriod: 36,
  zoomAmplitude: 0.015,
  zoomPeriod: 38,
  yPhase: 0.65
} as const;

/** Loads a raster once and shares its GPU texture for the lifetime of the app. */
export const createRasterBackgroundLoader = (url: string): RasterBackgroundLoader => {
  let cached: Promise<Texture | undefined> | undefined;
  return () => {
    if (typeof Image === 'undefined') return Promise.resolve(undefined);
    if (!cached) cached = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        try {
          resolve(Texture.from(image));
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

/** Shared raster plate with reusable micro-motion; optional atmosphere can layer above. */
export class StaticRasterBackgroundView {
  public readonly root = new Container();
  protected readonly sprite = new Sprite(Texture.EMPTY);
  private requested = false;
  private ready = false;
  private active = false;
  private width = 1280;
  private height = 720;
  private centerX = this.width / 2;
  private centerY = this.height / 2;
  private baseScaleX = 1;
  private baseScaleY = 1;
  private readonly reducedMotionForPlate: boolean;

  public constructor(
    private readonly load: RasterBackgroundLoader,
    motionReduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  ) {
    this.reducedMotionForPlate = motionReduced;
    this.sprite.anchor.set(0.5);
    this.root.addChild(this.sprite);
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
        this.sprite.texture = texture;
        this.ready = true;
        this.layout();
      });
    }
    this.layout();
  }

  /** Visible, slow shared pan/breathing transform; no new texture, geometry, or filter. */
  public update(animationSeconds: number, animate: boolean): void {
    if (!this.active || !this.ready) return;
    if (!animate || this.reducedMotionForPlate) {
      this.resetMotion();
      return;
    }

    const { xAmplitude, yAmplitude, xPeriod, yPeriod, zoomAmplitude, zoomPeriod, yPhase } = BASE_PLATE_MOTION;
    const xPhase = animationSeconds * Math.PI * 2 / xPeriod;
    const yMotionPhase = animationSeconds * Math.PI * 2 / yPeriod + yPhase;
    const zoomPhase = animationSeconds * Math.PI * 2 / zoomPeriod - Math.PI / 2;
    const zoom = 1 + (0.5 + 0.5 * Math.sin(zoomPhase)) * zoomAmplitude;

    this.sprite.position.set(
      this.centerX + Math.sin(xPhase) * xAmplitude,
      this.centerY + Math.sin(yMotionPhase) * yAmplitude
    );
    this.sprite.scale.set(this.baseScaleX * zoom, this.baseScaleY * zoom);
  }

  private layout(): void {
    this.root.visible = this.active && this.ready;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    // Small overscan preserves the established cover crop at every logical size.
    const size = Math.max(this.width, this.height) * 1.025;
    this.sprite.position.set(this.centerX, this.centerY);
    this.sprite.width = size;
    this.sprite.height = size;
    this.baseScaleX = Math.abs(this.sprite.scale.x);
    this.baseScaleY = Math.abs(this.sprite.scale.y);
  }

  private resetMotion(): void {
    this.sprite.position.set(this.centerX, this.centerY);
    this.sprite.scale.set(this.baseScaleX, this.baseScaleY);
  }
}
