import { ANGULAR_SWEEP_DEFINITION, type AngularSweepDefinition } from '../../content/hazards/AngularSweepDefinition';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { asArenaBoundary, getArenaRadiusAtAngle, type ArenaBoundaryInput } from '../ArenaBoundary';

export type AngularSweepPhase = 'idle' | 'telegraph' | 'active' | 'recovery';

export interface AngularSweepState {
  phase: AngularSweepPhase;
  /** Centre line of the currently dangerous sector. */
  angle: number;
  /** Angle committed at the start of the cast. */
  startAngle: number;
  progress: number;
  travelProgress: number;
  dangerHalfAngle: number;
  travelRadians: number;
  arenaRadius: number;
  sequence: number;
}

/** Result kept separate from the render state so the view cannot apply damage. */
export interface AngularSweepUpdateResult {
  readonly damaged: boolean;
}

const FULL_CIRCLE = Math.PI * 2;
const EPSILON = 0.000001;

/**
 * Pure Angular hazard. The sector is committed during telegraph, then moves
 * through a bounded arc while active. A player can evade by stepping outside
 * the announced sector or by crossing behind its travel direction.
 */
export class AngularSweepHazard {
  public readonly state: AngularSweepState;
  private phase: AngularSweepPhase = 'idle';
  private phaseTimer = 0;
  private nextTriggerSeconds: number;
  private strikeIndex = 0;
  private hitApplied = false;
  private strikeStartAngle = 0;

  public constructor(private readonly definition: AngularSweepDefinition = ANGULAR_SWEEP_DEFINITION) {
    this.nextTriggerSeconds = definition.firstTriggerSeconds;
    this.state = {
      phase: 'idle',
      angle: 0,
      startAngle: 0,
      progress: 0,
      travelProgress: 0,
      dangerHalfAngle: definition.dangerHalfAngle,
      travelRadians: definition.travelRadians,
      arenaRadius: 0,
      sequence: 0
    };
  }

  public update(
    dtSeconds: number,
    elapsedSeconds: number,
    player: PlayerState,
    arena: ArenaBoundaryInput,
    allowStart = true
  ): AngularSweepUpdateResult {
    let remaining = Math.min(Math.max(dtSeconds, 0), 0.1);
    let damaged = false;

    while (remaining > EPSILON) {
      if (this.phase === 'idle') {
        if (elapsedSeconds + EPSILON < this.nextTriggerSeconds) break;
        if (elapsedSeconds > this.definition.lastTriggerSeconds || !allowStart) break;
        this.startStrike(arena);
      }

      const duration = this.phaseDuration();
      const step = Math.min(remaining, Math.max(0, duration - this.phaseTimer));
      this.phaseTimer += step;
      remaining -= step;
      this.syncState(arena);

      if (this.phase === 'active' && !this.hitApplied && this.intersectsPlayer(player, arena)) {
        this.hitApplied = true;
        damaged = true;
      }

      if (this.phaseTimer + EPSILON < duration) continue;
      this.phaseTimer = 0;
      if (this.phase === 'telegraph') {
        this.phase = 'active';
        this.hitApplied = false;
      } else if (this.phase === 'active') {
        this.phase = 'recovery';
      } else {
        this.phase = 'idle';
        this.nextTriggerSeconds += this.definition.intervalSeconds;
      }
    }

    this.syncState(arena);
    return { damaged };
  }

  public reset(): void {
    this.phase = 'idle';
    this.phaseTimer = 0;
    this.nextTriggerSeconds = this.definition.firstTriggerSeconds;
    this.strikeIndex = 0;
    this.hitApplied = false;
    this.strikeStartAngle = 0;
    Object.assign(this.state, {
      phase: 'idle' as AngularSweepPhase,
      angle: 0,
      startAngle: 0,
      progress: 0,
      travelProgress: 0,
      dangerHalfAngle: this.definition.dangerHalfAngle,
      travelRadians: this.definition.travelRadians,
      arenaRadius: 0,
      sequence: 0
    });
  }

  private startStrike(arena: ArenaBoundaryInput): void {
    const boundary = asArenaBoundary(arena);
    const sector = this.strikeIndex % Math.max(1, this.definition.sectorCount);
    const direction = this.strikeIndex % 2 === 0 ? 1 : -1;
    this.strikeStartAngle = normalizeAngle(
      -Math.PI / 2 + sector * this.definition.startAngleStep
    );
    this.phase = 'telegraph';
    this.phaseTimer = 0;
    this.hitApplied = false;
    this.strikeIndex += 1;
    this.state.startAngle = this.strikeStartAngle;
    this.state.angle = this.strikeStartAngle;
    this.state.travelRadians = direction * Math.abs(this.definition.travelRadians);
    this.state.arenaRadius = boundary.radius;
    this.state.sequence += 1;
  }

  private phaseDuration(): number {
    if (this.phase === 'telegraph') return this.definition.telegraphSeconds;
    if (this.phase === 'active') return this.definition.attackSeconds;
    return this.definition.recoverySeconds;
  }

  private syncState(arena: ArenaBoundaryInput): void {
    this.state.phase = this.phase;
    this.state.progress = this.phase === 'idle'
      ? 0
      : Math.min(1, this.phaseTimer / Math.max(this.phaseDuration(), EPSILON));
    this.state.travelProgress = this.phase === 'active'
      ? this.state.progress
      : this.phase === 'recovery'
        ? 1
        : 0;
    this.state.arenaRadius = Math.max(0, asArenaBoundary(arena).radius);
    if (this.phase === 'idle') {
      this.state.angle = this.strikeStartAngle;
      return;
    }
    this.state.angle = normalizeAngle(
      this.strikeStartAngle + this.state.travelRadians * smoothstep(this.state.travelProgress)
    );
  }

  private intersectsPlayer(player: PlayerState, arena: ArenaBoundaryInput): boolean {
    const dx = player.x - ARENA_CENTER.x;
    const dy = player.y - ARENA_CENTER.y;
    const distance = Math.hypot(dx, dy);
    const maxRadius = getArenaRadiusAtAngle(arena, Math.atan2(dy, dx));
    if (distance > maxRadius + player.radius) return false;
    // At the centre every radial sector meets. This is intentional and gives
    // the telegraph a clear reason to leave the centre before active.
    if (distance <= player.radius) return true;
    const angle = Math.atan2(dy, dx);
    const angularPadding = Math.asin(Math.min(1, player.radius / distance));
    return Math.abs(normalizeAngle(angle - this.state.angle))
      <= this.definition.dangerHalfAngle + angularPadding;
  }
}

const normalizeAngle = (angle: number): number => {
  let normalized = angle % FULL_CIRCLE;
  if (normalized <= -Math.PI) normalized += FULL_CIRCLE;
  if (normalized > Math.PI) normalized -= FULL_CIRCLE;
  return normalized;
};

const smoothstep = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};

