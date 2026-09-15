import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { ChainSegmentState } from './CombatRenderState';
import type { ChainExplosionState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';
import type { ChainEvolution } from '../../content/weapons/WeaponEvolutionDefinitions';
import type { ArenaBoundaryInput } from '../ArenaBoundary';
import { CHAIN_SEGMENT_POOL_CAPACITY } from '../../config/constants';

const CHAIN_DEFINITION = WEAPON_DEFINITIONS.chainLightning;
const THUNDERHEAD_DELAY_SECONDS = 0.2;
const THUNDERHEAD_LIFE_SECONDS = 0.3;
const THUNDERHEAD_RADIUS = 70;
const CIRCUIT_SECONDS = 0.9;
const CIRCUIT_TICK_SECONDS = 0.2;
const CIRCUIT_LINE_WIDTH = 10;

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
  public readonly segments = Array.from({ length: CHAIN_SEGMENT_POOL_CAPACITY }, createChainSegmentState);
  public readonly explosions = Array.from({ length: CHAIN_DEFINITION.maxTargets + 2 }, createChainExplosionState);
  private readonly hitIndices = Array.from({ length: CHAIN_SEGMENT_POOL_CAPACITY }, () => -1);
  private readonly circuitHitMarkers: Uint32Array;
  private readonly circuitHitGenerations: Uint32Array;
  private unlocked = false;
  private damage = CHAIN_DEFINITION.damage;
  private maxTargets = CHAIN_DEFINITION.maxTargets;
  private jumpRadius = CHAIN_DEFINITION.jumpRadius;
  private rank = 1;
  private permanentDamageMultiplier = 1;
  private evolution: ChainEvolution | null = null;
  private castSequence = 0;
  private circuitTimer = 0;
  private circuitTick = 0;

  public constructor(private readonly context: ChainBehaviorContext) {
    this.circuitHitMarkers = new Uint32Array(context.enemies.pool.capacity);
    this.circuitHitGenerations = new Uint32Array(context.enemies.pool.capacity);
  }

  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public get currentEvolution(): ChainEvolution | null {
    return this.evolution;
  }

  public get currentRank(): number {
    return this.rank;
  }

  public get currentMaxTargets(): number {
    return this.maxTargets;
  }

  public get currentJumpRadius(): number {
    return this.jumpRadius;
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
    this.applyRankTuning();
  }

  /** Applies one focused-path rank without creating a second upgrade stack. */
  public setRank(rank: 2 | 3 | 4 | 5 | 6 | 7): boolean {
    if (rank !== this.rank + 1) return false;
    this.rank = rank;
    this.applyRankTuning();
    return true;
  }

  public setEvolution(evolution: ChainEvolution): boolean {
    if (this.evolution !== null) return false;
    this.evolution = evolution;
    return true;
  }

  public setArenaBoundary(boundary: ArenaBoundaryInput): void {
    void boundary;
  }

  public updateSegments(dtSeconds: number): void {
    for (const segment of this.segments) {
      if (!segment.active) continue;
      segment.lifeSeconds -= dtSeconds;
      if (segment.lifeSeconds <= 0) segment.active = false;
    }
    this.circuitTimer += Math.max(0, dtSeconds);
    while (this.circuitTimer >= CIRCUIT_TICK_SECONDS) {
      this.circuitTimer -= CIRCUIT_TICK_SECONDS;
      this.damageCircuit();
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
    // Thunderhead changes the damage distribution, not the authored reach of
    // the chain. It marks at most two real links after the chain is built, so
    // rank VII still reaches five targets.
    const maxTargets = this.maxTargets;
    let targetCount = 0;
    for (let targetIndex = 0; targetIndex < maxTargets; targetIndex += 1) {
      const searchRadius = targetIndex === 0 ? 960 : this.jumpRadius;
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
      segment.persistent = false;
      this.hitIndices[targetIndex] = enemyIndex;
      enemy.health -= this.context.rollCriticalDamage(
        this.damage * (this.evolution === 'closed_circuit' ? 0.4 : 1)
      );
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
      currentX = enemy.x;
      currentY = enemy.y;
      targetCount += 1;
      if (this.evolution === 'thunderhead' && targetIndex < 2) {
        this.scheduleExplosion(targetIndex, enemy.x, enemy.y);
      }
    }
    if (this.evolution === 'closed_circuit') this.createCircuit(player.x, player.y, targetCount);
  }

  public reset(): void {
    for (const segment of this.segments) {
      segment.active = false;
      segment.x1 = 0;
      segment.y1 = 0;
      segment.x2 = 0;
      segment.y2 = 0;
      segment.lifeSeconds = 0;
      segment.persistent = false;
    }
    this.hitIndices.fill(-1);
    for (const explosion of this.explosions) {
      explosion.active = false;
      explosion.phase = 'telegraph';
      explosion.progress = 0;
      explosion.sequence = 0;
    }
    this.unlocked = false;
    this.rank = 1;
    this.damage = CHAIN_DEFINITION.damage * this.permanentDamageMultiplier;
    this.maxTargets = CHAIN_DEFINITION.maxTargets;
    this.jumpRadius = CHAIN_DEFINITION.jumpRadius;
    this.evolution = null;
    this.castSequence = 0;
    this.circuitTimer = 0;
    this.circuitTick = 0;
    this.circuitHitMarkers.fill(0);
    this.circuitHitGenerations.fill(0);
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

  private createCircuit(originX: number, originY: number, targetCount: number): void {
    const nodeCount = Math.min(3, targetCount);
    if (nodeCount <= 0) return;
    const nodes = Array.from({ length: nodeCount }, (_, index) => {
      const enemy = this.context.enemies.getState(this.hitIndices[index]);
      return enemy.active && enemy.health > 0
        ? { x: enemy.x, y: enemy.y }
        : { x: originX, y: originY };
    });
    let segmentIndex = targetCount;
    const createSegment = (x1: number, y1: number, x2: number, y2: number): void => {
      const segment = this.segments[segmentIndex];
      if (!segment) return;
      segment.active = true;
      segment.persistent = true;
      segment.x1 = x1;
      segment.y1 = y1;
      segment.x2 = x2;
      segment.y2 = y2;
      segment.lifeSeconds = CIRCUIT_SECONDS;
      segmentIndex += 1;
    };
    if (nodeCount === 1) createSegment(originX, originY, nodes[0].x, nodes[0].y);
    if (nodeCount === 2) createSegment(nodes[0].x, nodes[0].y, nodes[1].x, nodes[1].y);
    if (nodeCount === 3) {
      createSegment(nodes[0].x, nodes[0].y, nodes[1].x, nodes[1].y);
      createSegment(nodes[1].x, nodes[1].y, nodes[2].x, nodes[2].y);
      createSegment(nodes[2].x, nodes[2].y, nodes[0].x, nodes[0].y);
    }
    this.circuitTimer = 0;
  }

  private damageCircuit(): void {
    let hasCircuit = false;
    for (const segment of this.segments) {
      if (segment.active && segment.persistent) {
        hasCircuit = true;
        break;
      }
    }
    if (!hasCircuit) return;
    this.circuitTick = this.circuitTick >= 2_000_000_000 ? 1 : this.circuitTick + 1;
    for (const segment of this.segments) {
      if (!segment.active || !segment.persistent) continue;
      const dx = segment.x2 - segment.x1;
      const dy = segment.y2 - segment.y1;
      const length = Math.hypot(dx, dy);
      const candidates = this.context.enemies.queryCircle(
        (segment.x1 + segment.x2) * 0.5,
        (segment.y1 + segment.y2) * 0.5,
        length * 0.5 + CIRCUIT_LINE_WIDTH + 48
      );
      for (const index of candidates) {
        const enemy = this.context.enemies.getState(index);
        if (!enemy.active || enemy.health <= 0) continue;
        if (this.circuitHitMarkers[index] === this.circuitTick
          && this.circuitHitGenerations[index] === enemy.generation) continue;
        if (distanceToSegmentSquared(enemy.x, enemy.y, segment.x1, segment.y1, dx, dy)
          > (CIRCUIT_LINE_WIDTH * 0.5 + enemy.radius) ** 2) continue;
        this.circuitHitMarkers[index] = this.circuitTick;
        this.circuitHitGenerations[index] = enemy.generation;
        enemy.health -= this.context.rollCriticalDamage(this.damage * 0.12);
        if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
      }
    }
  }

  private applyRankTuning(): void {
    this.damage = (this.rank >= 6 ? 18 : this.rank >= 2 ? 16 : CHAIN_DEFINITION.damage)
      * this.permanentDamageMultiplier;
    this.maxTargets = this.rank >= 7 ? 5 : this.rank >= 3 ? 4 : CHAIN_DEFINITION.maxTargets;
    this.jumpRadius = this.rank >= 4 ? 210 : CHAIN_DEFINITION.jumpRadius;
  }
}

const distanceToSegmentSquared = (
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number
): number => {
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const progress = lengthSquared <= 0.000001
    ? 0
    : Math.min(1, Math.max(0, ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / lengthSquared));
  const closestX = startX + deltaX * progress;
  const closestY = startY + deltaY * progress;
  return (pointX - closestX) ** 2 + (pointY - closestY) ** 2;
};

const normalizeMultiplier = (value: number): number => (
  Number.isFinite(value) && value > 0 ? value : 1
);
