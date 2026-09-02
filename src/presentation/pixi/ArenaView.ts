import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';

export class ArenaView {
  public readonly root = new Container();
  private readonly arena = new Graphics();
  private readonly resonance = new Graphics();
  private readonly shockwave = new Graphics();
  private arenaRadius = -1;
  private arenaGeometryReady = false;
  private shockwaveLifeSeconds = 0;
  private shockwaveMaxLifeSeconds = 0;
  private shockwaveStartRadius = 0;
  private shockwaveEndRadius = 0;

  public constructor() {
    this.root.addChild(this.arena, this.resonance, this.shockwave);
    this.shockwave.visible = false;
    this.arena.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    this.render(ARENA_RADIUS);
  }

  public render(radius: number, resonance = 0): void {
    if (this.arenaRadius === radius && !this.resonance.visible && resonance <= 0 && this.shockwaveLifeSeconds <= 0) return;
    if (this.arenaRadius >= 0 && radius > this.arenaRadius + 0.5) {
      this.shockwaveStartRadius = this.arenaRadius;
      this.shockwaveEndRadius = radius + 28;
      this.shockwaveMaxLifeSeconds = 0.58;
      this.shockwaveLifeSeconds = this.shockwaveMaxLifeSeconds;
    }
    if (!this.arenaGeometryReady) {
      this.arena
        .beginPath()
        .circle(0, 0, ARENA_RADIUS)
        .fill({ color: 0x111a36, alpha: 1 })
        .stroke({ color: 0x4b6cb7, width: 3, alpha: 0.9 })
        .beginPath()
        .circle(0, 0, Math.max(0, ARENA_RADIUS - 40))
        .stroke({ color: 0x26365f, width: 2, alpha: 0.8 })
        .beginPath()
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
    } else {
      this.resonance.visible = true;
      this.resonance.clear();
      this.resonance
        .beginPath()
        .circle(ARENA_CENTER.x, ARENA_CENTER.y, radius + 10 + resonance * 16)
        .stroke({ color: 0x75e6ff, width: 4 + resonance * 3, alpha: 0.18 + resonance * 0.42 });
    }

    this.shockwave.clear();
    this.shockwave.visible = this.shockwaveLifeSeconds > 0;
    if (this.shockwaveLifeSeconds > 0) {
      const progress = 1 - this.shockwaveLifeSeconds / this.shockwaveMaxLifeSeconds;
      const eased = progress * progress * (3 - 2 * progress);
      const shockwaveRadius = this.shockwaveStartRadius
        + (this.shockwaveEndRadius - this.shockwaveStartRadius) * eased;
      this.shockwave
        .beginPath()
        .circle(ARENA_CENTER.x, ARENA_CENTER.y, shockwaveRadius)
        .stroke({
          color: 0x9bf4ff,
          width: 5 - progress * 3,
          alpha: (1 - progress) * 0.78
        });
    }
  }

  public update(deltaSeconds: number): void {
    if (this.shockwaveLifeSeconds <= 0) return;
    this.shockwaveLifeSeconds = Math.max(0, this.shockwaveLifeSeconds - Math.min(Math.max(deltaSeconds, 0), 0.1));
    if (this.shockwaveLifeSeconds <= 0) this.shockwave.visible = false;
  }

  public reset(): void {
    this.arenaRadius = -1;
    this.shockwaveLifeSeconds = 0;
    this.shockwaveMaxLifeSeconds = 0;
    this.shockwave.clear();
    this.shockwave.visible = false;
    this.resonance.clear();
    this.resonance.visible = false;
  }
}
