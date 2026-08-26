import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { ARENA_CENTER, ARENA_RADIUS, ENEMY_POOL_CAPACITY, LOGICAL_HEIGHT, PROJECTILE_POOL_CAPACITY } from '../config/constants';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../content/enemies/EnemyDefinitions';
import type { PlayerState } from '../simulation/PlayerModel';
import type { CombatSimulation } from '../simulation/combat/CombatSimulation';
import type { ViewportState } from './viewport/ViewportTransform';

const createTexture = (renderer: Renderer, draw: (graphics: Graphics) => void): Texture => {
  const graphics = new Graphics();
  draw(graphics);
  const texture = renderer.generateTexture({
    target: graphics,
    resolution: 1,
    antialias: false,
    defaultAnchor: { x: 0.5, y: 0.5 }
  });
  graphics.destroy();
  return texture;
};

const createEnemyTextures = (renderer: Renderer): Record<EnemyKind, Texture> => ({
  chaser: createTexture(renderer, (graphics) => {
    graphics.poly([0, -18, 16, 12, -16, 12]).fill(ENEMY_DEFINITIONS.chaser.color).stroke({ color: 0xfff3eb, width: 2 });
  }),
  fast: createTexture(renderer, (graphics) => {
    graphics.poly([0, -14, 14, 0, 0, 14, -14, 0]).fill(ENEMY_DEFINITIONS.fast.color).stroke({ color: 0xfffbdf, width: 2 });
  }),
  tank: createTexture(renderer, (graphics) => {
    graphics.regularPoly(0, 0, 28, 6, Math.PI / 6).fill(ENEMY_DEFINITIONS.tank.color).stroke({ color: 0xf0e6ff, width: 2 });
  })
});

export class PixiGameView {
  public readonly root = new Container();
  private readonly world = new Container();
  private readonly arena = new Graphics();
  private readonly player = new Graphics();
  private readonly enemyLayer = new Container();
  private readonly projectileLayer = new Container();
  private readonly enemyTextures: Record<EnemyKind, Texture>;
  private readonly enemySprites: Sprite[] = [];
  private readonly projectileSprites: Sprite[] = [];
  private arenaRadius = -1;
  private arenaGeometryReady = false;
  private readonly title: Text;
  private readonly hint: Text;

  public constructor(renderer: Renderer) {
    this.root.addChild(this.world);
    this.world.addChild(this.arena, this.projectileLayer, this.enemyLayer, this.player);
    this.arena.position.set(ARENA_CENTER.x, ARENA_CENTER.y);

    this.renderArena(ARENA_RADIUS);

    this.player.circle(0, 0, 22).fill({ color: 0x75e6ff }).stroke({ color: 0xf4ffff, width: 3 });
    this.player.circle(0, 0, 7).fill({ color: 0x10213d });

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

    this.title = new Text({
      text: 'GEOMETRY SURVIVOR',
      style: new TextStyle({
        fill: 0xeaf0ff,
        fontFamily: 'Arial, sans-serif',
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: 4
      })
    });
    this.title.anchor.set(0.5, 0);
    this.title.position.set(ARENA_CENTER.x, 34);
    this.world.addChild(this.title);

    this.hint = new Text({
      text: 'Mantén pulsado y mueve para sobrevivir · WASD / flechas',
      style: new TextStyle({
        fill: 0xaab7d8,
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        align: 'center'
      })
    });
    this.hint.anchor.set(0.5, 1);
    this.hint.position.set(ARENA_CENTER.x, LOGICAL_HEIGHT - 26);
    this.world.addChild(this.hint);
  }

  public resize(viewport: ViewportState): void {
    this.root.scale.set(viewport.scale);
    this.root.position.set(viewport.offsetX, viewport.offsetY);
    this.world.position.set(viewport.worldOffsetX, viewport.worldOffsetY);
    this.root.hitArea = undefined;
  }

  public renderArena(radius: number): void {
    if (this.arenaRadius === radius) return;
    if (!this.arenaGeometryReady) {
      this.arena
        .circle(0, 0, ARENA_RADIUS)
        .fill({ color: 0x111a36, alpha: 1 })
        .stroke({ color: 0x4b6cb7, width: 3, alpha: 0.9 })
        .circle(0, 0, Math.max(0, ARENA_RADIUS - 40))
        .stroke({ color: 0x26365f, width: 2, alpha: 0.8 })
        .circle(0, 0, 2)
        .fill({ color: 0x83a8ff, alpha: 0.9 });
      this.arenaGeometryReady = true;
    }
    this.arena.scale.set(radius / ARENA_RADIUS);
    this.arenaRadius = radius;
  }

  public renderCombat(combat: CombatSimulation): void {
    for (let index = 0; index < this.enemySprites.length; index += 1) {
      const state = combat.enemies.states[index];
      const sprite = this.enemySprites[index];
      sprite.visible = state.active;
      if (!state.active) continue;
      const texture = this.enemyTextures[state.kind];
      if (sprite.texture !== texture) sprite.texture = texture;
      sprite.position.set(state.x, state.y);
      sprite.alpha = Math.max(0.55, state.health / state.maxHealth);
    }

    for (let index = 0; index < this.projectileSprites.length; index += 1) {
      const state = combat.projectiles.states[index];
      const sprite = this.projectileSprites[index];
      sprite.visible = state.active;
      if (!state.active) continue;
      sprite.position.set(state.x, state.y);
      sprite.rotation = Math.atan2(state.vy, state.vx);
    }

  }

  public renderPlayer(state: PlayerState): void {
    this.player.position.set(state.x, state.y);
  }
}
