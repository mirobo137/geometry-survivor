import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';

export class ArenaView {
  public readonly root = new Container();
  private readonly arena = new Graphics();
  private readonly resonance = new Graphics();
  private arenaRadius = -1;
  private arenaGeometryReady = false;

  public constructor() {
    this.root.addChild(this.arena, this.resonance);
    this.arena.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    this.render(ARENA_RADIUS);
  }

  public render(radius: number, resonance = 0): void {
    if (this.arenaRadius === radius && !this.resonance.visible && resonance <= 0) return;
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
    if (resonance <= 0) {
      if (this.resonance.visible) {
        this.resonance.clear();
        this.resonance.visible = false;
      }
      return;
    }

    this.resonance.visible = true;
    this.resonance.clear();
    this.resonance
      .circle(ARENA_CENTER.x, ARENA_CENTER.y, radius + 10 + resonance * 16)
      .stroke({ color: 0x75e6ff, width: 4 + resonance * 3, alpha: 0.18 + resonance * 0.42 });
  }
}
