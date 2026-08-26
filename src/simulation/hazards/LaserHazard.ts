import { LASER_DEFINITION, type LaserDefinition } from '../../content/hazards/LaserDefinition';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';

export type LaserPhase = 'idle' | 'telegraph' | 'active' | 'recovery';

export interface LaserHazardState {
  phase: LaserPhase;
  angle: number;
  progress: number;
  width: number;
}

const FULL_LINE = Math.PI;
const ANGLE_STEP = 0.9162978572970231;
const EPSILON = 0.000001;

export class LaserHazard {
  public readonly state: LaserHazardState;
  private phase: LaserPhase = 'idle';
  private phaseTimer = 0;
  private nextTriggerSeconds: number;
  private strikeIndex = 0;
  private hitApplied = false;

  public constructor(private readonly definition: LaserDefinition = LASER_DEFINITION) {
    this.nextTriggerSeconds = definition.firstTriggerSeconds;
    this.state = {
      phase: 'idle',
      angle: 0,
      progress: 0,
      width: definition.width
    };
  }

  public update(
    dtSeconds: number,
    elapsedSeconds: number,
    player: PlayerState,
    arenaRadius: number
  ): boolean {
    let remaining = Math.max(0, dtSeconds);
    let damagedPlayer = false;

    while (remaining > EPSILON) {
      if (this.phase === 'idle') {
        if (elapsedSeconds + EPSILON < this.nextTriggerSeconds) break;
        this.startStrike();
      }

      const duration = this.phaseDuration();
      const step = Math.min(remaining, Math.max(0, duration - this.phaseTimer));
      this.phaseTimer += step;
      remaining -= step;

      if (this.phase === 'active' && !this.hitApplied) {
        this.hitApplied = true;
        if (this.intersectsPlayer(player, arenaRadius)) damagedPlayer = true;
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

    this.syncState();
    return damagedPlayer;
  }

  private startStrike(): void {
    this.phase = 'telegraph';
    this.phaseTimer = 0;
    this.hitApplied = false;
    this.state.angle = (this.strikeIndex * ANGLE_STEP) % FULL_LINE;
    this.strikeIndex += 1;
  }

  private phaseDuration(): number {
    if (this.phase === 'telegraph') return this.definition.telegraphSeconds;
    if (this.phase === 'active') return this.definition.attackSeconds;
    return this.definition.recoverySeconds;
  }

  private syncState(): void {
    this.state.phase = this.phase;
    this.state.width = this.definition.width;
    this.state.progress = this.phase === 'idle'
      ? 0
      : Math.min(1, this.phaseTimer / this.phaseDuration());
  }

  private intersectsPlayer(player: PlayerState, arenaRadius: number): boolean {
    const dx = player.x - ARENA_CENTER.x;
    const dy = player.y - ARENA_CENTER.y;
    const perpendicularDistance = Math.abs(dx * Math.sin(this.state.angle) - dy * Math.cos(this.state.angle));
    const alongDistance = Math.abs(dx * Math.cos(this.state.angle) + dy * Math.sin(this.state.angle));
    return perpendicularDistance <= player.radius + this.definition.width * 0.5
      && alongDistance <= arenaRadius + player.radius;
  }
}
