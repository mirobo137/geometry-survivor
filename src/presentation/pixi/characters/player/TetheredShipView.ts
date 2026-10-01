import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { TETHERED_SHIP_ART as ART } from '../../../../assets/skins/tethered/TetheredAssets';
import { PROJECTILE_MUZZLE_OFFSETS } from '../../../../content/weapons/WeaponDefinitions';
import type { FxQuality } from '../../../../content/visual/VisualTokens';

export interface TetheredShipTextures { readonly ship: Texture; readonly cannon: Texture }
let cachedArt: Promise<TetheredShipTextures | undefined> | undefined;

/** Shared application-lifetime sources; views never destroy shared textures. */
export const loadTetheredShipArt = (): Promise<TetheredShipTextures | undefined> => {
  if (typeof Image === 'undefined') return Promise.resolve(undefined);
  if (!cachedArt) {
    const load = (url: string): Promise<Texture | undefined> => new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        try { resolve(Texture.from(image)); } catch { resolve(undefined); }
      };
      image.onerror = () => resolve(undefined);
      image.src = url;
    });
    cachedArt = Promise.all([load(ART.ship.url), load(ART.cannon.url)])
      .then(([ship, cannon]) => {
        if (ship && cannon) return { ship, cannon };
        cachedArt = undefined;
        return undefined;
      });
  }
  return cachedArt;
};

/** One intact ship + two shared cannons + ship flash + bounded cables. No rope physics. */
export class TetheredShipView {
  public readonly root = new Container({ label: 'tethered-ship-prototype' });
  private readonly cables = new Graphics({ label: 'tether-cables' });
  private readonly ship = new Sprite({ texture: Texture.EMPTY, label: 'tether-ship' });
  private readonly left = new Sprite({ texture: Texture.EMPTY, label: 'tether-cannon-left' });
  private readonly right = new Sprite({ texture: Texture.EMPTY, label: 'tether-cannon-right' });
  private readonly damage = new Sprite({ texture: Texture.EMPTY, label: 'tether-damage-flash' });
  private loaded = false;
  private lastSeconds: number | null = null;
  private lastDefeat = -1;
  private readonly reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  public constructor(
    private readonly quality: FxQuality,
    load: () => Promise<TetheredShipTextures | undefined> = loadTetheredShipArt
  ) {
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.cables, this.ship, this.left, this.right, this.damage);
    void load().then(art => {
      if (!art || this.root.destroyed) return;
      this.configure(this.ship, art.ship, ART.ship);
      this.configure(this.damage, art.ship, ART.ship);
      this.configure(this.left, art.cannon, ART.cannon);
      this.configure(this.right, art.cannon, ART.cannon);
      this.damage.blendMode = 'add';
      this.loaded = true;
    }).catch(() => { /* Keep the existing player visible on unexpected decode errors. */ });
  }

  private configure(sprite: Sprite, texture: Texture, part: {
    readonly width: number; readonly height: number; readonly anchorX: number; readonly anchorY: number
  }): void {
    sprite.texture = texture;
    sprite.anchor.set(part.anchorX, part.anchorY);
    sprite.width = part.width;
    sprite.height = part.height;
  }

  public render(seconds: number, aim: number, movement: number, defeat: number, damage: number, leftKick: number, rightKick: number): boolean {
    this.root.visible = this.loaded && !this.root.destroyed;
    if (!this.root.visible) return false;
    // PlayerView still renders during pause. Do not let its movement smoothing
    // silently change cables while the presentation clock is frozen.
    if (this.lastSeconds === seconds && this.lastDefeat === defeat) return true;
    this.lastSeconds = seconds;
    this.lastDefeat = defeat;
    const wave = this.reducedMotion ? 0 : Math.sin(seconds * 3.4);
    this.ship.position.set(0, -defeat * 9);
    this.ship.rotation = 0;
    this.damage.position.copyFrom(this.ship.position);
    this.damage.alpha = damage * 0.7;
    this.damage.visible = damage > 0;
    const cos = Math.cos(aim);
    const sin = Math.sin(aim);
    this.placeCannon(this.left, 0, aim, cos, sin, leftKick, defeat);
    this.placeCannon(this.right, 1, aim, cos, sin, rightKick, defeat);
    this.cables.clear();
    this.cables.visible = defeat < 0.9;
    const leftPort = this.left.x <= this.right.x ? -1 : 1;
    this.drawCable(this.left, leftPort, aim, wave, movement, defeat);
    this.drawCable(this.right, -leftPort, aim, -wave, movement, defeat);
    return true;
  }

  private placeCannon(sprite: Sprite, index: 0 | 1, aim: number, cos: number, sin: number, recoil: number, defeat: number): void {
    const mouth = PROJECTILE_MUZZLE_OFFSETS[index];
    // The asset pivot IS the barrel tip, so its world origin matches simulation.
    // Recoil retreats along the barrel, never smooths or changes shot targeting.
    sprite.position.set(mouth.x * cos - mouth.y * sin - recoil * sin * 0.24 + (index === 0 ? -1 : 1) * defeat * 20,
      mouth.x * sin + mouth.y * cos + recoil * cos * 0.24 + defeat * 12);
    sprite.rotation = aim;
  }

  private drawCable(sprite: Sprite, side: number, aim: number, wave: number, movement: number, defeat: number): void {
    // Each turret owns a DISTINCT port, even when both muzzles lie on one side.
    const portSide = side;
    const x0 = portSide * ART.cablePortX;
    const y0 = ART.cablePortY - defeat * 9;
    const rear = ART.cannon.height * (0.84 - ART.cannon.anchorY);
    const x1 = sprite.x - Math.sin(aim) * rear;
    const y1 = sprite.y + Math.cos(aim) * rear;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const length = Math.max(1, Math.hypot(dx, dy));
    const flex = (this.quality === 'low' ? 2 : 3) + wave * (1 + movement);
    const bendX = -dy / length * flex * portSide;
    const bendY = dx / length * flex * portSide;
    // One graphics object, two short polylines, no link sprites or physics objects.
    for (let pass = 0; pass < 2; pass += 1) {
      this.cables.beginPath().moveTo(x0, y0);
      for (let i = 1; i <= ART.cableSegments; i += 1) {
        const t = i / ART.cableSegments;
        const curve = Math.sin(t * Math.PI);
        this.cables.lineTo(x0 + dx * t + bendX * curve, y0 + dy * t + bendY * curve);
      }
      this.cables.stroke({ color: pass === 0 ? 0x304451 : 0x75d9eb,
        width: pass === 0 ? 2.7 : 0.7, alpha: pass === 0 ? 0.95 : 0.65 });
    }
  }

  public reset(): void {
    this.lastSeconds = null;
    this.lastDefeat = -1;
    this.root.visible = false;
    this.cables.clear();
    this.damage.alpha = 0;
  }
}
