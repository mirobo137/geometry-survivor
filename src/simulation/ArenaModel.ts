import {
  ARENA_EXPANSION_DURATION_SECONDS,
  ARENA_INTERMEDIATE_RADIUS,
  ARENA_EXPANSION_START_SECONDS,
  ARENA_MAX_RADIUS,
  ARENA_RADIUS,
  ARENA_RESONANCE_DURATION_SECONDS,
  ARENA_SECOND_EXPANSION_START_SECONDS
} from '../config/constants';
import { ACT_I_ARENA_SHAPE_CHANGES } from '../content/run/ArenaShapeDefinitions';
import type { ArenaBoundary, ArenaShape } from './ArenaBoundary';

export type ArenaShapePhase = 'stable' | 'telegraph' | 'morph';

export interface ArenaState extends ArenaBoundary {
  readonly elapsedSeconds: number;
  readonly radius: number;
  readonly expansionProgress: number;
  readonly expansionIndex: number;
  readonly resonance: number;
  readonly shape: ArenaShape;
  readonly shapeTelegraphProgress: number;
  readonly shapePhase: ArenaShapePhase;
  readonly shapeIndex: number;
}

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

/**
 * Owns arena timing in simulation space. Rendering can observe this snapshot,
 * but it never decides when the playable boundary changes.
 */
export class ArenaModel {
  public state: ArenaState = {
    elapsedSeconds: 0,
    radius: ARENA_RADIUS,
    expansionProgress: 0,
    expansionIndex: 0,
    resonance: 0,
    shape: 'circle',
    shapeFrom: 'circle',
    shapeTo: 'circle',
    morphProgress: 0,
    shapeTelegraphProgress: 0,
    shapePhase: 'stable',
    shapeIndex: 0
  };

  public update(dtSeconds: number): void {
    const elapsedSeconds = this.state.elapsedSeconds + Math.max(0, dtSeconds);
    const firstLinearProgress = clamp01(
      (elapsedSeconds - ARENA_EXPANSION_START_SECONDS) / ARENA_EXPANSION_DURATION_SECONDS
    );
    const secondLinearProgress = clamp01(
      (elapsedSeconds - ARENA_SECOND_EXPANSION_START_SECONDS) / ARENA_EXPANSION_DURATION_SECONDS
    );
    // Each expansion is short and eased, with a stable plateau between them.
    const firstProgress = firstLinearProgress * firstLinearProgress * (3 - 2 * firstLinearProgress);
    const secondProgress = secondLinearProgress * secondLinearProgress * (3 - 2 * secondLinearProgress);
    const radius = ARENA_RADIUS
      + (ARENA_INTERMEDIATE_RADIUS - ARENA_RADIUS) * firstProgress
      + (ARENA_MAX_RADIUS - ARENA_INTERMEDIATE_RADIUS) * secondProgress;
    const expansionProgress = (firstProgress + secondProgress) * 0.5;
    const expansionIndex = secondLinearProgress > 0 ? 2 : firstLinearProgress > 0 ? 1 : 0;
    const resonance = Math.max(
      this.expansionResonance(elapsedSeconds, ARENA_EXPANSION_START_SECONDS),
      this.expansionResonance(elapsedSeconds, ARENA_SECOND_EXPANSION_START_SECONDS)
    );
    const shapeFrame = getShapeFrame(elapsedSeconds);

    this.state = {
      elapsedSeconds,
      radius,
      expansionProgress,
      expansionIndex,
      resonance,
      ...shapeFrame
    };
  }

  public reset(): void {
    this.state = {
      elapsedSeconds: 0,
      radius: ARENA_RADIUS,
      expansionProgress: 0,
      expansionIndex: 0,
      resonance: 0,
      shape: 'circle',
      shapeFrom: 'circle',
      shapeTo: 'circle',
      morphProgress: 0,
      shapeTelegraphProgress: 0,
      shapePhase: 'stable',
      shapeIndex: 0
    };
  }

  private expansionResonance(elapsedSeconds: number, startSeconds: number): number {
    const age = elapsedSeconds - startSeconds;
    if (age < 0 || age >= ARENA_RESONANCE_DURATION_SECONDS) return 0;
    const progress = age / ARENA_RESONANCE_DURATION_SECONDS;
    return Math.sin(progress * Math.PI);
  }
}

interface ArenaShapeFrame {
  readonly shape: ArenaShape;
  readonly shapeFrom: ArenaShape;
  readonly shapeTo: ArenaShape;
  readonly morphProgress: number;
  readonly shapeTelegraphProgress: number;
  readonly shapePhase: ArenaShapePhase;
  readonly shapeIndex: number;
}

const getShapeFrame = (elapsedSeconds: number): ArenaShapeFrame => {
  let stableShape: ArenaShape = 'circle';
  let shapeIndex = 0;
  for (let index = 0; index < ACT_I_ARENA_SHAPE_CHANGES.length; index += 1) {
    const change = ACT_I_ARENA_SHAPE_CHANGES[index];
    const telegraphEnd = change.startSeconds + change.telegraphSeconds;
    const morphEnd = telegraphEnd + change.morphSeconds;
    if (elapsedSeconds < change.startSeconds) break;
    if (elapsedSeconds < telegraphEnd) {
      return {
        shape: change.to,
        shapeFrom: change.from,
        shapeTo: change.to,
        morphProgress: 0,
        shapeTelegraphProgress: clamp01((elapsedSeconds - change.startSeconds) / change.telegraphSeconds),
        shapePhase: 'telegraph',
        shapeIndex: index + 1
      };
    }
    if (elapsedSeconds < morphEnd) {
      return {
        shape: change.to,
        shapeFrom: change.from,
        shapeTo: change.to,
        morphProgress: clamp01((elapsedSeconds - telegraphEnd) / change.morphSeconds),
        shapeTelegraphProgress: 1,
        shapePhase: 'morph',
        shapeIndex: index + 1
      };
    }
    stableShape = change.to;
    shapeIndex = index + 1;
  }
  return {
    shape: stableShape,
    shapeFrom: stableShape,
    shapeTo: stableShape,
    morphProgress: 0,
    shapeTelegraphProgress: 0,
    shapePhase: 'stable',
    shapeIndex
  };
};
