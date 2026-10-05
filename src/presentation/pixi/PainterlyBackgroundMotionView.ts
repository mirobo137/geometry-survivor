import { Container, Sprite, Texture } from 'pixi.js';
import type { BackgroundId } from '../../content/visual/BackgroundDefinitions';
import { REWARD_BACKGROUND_IDS, type RewardBackgroundId } from '../../content/retention/RewardCosmeticDefinitions';
import { getBackgroundDefinition } from '../../content/visual/BackgroundDefinitions';
import { loadTidalVeilCurrentA, loadTidalVeilCurrentB } from './TidalVeilBackgroundView';

const SOURCE_SIZE = 1254;

export type PainterlyBackgroundMotionId = Exclude<BackgroundId, 'tidal-veil'>;

export interface PainterlyMotionStyle {
  readonly tint: number;
  readonly opacity: number;
  /** Values above 1 make the slow current complete its cycle sooner. */
  readonly speed: number;
  readonly phase: number;
}

/** Per-background treatment keeps the reused vapor layers in each painting's palette. */
export const PAINTERLY_MOTION_STYLES: Readonly<Record<PainterlyBackgroundMotionId, PainterlyMotionStyle>> = {
  ...Object.fromEntries(REWARD_BACKGROUND_IDS.map((id, index) => [id, { tint: getBackgroundDefinition(id).tokens.accent, opacity: .78, speed: .94 + index * .014, phase: index * .7 }])) as Record<RewardBackgroundId, PainterlyMotionStyle>,
  'deep-space': { tint: 0x7189e8, opacity: 0.88, speed: 1.01, phase: 0.35 },
  'ion-storm': { tint: 0x55dfc7, opacity: 0.94, speed: 1.13, phase: 1.1 },
  'solar-drift': { tint: 0xf2a05a, opacity: 0.86, speed: 0.99, phase: 2.05 },
  'crystal-field': { tint: 0xb994ed, opacity: 0.9, speed: 1.09, phase: 2.75 },
  'nacre-orbit': { tint: 0x8cb9c2, opacity: 0.8, speed: 0.95, phase: 1.65 },
  'vesper-bloom': { tint: 0xc48ab7, opacity: 0.88, speed: 1.07, phase: 3.4 },
  'silent-archive': { tint: 0xa0c1bc, opacity: 0.8, speed: 0.96, phase: 4.1 },
  'lunar-fault': { tint: 0xb1b7c2, opacity: 0.76, speed: 1.02, phase: 4.9 },
  'leviathan-wake': { tint: 0x82bcaf, opacity: 0.86, speed: 1.06, phase: 5.7 }
};

interface CurrentLayer {
  readonly sprite: Sprite;
  readonly load: () => Promise<Texture | undefined>;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly alpha: number;
  readonly driftX: number;
  readonly driftY: number;
  readonly periodX: number;
  readonly periodY: number;
  readonly phase: number;
  readonly flipX: boolean;
  requested: boolean;
  ready: boolean;
  baseX: number;
  baseY: number;
}

/** Reuses Tidal Veil's two transparent currents to animate any painted plate. */
export class PainterlyBackgroundMotionView {
  public readonly root = new Container();
  private readonly currents: readonly CurrentLayer[];
  private layerActive = false;
  private layoutWidth = 1280;
  private layoutHeight = 720;
  private style: PainterlyMotionStyle = PAINTERLY_MOTION_STYLES['deep-space'];
  private readonly motionReduced: boolean;

  public constructor(
    loadCurrentA = loadTidalVeilCurrentA,
    loadCurrentB = loadTidalVeilCurrentB,
    motionReduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  ) {
    this.motionReduced = motionReduced;
    this.currents = [
      this.createCurrent(loadCurrentA, 0, 0, 820, 820, 0.24, 44, 25, 18, 24, 0),
      this.createCurrent(loadCurrentB, 650, 600, 604, 654, 0.22, 35, 39, 23, 17, 1.8),
      this.createCurrent(loadCurrentA, 434, 0, 820, 820, 0.20, 38, 29, 20, 19, 2.7, true),
      this.createCurrent(loadCurrentB, 0, 600, 604, 654, 0.18, 39, 35, 21, 25, 4.9, true)
    ];
    this.root.addChild(...this.currents.map(current => current.sprite));
    this.root.visible = false;
  }

  public render(
    active: boolean,
    width: number,
    height: number,
    style?: PainterlyMotionStyle
  ): void {
    this.layerActive = active;
    this.root.visible = active;
    this.layoutWidth = width;
    this.layoutHeight = height;
    if (style) this.style = style;
    for (const current of this.currents) {
      current.sprite.tint = this.style.tint;
      current.sprite.alpha = current.alpha * this.style.opacity;
      current.sprite.visible = active && current.ready;
      if (active && !current.requested) this.loadCurrent(current);
    }
    this.layoutCurrents();
  }

  public update(animationSeconds: number, animate: boolean): void {
    if (!this.layerActive) return;
    const moving = animate && !this.motionReduced;
    for (const current of this.currents) {
      if (!current.ready) continue;
      if (!moving) {
        current.sprite.position.set(current.baseX, current.baseY);
        current.sprite.alpha = current.alpha * this.style.opacity;
        continue;
      }
      const phaseX = animationSeconds * Math.PI * 2 / (current.periodX / this.style.speed)
        + current.phase + this.style.phase;
      const phaseY = animationSeconds * Math.PI * 2 / (current.periodY / this.style.speed)
        + current.phase + this.style.phase;
      current.sprite.position.set(
        current.baseX + Math.sin(phaseX) * current.driftX,
        current.baseY + Math.cos(phaseY) * current.driftY
      );
      // A restrained breath supports the visible drift without reading as a flash.
      current.sprite.alpha = current.alpha * this.style.opacity
        * (0.93 + Math.sin(phaseY * 0.7) * 0.07);
    }
  }

  private createCurrent(
    load: () => Promise<Texture | undefined>,
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    alpha: number,
    driftX: number,
    driftY: number,
    periodX: number,
    periodY: number,
    phase: number,
    flipX = false
  ): CurrentLayer {
    const sprite = new Sprite(Texture.EMPTY);
    sprite.anchor.set(0.5);
    sprite.visible = false;
    return {
      sprite, load, sourceX, sourceY, sourceWidth, sourceHeight, alpha,
      driftX, driftY, periodX, periodY, phase, flipX,
      requested: false, ready: false, baseX: 0, baseY: 0
    };
  }

  private loadCurrent(current: CurrentLayer): void {
    current.requested = true;
    void current.load().then(texture => {
      if (this.root.destroyed) return;
      if (!texture) {
        current.requested = false;
        return;
      }
      current.sprite.texture = texture;
      current.ready = true;
      current.sprite.tint = this.style.tint;
      current.sprite.alpha = current.alpha * this.style.opacity;
      current.sprite.visible = this.layerActive;
      this.layoutCurrents();
    }).catch(() => {
      current.requested = false;
    });
  }

  private layoutCurrents(): void {
    const portrait = this.layoutHeight > this.layoutWidth;
    // A square cover crop hides most corner vapor on a tall screen. In portrait,
    // size to the visible width and anchor the bottom pair to the visible bottom.
    const coverSize = (portrait ? this.layoutWidth : Math.max(this.layoutWidth, this.layoutHeight)) * 1.025;
    const pixelScale = coverSize / SOURCE_SIZE;
    const left = this.layoutWidth / 2 - coverSize / 2;
    const top = this.layoutHeight / 2 - coverSize / 2;
    for (const current of this.currents) {
      current.baseX = left + (current.sourceX + current.sourceWidth / 2) * pixelScale;
      current.baseY = portrait
        ? current.sourceY === 0
          ? -coverSize * 0.0125 + current.sourceHeight * pixelScale / 2
          : this.layoutHeight + coverSize * 0.0125 - current.sourceHeight * pixelScale / 2
        : top + (current.sourceY + current.sourceHeight / 2) * pixelScale;
      current.sprite.width = current.sourceWidth * pixelScale;
      current.sprite.height = current.sourceHeight * pixelScale;
      current.sprite.scale.x = current.flipX
        ? -Math.abs(current.sprite.scale.x)
        : Math.abs(current.sprite.scale.x);
      current.sprite.position.set(current.baseX, current.baseY);
    }
  }
}
