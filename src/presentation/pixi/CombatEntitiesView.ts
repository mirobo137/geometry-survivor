import { Container, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import { ENEMY_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import type { CombatRenderState, EnemyRenderState } from '../../simulation/combat/CombatRenderState';
import turtleSvg from '../../assets/svg/enemies/turtle/turtle.svg?raw';
import turtleShellSvg from '../../assets/svg/enemies/turtle/turtle-shell.svg?raw';
import turtleFrontSvg from '../../assets/svg/enemies/turtle/turtle-limbs-front.svg?raw';
import turtleRearSvg from '../../assets/svg/enemies/turtle/turtle-limbs-rear.svg?raw';
import turtleHeadSvg from '../../assets/svg/enemies/turtle/turtle-head.svg?raw';
import { TurtleVisual, type TurtleTextureSet } from './enemies/turtle/TurtleVisual';
import { createSvgTexture, type SvgTextureFrame } from './SvgTextureFactory';
import { createTexture } from './TextureFactory';

const TURTLE_TEXTURE_FRAME: SvgTextureFrame = {
  x: -32,
  y: -32,
  width: 64,
  height: 64
};

interface EnemyTextureSet {
  readonly fallback: Record<EnemyKind, Texture>;
  readonly turtle: TurtleTextureSet;
}

const createEnemyTextures = (renderer: Renderer): EnemyTextureSet => ({
  fallback: {
    chaser: createSvgTexture(renderer, turtleSvg, TURTLE_TEXTURE_FRAME),
    fast: createTexture(renderer, (graphics) => {
      graphics.poly([0, -14, 14, 0, 0, 14, -14, 0]).fill(ENEMY_DEFINITIONS.fast.color).stroke({ color: 0xfffbdf, width: 2 });
    }),
    tank: createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, 28, 6, Math.PI / 6).fill(ENEMY_DEFINITIONS.tank.color).stroke({ color: 0xf0e6ff, width: 2 });
    }),
    elite: createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, 24, 8, Math.PI / 8)
        .fill(ENEMY_DEFINITIONS.elite.color)
        .stroke({ color: 0xffe5f8, width: 3 });
      graphics.circle(0, 0, 10).stroke({ color: 0xffffff, width: 2 });
    }),
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

  public constructor(private readonly textures: EnemyTextureSet) {
    this.fallback = new Sprite(textures.fallback.chaser);
    this.fallback.anchor.set(0.5);
    this.root.addChild(this.fallback);
  }

  public render(state: EnemyRenderState, animationSeconds: number): void {
    this.root.visible = state.active;
    if (!state.active) return;
    if (state.kind === 'chaser') {
      // TurtleVisual owns the world position of its composed root. Clear a
      // previous fallback position so a pooled slot changing kind cannot add
      // an old coordinate as an unintended offset.
      this.root.position.set(0, 0);
      this.fallback.visible = false;
      // A pool slot may never become a chaser. Allocate the four-part visual
      // only when that slot first needs it, keeping the initial mobile scene
      // light while retaining deterministic pooling after warm-up.
      if (this.turtle === null) {
        this.turtle = new TurtleVisual(this.textures.turtle);
        this.root.addChild(this.turtle.root);
      }
      this.turtle.render(state, animationSeconds);
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
}

export class CombatEntitiesView {
  public readonly root = new Container();
  private readonly enemyLayer = new Container();
  private readonly projectileLayer = new Container();
  private readonly enemyTextures: EnemyTextureSet;
  private readonly enemyVisuals: EnemyVisual[] = [];
  private readonly projectileSprites: Sprite[] = [];

  public constructor(renderer: Renderer) {
    this.root.addChild(this.projectileLayer, this.enemyLayer);
    this.enemyTextures = createEnemyTextures(renderer);
    const projectileTexture = createTexture(renderer, (graphics) => {
      graphics.circle(0, 0, 7).fill({ color: 0xfff6a8 }).stroke({ color: 0xffffff, width: 2 });
    });
    for (let index = 0; index < ENEMY_POOL_CAPACITY; index += 1) {
      const visual = new EnemyVisual(this.enemyTextures);
      this.enemyVisuals.push(visual);
      this.enemyLayer.addChild(visual.root);
    }
    for (let index = 0; index < PROJECTILE_POOL_CAPACITY; index += 1) {
      const sprite = new Sprite(projectileTexture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.projectileSprites.push(sprite);
      this.projectileLayer.addChild(sprite);
    }
  }

  public render(combat: Pick<CombatRenderState, 'enemies' | 'projectiles'>, animationSeconds = 0): void {
    for (let index = 0; index < this.enemyVisuals.length; index += 1) {
      this.enemyVisuals[index].render(combat.enemies[index], animationSeconds);
    }

    for (let index = 0; index < this.projectileSprites.length; index += 1) {
      const state = combat.projectiles[index];
      const sprite = this.projectileSprites[index];
      sprite.visible = state.active;
      if (!state.active) continue;
      sprite.position.set(state.x, state.y);
      sprite.rotation = Math.atan2(state.vy, state.vx);
    }
  }
}
