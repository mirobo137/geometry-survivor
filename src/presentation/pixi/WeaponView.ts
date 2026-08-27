import { Container, Graphics, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { CombatRenderState } from '../../simulation/combat/CombatRenderState';
import { createTexture } from './TextureFactory';

export class WeaponView {
  public readonly root = new Container();
  private readonly orbitLayer = new Container();
  private readonly chainLayer = new Graphics();
  private readonly orbitSprites: Sprite[] = [];

  public constructor(renderer: Renderer) {
    this.root.addChild(this.orbitLayer, this.chainLayer);
    const orbitTexture: Texture = createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, WEAPON_DEFINITIONS.orbit.radius, 4, Math.PI / 4)
        .fill({ color: 0x9bffcf })
        .stroke({ color: 0xe5fff3, width: 2 });
    });
    for (let index = 0; index < WEAPON_DEFINITIONS.orbit.maxBlades; index += 1) {
      const sprite = new Sprite(orbitTexture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.orbitSprites.push(sprite);
      this.orbitLayer.addChild(sprite);
    }
  }

  public render(combat: Pick<CombatRenderState, 'orbitBlades' | 'chainSegments'>): void {
    for (let index = 0; index < this.orbitSprites.length; index += 1) {
      const state = combat.orbitBlades[index];
      const sprite = this.orbitSprites[index];
      sprite.visible = state.active;
      if (!state.active) continue;
      sprite.position.set(state.x, state.y);
      sprite.rotation = state.angle;
    }

    let hasActiveChain = false;
    for (const segment of combat.chainSegments) {
      if (segment.active) {
        hasActiveChain = true;
        break;
      }
    }
    if (!hasActiveChain) {
      if (this.chainLayer.visible) {
        this.chainLayer.clear();
        this.chainLayer.visible = false;
      }
      return;
    }

    this.chainLayer.visible = true;
    this.chainLayer.clear();
    for (const segment of combat.chainSegments) {
      if (!segment.active) continue;
      const alpha = Math.max(0, Math.min(1, segment.lifeSeconds / WEAPON_DEFINITIONS.chainLightning.segmentLifetimeSeconds));
      this.chainLayer
        .moveTo(segment.x1, segment.y1)
        .lineTo(segment.x2, segment.y2)
        .stroke({ color: 0xa9f4ff, width: 5, alpha });
    }
  }
}
