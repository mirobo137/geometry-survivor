import { Container, Graphics, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { CombatRenderState } from '../../simulation/combat/CombatRenderState';
import { createTexture } from './TextureFactory';

export class WeaponView {
  public readonly root = new Container();
  private readonly orbitLayer = new Container();
  private readonly chainLayer = new Graphics();
  private readonly chainImpactLayer = new Container();
  private readonly orbitSprites: Sprite[] = [];
  private readonly chainImpactSprites: Sprite[] = [];
  private readonly previousChainActive: boolean[];

  public constructor(renderer: Renderer, private readonly onChainImpact?: () => void) {
    this.previousChainActive = Array.from({ length: WEAPON_DEFINITIONS.chainLightning.maxTargets }, () => false);
    this.root.addChild(this.orbitLayer, this.chainLayer, this.chainImpactLayer);
    const orbitTexture: Texture = createTexture(renderer, (graphics) => {
      graphics.beginPath().regularPoly(0, 0, WEAPON_DEFINITIONS.orbit.radius, 4, Math.PI / 4)
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
    const chainImpactTexture = createTexture(renderer, (graphics) => {
      graphics.beginPath().regularPoly(0, 0, 7, 8, Math.PI / 8)
        .fill({ color: 0xffffff, alpha: 0.9 })
        .stroke({ color: 0xd9fbff, width: 2 });
    });
    for (let index = 0; index < WEAPON_DEFINITIONS.chainLightning.maxTargets; index += 1) {
      const sprite = new Sprite(chainImpactTexture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.chainImpactSprites.push(sprite);
      this.chainImpactLayer.addChild(sprite);
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
      this.chainLayer.clear();
      this.chainLayer.visible = false;
      for (let index = 0; index < this.previousChainActive.length; index += 1) {
        this.previousChainActive[index] = false;
        this.chainImpactSprites[index].visible = false;
      }
      this.chainImpactLayer.visible = false;
      return;
    }

    this.chainLayer.visible = true;
    this.chainLayer.clear();
    this.chainImpactLayer.visible = true;
    for (let index = 0; index < combat.chainSegments.length; index += 1) {
      const segment = combat.chainSegments[index];
      if (!segment.active) {
        this.previousChainActive[index] = false;
        this.chainImpactSprites[index].visible = false;
        continue;
      }
      if (!this.previousChainActive[index]) this.onChainImpact?.();
      this.previousChainActive[index] = true;
      const alpha = Math.max(0, Math.min(1, segment.lifeSeconds / WEAPON_DEFINITIONS.chainLightning.segmentLifetimeSeconds));
      this.chainLayer
        .beginPath()
        .moveTo(segment.x1, segment.y1)
        .lineTo(segment.x2, segment.y2)
        .stroke({ color: 0xa9f4ff, width: 8, alpha: alpha * 0.28 })
        .beginPath()
        .moveTo(segment.x1, segment.y1)
        .lineTo(segment.x2, segment.y2)
        .stroke({ color: 0xe8ffff, width: 3, alpha });
      const sprite = this.chainImpactSprites[index];
      sprite.position.set(segment.x2, segment.y2);
      sprite.rotation = (1 - alpha) * Math.PI * 0.5;
      sprite.scale.set(0.75 + alpha * 0.85);
      sprite.alpha = alpha;
      sprite.visible = true;
    }
  }

  public reset(): void {
    this.chainLayer.clear();
    this.chainLayer.visible = false;
    this.chainImpactLayer.visible = false;
    for (let index = 0; index < this.previousChainActive.length; index += 1) {
      this.previousChainActive[index] = false;
      this.chainImpactSprites[index].visible = false;
    }
  }
}
