import { Container, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import { ENEMY_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import type { FxQuality } from '../../content/visual/VisualTokens';
import { getCannonSkinDefinition, type CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import type { CombatRenderState, EnemyRenderState } from '../../simulation/combat/CombatRenderState';
import chaserRearSvg from '../../assets/svg/enemies/chaser/chaser-rear.svg?raw';
import chaserWingsSvg from '../../assets/svg/enemies/chaser/chaser-wings.svg?raw';
import chaserHullSvg from '../../assets/svg/enemies/chaser/chaser-hull.svg?raw';
import chaserCockpitSvg from '../../assets/svg/enemies/chaser/chaser-cockpit.svg?raw';
import fastRearSvg from '../../assets/svg/enemies/fast/fast-rear.svg?raw';
import fastWingsSvg from '../../assets/svg/enemies/fast/fast-wings.svg?raw';
import fastHullSvg from '../../assets/svg/enemies/fast/fast-hull.svg?raw';
import fastCockpitSvg from '../../assets/svg/enemies/fast/fast-cockpit.svg?raw';
import tankRearSvg from '../../assets/svg/enemies/tank/tank-rear.svg?raw';
import tankWingsSvg from '../../assets/svg/enemies/tank/tank-wings.svg?raw';
import tankHullSvg from '../../assets/svg/enemies/tank/tank-hull.svg?raw';
import tankCockpitSvg from '../../assets/svg/enemies/tank/tank-cockpit.svg?raw';
import eliteRearSvg from '../../assets/svg/enemies/elite/elite-rear.svg?raw';
import eliteWingsSvg from '../../assets/svg/enemies/elite/elite-wings.svg?raw';
import eliteHullSvg from '../../assets/svg/enemies/elite/elite-hull.svg?raw';
import eliteCockpitSvg from '../../assets/svg/enemies/elite/elite-cockpit.svg?raw';
import { EnemyDefeatFxView } from './enemies/EnemyDefeatFxView';
import { EnemyShipVisual, type EnemyShipTextureMap } from './enemies/EnemyShipVisual';
import { createSvgTexture, type SvgTextureFrame } from './SvgTextureFactory';
import { createTexture } from './TextureFactory';
import { EnemyImpactFxView } from './fx/EnemyImpactFxView';
import { DamageNumberView } from './fx/DamageNumberView';
import { HealthBarView } from './entities/HealthBarView';
import { ProjectileTrailView } from './fx/ProjectileTrailView';
import { getProjectileCurveOffset, getProjectileCurveVelocity } from './fx/ProjectileMotionVisual';

import projectileBasicSvg from '../../assets/svg/cannons/projectile-basic.svg?raw';
import projectileCurveSvg from '../../assets/svg/cannons/projectile-curve.svg?raw';
import projectileSmokeSvg from '../../assets/svg/cannons/projectile-smoke.svg?raw';
import projectileRainbowSvg from '../../assets/svg/cannons/projectile-rainbow.svg?raw';

const ENEMY_TEXTURE_FRAME: SvgTextureFrame = {
  x: -32,
  y: -32,
  width: 64,
  height: 64
};

const PROJECTILE_TEXTURE_FRAME: SvgTextureFrame = {
  x: -16,
  y: -16,
  width: 32,
  height: 32
};

interface EnemyTextureSet {
  readonly ships: EnemyShipTextureMap;
  readonly boss: Texture;
}

const createEnemyTextures = (renderer: Renderer): EnemyTextureSet => ({
  ships: {
    chaser: {
      rear: createSvgTexture(renderer, chaserRearSvg, ENEMY_TEXTURE_FRAME),
      wings: createSvgTexture(renderer, chaserWingsSvg, ENEMY_TEXTURE_FRAME),
      hull: createSvgTexture(renderer, chaserHullSvg, ENEMY_TEXTURE_FRAME),
      cockpit: createSvgTexture(renderer, chaserCockpitSvg, ENEMY_TEXTURE_FRAME)
    },
    fast: {
      rear: createSvgTexture(renderer, fastRearSvg, ENEMY_TEXTURE_FRAME),
      wings: createSvgTexture(renderer, fastWingsSvg, ENEMY_TEXTURE_FRAME),
      hull: createSvgTexture(renderer, fastHullSvg, ENEMY_TEXTURE_FRAME),
      cockpit: createSvgTexture(renderer, fastCockpitSvg, ENEMY_TEXTURE_FRAME)
    },
    tank: {
      rear: createSvgTexture(renderer, tankRearSvg, ENEMY_TEXTURE_FRAME),
      wings: createSvgTexture(renderer, tankWingsSvg, ENEMY_TEXTURE_FRAME),
      hull: createSvgTexture(renderer, tankHullSvg, ENEMY_TEXTURE_FRAME),
      cockpit: createSvgTexture(renderer, tankCockpitSvg, ENEMY_TEXTURE_FRAME)
    },
    elite: {
      rear: createSvgTexture(renderer, eliteRearSvg, ENEMY_TEXTURE_FRAME),
      wings: createSvgTexture(renderer, eliteWingsSvg, ENEMY_TEXTURE_FRAME),
      hull: createSvgTexture(renderer, eliteHullSvg, ENEMY_TEXTURE_FRAME),
      cockpit: createSvgTexture(renderer, eliteCockpitSvg, ENEMY_TEXTURE_FRAME)
    }
  },
  boss: createTexture(renderer, (graphics) => {
      graphics.beginPath().regularPoly(0, 0, ENEMY_DEFINITIONS.boss.radius, 8, Math.PI / 8)
        .fill(ENEMY_DEFINITIONS.boss.color)
        .stroke({ color: 0xffe8ff, width: 4 });
      graphics.beginPath().circle(0, 0, 22).fill({ color: 0x241044, alpha: 0.92 }).stroke({ color: 0xffffff, width: 3 });
      graphics.beginPath().circle(0, 0, 8).fill({ color: 0x75e6ff, alpha: 0.95 });
  })
});

class EnemyVisual {
  public readonly root = new Container();
  private readonly ship: EnemyShipVisual;
  private readonly boss: Sprite;
  private hitAtSeconds = Number.NEGATIVE_INFINITY;

  public constructor(textures: EnemyTextureSet, phaseSeed: number, quality: FxQuality) {
    this.ship = new EnemyShipVisual(textures.ships, phaseSeed, quality);
    this.boss = new Sprite(textures.boss);
    this.boss.anchor.set(0.5);
    this.boss.visible = false;
    this.root.addChild(this.ship.root, this.boss);
  }

  public render(state: EnemyRenderState, animationSeconds: number): void {
    this.root.visible = state.active;
    if (!state.active) {
      this.root.scale.set(1);
      return;
    }
    this.root.position.set(state.x, state.y);
    const hitAge = animationSeconds - this.hitAtSeconds;
    const hitProgress = hitAge >= 0 ? Math.min(1, hitAge / 0.12) : 1;
    const punch = hitProgress < 1 ? 1 + Math.sin(hitProgress * Math.PI) * 0.045 : 1;
    this.root.scale.set(punch);
    if (state.kind === 'boss') {
      this.ship.root.visible = false;
      this.boss.visible = true;
      this.boss.alpha = Math.max(0.55, state.health / state.maxHealth);
      return;
    }
    this.boss.visible = false;
    this.ship.render(state, animationSeconds, hitProgress < 1 ? Math.sin(hitProgress * Math.PI) : 0);
  }

  public playHit(animationSeconds: number): void {
    this.hitAtSeconds = animationSeconds;
  }

  public reset(): void {
    this.hitAtSeconds = Number.NEGATIVE_INFINITY;
    this.root.visible = false;
    this.root.scale.set(1);
    this.ship.reset();
    this.boss.visible = false;
  }
}

export class CombatEntitiesView {
  public readonly root = new Container();
  private readonly enemyLayer = new Container();
  private readonly projectileLayer = new Container();
  private readonly enemyTextures: EnemyTextureSet;
  private readonly enemyVisuals: EnemyVisual[] = [];
  private readonly projectileSprites: Sprite[] = [];
  private readonly enemyImpactFx: EnemyImpactFxView;
  private readonly enemyDefeatFx: EnemyDefeatFxView;
  private readonly damageNumbers: DamageNumberView;
  private readonly healthBars: HealthBarView;
  private readonly projectileTrails: ProjectileTrailView;
  private readonly projectileTextures: Readonly<Record<CannonSkinId, Texture>>;
  private cannonSkin: CannonSkinId;
  private readonly previousActive = Array.from({ length: ENEMY_POOL_CAPACITY }, () => false);
  private readonly previousHealth = Array.from({ length: ENEMY_POOL_CAPACITY }, () => 0);

  public constructor(renderer: Renderer, quality: FxQuality = 'medium', cannonSkin: CannonSkinId = 'basic') {
    this.cannonSkin = cannonSkin;
    this.enemyImpactFx = new EnemyImpactFxView(renderer, quality);
    this.damageNumbers = new DamageNumberView(quality);
    this.healthBars = new HealthBarView(ENEMY_POOL_CAPACITY, quality);
    this.projectileTrails = new ProjectileTrailView(PROJECTILE_POOL_CAPACITY, quality, cannonSkin);
    this.enemyTextures = createEnemyTextures(renderer);
    this.enemyDefeatFx = new EnemyDefeatFxView(this.enemyTextures.ships, quality);
    this.root.addChild(
      this.projectileLayer,
      this.projectileTrails.root,
      this.enemyLayer,
      this.enemyDefeatFx.root,
      this.healthBars.root,
      this.enemyImpactFx.root,
      this.damageNumbers.root
    );
    this.projectileTextures = {
      basic: createSvgTexture(renderer, projectileBasicSvg, PROJECTILE_TEXTURE_FRAME),
      curve: createSvgTexture(renderer, projectileCurveSvg, PROJECTILE_TEXTURE_FRAME),
      smoke: createSvgTexture(renderer, projectileSmokeSvg, PROJECTILE_TEXTURE_FRAME),
      rainbow: createSvgTexture(renderer, projectileRainbowSvg, PROJECTILE_TEXTURE_FRAME)
    };
    for (let index = 0; index < ENEMY_POOL_CAPACITY; index += 1) {
      const visual = new EnemyVisual(this.enemyTextures, index * 0.713, quality);
      this.enemyVisuals.push(visual);
      this.enemyLayer.addChild(visual.root);
    }
    for (let index = 0; index < PROJECTILE_POOL_CAPACITY; index += 1) {
      const sprite = new Sprite(this.projectileTextures[cannonSkin]);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.projectileSprites.push(sprite);
      this.projectileLayer.addChild(sprite);
    }
  }

  public setCannonSkin(cannonSkin: CannonSkinId): void {
    this.cannonSkin = cannonSkin;
    this.projectileTrails.setCannonSkin(cannonSkin);
    for (const sprite of this.projectileSprites) sprite.texture = this.projectileTextures[cannonSkin];
  }

  public render(combat: Pick<CombatRenderState, 'enemies' | 'projectiles'>, animationSeconds = 0): void {
    this.projectileTrails.render(combat.projectiles);
    const trailKind = getCannonSkinDefinition(this.cannonSkin).trail;
    for (let index = 0; index < this.enemyVisuals.length; index += 1) {
      const state = combat.enemies[index];
      const wasActive = this.previousActive[index];
      if (state.active) {
        if (wasActive && state.health < this.previousHealth[index] - 0.001) {
          const amount = this.previousHealth[index] - state.health;
          this.enemyImpactFx.playHit(state.x, state.y, state.radius, state.kind);
          this.damageNumbers.playHit(index, state.x, state.y, state.radius, amount, state.kind);
          this.healthBars.noteDamage(index, animationSeconds);
          this.enemyVisuals[index].playHit(animationSeconds);
        }
      }
      this.enemyVisuals[index].render(state, animationSeconds);
      this.previousActive[index] = state.active;
      this.previousHealth[index] = state.health;
    }
    this.healthBars.render(combat.enemies, animationSeconds);

    for (let index = 0; index < this.projectileSprites.length; index += 1) {
      const state = combat.projectiles[index];
      const sprite = this.projectileSprites[index];
      sprite.visible = state.active;
      if (!state.active) continue;
      const speed = Math.hypot(state.vx, state.vy);
      const directionX = speed > 0.5 ? state.vx / speed : 1;
      const directionY = speed > 0.5 ? state.vy / speed : 0;
      const normalX = -directionY;
      const normalY = directionX;
      const curveOffset = getProjectileCurveOffset(state, trailKind);
      sprite.position.set(state.x + normalX * curveOffset, state.y + normalY * curveOffset);
      const curveVelocity = getProjectileCurveVelocity(state, trailKind);
      sprite.rotation = Math.atan2(state.vy + normalY * curveVelocity, state.vx + normalX * curveVelocity);
    }
  }

  public playEnemyDefeat(x: number, y: number, kind: EnemyKind): void {
    this.enemyImpactFx.playDefeat(x, y, kind);
    if (kind !== 'boss') this.enemyDefeatFx.play(x, y, kind);
  }

  public updateFx(deltaSeconds: number): void {
    this.enemyImpactFx.update(deltaSeconds);
    this.enemyDefeatFx.update(deltaSeconds);
    this.damageNumbers.update(deltaSeconds);
  }

  public reset(): void {
    this.enemyImpactFx.clear();
    this.enemyDefeatFx.clear();
    this.damageNumbers.clear();
    this.healthBars.clear();
    this.projectileTrails.clear();
    for (let index = 0; index < this.enemyVisuals.length; index += 1) {
      this.previousActive[index] = false;
      this.previousHealth[index] = 0;
      this.enemyVisuals[index].reset();
    }
    for (const sprite of this.projectileSprites) sprite.visible = false;
  }
}
