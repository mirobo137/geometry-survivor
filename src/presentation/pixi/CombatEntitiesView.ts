import { Container, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import { ENEMY_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import type { CombatRenderState } from '../../simulation/combat/CombatRenderState';
import { createTexture } from './TextureFactory';

const createEnemyTextures = (renderer: Renderer): Record<EnemyKind, Texture> => ({
  chaser: createTexture(renderer, (graphics) => {
    graphics.poly([0, -18, 16, 12, -16, 12]).fill(ENEMY_DEFINITIONS.chaser.color).stroke({ color: 0xfff3eb, width: 2 });
  }),
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
});

export class CombatEntitiesView {
  public readonly root = new Container();
  private readonly enemyLayer = new Container();
  private readonly projectileLayer = new Container();
  private readonly enemyTextures: Record<EnemyKind, Texture>;
  private readonly enemySprites: Sprite[] = [];
  private readonly projectileSprites: Sprite[] = [];

  public constructor(renderer: Renderer) {
    this.root.addChild(this.projectileLayer, this.enemyLayer);
    this.enemyTextures = createEnemyTextures(renderer);
    const projectileTexture = createTexture(renderer, (graphics) => {
      graphics.circle(0, 0, 7).fill({ color: 0xfff6a8 }).stroke({ color: 0xffffff, width: 2 });
    });
    for (let index = 0; index < ENEMY_POOL_CAPACITY; index += 1) {
      const sprite = new Sprite(this.enemyTextures.chaser);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.enemySprites.push(sprite);
      this.enemyLayer.addChild(sprite);
    }
    for (let index = 0; index < PROJECTILE_POOL_CAPACITY; index += 1) {
      const sprite = new Sprite(projectileTexture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.projectileSprites.push(sprite);
      this.projectileLayer.addChild(sprite);
    }
  }

  public render(combat: Pick<CombatRenderState, 'enemies' | 'projectiles'>): void {
    for (let index = 0; index < this.enemySprites.length; index += 1) {
      const state = combat.enemies[index];
      const sprite = this.enemySprites[index];
      sprite.visible = state.active;
      if (!state.active) continue;
      const texture = this.enemyTextures[state.kind];
      if (sprite.texture !== texture) sprite.texture = texture;
      sprite.position.set(state.x, state.y);
      sprite.alpha = Math.max(0.55, state.health / state.maxHealth);
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
