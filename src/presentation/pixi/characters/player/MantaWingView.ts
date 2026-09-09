import { Container, Sprite, Texture } from 'pixi.js';
import { MANTA_WING } from '../../../../assets/skins/manta/MantaAssets';

let cachedWing: Promise<Texture | undefined> | undefined;

/** Application-lifetime texture; two fins and future view instances share it. */
export const loadMantaWing = (): Promise<Texture | undefined> => {
  if (typeof Image === 'undefined') return Promise.resolve(undefined);
  if (!cachedWing) cachedWing = new Promise(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(Texture.from(image));
    image.onerror = () => { cachedWing = undefined; resolve(undefined); };
    image.src = MANTA_WING.url;
  });
  return cachedWing;
};

/** Local fin hinges. Texture material is baked; no filters or per-frame resources. */
export class MantaWingView {
  readonly root = new Container({ label: 'manta-wings' });
  private readonly left = new Sprite(Texture.EMPTY);
  private readonly right = new Sprite(Texture.EMPTY);
  private loaded = false;

  constructor(load: () => Promise<Texture | undefined> = loadMantaWing) {
    this.root.visible = false;
    for (const wing of [this.left, this.right]) {
      wing.anchor.set(MANTA_WING.anchorX, MANTA_WING.anchorY);
      this.root.addChild(wing);
    }
    void load().then(texture => {
      if (!texture || this.root.destroyed) return;
      for (const wing of [this.left, this.right]) {
        wing.texture = texture;
        wing.width = MANTA_WING.width;
        wing.height = MANTA_WING.height;
      }
      this.right.scale.x *= -1;
      this.loaded = true;
    });
  }

  render(active: boolean, time: number, movement: number, defeat: number, damage = 0): boolean {
    this.root.visible = active && this.loaded;
    if (!this.root.visible) return false;
    const wave = Math.sin(time * Math.PI * 2 / MANTA_WING.cycleSeconds);
    const flex = wave * MANTA_WING.amplitude * (0.65 + movement * 0.35);
    this.left.position.set(-MANTA_WING.rootX - defeat * 18, MANTA_WING.rootY + defeat * 6);
    this.right.position.set(MANTA_WING.rootX + defeat * 18, MANTA_WING.rootY + defeat * 6);
    this.left.rotation = flex - defeat * 0.6;
    this.right.rotation = -flex + defeat * 0.6;
    this.root.scale.set(1, 1 - damage * 0.025);
    return true;
  }
}
