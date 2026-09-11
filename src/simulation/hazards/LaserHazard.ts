import { LASER_DEFINITION, type LaserDefinition } from '../../content/hazards/LaserDefinition';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { asArenaBoundary, getArenaRadiusAtAngle, type ArenaBoundaryInput } from '../ArenaBoundary';
import { RadialActDirector } from '../acts/RadialActDirector';

export type LaserPhase = 'idle' | 'telegraph' | 'active' | 'recovery';

export interface LaserHazardState {
  phase: LaserPhase;
  angle: number;
  progress: number;
  width: number;
  sweepProgress: number;
  sweeping: boolean;
}

const FULL_LINE = Math.PI;
const ANGLE_STEP = 0.9162978572970231;
const EPSILON = 0.000001;
const MIN_INTERVAL_SECONDS = 0.25;

export class LaserHazard {
  public readonly state: LaserHazardState;
  private phase: LaserPhase = 'idle';
  private phaseTimer = 0;
  private nextTriggerSeconds: number;
  private strikeIndex = 0;
  private hitApplied = false;
  private strikeIntervalSeconds: number;
  private strikeStartAngle = 0;
  private strikeSweepAngle = 0;
  private strikeSweepAttackSeconds = 0;
  private readonly intervalMultiplier: number;

  public constructor(
    private readonly definition: LaserDefinition = LASER_DEFINITION,
    private readonly actDirector: RadialActDirector = new RadialActDirector(),
    intervalMultiplier = 1
  ) {
    this.intervalMultiplier = Number.isFinite(intervalMultiplier)
      ? Math.max(0.1, intervalMultiplier)
      : 1;
    this.nextTriggerSeconds = definition.firstTriggerSeconds;
    this.strikeIntervalSeconds = this.scaleInterval(definition.intervalSeconds);
    this.state = {
      phase: 'idle',
      angle: 0,
      progress: 0,
      width: definition.width,
      sweepProgress: 0,
      sweeping: false
    };
  }

  public update(
    dtSeconds: number,
    elapsedSeconds: number,
    player: PlayerState,
    arena: ArenaBoundaryInput,
    allowStart = true
  ): boolean {
    let remaining = Math.max(0, dtSeconds);
    let damagedPlayer = false;

    while (remaining > EPSILON) {
      if (this.phase === 'idle') {
        if (elapsedSeconds + EPSILON < this.nextTriggerSeconds) break;
        if (!allowStart) break;
        this.startStrike(arena);
      }

      const duration = this.phaseDuration();
      const step = Math.min(remaining, Math.max(0, duration - this.phaseTimer));
      this.phaseTimer += step;
      remaining -= step;

      this.syncState();
      if (this.phase === 'active' && !this.hitApplied) {
        if (this.intersectsPlayer(player, arena)) {
          this.hitApplied = true;
          damagedPlayer = true;
        }
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
        this.nextTriggerSeconds += this.strikeIntervalSeconds;
      }
    }

    this.syncState();
    return damagedPlayer;
  }

  public reset(): void {
    this.phase = 'idle';
    this.phaseTimer = 0;
    this.nextTriggerSeconds = this.definition.firstTriggerSeconds;
    this.strikeIndex = 0;
    this.hitApplied = false;
    this.strikeIntervalSeconds = this.scaleInterval(this.definition.intervalSeconds);
    this.strikeStartAngle = 0;
    this.strikeSweepAngle = 0;
    this.strikeSweepAttackSeconds = 0;
    this.state.phase = 'idle';
    this.state.angle = 0;
    this.state.progress = 0;
    this.state.width = this.definition.width;
    this.state.sweepProgress = 0;
    this.state.sweeping = false;
  }

  private startStrike(arena: ArenaBoundaryInput): void {
    const boundary = asArenaBoundary(arena);
    const shape = boundary.shape ?? boundary.shapeTo;
    const shapeIndex = boundary.shapeIndex ?? 0;
    const pressure = this.actDirector.getLaserPressure(shape, shapeIndex);
    const shouldSweep = this.strikeIndex % pressure.sweepEveryStrikes === 0;
    this.phase = 'telegraph';
    this.phaseTimer = 0;
    this.hitApplied = false;
    this.strikeIntervalSeconds = this.scaleInterval(pressure.intervalSeconds);
    this.strikeStartAngle = (this.strikeIndex * ANGLE_STEP) % FULL_LINE;
    this.strikeSweepAngle = shouldSweep ? pressure.sweepAngleRadians : 0;
    this.strikeSweepAttackSeconds = pressure.sweepAttackSeconds;
    this.state.angle = this.strikeStartAngle;
    this.strikeIndex += 1;
  }

  private scaleInterval(intervalSeconds: number): number {
    return Math.max(MIN_INTERVAL_SECONDS, intervalSeconds * this.intervalMultiplier);
  }

  private phaseDuration(): number {
    if (this.phase === 'telegraph') return this.definition.telegraphSeconds;
    if (this.phase === 'active') {
      return this.strikeSweepAngle === 0
        ? this.definition.attackSeconds
        : this.strikeSweepAttackSeconds;
    }
    return this.definition.recoverySeconds;
  }

  private syncState(): void {
    this.state.phase = this.phase;
    this.state.width = this.definition.width;
    this.state.progress = this.phase === 'idle'
      ? 0
      : Math.min(1, this.phaseTimer / this.phaseDuration());
    const sweepProgress = this.phase !== 'active' && this.phase !== 'recovery'
      || this.strikeSweepAngle === 0
      ? 0
      : Math.min(1, this.phase === 'recovery'
        ? 1
        : this.phaseTimer / Math.max(this.strikeSweepAttackSeconds, EPSILON));
    this.state.sweepProgress = smoothstep(sweepProgress);
    this.state.sweeping = this.phase === 'active' && this.strikeSweepAngle !== 0 && sweepProgress < 1;
    if (this.phase === 'active' || this.phase === 'recovery') {
      this.state.angle = normalizeLineAngle(
        this.strikeStartAngle + this.strikeSweepAngle * this.state.sweepProgress
      );
    }
  }

  private intersectsPlayer(player: PlayerState, arena: ArenaBoundaryInput): boolean {
    const dx = player.x - ARENA_CENTER.x;
    const dy = player.y - ARENA_CENTER.y;
    const perpendicularDistance = Math.abs(dx * Math.sin(this.state.angle) - dy * Math.cos(this.state.angle));
    const alongDistance = Math.abs(dx * Math.cos(this.state.angle) + dy * Math.sin(this.state.angle));
    const playerAngle = Math.atan2(dy, dx);
    return perpendicularDistance <= player.radius + this.definition.width * 0.5
      && alongDistance <= getArenaRadiusAtAngle(arena, playerAngle) + player.radius;
  }
}

const smoothstep = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};

const normalizeLineAngle = (angle: number): number => {
  const normalized = angle % FULL_LINE;
  return normalized < 0 ? normalized + FULL_LINE : normalized;
};
