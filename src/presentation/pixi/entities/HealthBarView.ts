import { Container, Graphics } from 'pixi.js';
import { FX_QUALITY, type FxQuality } from '../../../content/visual/VisualTokens';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';

const RECENT_DAMAGE_SECONDS = 1;
const BAR_WIDTH = 46;
const BAR_HEIGHT = 5;

/** Shared dynamic geometry for a limited set of recently relevant enemy bars. */
export class HealthBarView {
  public readonly root = new Container();
  private readonly graphics = new Graphics();
  private readonly recentUntil: number[];
  private readonly limit: number;
  private activeBars = 0;

  public constructor(enemyCapacity: number, quality: FxQuality = 'medium') {
    this.limit = FX_QUALITY[quality].healthBarLimit;
    this.recentUntil = Array.from({ length: enemyCapacity }, () => Number.NEGATIVE_INFINITY);
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.graphics);
  }

  public get activeBarCount(): number {
    return this.activeBars;
  }

  public noteDamage(enemyIndex: number, animationSeconds: number): void {
    this.recentUntil[enemyIndex] = animationSeconds + RECENT_DAMAGE_SECONDS;
  }

  public render(enemies: readonly EnemyRenderState[], animationSeconds: number): void {
    this.graphics.clear();
    this.activeBars = 0;
    if (this.limit === 0) {
      this.root.visible = false;
      return;
    }

    // Tanks and elites are always relevant. Render them first so horde damage
    // cannot crowd their bars out of the fixed visual budget.
    for (let index = 0; index < enemies.length && this.activeBars < this.limit; index += 1) {
      const state = enemies[index];
      if (state.active && (state.kind === 'tank' || state.kind === 'elite')) this.draw(state);
    }
    for (let index = 0; index < enemies.length && this.activeBars < this.limit; index += 1) {
      const state = enemies[index];
      if (!state.active || state.kind === 'tank' || state.kind === 'elite' || state.kind === 'boss') continue;
      if (this.recentUntil[index] >= animationSeconds) this.draw(state);
    }
    this.root.visible = this.activeBars > 0;
  }

  public clear(): void {
    this.recentUntil.fill(Number.NEGATIVE_INFINITY);
    this.graphics.clear();
    this.activeBars = 0;
    this.root.visible = false;
  }

  private draw(state: EnemyRenderState): void {
    const ratio = state.maxHealth > 0 ? Math.max(0, Math.min(1, state.health / state.maxHealth)) : 0;
    const left = state.x - BAR_WIDTH * 0.5;
    const top = state.y - Math.max(32, state.radius + 14);
    this.graphics
      .beginPath()
      .rect(left, top, BAR_WIDTH, BAR_HEIGHT)
      .fill({ color: 0x071120, alpha: 0.9 })
      .beginPath()
      .rect(left, top, BAR_WIDTH * ratio, BAR_HEIGHT)
      .fill({ color: state.kind === 'elite' ? 0xff5fd2 : state.kind === 'tank' ? 0xc58cff : 0x75e6ff, alpha: 0.95 })
      .beginPath()
      .rect(left, top, BAR_WIDTH, BAR_HEIGHT)
      .stroke({ color: 0xeaf0ff, width: 1, alpha: 0.7 });
    this.activeBars += 1;
  }
}
