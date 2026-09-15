import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { ChainSegmentState } from './CombatRenderState';
import type { ChainExplosionState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';
import type { ChainEvolution } from '../../content/weapons/WeaponEvolutionDefinitions';
import { ARENA_CENTER } from '../../config/constants';
import { asArenaBoundary, getArenaRadiusAtAngle, type ArenaBoundaryInput } from '../ArenaBoundary';

const CHAIN_DEFINITION = WEAPON_DEFINITIONS.chainLightning;
// Five direct targets for Closed Circuit plus one optional return segment.
const CHAIN_SEGMENT_CAPACITY = CHAIN_DEFINITION.maxTargets + 3;
const THUNDERHEAD_DELAY_SECONDS = 0.16;
const THUNDERHEAD_LIFE_SECONDS = 0.28;
const THUNDERHEAD_RADIUS = 54;

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

const createChainExplosionState = (): ChainExplosionState => ({
  active: false,
  phase: 'telegraph',
  x: 0,
  y: 0,
  radius: THUNDERHEAD_RADIUS,
  progress: 0,
  sequence: 0
});

/** Owns chain targeting, segment lifetime and one-hit-per-target-per-cast state. */
export class ChainBehavior {
  public readonly segments = Array.from({ length: CHAIN_SEGMENT_CAPACITY }, createChainSegmentState);
  public readonly explosions = Array.from({ length: CHAIN_DEFINITION.maxTargets + 2 }, createChainExplosionState);
  private readonly hitIndices = Array.from({ length: CHAIN_SEGMENT_CAPACITY }, () => -1);
  private unlocked = false;
  private damage = CHAIN_DEFINITION.damage;
  private permanentDamageMultiplier = 1;
  private evolution: ChainEvolution | null = null;
  private arenaBoundary: ArenaBoundaryInput = 270;
  private castSequence = 0;

  public constructor(private readonly context: ChainBehaviorContext) {}

  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public get currentEvolution(): ChainEvolution | null {
    return this.evolution;
  }

  public unlock(): boolean {
    if (this.unlocked) return false;
    this.unlocked = true;
    return true;
  }

  public increaseDamage(amount: number): void {
    this.damage += Math.max(0, amount);
  }

  /** Applies the permanent damage branch to every jump in a cast. */
  public setPermanentDamageMultiplier(multiplier: number): void {
    this.permanentDamageMultiplier = normalizeMultiplier(multiplier);
    this.damage = CHAIN_DEFINITION.damage * this.permanentDamageMultiplier;
  }

  public setEvolution(evolution: ChainEvolution): boolean {
    if (this.evolution !== null) return false;
    this.evolution = evolution;
    return true;
  }

  public setArenaBoundary(boundary: ArenaBoundaryInput): void {
    this.arenaBoundary = boundary;
  }

  public updateSegments(dtSeconds: number): void {
    for (const segment of this.segments) {
      if (!segment.active) continue;
      segment.lifeSeconds -= dtSeconds;
      if (segment.lifeSeconds <= 0) segment.active = false;
    }
    for (let index = 0; index < this.explosions.length; index += 1) {
      const explosion = this.explosions[index];
      if (!explosion.active) continue;
      if (explosion.phase === 'telegraph') {
        explosion.progress = Math.min(1, explosion.progress + dtSeconds / THUNDERHEAD_DELAY_SECONDS);
        if (explosion.progress >= 1) {
          explosion.phase = 'active';
          explosion.progress = 0;
          this.detonateExplosion(explosion);
        }
      } else {
        explosion.progress = Math.min(1, explosion.progress + dtSeconds / THUNDERHEAD_LIFE_SECONDS);
        if (explosion.progress >= 1) explosion.active = false;
      }
    }
  }

  public fire(player: PlayerState): void {
    this.hitIndices.fill(-1);
    let currentX = player.x;
    let currentY = player.y;
    this.castSequence = this.castSequence >= 2_000_000_000 ? 1 : this.castSequence + 1;
    const maxTargets = this.evolution === 'closed_circuit'
      ? CHAIN_DEFINITION.maxTargets + 2
      : this.evolution === 'thunderhead' ? CHAIN_DEFINITION.maxTargets - 1 : CHAIN_DEFINITION.maxTargets;
    let targetCount = 0;
    for (let targetIndex = 0; targetIndex < maxTargets; targetIndex += 1) {
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
      targetCount += 1;
      if (this.evolution === 'thunderhead') this.scheduleExplosion(targetIndex, enemy.x, enemy.y);
    }
    if (this.evolution === 'closed_circuit' && targetCount > 1 && this.isNearArenaEdge(currentX, currentY)) {
      const first = this.context.enemies.getState(this.hitIndices[0]);
      const segment = this.segments[targetCount];
      segment.active = true;
      segment.x1 = currentX;
      segment.y1 = currentY;
      segment.x2 = first.active ? first.x : player.x;
      segment.y2 = first.active ? first.y : player.y;
      segment.lifeSeconds = CHAIN_DEFINITION.segmentLifetimeSeconds;
      for (let index = 0; index < targetCount; index += 1) {
        const enemy = this.context.enemies.getState(this.hitIndices[index]);
        if (!enemy.active || enemy.health <= 0) continue;
        enemy.health -= this.context.rollCriticalDamage(this.damage * 0.35);
        if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
      }
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
    for (const explosion of this.explosions) {
      explosion.active = false;
      explosion.phase = 'telegraph';
      explosion.progress = 0;
      explosion.sequence = 0;
    }
    this.unlocked = false;
    this.damage = CHAIN_DEFINITION.damage * this.permanentDamageMultiplier;
    this.evolution = null;
    this.castSequence = 0;
  }

  private scheduleExplosion(index: number, x: number, y: number): void {
    const explosion = this.explosions[index];
    explosion.active = true;
    explosion.phase = 'telegraph';
    explosion.x = x;
    explosion.y = y;
    explosion.radius = THUNDERHEAD_RADIUS;
    explosion.progress = 0;
    explosion.sequence = this.castSequence;
  }

  private detonateExplosion(explosion: ChainExplosionState): void {
    const candidates = this.context.enemies.queryCircle(explosion.x, explosion.y, explosion.radius + 48);
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0) continue;
      if (Math.hypot(enemy.x - explosion.x, enemy.y - explosion.y) > explosion.radius + enemy.radius) continue;
      enemy.health -= this.context.rollCriticalDamage(this.damage * 0.45);
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
    }
  }

  private isNearArenaEdge(x: number, y: number): boolean {
    const boundary = asArenaBoundary(this.arenaBoundary);
    const dx = x - ARENA_CENTER.x;
    const dy = y - ARENA_CENTER.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.001) return false;
    const edge = getArenaRadiusAtAngle(boundary, Math.atan2(dy, dx));
    return distance >= edge - 84;
  }
}

const normalizeMultiplier = (value: number): number => (
  Number.isFinite(value) && value > 0 ? value : 1
);
