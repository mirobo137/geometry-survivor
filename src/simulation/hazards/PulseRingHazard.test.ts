import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import { PULSE_RING_DRILL_DEFINITION } from '../../content/hazards/PulseRingDefinition';
import { PlayerModel } from '../PlayerModel';
import { PulseRingHazard } from './PulseRingHazard';

const advance = (
  hazard: PulseRingHazard,
  seconds: number,
  elapsedSeconds: number,
  player: PlayerModel
): number => {
  let elapsed = elapsedSeconds;
  let remaining = seconds;
  while (remaining > 0.000001) {
    const dt = Math.min(0.05, remaining);
    elapsed += dt;
    hazard.update(dt, elapsed, player.state, ARENA_RADIUS);
    remaining -= dt;
  }
  return elapsed;
};

describe('PulseRingHazard', () => {
  it('telegraphs a rotating sector opening before the damaging band starts', () => {
    const hazard = new PulseRingHazard(PULSE_RING_DRILL_DEFINITION);
    const player = new PlayerModel();

    expect(hazard.update(0.05, 0.05, player.state, ARENA_RADIUS).damaged).toBe(false);
    expect(hazard.state.phase).toBe('telegraph');
    expect(hazard.state.safeGapHalfAngle).toBe(PULSE_RING_DRILL_DEFINITION.safeGapHalfAngle);

    advance(hazard, PULSE_RING_DRILL_DEFINITION.telegraphSeconds - 0.05, 0.05, player);
    expect(hazard.state.phase).toBe('active');
    expect(hazard.state.radius).toBe(PULSE_RING_DRILL_DEFINITION.innerSafeRadius);
  });

  it('rotates the opening during the attack and damages a player caught outside it once', () => {
    const hazard = new PulseRingHazard(PULSE_RING_DRILL_DEFINITION);
    const player = new PlayerModel();
    advance(hazard, PULSE_RING_DRILL_DEFINITION.telegraphSeconds, 0, player);
    const initialGap = hazard.state.safeGapAngle;
    player.state.x = ARENA_CENTER.x + PULSE_RING_DRILL_DEFINITION.innerSafeRadius;
    player.state.y = ARENA_CENTER.y;

    const first = hazard.update(0.4, 1.2, player.state, ARENA_RADIUS);
    expect(first.damaged).toBe(true);
    expect(first.pushX).toBeGreaterThan(0);
    expect(hazard.state.safeGapAngle).not.toBe(initialGap);

    const second = hazard.update(0.4, 1.6, player.state, ARENA_RADIUS);
    expect(second.damaged).toBe(false);
  });

  it('leaves the player unharmed when the moving opening covers the current route', () => {
    const hazard = new PulseRingHazard(PULSE_RING_DRILL_DEFINITION);
    const player = new PlayerModel();
    advance(hazard, PULSE_RING_DRILL_DEFINITION.telegraphSeconds, 0, player);
    const safeAngle = hazard.state.safeGapAngle;
    player.state.x = ARENA_CENTER.x + Math.cos(safeAngle) * PULSE_RING_DRILL_DEFINITION.innerSafeRadius;
    player.state.y = ARENA_CENTER.y + Math.sin(safeAngle) * PULSE_RING_DRILL_DEFINITION.innerSafeRadius;

    expect(hazard.update(0.2, 1, player.state, ARENA_RADIUS).damaged).toBe(false);
  });

  it('stops scheduling after the boss gate and resets the opening deterministically', () => {
    const hazard = new PulseRingHazard(PULSE_RING_DRILL_DEFINITION);
    const player = new PlayerModel();
    hazard.update(0.1, 0, player.state, ARENA_RADIUS, true, true);
    expect(hazard.state.phase).toBe('idle');
    expect(hazard.state.sequence).toBe(0);

    hazard.reset();
    hazard.update(0.05, 0, player.state, ARENA_RADIUS);
    expect(hazard.state.sequence).toBe(1);
    hazard.reset();
    expect(hazard.state).toMatchObject({ phase: 'idle', direction: 'outward', sequence: 0, radius: 0 });
  });
});
