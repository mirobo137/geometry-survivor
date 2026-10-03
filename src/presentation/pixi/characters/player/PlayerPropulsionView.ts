import { BufferImageSource, Container, Sprite, Texture } from 'pixi.js';
import { PLAYER_ENGINE_FALLBACK_PORTS, PLAYER_ENGINE_MAX_PORTS, PLAYER_ENGINE_PORTS } from '../../../../content/visual/PlayerPropulsionDefinitions';
import { PLAYER_SKINS, type FxQuality, type PlayerSkinId } from '../../../../content/visual/VisualTokens';

/** Small baked white jet: 8 KiB RGBA, shared by all nozzles/layers of this view. */
const createPlumeTexture = (): Texture => {
  const width = 32, height = 64;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const radius = 0.06 + 0.9 * (1 - t) ** 0.7;
    const diamonds = 0.7 + 0.3 * Math.cos(t * 22) ** 4;
    for (let x = 0; x < width; x++) {
      const lateral = ((x + 0.5) / width * 2 - 1) / radius;
      const alpha = Math.max(0, 1 - lateral * lateral) ** 2 * (1 - t) ** 1.2 * diamonds;
      const offset = (y * width + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }
  return new Texture({ source: new BufferImageSource({ resource: pixels, width, height,
    format: 'rgba8unorm', alphaMode: 'no-premultiply-alpha', scaleMode: 'linear' }) });
};

/** Reactive engines, not particles: fixed sprites, no history, timers or per-frame geometry. */
export class PlayerPropulsionView {
  public readonly root = new Container({ label: 'player-propulsion' });
  private readonly sprites: Sprite[] = [];
  private readonly layers: number;
  private readonly reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  private skin: PlayerSkinId;
  private lastSeconds: number | null = null;
  private power = 0;

  public constructor(quality: FxQuality, skin: PlayerSkinId) {
    this.skin = skin;
    this.layers = this.reducedMotion || quality === 'low' ? 1 : quality === 'medium' ? 2 : 3;
    const texture = createPlumeTexture();
    this.root.eventMode = 'none';
    this.root.visible = false;
    // Long wake first, short white core last; normal blending keeps batching simple.
    for (let layer = this.layers - 1; layer >= 0; layer--) {
      for (let port = 0; port < PLAYER_ENGINE_MAX_PORTS; port++) {
        const sprite = new Sprite({ texture, label: `engine-${layer}-${port}` });
        sprite.anchor.set(0.5, 0);
        sprite.visible = false;
        this.sprites[layer * PLAYER_ENGINE_MAX_PORTS + port] = sprite;
        this.root.addChild(sprite);
      }
    }
    this.root.once('destroyed', () => texture.destroy(true));
  }

  public setSkin(skin: PlayerSkinId): void {
    if (skin === this.skin) return;
    this.skin = skin;
    this.reset();
  }

  public render(seconds: number, movement: number, alive: boolean, raster: boolean): void {
    if (!alive) { this.reset(); return; }
    // A frozen presentation clock must also freeze throttle and flicker.
    if (seconds === this.lastSeconds) return;
    const dt = this.lastSeconds === null ? 1 / 60 : Math.min(0.1, Math.max(0, seconds - this.lastSeconds));
    this.lastSeconds = seconds;
    const target = Math.min(1, Math.max(0, movement));
    this.power += (target - this.power) * (1 - Math.exp(-dt * (target > this.power ? 18 : 9)));
    this.root.visible = this.power > 0.015;
    if (!this.root.visible) return;
    const ports = raster ? PLAYER_ENGINE_PORTS[this.skin] : PLAYER_ENGINE_FALLBACK_PORTS;
    const color = PLAYER_SKINS[this.skin].outer;
    const shimmer = this.reducedMotion || this.layers === 1 ? 1 : 1 + Math.sin(seconds * 17) * 0.045;
    for (let layer = 0; layer < this.layers; layer++) {
      for (let index = 0; index < PLAYER_ENGINE_MAX_PORTS; index++) {
        const sprite = this.sprites[layer * PLAYER_ENGINE_MAX_PORTS + index];
        const port = ports[index];
        sprite.visible = port !== undefined;
        if (!port) continue;
        sprite.position.set(port[0], port[1] - 2);
        const lateralEngine = ports.length === 3 && index !== 1 ? 0.75 : 1;
        if (layer === 0) {
          sprite.tint = this.layers === 1 ? color : 0xe8fcff;
          sprite.width = (4 + this.power * 3) * lateralEngine;
          sprite.height = (10 + this.power * 30) * shimmer;
          sprite.alpha = this.power * 0.88;
        } else if (layer === 1) {
          sprite.tint = color;
          sprite.width = (10 + this.power * 7) * lateralEngine;
          sprite.height = (16 + this.power * 36) * shimmer;
          sprite.alpha = this.power * 0.48;
        } else {
          sprite.tint = color;
          sprite.width = (6 + this.power * 5) * lateralEngine;
          sprite.height = 20 + this.power * 58;
          sprite.alpha = this.power * 0.2;
        }
      }
    }
  }

  public reset(): void {
    this.lastSeconds = null;
    this.power = 0;
    this.root.visible = false;
  }
}
