import { Container, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import { ENEMY_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import type { FxQuality } from '../../content/visual/VisualTokens';
import { type CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import type { CombatRenderState, EnemyRenderState } from '../../simulation/combat/CombatRenderState';
import turtleSvg from '../../assets/svg/enemies/turtle/turtle.svg?raw';
import turtleShellSvg from '../../assets/svg/enemies/turtle/turtle-shell.svg?raw';
import turtleFrontSvg from '../../assets/svg/enemies/turtle/turtle-limbs-front.svg?raw';
import turtleRearSvg from '../../assets/svg/enemies/turtle/turtle-limbs-rear.svg?raw';
import turtleHeadSvg from '../../assets/svg/enemies/turtle/turtle-head.svg?raw';
import fastSvg from '../../assets/svg/enemies/fast/fast.svg?raw';
import tankSvg from '../../assets/svg/enemies/tank/tank.svg?raw';
import eliteSvg from '../../assets/svg/enemies/elite/elite.svg?raw';
import { TurtleVisual, type TurtleTextureSet } from './enemies/turtle/TurtleVisual';
import { TurtleDefeatFxView } from './enemies/turtle/TurtleDefeatFxView';
import { createSvgTexture, type SvgTextureFrame } from './SvgTextureFactory';
import { createTexture } from './TextureFactory';
import { EnemyImpactFxView } from './fx/EnemyImpactFxView';
import { DamageNumberView } from './fx/DamageNumberView';
import { HealthBarView } from './entities/HealthBarView';
import { ProjectileTrailView } from './fx/ProjectileTrailView';

import projectileBasicSvg from '../../assets/svg/cannons/projectile-basic.svg?raw';
import projectileCurveSvg from '../../assets/svg/cannons/projectile-curve.svg?raw';
import projectileSmokeSvg from '../../assets/svg/cannons/projectile-smoke.svg?raw';
import projectileRainbowSvg from '../../assets/svg/cannons/projectile-rainbow.svg?raw';

const TURTLE_TEXTURE_FRAME: SvgTextureFrame = {
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
  readonly fallback: Record<EnemyKind, Texture>;
  readonly turtle: TurtleTextureSet;
}

const createEnemyTextures = (renderer: Renderer): EnemyTextureSet => ({
  fallback: {
    chaser: createSvgTexture(renderer, turtleSvg, TURTLE_TEXTURE_FRAME),
    fast: createSvgTexture(renderer, fastSvg, TURTLE_TEXTURE_FRAME),
    tank: createSvgTexture(renderer, tankSvg, TURTLE_TEXTURE_FRAME),
    elite: createSvgTexture(renderer, eliteSvg, TURTLE_TEXTURE_FRAME),
    boss: createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, ENEMY_DEFINITIONS.boss.radius, 8, Math.PI / 8)
        .fill(ENEMY_DEFINITIONS.boss.color)
        .stroke({ color: 0xffe8ff, width: 4 });
      graphics.circle(0, 0, 22).fill({ color: 0x241044, alpha: 0.92 }).stroke({ color: 0xffffff, width: 3 });
      graphics.circle(0, 0, 8).fill({ color: 0x75e6ff, alpha: 0.95 });
    })
  },
  turtle: {
    shell: createSvgTexture(renderer, turtleShellSvg, TURTLE_TEXTURE_FRAME),
    limbsFront: createSvgTexture(renderer, turtleFrontSvg, TURTLE_TEXTURE_FRAME),
    limbsRear: createSvgTexture(renderer, turtleRearSvg, TURTLE_TEXTURE_FRAME),
    head: createSvgTexture(renderer, turtleHeadSvg, TURTLE_TEXTURE_FRAME)
  }
});

class EnemyVisual {
  public readonly root = new Container();
  private readonly fallback: Sprite;
  private turtle: TurtleVisual | null = null;
  private hitAtSeconds = Number.NEGATIVE_INFINITY;

  public constructor(private readonly textures: EnemyTextureSet) {
    this.fallback = new Sprite(textures.fallback.chaser);
    this.fallback.anchor.set(0.5);
    this.root.addChild(this.fallback);
  }

  public render(state: EnemyRenderState, animationSeconds: number): void {
    this.root.visible = state.active;
    if (!state.active) {
      this.root.scale.set(1);
      return;
    }
    const hitAge = animationSeconds - this.hitAtSeconds;
    const hitProgress = hitAge >= 0 ? Math.min(1, hitAge / 0.12) : 1;
    const punch = hitProgress < 1 ? 1 + Math.sin(hitProgress * Math.PI) * 0.045 : 1;
    this.root.scale.set(punch);
    if (state.kind === 'chaser') {
      // Every pooled enemy owns its world transform at this level. The turtle
      // renders locally so the hit-punch scales around this enemy, never the
      // global origin.
      this.root.position.set(state.x, state.y);
      this.fallback.visible = false;
      // A pool slot may never become a chaser. Allocate the four-part visual
      // only when that slot first needs it, keeping the initial mobile scene
      // light while retaining deterministic pooling after warm-up.
      if (this.turtle === null) {
        this.turtle = new TurtleVisual(this.textures.turtle);
        this.root.addChild(this.turtle.root);
      }
      this.turtle.render(state, animationSeconds, 'local');
      return;
    }

    if (this.turtle !== null) this.turtle.root.visible = false;
    this.fallback.visible = true;
    this.fallback.texture = this.textures.fallback[state.kind];
    this.fallback.position.set(0, 0);
    this.fallback.rotation = Math.hypot(state.vx, state.vy) > 0.5 ? Math.atan2(state.vy, state.vx) + Math.PI / 2 : this.fallback.rotation;
    this.fallback.alpha = Math.max(0.55, state.health / state.maxHealth);
    this.root.position.set(state.x, state.y);
  }

  public playHit(animationSeconds: number): void {
    this.hitAtSeconds = animationSeconds;
  }

  public reset(): void {
    this.hitAtSeconds = Number.NEGATIVE_INFINITY;
    this.root.visible = false;
    this.root.scale.set(1);
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
  private readonly turtleDefeatFx: TurtleDefeatFxView;
  private readonly damageNumbers: DamageNumberView;
  private readonly healthBars: HealthBarView;
  private readonly projectileTrails: ProjectileTrailView;
  private readonly projectileTextures: Readonly<Record<CannonSkinId, Texture>>;
  private readonly previousActive = Array.from({ length: ENEMY_POOL_CAPACITY }, () => false);
  private readonly previousHealth = Array.from({ length: ENEMY_POOL_CAPACITY }, () => 0);

  public constructor(renderer: Renderer, quality: FxQuality = 'medium', cannonSkin: CannonSkinId = 'basic') {
    this.enemyImpactFx = new EnemyImpactFxView(renderer, quality);
    this.damageNumbers = new DamageNumberView(quality);
    this.healthBars = new HealthBarView(ENEMY_POOL_CAPACITY, quality);
    this.projectileTrails = new ProjectileTrailView(PROJECTILE_POOL_CAPACITY, quality, cannonSkin);
    this.root.addChild(this.projectileLayer, this.projectileTrails.root, this.enemyLayer, this.healthBars.root, this.enemyImpactFx.root, this.damageNumbers.root);
    this.enemyTextures = createEnemyTextures(renderer);
    this.turtleDefeatFx = new TurtleDefeatFxView(this.enemyTextures.turtle, quality);
    // A defeated turtle clears the active enemy layer immediately, then its
    // visual copy briefly occupies the same world depth below HUD feedback.
    this.root.addChildAt(this.turtleDefeatFx.root, 3);
    this.projectileTextures = {
      basic: createSvgTexture(renderer, projectileBasicSvg, PROJECTILE_TEXTURE_FRAME),
      curve: createSvgTexture(renderer, projectileCurveSvg, PROJECTILE_TEXTURE_FRAME),
      smoke: createSvgTexture(renderer, projectileSmokeSvg, PROJECTILE_TEXTURE_FRAME),
      rainbow: createSvgTexture(renderer, projectileRainbowSvg, PROJECTILE_TEXTURE_FRAME)
    };
    for (let index = 0; index < ENEMY_POOL_CAPACITY; index += 1) {
      const visual = new EnemyVisual(this.enemyTextures);
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
    this.projectileTrails.setCannonSkin(cannonSkin);
    for (const sprite of this.projectileSprites) sprite.texture = this.projectileTextures[cannonSkin];
  }

  public render(combat: Pick<CombatRenderState, 'enemies' | 'projectiles'>, animationSeconds = 0): void {
    this.projectileTrails.render(combat.projectiles);
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
      sprite.position.set(state.x, state.y);
      sprite.rotation = Math.atan2(state.vy, state.vx);
    }
  }

  public playEnemyDefeat(x: number, y: number, kind: EnemyKind): void {
    this.enemyImpactFx.playDefeat(x, y, kind);
    if (kind === 'chaser') this.turtleDefeatFx.play(x, y);
  }

  public updateFx(deltaSeconds: number): void {
    this.enemyImpactFx.update(deltaSeconds);
    this.turtleDefeatFx.update(deltaSeconds);
    this.damageNumbers.update(deltaSeconds);
  }

  public reset(): void {
    this.enemyImpactFx.clear();
    this.turtleDefeatFx.clear();
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
