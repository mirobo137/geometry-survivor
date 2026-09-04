import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { ChainSegmentState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';

const CHAIN_DEFINITION = WEAPON_DEFINITIONS.chainLightning;

export interface ChainBehaviorContext {
  readonly enemies: EnemySystem;
  readonly rollCriticalDamage: (baseDamage: number) => number;
  readonly onEnemyDefeated: (enemy: EnemyState) => void;
}

const createChainSegmentState = (): ChainSegmentState => ({
  active: false,
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
  lifeSeconds: 0
});

/** Owns chain targeting, segment lifetime and one-hit-per-target-per-cast state. */
export class ChainBehavior {
  public readonly segments = Array.from({ length: CHAIN_DEFINITION.maxTargets }, createChainSegmentState);
  private readonly hitIndices = Array.from({ length: CHAIN_DEFINITION.maxTargets }, () => -1);
  private unlocked = false;
  private damage = CHAIN_DEFINITION.damage;

  public constructor(private readonly context: ChainBehaviorContext) {}

  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public unlock(): boolean {
    if (this.unlocked) return false;
    this.unlocked = true;
    return true;
  }

  public increaseDamage(amount: number): void {
    this.damage += Math.max(0, amount);
  }

  public updateSegments(dtSeconds: number): void {
    for (const segment of this.segments) {
      if (!segment.active) continue;
      segment.lifeSeconds -= dtSeconds;
      if (segment.lifeSeconds <= 0) segment.active = false;
    }
  }

  public fire(player: PlayerState): void {
    this.hitIndices.fill(-1);
    let currentX = player.x;
    let currentY = player.y;
    for (let targetIndex = 0; targetIndex < CHAIN_DEFINITION.maxTargets; targetIndex += 1) {
      const searchRadius = targetIndex === 0 ? 960 : CHAIN_DEFINITION.jumpRadius;
      const enemyIndex = this.context.enemies.findNearestEnemyIndex(
        currentX,
        currentY,
        searchRadius,
        this.hitIndices,
        targetIndex
      );
      if (enemyIndex < 0) break;
      const enemy = this.context.enemies.getState(enemyIndex);
      const segment = this.segments[targetIndex];
      segment.active = true;
      segment.x1 = currentX;
      segment.y1 = currentY;
      segment.x2 = enemy.x;
      segment.y2 = enemy.y;
      segment.lifeSeconds = CHAIN_DEFINITION.segmentLifetimeSeconds;
      this.hitIndices[targetIndex] = enemyIndex;
      enemy.health -= this.context.rollCriticalDamage(this.damage);
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
      currentX = enemy.x;
      currentY = enemy.y;
    }
  }

  public reset(): void {
    for (const segment of this.segments) {
      segment.active = false;
      segment.x1 = 0;
      segment.y1 = 0;
      segment.x2 = 0;
      segment.y2 = 0;
      segment.lifeSeconds = 0;
    }
    this.hitIndices.fill(-1);
    this.unlocked = false;
    this.damage = CHAIN_DEFINITION.damage;
  }
}
