import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

interface PooledFx {
  readonly sprite: Sprite;
  lifeSeconds: number;
  maxLifeSeconds: number;
  velocityX: number;
  velocityY: number;
  drag: number;
}

/**
 * Reusable presentation-only pool for short-lived sprites.
 *
 * A full pool is allocated once during view construction. Spawning and
 * updating only mutate existing sprites, so a horde cannot create garbage in
 * the fixed-step loop. The pool deliberately drops a request when full; low
 * priority decoration must never grow without bounds.
 */
export class FxPool {
  public readonly root = new Container();
  private readonly items: PooledFx[] = [];
  private active = 0;

  public constructor(texture: Texture, capacity: number) {
    this.root.eventMode = 'none';
    const safeCapacity = Math.max(0, Math.floor(capacity));
    for (let index = 0; index < safeCapacity; index += 1) {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      this.items.push({
        sprite,
        lifeSeconds: 0,
        maxLifeSeconds: 0,
        velocityX: 0,
        velocityY: 0,
        drag: 0.9
      });
    }
  }

  public get capacity(): number {
    return this.items.length;
  }

  public get activeCount(): number {
    return this.active;
  }

  public spawn(
    x: number,
    y: number,
    color: number,
    lifeSeconds: number,
    velocityX: number,
    velocityY: number,
    drag = 0.9,
    scale = 1
  ): boolean {
    let item: PooledFx | undefined;
    for (const candidate of this.items) {
      if (!candidate.sprite.visible) {
        item = candidate;
        break;
      }
    }
    if (!item) return false;

    const life = Math.max(0.001, lifeSeconds);
    item.lifeSeconds = life;
    item.maxLifeSeconds = life;
    item.velocityX = velocityX;
    item.velocityY = velocityY;
    item.drag = Math.min(0.999, Math.max(0, drag));
    item.sprite.position.set(x, y);
    item.sprite.tint = color;
    item.sprite.alpha = 1;
    item.sprite.scale.set(Math.max(0.01, scale));
    item.sprite.rotation = Math.atan2(velocityY, velocityX);
    item.sprite.visible = true;
    this.active += 1;
    return true;
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    if (delta <= 0) return;

    for (const item of this.items) {
      const sprite = item.sprite;
      if (!sprite.visible) continue;
      item.lifeSeconds -= delta;
      if (item.lifeSeconds <= 0) {
        sprite.visible = false;
        sprite.alpha = 0;
        this.active = Math.max(0, this.active - 1);
        continue;
      }

      const drag = Math.pow(item.drag, delta * 60);
      item.velocityX *= drag;
      item.velocityY *= drag;
      sprite.x += item.velocityX * delta;
      sprite.y += item.velocityY * delta;
      const lifeRatio = Math.max(0, item.lifeSeconds / item.maxLifeSeconds);
      sprite.alpha = lifeRatio * lifeRatio;
      sprite.scale.set(Math.max(0.1, lifeRatio));
    }
  }

  public clear(): void {
    for (const item of this.items) {
      item.sprite.visible = false;
      item.sprite.alpha = 0;
      item.lifeSeconds = 0;
    }
    this.active = 0;
  }
}
