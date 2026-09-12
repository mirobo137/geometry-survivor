import { ARENA_CENTER } from '../../config/constants';
import { PULSE_RING_DEFINITION, type PulseRingDefinition } from '../../content/hazards/PulseRingDefinition';
import type { PlayerState } from '../PlayerModel';
import { asArenaBoundary, getArenaRadiusAtAngle, type ArenaBoundaryInput } from '../ArenaBoundary';

export type PulseRingDirection = 'outward' | 'inward';
export type PulseRingPhase = 'idle' | 'telegraph' | 'active' | 'recovery';

export interface PulseRingState {
  phase: PulseRingPhase;
  direction: PulseRingDirection;
  radius: number;
  startRadius: number;
  endRadius: number;
  progress: number;
  travelProgress: number;
  width: number;
  /** World-space center of the moving opening. */
  safeGapAngle: number;
  safeGapHalfAngle: number;
  sequence: number;
}

export interface PulseRingUpdateResult {
  readonly damaged: boolean;
  readonly pushX: number;
  readonly pushY: number;
}

const EPSILON = 0.000001;
const FULL_CIRCLE = Math.PI * 2;

/**
 * Angular ring hazard. The simulation owns the band, opening and collision;
 * the renderer only consumes the snapshot. The safe gap rotates after the
 * telegraph begins, so the player must read the opening and keep moving.
 */
export class PulseRingHazard {
  public readonly state: PulseRingState;
  private phase: PulseRingPhase = 'idle';
  private phaseTimer = 0;
  private nextTriggerSeconds: number;
  private pulseIndex = 0;
  private hitApplied = false;
  private pulseStartRadius = 0;
  private pulseEndRadius = 0;
  private safeGapStartAngle = 0;
  private previousPlayerRadius = 0;
  private previousPlayerAngle = 0;
  private hasPreviousPlayerPosition = false;

  public constructor(private readonly definition: PulseRingDefinition = PULSE_RING_DEFINITION) {
    this.nextTriggerSeconds = definition.firstTriggerSeconds;
    this.state = {
      phase: 'idle',
      direction: 'outward',
      radius: 0,
      startRadius: 0,
      endRadius: 0,
      progress: 0,
      travelProgress: 0,
      width: definition.width,
      safeGapAngle: -Math.PI / 2,
      safeGapHalfAngle: definition.safeGapHalfAngle,
      sequence: 0
    };
  }

  public update(
    dtSeconds: number,
    elapsedSeconds: number,
    player: PlayerState,
    arena: ArenaBoundaryInput,
    allowStart = true,
    bossActive = false
  ): PulseRingUpdateResult {
    let remaining = Math.min(Math.max(dtSeconds, 0), 0.1);
    let damaged = false;
    let pushX = 0;
    let pushY = 0;
    const playerPosition = this.getPlayerPosition(player);
    const previousRadius = this.hasPreviousPlayerPosition ? this.previousPlayerRadius : playerPosition.radius;
    const previousAngle = this.hasPreviousPlayerPosition ? this.previousPlayerAngle : playerPosition.angle;

    while (remaining > EPSILON) {
      if (this.phase === 'idle') {
        if (bossActive) {
          this.nextTriggerSeconds = Number.POSITIVE_INFINITY;
          break;
        }
        if (elapsedSeconds + EPSILON < this.nextTriggerSeconds) break;
        if (elapsedSeconds > this.definition.lastTriggerSeconds || !allowStart) break;
        this.startPulse(arena, player);
      }

      const previousWaveRadius = this.currentWaveRadius();
      const duration = this.phaseDuration();
      const step = Math.min(remaining, Math.max(0, duration - this.phaseTimer));
      this.phaseTimer += step;
      remaining -= step;
      this.syncState();

      if (this.phase === 'active' && this.bandIntersects(previousRadius, playerPosition.radius, previousWaveRadius, this.state.radius)) {
        const safeAtPrevious = isWithinAngle(previousAngle, this.state.safeGapAngle, this.state.safeGapHalfAngle);
        const safeNow = isWithinAngle(playerPosition.angle, this.state.safeGapAngle, this.state.safeGapHalfAngle);
        if (!safeAtPrevious && !safeNow) {
          if (!this.hitApplied) {
            this.hitApplied = true;
            damaged = true;
          }
          const sign = this.state.direction === 'outward' ? 1 : -1;
          const push = this.definition.pushSpeed * step * sign;
          pushX += Math.cos(playerPosition.angle) * push;
          pushY += Math.sin(playerPosition.angle) * push;
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
        this.nextTriggerSeconds += this.definition.intervalSeconds;
      }
    }

    this.previousPlayerRadius = playerPosition.radius;
    this.previousPlayerAngle = playerPosition.angle;
    this.hasPreviousPlayerPosition = true;
    this.syncState();
    return { damaged, pushX, pushY };
  }

  public reset(): void {
    this.phase = 'idle';
    this.phaseTimer = 0;
    this.nextTriggerSeconds = this.definition.firstTriggerSeconds;
    this.pulseIndex = 0;
    this.hitApplied = false;
    this.pulseStartRadius = 0;
    this.pulseEndRadius = 0;
    this.safeGapStartAngle = -Math.PI / 2;
    this.previousPlayerRadius = 0;
    this.previousPlayerAngle = 0;
    this.hasPreviousPlayerPosition = false;
    Object.assign(this.state, {
      phase: 'idle',
      direction: 'outward' as PulseRingDirection,
      radius: 0,
      startRadius: 0,
      endRadius: 0,
      progress: 0,
      travelProgress: 0,
      width: this.definition.width,
      safeGapAngle: -Math.PI / 2,
      safeGapHalfAngle: this.definition.safeGapHalfAngle,
      sequence: 0
    });
  }

  private startPulse(arena: ArenaBoundaryInput, player: PlayerState): void {
    const arenaRadius = getMinimumArenaRadius(arena);
    const innerRadius = Math.min(this.definition.innerSafeRadius, arenaRadius);
    const maximumOuterRadius = arenaRadius
      - player.radius * 2
      - this.definition.width * 0.5
      - this.definition.outerSafeMargin;
    const outerRadius = Math.max(innerRadius, maximumOuterRadius);
    const direction: PulseRingDirection = this.pulseIndex % 2 === 0 ? 'outward' : 'inward';
    this.pulseStartRadius = direction === 'outward' ? innerRadius : outerRadius;
    this.pulseEndRadius = direction === 'outward' ? outerRadius : innerRadius;
    this.safeGapStartAngle = normalizeAngle(-Math.PI / 2 + this.pulseIndex * (FULL_CIRCLE / this.definition.sectorCount));
    this.phase = 'telegraph';
    this.phaseTimer = 0;
    this.hitApplied = false;
    this.pulseIndex += 1;
    this.state.direction = direction;
    this.state.startRadius = this.pulseStartRadius;
    this.state.endRadius = this.pulseEndRadius;
    this.state.safeGapAngle = this.safeGapStartAngle;
    this.state.safeGapHalfAngle = this.definition.safeGapHalfAngle;
    this.state.sequence += 1;
  }

  private phaseDuration(): number {
    if (this.phase === 'telegraph') return this.definition.telegraphSeconds;
    if (this.phase === 'active') return this.definition.attackSeconds;
    return this.definition.recoverySeconds;
  }

  private currentWaveRadius(): number {
    if (this.phase === 'active' || this.phase === 'recovery') return this.state.radius;
    return this.pulseStartRadius;
  }

  private syncState(): void {
    this.state.phase = this.phase;
    this.state.width = this.definition.width;
    this.state.progress = this.phase === 'idle'
      ? 0
      : Math.min(1, this.phaseTimer / Math.max(this.phaseDuration(), EPSILON));
    this.state.travelProgress = this.phase === 'telegraph'
      ? 0
      : this.phase === 'idle'
        ? 0
        : this.phase === 'active'
          ? this.state.progress
          : 1;
    if (this.phase === 'idle') {
      this.state.radius = 0;
      this.state.safeGapAngle = this.safeGapStartAngle;
    } else if (this.phase === 'telegraph') {
      this.state.radius = this.pulseStartRadius;
      this.state.safeGapAngle = this.safeGapStartAngle;
    } else {
      const easedProgress = smoothstep(this.state.travelProgress);
      this.state.radius = this.pulseStartRadius
        + (this.pulseEndRadius - this.pulseStartRadius) * easedProgress;
      const sign = this.state.direction === 'outward' ? 1 : -1;
      this.state.safeGapAngle = normalizeAngle(
        this.safeGapStartAngle + sign * this.definition.safeGapRotationRadians * this.state.travelProgress
      );
    }
  }

  private bandIntersects(
    previousPlayerRadius: number,
    playerRadius: number,
    previousWaveRadius: number,
    waveRadius: number
  ): boolean {
    const tolerance = this.definition.width * 0.5 + 18;
    const previousRelative = previousPlayerRadius - previousWaveRadius;
    const relative = playerRadius - waveRadius;
    if (Math.abs(previousRelative) <= tolerance || Math.abs(relative) <= tolerance) return true;
    const low = Math.min(previousRelative, relative) - tolerance;
    const high = Math.max(previousRelative, relative) + tolerance;
    return low <= 0 && high >= 0;
  }

  private getPlayerPosition(player: PlayerState): { readonly radius: number; readonly angle: number } {
    const dx = player.x - ARENA_CENTER.x;
    const dy = player.y - ARENA_CENTER.y;
    return { radius: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
  }
}

const getMinimumArenaRadius = (arena: ArenaBoundaryInput): number => {
  let minimumRadius = Number.POSITIVE_INFINITY;
  for (let index = 0; index < 24; index += 1) {
    minimumRadius = Math.min(minimumRadius, getArenaRadiusAtAngle(arena, (index / 24) * FULL_CIRCLE));
  }
  return Math.max(0, Number.isFinite(minimumRadius) ? minimumRadius : asArenaBoundary(arena).radius);
};

const normalizeAngle = (angle: number): number => {
  let normalized = angle % FULL_CIRCLE;
  if (normalized <= -Math.PI) normalized += FULL_CIRCLE;
  if (normalized > Math.PI) normalized -= FULL_CIRCLE;
  return normalized;
};

const isWithinAngle = (angle: number, center: number, halfWidth: number): boolean => (
  Math.abs(normalizeAngle(angle - center)) <= Math.max(0, halfWidth)
);

const smoothstep = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};
