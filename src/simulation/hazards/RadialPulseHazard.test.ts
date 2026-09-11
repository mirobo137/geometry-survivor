import { describe, expect, it } from 'vitest';
import { ARENA_RADIUS } from '../../config/constants';
import { RADIAL_PULSE_DEFINITION } from '../../content/hazards/RadialPulseDefinition';
import { PlayerModel } from '../PlayerModel';
import type { ArenaBoundary } from '../ArenaBoundary';
import { RadialPulseHazard } from './RadialPulseHazard';

const testDefinition = {
  ...RADIAL_PULSE_DEFINITION,
  firstTriggerSeconds: 0,
  intervalSeconds: 1,
  lastTriggerSeconds: 2,
  telegraphSeconds: 0.1,
  attackSeconds: 0.2,
  recoverySeconds: 0.1
};

describe('RadialPulseHazard', () => {
  it('telegraphs before damage, crosses a middle player once, and recovers harmlessly', () => {
    const hazard = new RadialPulseHazard(testDefinition);
    const player = new PlayerModel();
    player.state.x += 100;

    expect(hazard.update(0.05, 0, player.state, ARENA_RADIUS)).toBe(false);
    expect(hazard.state.phase).toBe('telegraph');
    let damageCount = 0;
    if (hazard.update(0.06, 0.06, player.state, ARENA_RADIUS)) damageCount += 1;
    expect(hazard.state.phase).toBe('active');

    for (let index = 0; index < 2; index += 1) {
      if (hazard.update(0.1, 0.16 + index * 0.1, player.state, ARENA_RADIUS)) damageCount += 1;
    }
    expect(damageCount).toBe(1);
    expect(hazard.state.phase).toBe('recovery');
    expect(hazard.update(0.1, 0.36, player.state, ARENA_RADIUS)).toBe(false);
    expect(hazard.state.phase).toBe('idle');
  });

  it('leaves an inner and outer pocket that can evade both travel directions', () => {
    const player = new PlayerModel();
    const outward = new RadialPulseHazard(testDefinition);
    let elapsed = 0;
    outward.update(0.05, elapsed, player.state, ARENA_RADIUS);
    for (let index = 0; index < 30; index += 1) {
      elapsed += 0.1;
      expect(outward.update(0.1, elapsed, player.state, ARENA_RADIUS)).toBe(false);
    }

    const edgePlayer = new PlayerModel();
    edgePlayer.state.x = 640 + ARENA_RADIUS - edgePlayer.state.radius;
    const inward = new RadialPulseHazard(testDefinition);
    elapsed = 0;
    inward.update(0.05, elapsed, edgePlayer.state, ARENA_RADIUS);
    for (let index = 0; index < 4; index += 1) {
      elapsed += 0.1;
      expect(inward.update(0.1, elapsed, edgePlayer.state, ARENA_RADIUS)).toBe(false);
    }
    expect(inward.state.phase).toBe('idle');
    inward.update(0.05, 1, edgePlayer.state, ARENA_RADIUS);
    expect(inward.state.direction).toBe('inward');
    for (let index = 0; index < 4; index += 1) {
      elapsed = 1.05 + index * 0.1;
      expect(inward.update(0.1, elapsed, edgePlayer.state, ARENA_RADIUS)).toBe(false);
    }
  });

  it('keeps the outer pocket safe against the flat side of a hexagon', () => {
    const hexagon: ArenaBoundary = {
      radius: ARENA_RADIUS,
      shapeFrom: 'hexagon',
      shapeTo: 'hexagon',
      morphProgress: 0,
      shape: 'hexagon',
      shapeIndex: 1
    };
    const player = new PlayerModel();
    const hazard = new RadialPulseHazard(testDefinition);
    const edgeRadius = ARENA_RADIUS * Math.cos(Math.PI / 6) - player.state.radius;
    player.state.x = 640 + edgeRadius;
    hazard.update(0.05, 0, player.state, hexagon);
    for (let index = 0; index < 4; index += 1) {
      expect(hazard.update(0.1, 0.05 + index * 0.1, player.state, hexagon)).toBe(false);
    }
  });

  it('alternates outward and inward travel without changing the authored cadence', () => {
    const hazard = new RadialPulseHazard(testDefinition);
    const player = new PlayerModel();

    hazard.update(0.05, 0, player.state, ARENA_RADIUS);
    expect(hazard.state.direction).toBe('outward');
    hazard.update(0.1, 0.05, player.state, ARENA_RADIUS);
    hazard.update(0.1, 0.15, player.state, ARENA_RADIUS);
    hazard.update(0.1, 0.25, player.state, ARENA_RADIUS);
    hazard.update(0.1, 0.35, player.state, ARENA_RADIUS);
    expect(hazard.state.phase).toBe('idle');

    hazard.update(0.05, 1, player.state, ARENA_RADIUS);
    expect(hazard.state.phase).toBe('telegraph');
    expect(hazard.state.direction).toBe('inward');
    expect(hazard.state.startRadius).toBe(
      ARENA_RADIUS - player.state.radius * 2 - testDefinition.width * 0.5 - testDefinition.outerSafeMargin
    );
    expect(hazard.state.endRadius).toBe(testDefinition.innerSafeRadius);
  });

  it('does not start while arbitrated or after the Act I deadline', () => {
    const hazard = new RadialPulseHazard(testDefinition);
    const player = new PlayerModel();

    expect(hazard.update(0.1, 0, player.state, ARENA_RADIUS, false)).toBe(false);
    expect(hazard.state.phase).toBe('idle');
    expect(hazard.update(0.1, 0, player.state, ARENA_RADIUS, true, true)).toBe(false);
    expect(hazard.state.phase).toBe('idle');
    expect(hazard.update(0.1, 2.1, player.state, ARENA_RADIUS)).toBe(false);
    expect(hazard.state.phase).toBe('idle');
  });

  it('resets direction, sequence and pending damage state', () => {
    const hazard = new RadialPulseHazard(testDefinition);
    const player = new PlayerModel();
    hazard.update(0.05, 0, player.state, ARENA_RADIUS);
    hazard.reset();

    expect(hazard.state).toMatchObject({ phase: 'idle', direction: 'outward', sequence: 0, radius: 0 });
    expect(hazard.update(0, 0, player.state, ARENA_RADIUS)).toBe(false);
    expect(hazard.state.phase).toBe('idle');
  });
});
