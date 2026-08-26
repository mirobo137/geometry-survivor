import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ARENA_CENTER, ARENA_RADIUS, LOGICAL_HEIGHT } from '../config/constants';
import type { PlayerState } from '../simulation/PlayerModel';
import type { ViewportState } from './viewport/ViewportTransform';

export class PixiGameView {
  public readonly root = new Container();
  private readonly world = new Container();
  private readonly arena = new Graphics();
  private readonly player = new Graphics();
  private arenaRadius = -1;
  private arenaGeometryReady = false;
  private readonly title: Text;
  private readonly hint: Text;

  public constructor() {
    this.root.addChild(this.world);
    this.world.addChild(this.arena, this.player);
    this.arena.position.set(ARENA_CENTER.x, ARENA_CENTER.y);

    this.renderArena(ARENA_RADIUS);

    this.player.circle(0, 0, 22).fill({ color: 0x75e6ff }).stroke({ color: 0xf4ffff, width: 3 });
    this.player.circle(0, 0, 7).fill({ color: 0x10213d });

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

  public renderPlayer(state: PlayerState): void {
    this.player.position.set(state.x, state.y);
  }
}
