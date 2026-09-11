import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import { LASER_DEFINITION } from '../../content/hazards/LaserDefinition';
import { PlayerModel } from '../PlayerModel';
import type { ArenaBoundary } from '../ArenaBoundary';
import { LaserHazard } from './LaserHazard';

describe('LaserHazard', () => {
  it('waits for its first trigger and exposes a telegraph before attacking', () => {
    const hazard = new LaserHazard();
    const player = new PlayerModel();

    expect(hazard.update(1 / 60, LASER_DEFINITION.firstTriggerSeconds - 1 / 60, player.state, ARENA_RADIUS)).toBe(false);
    expect(hazard.state.phase).toBe('idle');

    hazard.update(1 / 60, LASER_DEFINITION.firstTriggerSeconds, player.state, ARENA_RADIUS);
    expect(hazard.state.phase).toBe('telegraph');
    expect(hazard.state.progress).toBeCloseTo(1 / 60 / LASER_DEFINITION.telegraphSeconds);
  });

  it('defers a scheduled strike while the radial hazard owns the timeline', () => {
    const hazard = new LaserHazard({ ...LASER_DEFINITION, firstTriggerSeconds: 0 });
    const player = new PlayerModel();

    expect(hazard.update(1 / 60, 0, player.state, ARENA_RADIUS, false)).toBe(false);
    expect(hazard.state.phase).toBe('idle');
    hazard.update(1 / 60, 1 / 60, player.state, ARENA_RADIUS, true);
    expect(hazard.state.phase).toBe('telegraph');
  });

  it('damages a player in the line once and allows a perpendicular escape', () => {
    const hazard = new LaserHazard();
    const player = new PlayerModel();
    let elapsed = LASER_DEFINITION.firstTriggerSeconds;
    hazard.update(1 / 60, elapsed, player.state, ARENA_RADIUS);

    const telegraphSteps = Math.ceil(LASER_DEFINITION.telegraphSeconds * 60);
    let damageCount = 0;
    for (let index = 0; index < telegraphSteps; index += 1) {
      elapsed += 1 / 60;
      if (hazard.update(1 / 60, elapsed, player.state, ARENA_RADIUS)) damageCount += 1;
    }

    for (let index = 0; index < Math.ceil(LASER_DEFINITION.attackSeconds * 60) + 1; index += 1) {
      elapsed += 1 / 60;
      if (hazard.update(1 / 60, elapsed, player.state, ARENA_RADIUS)) damageCount += 1;
    }
    expect(damageCount).toBe(1);

    const escaped = new LaserHazard();
    const escapedPlayer = new PlayerModel();
    let escapedElapsed = LASER_DEFINITION.firstTriggerSeconds;
    escaped.update(1 / 60, escapedElapsed, escapedPlayer.state, ARENA_RADIUS);
    escapedPlayer.state.x = ARENA_CENTER.x;
    escapedPlayer.state.y = ARENA_CENTER.y + 100;
    for (let index = 0; index < telegraphSteps + 2; index += 1) {
      escapedElapsed += 1 / 60;
      expect(escaped.update(1 / 60, escapedElapsed, escapedPlayer.state, ARENA_RADIUS)).toBe(false);
    }
  });

  it('returns to idle before the first trigger after reset', () => {
    const hazard = new LaserHazard();
    const player = new PlayerModel();
    hazard.update(1 / 60, LASER_DEFINITION.firstTriggerSeconds, player.state, ARENA_RADIUS);

    hazard.reset();

    expect(hazard.state.phase).toBe('idle');
    expect(hazard.state.progress).toBe(0);
    expect(hazard.update(1 / 60, LASER_DEFINITION.firstTriggerSeconds - 1 / 60, player.state, ARENA_RADIUS)).toBe(false);
  });

  it('uses the active shape boundary when deciding whether a line reaches the player', () => {
    const hazard = new LaserHazard({ ...LASER_DEFINITION, firstTriggerSeconds: 0 });
    const player = new PlayerModel();
    const hexagon: ArenaBoundary = {
      radius: ARENA_RADIUS,
      shapeFrom: 'hexagon',
      shapeTo: 'hexagon',
      morphProgress: 0
    };
    const angle = Math.PI / 6;
    player.state.x = ARENA_CENTER.x + Math.cos(angle) * ARENA_RADIUS;
    player.state.y = ARENA_CENTER.y + Math.sin(angle) * ARENA_RADIUS;

    hazard.update(1 / 60, 0, player.state, hexagon);
    hazard.state.angle = angle;
    const telegraphSteps = Math.ceil(LASER_DEFINITION.telegraphSeconds * 60);
    let damageCount = 0;
    for (let index = 0; index < telegraphSteps + 2; index += 1) {
      if (hazard.update(1 / 60, (index + 1) / 60, player.state, hexagon)) damageCount += 1;
    }

    expect(damageCount).toBe(0);
  });

  it('sweeps an occasional circular laser during its telegraph and attack', () => {
    const hazard = new LaserHazard({ ...LASER_DEFINITION, firstTriggerSeconds: 0 });
    const player = new PlayerModel();
    const circle = {
      radius: ARENA_RADIUS,
      shapeFrom: 'circle' as const,
      shapeTo: 'circle' as const,
      morphProgress: 0,
      shape: 'circle' as const,
      shapeIndex: 0
    };

    hazard.update(1 / 60, 0, player.state, circle);
    const initialAngle = hazard.state.angle;
    hazard.update(0.45, 0.45, player.state, circle);

    expect(hazard.state.phase).toBe('telegraph');
    expect(hazard.state.sweeping).toBe(false);
    expect(hazard.state.angle).toBe(initialAngle);
    expect(hazard.state.sweepProgress).toBe(0);

    hazard.update(0.35, 0.8, player.state, circle);
    expect(hazard.state.phase).toBe('active');
    expect(hazard.state.sweeping).toBe(true);
    expect(hazard.state.angle).toBeGreaterThan(initialAngle);
    expect(hazard.state.sweepProgress).toBeGreaterThan(0);

    hazard.update(0.7, 1.15, player.state, circle);
    expect(hazard.state.phase).toBe('active');
    expect(hazard.state.sweeping).toBe(true);

    hazard.update(0.25, 1.85, player.state, circle);
    expect(hazard.state.phase).toBe('recovery');
    expect(hazard.state.sweepProgress).toBe(1);
    expect(hazard.state.sweeping).toBe(false);

    const movingPlayer = new PlayerModel();
    const targetAngle = 0.34;
    movingPlayer.state.x = ARENA_CENTER.x + Math.cos(targetAngle) * 100;
    movingPlayer.state.y = ARENA_CENTER.y + Math.sin(targetAngle) * 100;
    const movingHazard = new LaserHazard({ ...LASER_DEFINITION, firstTriggerSeconds: 0 });
    expect(movingHazard.update(0.8, 0, movingPlayer.state, circle)).toBe(false);
    expect(movingHazard.state.phase).toBe('active');

    let movingDamage = false;
    let elapsed = 0.8;
    for (let index = 0; index < 70; index += 1) {
      elapsed += 1 / 60;
      if (movingHazard.update(1 / 60, elapsed, movingPlayer.state, circle)) movingDamage = true;
    }
    expect(movingDamage).toBe(true);
  });

  it('shortens the interval after the hexagon returns for its second intervention', () => {
    const definition = {
      ...LASER_DEFINITION,
      firstTriggerSeconds: 0,
      telegraphSeconds: 0.1,
      attackSeconds: 0.05,
      recoverySeconds: 0.1
    };
    const player = new PlayerModel();
    const firstHexagon = {
      radius: ARENA_RADIUS,
      shapeFrom: 'hexagon' as const,
      shapeTo: 'hexagon' as const,
      morphProgress: 0,
      shape: 'hexagon' as const,
      shapeIndex: 1
    };
    const repeatedHexagon = { ...firstHexagon, shapeIndex: 3 };

    const measureSecondStrike = (arena: typeof firstHexagon): number => {
      const hazard = new LaserHazard(definition);
      let previousPhase = hazard.state.phase;
      let elapsed = 0;
      let starts = 0;
      for (let step = 0; step < 2000; step += 1) {
        hazard.update(0.05, elapsed, player.state, arena);
        if (hazard.state.phase === 'telegraph' && previousPhase === 'idle') {
          starts += 1;
          if (starts === 2) return elapsed;
        }
        previousPhase = hazard.state.phase;
        elapsed += 0.05;
      }
      return Number.POSITIVE_INFINITY;
    };

    const firstInterval = measureSecondStrike(firstHexagon);
    const repeatedInterval = measureSecondStrike(repeatedHexagon);

    expect(firstInterval).toBeCloseTo(14, 1);
    expect(repeatedInterval).toBeCloseTo(10.5, 1);
    expect(repeatedInterval).toBeLessThan(firstInterval);
  });
});
