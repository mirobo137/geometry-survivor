import { Sprite, Texture } from 'pixi.js';
import tidalVeilUrl from '../../assets/images/backgrounds/tidal-veil.webp?url';
import currentAUrl from '../../assets/images/backgrounds/tidal-veil-current-a.webp?url';
import currentBUrl from '../../assets/images/backgrounds/tidal-veil-current-b.webp?url';
import { createRasterBackgroundLoader, StaticRasterBackgroundView } from './StaticRasterBackgroundView';

export const loadTidalVeilBackground = createRasterBackgroundLoader(tidalVeilUrl);
export const loadTidalVeilCurrentA = createRasterBackgroundLoader(currentAUrl);
export const loadTidalVeilCurrentB = createRasterBackgroundLoader(currentBUrl);
export const loadTidalVeilCurrents = () => Promise.all([
  loadTidalVeilCurrentA(),
  loadTidalVeilCurrentB()
]);

const SOURCE_SIZE = 1254;

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

/** Adds four-corner, independently drifting currents over the static painting. */
export class TidalVeilBackgroundView extends StaticRasterBackgroundView {
  private readonly currents: readonly CurrentLayer[];
  private layerActive = false;
  private layoutWidth = 1280;
  private layoutHeight = 720;
  private readonly motionReduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  public constructor(
    load = loadTidalVeilBackground,
    loadCurrentA = loadTidalVeilCurrentA,
    loadCurrentB = loadTidalVeilCurrentB
  ) {
    super(load);
    this.currents = [
      // Two source textures are mirrored into the two uncovered corners. This
      // fills the frame without decoding or shipping duplicate artwork.
      this.createCurrent(loadCurrentA, 0, 0, 820, 820, 0.24, 38, 22, 18, 24, 0),
      this.createCurrent(loadCurrentB, 650, 600, 604, 654, 0.22, 30, 34, 23, 17, 1.8),
      this.createCurrent(loadCurrentA, 434, 0, 820, 820, 0.20, 33, 25, 20, 19, 2.7, true),
      this.createCurrent(loadCurrentB, 0, 600, 604, 654, 0.18, 34, 30, 21, 25, 4.9, true)
    ];
    this.root.addChild(...this.currents.map(current => current.sprite));
  }

  public override render(active: boolean, width: number, height: number): void {
    super.render(active, width, height);
    this.layerActive = active;
    this.layoutWidth = width;
    this.layoutHeight = height;
    for (const current of this.currents) {
      current.sprite.visible = active && current.ready;
      if (active && !current.requested) this.loadCurrent(current);
    }
    this.layoutCurrents();
  }

  public override update(animationSeconds: number, animate: boolean): void {
    super.update(animationSeconds, animate);
    if (!this.layerActive) return;
    const moving = animate && !this.motionReduced;
    for (const current of this.currents) {
      if (!current.ready) continue;
      if (!moving) {
        current.sprite.position.set(current.baseX, current.baseY);
        current.sprite.alpha = current.alpha;
        continue;
      }
      const phaseX = animationSeconds * Math.PI * 2 / current.periodX + current.phase;
      const phaseY = animationSeconds * Math.PI * 2 / current.periodY + current.phase;
      current.sprite.position.set(
        current.baseX + Math.sin(phaseX) * current.driftX,
        current.baseY + Math.cos(phaseY) * current.driftY
      );
      // A restrained breath supports the visible drift without reading as a flash.
      current.sprite.alpha = current.alpha * (0.93 + Math.sin(phaseY * 0.7) * 0.07);
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
    sprite.alpha = alpha;
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
      current.sprite.visible = this.layerActive;
      this.layoutCurrents();
    });
  }

  private layoutCurrents(): void {
    const portrait = this.layoutHeight > this.layoutWidth;
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
