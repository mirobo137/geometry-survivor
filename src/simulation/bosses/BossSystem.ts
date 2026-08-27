import { BOSS_DEFINITION, type BossDefinition } from '../../content/bosses/BossDefinition';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import type { BossRenderState } from '../combat/CombatRenderState';
import type { EnemyState } from '../combat/EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';

export type BossPhase = BossRenderState['phase'];

const FULL_CIRCLE = Math.PI * 2;
const HALF_LINE = Math.PI;
const SWEEP_ANGLE_STEP = 0.741;
const SAFE_GAP_ANGLE_STEP = 1.913;
const EPSILON = 0.000001;

/** Runs the single authored boss pattern set without depending on Pixi or UI. */
export class BossSystem {
  public readonly state: BossRenderState;
  private boss: EnemyState | null = null;
  private phase: BossPhase = 'inactive';
  private phaseTimer = 0;
  private attackIndex = 0;
  private hitApplied = false;
  private arenaRadius = 0;

  public constructor(
    private readonly enemies: EnemySystem,
    private readonly definition: BossDefinition = BOSS_DEFINITION
  ) {
    this.state = {
      active: false,
      x: ARENA_CENTER.x,
      y: ARENA_CENTER.y - definition.spawnDistance,
      radius: 0,
      health: 0,
      maxHealth: 0,
      phase: 'inactive',
      progress: 0,
      sweepAngle: 0,
      ringRadius: definition.ringStartRadius,
      safeGapAngle: 0,
      safeGapHalfAngle: definition.safeGapHalfAngle
    };
  }

  /** Advances the boss and returns damage dealt to the player this step. */
  public update(
    dtSeconds: number,
    elapsedSeconds: number,
    player: PlayerState,
    arenaRadius: number
  ): number {
    if (this.phase === 'defeated') return 0;
    this.arenaRadius = Math.max(0, arenaRadius);
    if (!this.boss) {
      if (elapsedSeconds + EPSILON < this.definition.startSeconds) return 0;
      this.boss = this.enemies.spawnBoss(arenaRadius, this.definition.spawnDistance);
      if (!this.boss) return 0;
      this.phase = 'intro';
      this.phaseTimer = 0;
      this.hitApplied = false;
      this.syncState();
      return 0;
    }
    if (!this.boss.active) {
      this.markDefeated();
      return 0;
    }

    let remaining = Math.min(Math.max(dtSeconds, 0), 0.1);
    let damage = 0;
    while (remaining > EPSILON) {
      const duration = this.phaseDuration();
      const step = Math.min(remaining, Math.max(0, duration - this.phaseTimer));
      this.phaseTimer += step;
      remaining -= step;
      this.syncState();

      if (this.phase === 'sweep-active' && !this.hitApplied) {
        this.hitApplied = true;
        if (this.intersectsSweep(player, arenaRadius)) damage = this.definition.damage;
      }
      if (this.phase === 'ring-active' && !this.hitApplied && this.intersectsRing(player)) {
        this.hitApplied = true;
        damage = this.definition.damage;
      }

      if (this.phaseTimer + EPSILON < duration) continue;
      this.phaseTimer = 0;
      this.advancePhase();
    }
    this.syncState();
    return damage;
  }

  /** Marks the dedicated boss as defeated when a weapon releases its pooled state. */
  public markDefeated(): void {
    this.boss = null;
    this.phase = 'defeated';
    this.phaseTimer = 0;
    this.hitApplied = true;
    this.state.active = false;
    this.state.health = 0;
    this.state.phase = 'defeated';
    this.state.progress = 0;
  }

  public reset(): void {
    this.boss = null;
    this.phase = 'inactive';
    this.phaseTimer = 0;
    this.attackIndex = 0;
    this.hitApplied = false;
    this.arenaRadius = 0;
    this.state.active = false;
    this.state.x = ARENA_CENTER.x;
    this.state.y = ARENA_CENTER.y - this.definition.spawnDistance;
    this.state.radius = 0;
    this.state.health = 0;
    this.state.maxHealth = 0;
    this.state.phase = 'inactive';
    this.state.progress = 0;
    this.state.sweepAngle = 0;
    this.state.ringRadius = this.definition.ringStartRadius;
    this.state.safeGapAngle = 0;
    this.state.safeGapHalfAngle = this.definition.safeGapHalfAngle;
  }

  private phaseDuration(): number {
    if (this.phase === 'intro') return this.definition.introSeconds;
    if (this.phase === 'sweep-telegraph') return this.definition.sweepTelegraphSeconds;
    if (this.phase === 'sweep-active') return this.definition.sweepActiveSeconds;
    if (this.phase === 'ring-telegraph') return this.definition.ringTelegraphSeconds;
    if (this.phase === 'ring-active') return this.definition.ringActiveSeconds;
    return this.definition.recoverySeconds;
  }

  private advancePhase(): void {
    if (this.phase === 'intro') {
      this.startPattern();
    } else if (this.phase === 'sweep-telegraph') {
      this.phase = 'sweep-active';
      this.hitApplied = false;
    } else if (this.phase === 'sweep-active') {
      this.phase = 'recovery';
    } else if (this.phase === 'ring-telegraph') {
      this.phase = 'ring-active';
      this.hitApplied = false;
    } else if (this.phase === 'ring-active') {
      this.phase = 'recovery';
    } else {
      this.attackIndex += 1;
      this.startPattern();
    }
  }

  private startPattern(): void {
    this.phaseTimer = 0;
    this.hitApplied = false;
    if (this.attackIndex % 2 === 0) {
      this.phase = 'sweep-telegraph';
      this.state.sweepAngle = (this.attackIndex * SWEEP_ANGLE_STEP) % HALF_LINE;
    } else {
      this.phase = 'ring-telegraph';
      this.state.safeGapAngle = (this.attackIndex * SAFE_GAP_ANGLE_STEP) % FULL_CIRCLE;
      this.state.ringRadius = this.definition.ringStartRadius;
    }
  }

  private syncState(): void {
    const boss = this.boss;
    if (!boss) {
      this.state.active = false;
      this.state.phase = this.phase;
      this.state.progress = 0;
      return;
    }
    this.state.active = boss.active;
    this.state.x = boss.x;
    this.state.y = boss.y;
    this.state.radius = boss.radius;
    this.state.health = Math.max(0, boss.health);
    this.state.maxHealth = boss.maxHealth;
    this.state.safeGapHalfAngle = this.definition.safeGapHalfAngle;
    this.state.phase = this.phase;
    this.state.progress = this.phase === 'inactive' || this.phase === 'defeated'
      ? 0
      : Math.min(1, this.phaseTimer / this.phaseDuration());
    if (this.phase === 'ring-active') {
      this.state.ringRadius = this.definition.ringStartRadius
        + (this.state.progress * Math.max(0, this.currentRingEndRadius() - this.definition.ringStartRadius));
    }
  }

  private currentRingEndRadius(): number {
    return this.arenaRadius > 0
      ? this.arenaRadius + this.definition.ringEndPadding
      : this.definition.ringStartRadius;
  }

  private intersectsSweep(player: PlayerState, arenaRadius: number): boolean {
    const dx = player.x - ARENA_CENTER.x;
    const dy = player.y - ARENA_CENTER.y;
    const perpendicularDistance = Math.abs(dx * Math.sin(this.state.sweepAngle) - dy * Math.cos(this.state.sweepAngle));
    const alongDistance = Math.abs(dx * Math.cos(this.state.sweepAngle) + dy * Math.sin(this.state.sweepAngle));
    return perpendicularDistance <= player.radius + this.definition.sweepWidth * 0.5
      && alongDistance <= arenaRadius + player.radius;
  }

  private intersectsRing(player: PlayerState): boolean {
    const dx = player.x - ARENA_CENTER.x;
    const dy = player.y - ARENA_CENTER.y;
    const distance = Math.hypot(dx, dy);
    if (Math.abs(distance - this.state.ringRadius) > player.radius + this.definition.ringWidth * 0.5) return false;
    const angle = Math.atan2(dy, dx);
    const delta = Math.abs(Math.atan2(
      Math.sin(angle - this.state.safeGapAngle),
      Math.cos(angle - this.state.safeGapAngle)
    ));
    return delta > this.definition.safeGapHalfAngle;
  }
}
