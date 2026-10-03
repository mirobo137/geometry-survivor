import { Container, Graphics, Sprite, Texture, type PointData } from 'pixi.js';
import {
  CANNON_SKIN_RASTER_ART,
  LINKED_CANNON_LAYOUT,
  PLAYER_SHIP_RASTER_ART
} from '../../../../assets/skins/SkinRasterAssets';
import { PROJECTILE_MUZZLE_OFFSETS } from '../../../../content/weapons/WeaponDefinitions';
import type { CannonSkinId } from '../../../../content/visual/CannonSkinDefinitions';
import type { FxQuality, PlayerSkinId } from '../../../../content/visual/VisualTokens';
import { CANNON_FEEDBACK_TIMING } from '../../../../content/visual/CannonFeedbackDefinitions';

export interface TetheredShipTextures { readonly ship: Texture; readonly cannon: Texture }
export type TetheredShipArtLoader = (
  shipSkin: PlayerSkinId,
  cannonSkin: CannonSkinId
) => Promise<TetheredShipTextures | undefined>;

const texturePromises = new Map<string, Promise<Texture | undefined>>();

const loadTexture = (url: string): Promise<Texture | undefined> => {
  if (typeof Image === 'undefined') return Promise.resolve(undefined);
  const cached = texturePromises.get(url);
  if (cached) return cached;

  let pending: Promise<Texture | undefined>;
  pending = new Promise<Texture | undefined>(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      try {
        await image.decode();
        image.onload = image.onerror = null;
        resolve(Texture.from(image));
      } catch { image.onload = image.onerror = null; resolve(undefined); }
    };
    image.onerror = () => { image.onload = image.onerror = null; resolve(undefined); };
    image.src = url;
  }).then(texture => {
    if (!texture && texturePromises.get(url) === pending) texturePromises.delete(url);
    return texture;
  });
  texturePromises.set(url, pending);
  return pending;
};

/** Loads only the equipped ship and cannon; shared image URLs share textures. */
export const loadShipSkinArt: TetheredShipArtLoader = async (shipSkin, cannonSkin) => {
  const shipArt = PLAYER_SHIP_RASTER_ART[shipSkin];
  const cannonArt = CANNON_SKIN_RASTER_ART[cannonSkin];
  const [ship, cannon] = await Promise.all([loadTexture(shipArt.url), loadTexture(cannonArt.url)]);
  return ship && cannon ? { ship, cannon } : undefined;
};

/** Compatibility helper for the original Ivory Spear visual QA route. */
export const loadTetheredShipArt = (): Promise<TetheredShipTextures | undefined> => (
  loadShipSkinArt('spearhead', 'spearhead')
);

/** One complete ship + two shared interchangeable cannons + flash and cables. */
export class TetheredShipView {
  public readonly root = new Container({ label: 'raster-player-skin' });
  private readonly cables = new Graphics({ label: 'tether-cables' });
  private readonly ship = new Sprite({ texture: Texture.EMPTY, label: 'tether-ship' });
  private readonly left = new Sprite({ texture: Texture.EMPTY, label: 'tether-cannon-left' });
  private readonly right = new Sprite({ texture: Texture.EMPTY, label: 'tether-cannon-right' });
  private readonly damage = new Sprite({ texture: Texture.EMPTY, label: 'tether-damage-flash' });
  private loaded = false;
  private generation = 0;
  private lastSeconds: number | null = null;
  private lastDefeat = -1;
  private readonly cableCurves = [
    { c1x: 0, c1y: 0, c2x: 0, c2y: 0, ready: false, points: new Float32Array((LINKED_CANNON_LAYOUT.cableSegments + 1) * 2) },
    { c1x: 0, c1y: 0, c2x: 0, c2y: 0, ready: false, points: new Float32Array((LINKED_CANNON_LAYOUT.cableSegments + 1) * 2) }
  ];
  private shipSkin: PlayerSkinId;
  private cannonSkin: CannonSkinId;
  private readonly reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  public constructor(
    private readonly quality: FxQuality,
    shipSkin: PlayerSkinId = 'spearhead',
    cannonSkin: CannonSkinId = 'spearhead',
    private readonly load: TetheredShipArtLoader = loadShipSkinArt
  ) {
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.cables, this.ship, this.left, this.right, this.damage);
    this.shipSkin = shipSkin;
    this.cannonSkin = cannonSkin;
    this.loadCurrentArt();
  }

  private loadCurrentArt(): void {
    const generation = ++this.generation;
    const requestedShip = this.shipSkin;
    const requestedCannon = this.cannonSkin;
    this.loaded = false;
    this.root.visible = false;
    void this.load(requestedShip, requestedCannon).then(art => {
      if (!art || this.root.destroyed || generation !== this.generation) return;
      this.configure(this.ship, art.ship, PLAYER_SHIP_RASTER_ART[requestedShip]);
      this.configure(this.damage, art.ship, PLAYER_SHIP_RASTER_ART[requestedShip]);
      this.configure(this.left, art.cannon, CANNON_SKIN_RASTER_ART[requestedCannon]);
      this.configure(this.right, art.cannon, CANNON_SKIN_RASTER_ART[requestedCannon]);
      this.damage.blendMode = 'add';
      this.loaded = true;
      // Compose once when assets commit, including while the hidden world has
      // no ticker work. The next real frame still supplies its actual pose/time.
      this.render(0, 0, 0, 0, 0, 0, 0);
      this.lastSeconds = null;
    }).catch(() => { /* Keep the existing player visible on unexpected decode errors. */ });
  }

  public setSkins(shipSkin: PlayerSkinId, cannonSkin: CannonSkinId): void {
    if (shipSkin === this.shipSkin && cannonSkin === this.cannonSkin) return;
    this.shipSkin = shipSkin;
    this.cannonSkin = cannonSkin;
    this.loadCurrentArt();
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
    const dt = this.lastSeconds === null ? 1 / 60 : Math.min(0.1, Math.max(0, seconds - this.lastSeconds));
    this.lastSeconds = seconds;
    this.lastDefeat = defeat;
    const wave = this.reducedMotion ? 0 : Math.sin(seconds * 1.7) * 0.6;
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
    // A physical tether keeps its hull socket when the gun crosses behind the ship.
    const leftPort = -1;
    this.drawCable(this.left, 0, leftPort, aim, wave, movement, defeat, dt);
    this.drawCable(this.right, 1, -leftPort, aim, -wave, movement, defeat, dt);
    return true;
  }

  private placeCannon(sprite: Sprite, index: 0 | 1, aim: number, cos: number, sin: number, recoil: number, defeat: number): void {
    const mouth = PROJECTILE_MUZZLE_OFFSETS[index];
    // The image pivot IS the barrel tip, so its world origin matches simulation.
    // Recoil retreats along the barrel, never smooths or changes shot targeting.
    sprite.position.set(mouth.x * cos - mouth.y * sin - recoil * sin * CANNON_FEEDBACK_TIMING.rasterRecoilScale + (index === 0 ? -1 : 1) * defeat * 20,
      mouth.x * sin + mouth.y * cos + recoil * cos * CANNON_FEEDBACK_TIMING.rasterRecoilScale + defeat * 12);
    sprite.rotation = aim;
  }

  private drawCable(sprite: Sprite, index: 0 | 1, side: number, aim: number, wave: number, movement: number, defeat: number, dt: number): void {
    // Each cannon has a distinct rear socket and its own hull port.
    const cannonArt = CANNON_SKIN_RASTER_ART[this.cannonSkin];
    const x0 = side * LINKED_CANNON_LAYOUT.cablePortX;
    const y0 = LINKED_CANNON_LAYOUT.cablePortY - defeat * 9;
    const rear = cannonArt.height * (cannonArt.cableAnchorY - cannonArt.anchorY);
    const x1 = sprite.x - Math.sin(aim) * rear;
    const y1 = sprite.y + Math.cos(aim) * rear;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const length = Math.max(1, Math.hypot(dx, dy));
    // Slack decreases with separation. Handles trail gently while endpoints remain exact.
    const slack = Math.max(3, Math.min(15, 18 - length * 0.22));
    const curve = this.cableCurves[index];
    const settle = !curve.ready || this.reducedMotion ? 1 : 1 - Math.exp(-dt * 12);
    const sway = this.quality === 'low' ? 0 : wave;
    curve.c1x += (side * slack - curve.c1x) * settle;
    curve.c1y += (8 + movement * 5 + sway - curve.c1y) * settle;
    curve.c2x += (-Math.sin(aim) * 10 + side * slack * 0.45 - curve.c2x) * settle;
    curve.c2y += (Math.cos(aim) * 10 + movement * 4 - curve.c2y) * settle;
    curve.ready = true;
    const steps = LINKED_CANNON_LAYOUT.cableSegments;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, u = 1 - t;
      curve.points[i * 2] = u ** 3 * x0 + 3 * u * u * t * (x0 + curve.c1x)
        + 3 * u * t * t * (x1 + curve.c2x) + t ** 3 * x1;
      curve.points[i * 2 + 1] = u ** 3 * y0 + 3 * u * u * t * (y0 + curve.c1y)
        + 3 * u * t * t * (y1 + curve.c2y) + t ** 3 * y1;
    }
    // One graphics object, two short polylines, no link sprites or physics objects.
    for (let pass = 0; pass < 2; pass += 1) {
      this.cables.beginPath().moveTo(x0, y0);
      for (let i = 1; i <= LINKED_CANNON_LAYOUT.cableSegments; i += 1) {
        this.cables.lineTo(curve.points[i * 2], curve.points[i * 2 + 1]);
      }
      this.cables.stroke({ color: pass === 0 ? 0x243641 : 0x9bb4bc,
        width: pass === 0 ? 3.3 : 1.1, alpha: pass === 0 ? 0.95 : 0.8, cap: 'round', join: 'round' });
    }
  }

  /** Writes into a reusable point on the exact cable polyline; no geometry or allocation. */
  public sampleCable(index: 0 | 1, progress: number, target: PointData): boolean {
    if (!this.root.visible || !this.cables.visible) return false;
    const curve = this.cableCurves[index];
    const t = Math.min(1, Math.max(0, progress));
    const steps = LINKED_CANNON_LAYOUT.cableSegments;
    const segment = Math.min(steps - 1, Math.floor(t * steps));
    const weight = t * steps - segment;
    target.x = curve.points[segment * 2] * (1 - weight) + curve.points[(segment + 1) * 2] * weight;
    target.y = curve.points[segment * 2 + 1] * (1 - weight) + curve.points[(segment + 1) * 2 + 1] * weight;
    return true;
  }

  public reset(): void {
    this.lastSeconds = null;
    this.lastDefeat = -1;
    this.root.visible = false;
    this.cables.clear();
    for (const curve of this.cableCurves) curve.ready = false;
    this.damage.alpha = 0;
  }
}
