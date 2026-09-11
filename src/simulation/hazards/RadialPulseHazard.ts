import { ARENA_CENTER } from '../../config/constants';
import { RADIAL_PULSE_DEFINITION, type RadialPulseDefinition } from '../../content/hazards/RadialPulseDefinition';
import type { PlayerState } from '../PlayerModel';
import { asArenaBoundary, getArenaRadiusAtAngle, type ArenaBoundaryInput } from '../ArenaBoundary';

export type RadialPulseDirection = 'outward' | 'inward';
export type RadialPulsePhase = 'idle' | 'telegraph' | 'active' | 'recovery';

export interface RadialPulseState {
  phase: RadialPulsePhase;
  direction: RadialPulseDirection;
  radius: number;
  startRadius: number;
  endRadius: number;
  progress: number;
  travelProgress: number;
  width: number;
  sequence: number;
}

const EPSILON = 0.000001;
const FULL_CIRCLE = Math.PI * 2;

/**
 * One moving annular hazard for Act I. The simulation owns the authoritative
 * radius and damage timing; the renderer only receives this snapshot.
 */
export class RadialPulseHazard {
  public readonly state: RadialPulseState;
  private phase: RadialPulsePhase = 'idle';
  private phaseTimer = 0;
  private nextTriggerSeconds: number;
  private pulseIndex = 0;
  private hitApplied = false;
  private pulseStartRadius = 0;
  private pulseEndRadius = 0;
  private previousPlayerRadius = 0;
  private hasPreviousPlayerRadius = false;

  public constructor(private readonly definition: RadialPulseDefinition = RADIAL_PULSE_DEFINITION) {
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
      sequence: 0
    };
  }

  /**
   * Updates the pulse and returns true at most once per cast. `allowStart`
   * arbitrates against the line laser; an already telegraphed/active pulse is
   * never cancelled. `bossActive` prevents a new pulse in the boss window.
   */
  public update(
    dtSeconds: number,
    elapsedSeconds: number,
    player: PlayerState,
    arena: ArenaBoundaryInput,
    allowStart = true,
    bossActive = false
  ): boolean {
    let remaining = Math.min(Math.max(dtSeconds, 0), 0.1);
    let damagedPlayer = false;
    const playerRadius = this.getPlayerRadius(player);
    const previousPlayerRadius = this.hasPreviousPlayerRadius
      ? this.previousPlayerRadius
      : playerRadius;

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

      if (this.phase === 'active' && !this.hitApplied
        && sweptBandIntersects(
          previousPlayerRadius,
          playerRadius,
          previousWaveRadius,
          this.state.radius,
          this.definition.width * 0.5 + player.radius
        )) {
        this.hitApplied = true;
        damagedPlayer = true;
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

    this.previousPlayerRadius = playerRadius;
    this.hasPreviousPlayerRadius = true;
    this.syncState();
    return damagedPlayer;
  }

  public reset(): void {
    this.phase = 'idle';
    this.phaseTimer = 0;
    this.nextTriggerSeconds = this.definition.firstTriggerSeconds;
    this.pulseIndex = 0;
    this.hitApplied = false;
    this.pulseStartRadius = 0;
    this.pulseEndRadius = 0;
    this.previousPlayerRadius = 0;
    this.hasPreviousPlayerRadius = false;
    this.state.phase = 'idle';
    this.state.direction = 'outward';
    this.state.radius = 0;
    this.state.startRadius = 0;
    this.state.endRadius = 0;
    this.state.progress = 0;
    this.state.travelProgress = 0;
    this.state.width = this.definition.width;
    this.state.sequence = 0;
  }

  private startPulse(arena: ArenaBoundaryInput, player: PlayerState): void {
    const arenaRadius = getMinimumArenaRadius(arena);
    // The full playable radius is never traversed. Leaving a center and an
    // outer pocket gives a player two valid answers after the telegraph; the
    // outer radius accounts for both the player body and the pulse thickness.
    const innerRadius = Math.min(this.definition.innerSafeRadius, arenaRadius);
    const maximumOuterRadius = arenaRadius
      - player.radius * 2
      - this.definition.width * 0.5
      - this.definition.outerSafeMargin;
    const outerRadius = Math.max(innerRadius, maximumOuterRadius);
    const direction: RadialPulseDirection = this.pulseIndex % 2 === 0 ? 'outward' : 'inward';
    this.pulseStartRadius = direction === 'outward' ? innerRadius : outerRadius;
    this.pulseEndRadius = direction === 'outward' ? outerRadius : innerRadius;
    this.phase = 'telegraph';
    this.phaseTimer = 0;
    this.hitApplied = false;
    this.pulseIndex += 1;
    this.state.direction = direction;
    this.state.startRadius = this.pulseStartRadius;
    this.state.endRadius = this.pulseEndRadius;
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
    } else if (this.phase === 'telegraph') {
      this.state.radius = this.pulseStartRadius;
    } else {
      const easedProgress = smoothstep(this.state.travelProgress);
      this.state.radius = this.pulseStartRadius
        + (this.pulseEndRadius - this.pulseStartRadius) * easedProgress;
    }
  }

  private getPlayerRadius(player: PlayerState): number {
    return Math.hypot(player.x - ARENA_CENTER.x, player.y - ARENA_CENTER.y);
  }
}

const sweptBandIntersects = (
  previousPlayerRadius: number,
  playerRadius: number,
  previousWaveRadius: number,
  waveRadius: number,
  tolerance: number
): boolean => {
  const previousRelative = previousPlayerRadius - previousWaveRadius;
  const relative = playerRadius - waveRadius;
  if (Math.abs(previousRelative) <= tolerance || Math.abs(relative) <= tolerance) return true;
  const low = Math.min(previousRelative, relative) - tolerance;
  const high = Math.max(previousRelative, relative) + tolerance;
  return low <= 0 && high >= 0;
};

const getMinimumArenaRadius = (arena: ArenaBoundaryInput): number => {
  let minimumRadius = Number.POSITIVE_INFINITY;
  // The outer pocket must also be safe at a flat side while the arena is a
  // hexagon or morphing. A small fixed sample is enough for the authored
  // convex shapes and runs only when a pulse starts, never on every tick.
  for (let index = 0; index < 24; index += 1) {
    minimumRadius = Math.min(
      minimumRadius,
      getArenaRadiusAtAngle(arena, (index / 24) * FULL_CIRCLE)
    );
  }
  return Math.max(0, Number.isFinite(minimumRadius) ? minimumRadius : asArenaBoundary(arena).radius);
};

const smoothstep = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};
