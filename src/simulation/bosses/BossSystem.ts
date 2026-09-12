import { BOSS_DEFINITION, type BossDefinition, type BossPattern } from '../../content/bosses/BossDefinition';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import type { BossRenderState } from '../combat/CombatRenderState';
import type { EnemyState } from '../combat/EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';

export type BossPhase = BossRenderState['phase'];

const FULL_CIRCLE = Math.PI * 2;
const SWEEP_ANGLE_STEP = 0.741;
const SAFE_GAP_ANGLE_STEP = 1.913;
const EPSILON = 0.000001;
// Replica positions are simulation coordinates, but must leave enough room
// for the 64px visual frame after its 0.72 runtime scale. This prevents a
// complete copy from being placed beyond the arena edge and appearing cut.
const WARDEN_REPLICA_EDGE_MARGIN = 30;

/** Runs the single authored boss pattern set without depending on Pixi or UI. */
export class BossSystem {
  public readonly state: BossRenderState;
  private boss: EnemyState | null = null;
  private phase: BossPhase = 'inactive';
  private phaseTimer = 0;
  private attackIndex = 0;
  private hitApplied = false;
  private arenaRadius = 0;
  private movementAngle = -Math.PI / 2;
  /** True until the first unlocked frame after a committed movement attack. */
  private movementWasLocked = true;
  /** Warden's idle path follows its current endpoint instead of a fixed orbit. */
  private ambientMovementRadius = 0;
  private previousX = ARENA_CENTER.x;
  private previousY = ARENA_CENTER.y;
  private replicaLeftX = ARENA_CENTER.x;
  private replicaLeftY = ARENA_CENTER.y;
  private replicaRightX = ARENA_CENTER.x;
  private replicaRightY = ARENA_CENTER.y;

  public constructor(
    private readonly enemies: EnemySystem,
    private readonly definition: BossDefinition = BOSS_DEFINITION
  ) {
    this.state = {
      bossId: definition.id,
      active: false,
      x: ARENA_CENTER.x,
      y: ARENA_CENTER.y - definition.spawnDistance,
      radius: 0,
      health: 0,
      maxHealth: 0,
      phase: 'inactive',
      progress: 0,
      pattern: 'sweep',
      sweepAngle: 0,
      ringRadius: definition.ringStartRadius,
      safeGapAngle: 0,
      safeGapHalfAngle: definition.safeGapHalfAngle,
      chargeStartX: ARENA_CENTER.x,
      chargeStartY: ARENA_CENTER.y,
      chargeAimX: ARENA_CENTER.x,
      chargeAimY: ARENA_CENTER.y,
      curveRadius: definition.ringStartRadius,
      curveStartAngle: 0,
      curveAngle: 0,
      curveTravelRadians: definition.curveTravelRadians,
      curveDirection: 1,
      replicaSequence: 0,
      replicaLeftX: ARENA_CENTER.x,
      replicaLeftY: ARENA_CENTER.y,
      replicaRightX: ARENA_CENTER.x,
      replicaRightY: ARENA_CENTER.y
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

    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    this.previousX = this.boss.x;
    this.previousY = this.boss.y;

    let remaining = dt;
    let segmentStartX = this.previousX;
    let segmentStartY = this.previousY;
    let damage = 0;
    while (remaining > EPSILON) {
      const duration = this.phaseDuration();
      const step = Math.min(remaining, Math.max(0, duration - this.phaseTimer));
      segmentStartX = this.boss.x;
      segmentStartY = this.boss.y;
      const movementLocked = this.isPatternLockedPhase();
      if (movementLocked) {
        // A telegraphed movement attack is committed. Freeze the boss while
        // it is being read, but never use this branch to cancel the attack.
        if (!this.movementWasLocked) {
          this.boss.vx = 0;
          this.boss.vy = 0;
        }
        this.movementWasLocked = true;
      } else {
        this.updateMovement(step);
      }
      this.phaseTimer += step;
      remaining -= step;
      this.updatePatternGeometry(step);
      this.updateAttackMovement();
      this.syncState();

      if (!this.hitApplied && this.intersectsCurrentPattern(
        player,
        arenaRadius,
        segmentStartX,
        segmentStartY,
        this.boss.x,
        this.boss.y
      )) {
        this.hitApplied = true;
        damage = this.definition.damage;
      }

      if (this.phaseTimer + EPSILON < duration) continue;
      this.phaseTimer = 0;
      this.advancePhase(player);
      segmentStartX = this.boss.x;
      segmentStartY = this.boss.y;
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
    this.state.bossId = this.definition.id;
    this.state.health = 0;
    this.state.phase = 'defeated';
    this.state.progress = 0;
    this.state.pattern = 'sweep';
    this.enemies.clearWardenReplicas();
  }

  public reset(): void {
    this.boss = null;
    this.phase = 'inactive';
    this.phaseTimer = 0;
    this.attackIndex = 0;
    this.hitApplied = false;
    this.arenaRadius = 0;
    this.movementAngle = -Math.PI / 2;
    this.movementWasLocked = true;
    this.ambientMovementRadius = 0;
    this.previousX = ARENA_CENTER.x;
    this.previousY = ARENA_CENTER.y;
    this.replicaLeftX = ARENA_CENTER.x;
    this.replicaLeftY = ARENA_CENTER.y;
    this.replicaRightX = ARENA_CENTER.x;
    this.replicaRightY = ARENA_CENTER.y;
    this.enemies.clearWardenReplicas();
    this.state.active = false;
    this.state.bossId = this.definition.id;
    this.state.x = ARENA_CENTER.x;
    this.state.y = ARENA_CENTER.y - this.definition.spawnDistance;
    this.state.radius = 0;
    this.state.health = 0;
    this.state.maxHealth = 0;
    this.state.phase = 'inactive';
    this.state.progress = 0;
    this.state.pattern = 'sweep';
    this.state.sweepAngle = 0;
    this.state.ringRadius = this.definition.ringStartRadius;
    this.state.safeGapAngle = 0;
    this.state.safeGapHalfAngle = this.definition.safeGapHalfAngle;
    this.state.chargeStartX = ARENA_CENTER.x;
    this.state.chargeStartY = ARENA_CENTER.y;
    this.state.chargeAimX = ARENA_CENTER.x;
    this.state.chargeAimY = ARENA_CENTER.y;
    this.state.curveRadius = this.definition.ringStartRadius;
    this.state.curveStartAngle = 0;
    this.state.curveAngle = 0;
    this.state.curveTravelRadians = this.definition.curveTravelRadians;
    this.state.curveDirection = 1;
    this.state.replicaSequence = 0;
    this.state.replicaLeftX = ARENA_CENTER.x;
    this.state.replicaLeftY = ARENA_CENTER.y;
    this.state.replicaRightX = ARENA_CENTER.x;
    this.state.replicaRightY = ARENA_CENTER.y;
  }

  private updateMovement(dtSeconds: number): void {
    if (!this.boss || dtSeconds <= 0) return;
    const safeRadius = Math.max(0, this.arenaRadius - this.boss.radius - 24);

    // Warden has presence between attacks, but its idle drift is anchored to
    // the endpoint of the previous committed action. Re-projecting to the
    // original orbit here would create a visible teleport after Charge/Curve.
    if (this.definition.id === 'orbital-warden') {
      if (this.movementWasLocked || this.ambientMovementRadius <= EPSILON) {
        const offsetX = this.boss.x - ARENA_CENTER.x;
        const offsetY = this.boss.y - ARENA_CENTER.y;
        const currentRadius = Math.hypot(offsetX, offsetY);
        if (currentRadius > EPSILON) {
          this.movementAngle = Math.atan2(offsetY, offsetX);
          this.ambientMovementRadius = Math.min(currentRadius, safeRadius);
        } else {
          this.ambientMovementRadius = Math.min(this.definition.movementRadius, safeRadius);
        }
      }

      this.movementAngle = normalizeAngle(
        this.movementAngle + this.definition.movementAngularSpeed * dtSeconds
      );
      const movementRadius = Math.min(this.ambientMovementRadius, safeRadius);
      this.boss.x = ARENA_CENTER.x + Math.cos(this.movementAngle) * movementRadius;
      this.boss.y = ARENA_CENTER.y + Math.sin(this.movementAngle) * movementRadius;
      this.boss.vx = -Math.sin(this.movementAngle)
        * this.definition.movementAngularSpeed * movementRadius;
      this.boss.vy = Math.cos(this.movementAngle)
        * this.definition.movementAngularSpeed * movementRadius;
      this.movementWasLocked = false;
      return;
    }

    this.movementAngle =
      (this.movementAngle + this.definition.movementAngularSpeed * dtSeconds) % FULL_CIRCLE;
    const movementRadius = Math.min(this.definition.movementRadius, safeRadius);

    this.boss.x = ARENA_CENTER.x + Math.cos(this.movementAngle) * movementRadius;
    this.boss.y = ARENA_CENTER.y + Math.sin(this.movementAngle) * movementRadius;
    this.boss.vx = -Math.sin(this.movementAngle)
      * this.definition.movementAngularSpeed * movementRadius;
    this.boss.vy = Math.cos(this.movementAngle)
      * this.definition.movementAngularSpeed * movementRadius;
    this.movementWasLocked = false;
  }

  private phaseDuration(): number {
    if (this.phase === 'intro') return this.definition.introSeconds;
    if (this.phase === 'sweep-telegraph') return this.definition.sweepTelegraphSeconds;
    if (this.phase === 'sweep-active') return this.definition.sweepActiveSeconds;
    if (this.phase === 'charge-telegraph') return this.definition.chargeTelegraphSeconds;
    if (this.phase === 'charge-active') return this.definition.chargeActiveSeconds;
    if (this.phase === 'curve-telegraph') return this.definition.curveTelegraphSeconds;
    if (this.phase === 'curve-active') return this.definition.curveActiveSeconds;
    if (this.phase === 'replicas-telegraph') return this.definition.replicasTelegraphSeconds;
    if (this.phase === 'replicas-active') return this.definition.replicasActiveSeconds;
    if (this.phase === 'ring-telegraph') return this.definition.ringTelegraphSeconds;
    if (this.phase === 'ring-active') return this.definition.ringActiveSeconds;
    return this.definition.recoverySeconds;
  }

  private advancePhase(player: PlayerState): void {
    if (this.phase === 'intro') {
      this.startPattern(player);
    } else if (this.phase === 'sweep-telegraph') {
      this.phase = 'sweep-active';
      this.hitApplied = false;
    } else if (this.phase === 'charge-telegraph') {
      this.phase = 'charge-active';
      this.hitApplied = false;
    } else if (this.phase === 'curve-telegraph') {
      this.phase = 'curve-active';
      this.hitApplied = false;
    } else if (this.phase === 'replicas-telegraph') {
      this.phase = 'replicas-active';
      this.hitApplied = true;
      this.enemies.spawnWardenReplicas(
        this.replicaLeftX,
        this.replicaLeftY,
        this.replicaRightX,
        this.replicaRightY,
        this.arenaRadius
      );
    } else if (this.phase === 'sweep-active') {
      this.phase = 'recovery';
    } else if (this.phase === 'charge-active') {
      this.phase = 'recovery';
    } else if (this.phase === 'curve-active') {
      this.phase = 'recovery';
    } else if (this.phase === 'replicas-active') {
      this.phase = 'recovery';
    } else if (this.phase === 'ring-telegraph') {
      this.phase = 'ring-active';
      this.hitApplied = false;
    } else if (this.phase === 'ring-active') {
      this.phase = 'recovery';
    } else {
      this.attackIndex += 1;
      this.startPattern(player);
    }
  }

  private startPattern(player: PlayerState): void {
    this.phaseTimer = 0;
    this.hitApplied = false;
    const order = this.definition.patternOrder.length > 0
      ? this.definition.patternOrder
      : ['sweep', 'ring'] as const;
    const pattern: BossPattern = order[this.attackIndex % order.length] ?? 'sweep';
    this.state.pattern = pattern;
    if (pattern === 'sweep') {
      this.phase = 'sweep-telegraph';
      this.state.sweepAngle = normalizeAngle(this.attackIndex * SWEEP_ANGLE_STEP);
      return;
    }
    if (pattern === 'ring') {
      this.phase = 'ring-telegraph';
      this.state.safeGapAngle = normalizeAngle(this.attackIndex * SAFE_GAP_ANGLE_STEP);
      this.state.ringRadius = this.definition.ringStartRadius;
      return;
    }
    if (pattern === 'charge') {
      this.phase = 'charge-telegraph';
      // Commit the destination once. Neither the player's later position nor
      // collision at the telegraph boundary may cancel this authored dash.
      this.state.chargeStartX = this.boss?.x ?? ARENA_CENTER.x;
      this.state.chargeStartY = this.boss?.y ?? ARENA_CENTER.y;
      const dx = player.x - this.state.chargeStartX;
      const dy = player.y - this.state.chargeStartY;
      const distance = Math.max(EPSILON, Math.hypot(dx, dy));
      const directionX = distance > EPSILON ? dx / distance : 0;
      const directionY = distance > EPSILON ? dy / distance : 1;
      const safeRadius = Math.max(0, this.arenaRadius - (this.boss?.radius ?? 48) - 24);
      const ox = this.state.chargeStartX - ARENA_CENTER.x;
      const oy = this.state.chargeStartY - ARENA_CENTER.y;
      const dot = ox * directionX + oy * directionY;
      const chargeDistance = Math.max(0, -dot + Math.sqrt(Math.max(0,
        dot * dot + safeRadius * safeRadius - ox * ox - oy * oy)));
      this.state.chargeAimX = this.state.chargeStartX + directionX * chargeDistance;
      this.state.chargeAimY = this.state.chargeStartY + directionY * chargeDistance;
      return;
    }
    if (pattern === 'curve') {
      this.phase = 'curve-telegraph';
      const dx = (this.boss?.x ?? ARENA_CENTER.x) - ARENA_CENTER.x;
      const dy = (this.boss?.y ?? ARENA_CENTER.y) - ARENA_CENTER.y;
      const startAngle = Math.atan2(dy, dx);
      this.state.curveStartAngle = startAngle;
      this.state.curveAngle = startAngle;
      this.state.curveTravelRadians = this.definition.curveTravelRadians;
      this.state.curveDirection = this.attackIndex % 2 === 0 ? 1 : -1;
      this.state.curveRadius = Math.hypot(dx, dy);
      return;
    }
    this.phase = 'replicas-telegraph';
    const baseX = this.boss?.x ?? ARENA_CENTER.x;
    const baseY = this.boss?.y ?? ARENA_CENTER.y;
    const aimAngle = Math.atan2(player.y - baseY, player.x - baseX);
    const spread = this.definition.replicaSpreadRadians;
    const offset = 80;
    const replicaRadius = Math.max(0, this.arenaRadius - WARDEN_REPLICA_EDGE_MARGIN);
    const placeReplica = (angle: number): { x: number; y: number } => {
      const rawX = baseX + Math.cos(angle) * offset;
      const rawY = baseY + Math.sin(angle) * offset;
      const fromCenterX = rawX - ARENA_CENTER.x;
      const fromCenterY = rawY - ARENA_CENTER.y;
      const distanceFromCenter = Math.hypot(fromCenterX, fromCenterY);
      if (distanceFromCenter <= replicaRadius || distanceFromCenter <= EPSILON) {
        return { x: rawX, y: rawY };
      }
      const correction = replicaRadius / distanceFromCenter;
      return {
        x: ARENA_CENTER.x + fromCenterX * correction,
        y: ARENA_CENTER.y + fromCenterY * correction
      };
    };
    const left = placeReplica(aimAngle - spread);
    const right = placeReplica(aimAngle + spread);
    this.replicaLeftX = left.x;
    this.replicaLeftY = left.y;
    this.replicaRightX = right.x;
    this.replicaRightY = right.y;
    this.state.replicaSequence += 1;
    this.state.replicaLeftX = this.replicaLeftX;
    this.state.replicaLeftY = this.replicaLeftY;
    this.state.replicaRightX = this.replicaRightX;
    this.state.replicaRightY = this.replicaRightY;
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
    this.state.bossId = this.definition.id;
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

  private updatePatternGeometry(step: number): void {
    if (step <= 0) return;
    if (this.phase === 'sweep-active' && this.definition.sweepAngularSpeed !== 0) {
      this.state.sweepAngle = normalizeAngle(
        this.state.sweepAngle + this.definition.sweepAngularSpeed * step
      );
    }
    if (this.phase === 'ring-active' && this.definition.ringAngularSpeed !== 0) {
      this.state.safeGapAngle = normalizeAngle(
        this.state.safeGapAngle + this.definition.ringAngularSpeed * step
      );
    }
  }

  private isAttackMovementPhase(): boolean {
    return this.phase === 'charge-active' || this.phase === 'curve-active';
  }

  /**
   * A committed telegraph must keep the authored origin stable. Otherwise a
   * charge/curve marker could drift with the orbital idle movement while the
   * player is reading it, making a correct dodge look like a mismatch.
   */
  private isPatternLockedPhase(): boolean {
    return this.isAttackMovementPhase()
      || this.phase === 'charge-telegraph'
      || this.phase === 'curve-telegraph'
      || this.phase === 'replicas-telegraph'
      || this.phase === 'replicas-active';
  }

  private updateAttackMovement(): void {
    if (!this.boss) return;
    if (this.phase === 'charge-active') {
      const progress = Math.min(1, this.phaseTimer / Math.max(EPSILON, this.definition.chargeActiveSeconds));
      this.boss.x = this.state.chargeStartX
        + (this.state.chargeAimX - this.state.chargeStartX) * progress;
      this.boss.y = this.state.chargeStartY
        + (this.state.chargeAimY - this.state.chargeStartY) * progress;
      this.boss.vx = (this.state.chargeAimX - this.state.chargeStartX)
        / Math.max(EPSILON, this.definition.chargeActiveSeconds);
      this.boss.vy = (this.state.chargeAimY - this.state.chargeStartY)
        / Math.max(EPSILON, this.definition.chargeActiveSeconds);
      return;
    }
    if (this.phase !== 'curve-active') return;
    const travel = Math.min(
      this.definition.curveTravelRadians,
      this.definition.curveAngularSpeed * this.phaseTimer
    );
    const angle = this.state.curveStartAngle + this.state.curveDirection * travel;
    this.state.curveAngle = angle;
    this.boss.x = ARENA_CENTER.x + Math.cos(angle) * this.state.curveRadius;
    this.boss.y = ARENA_CENTER.y + Math.sin(angle) * this.state.curveRadius;
    this.boss.vx = -Math.sin(angle) * this.state.curveDirection * this.state.curveRadius * this.definition.curveAngularSpeed;
    this.boss.vy = Math.cos(angle) * this.state.curveDirection * this.state.curveRadius * this.definition.curveAngularSpeed;
  }

  private intersectsCurrentPattern(
    player: PlayerState,
    arenaRadius: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): boolean {
    if (this.phase === 'sweep-active') return this.intersectsSweep(player, arenaRadius);
    if (this.phase === 'ring-active') return this.intersectsRing(player);
    if (this.phase === 'charge-active') {
      return this.distanceToSegment(player.x, player.y, startX, startY, endX, endY)
        <= player.radius + this.definition.chargeWidth * 0.5 + (this.boss?.radius ?? 0);
    }
    if (this.phase === 'curve-active') {
      return this.distanceToSegment(player.x, player.y, startX, startY, endX, endY)
        <= player.radius + this.definition.curveWidth * 0.5 + (this.boss?.radius ?? 0);
    }
    return false;
  }

  private distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared <= EPSILON) return Math.hypot(px - x1, py - y1);
    const projection = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
    return Math.hypot(px - (x1 + dx * projection), py - (y1 + dy * projection));
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

const normalizeAngle = (angle: number): number => {
  let normalized = angle % FULL_CIRCLE;
  if (normalized <= -Math.PI) normalized += FULL_CIRCLE;
  if (normalized > Math.PI) normalized -= FULL_CIRCLE;
  return normalized;
};
