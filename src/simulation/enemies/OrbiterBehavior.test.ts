import { describe, expect, it } from 'vitest';
import { ENEMY_DEFINITIONS } from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import { EnemyPool } from '../combat/EntityPools';
import { OrbiterBehavior } from './OrbiterBehavior';

const prepare = (spawnIndex = 0) => {
  const state = new EnemyPool(1).acquire();
  if (!state) throw new Error('No se pudo adquirir Orbiter');
  state.kind = 'orbiter';
  state.radius = ENEMY_DEFINITIONS.orbiter.radius;
  state.speed = ENEMY_DEFINITIONS.orbiter.speed;
  state.contactDamage = ENEMY_DEFINITIONS.orbiter.contactDamage;
  state.x = ARENA_CENTER.x + ARENA_RADIUS + 80;
  state.y = ARENA_CENTER.y;
  const behavior = new OrbiterBehavior();
  behavior.configure(state, spawnIndex, ARENA_RADIUS);
  return { state, behavior };
};

const stepUntil = (
  behavior: OrbiterBehavior,
  state: ReturnType<typeof prepare>['state'],
  predicate: () => boolean,
  dt = 1 / 60
) => {
  for (let index = 0; index < 600 && !predicate(); index += 1) {
    behavior.update(state, dt, ARENA_RADIUS);
  }
};

describe('OrbiterBehavior', () => {
  it('announces a deterministic sector while its hull stays dangerous and then follows a tangent', () => {
    const { state, behavior } = prepare(0);
    stepUntil(behavior, state, () => state.orbiterPhase === 'telegraph');
    expect(state.orbiterSector).toBe(0);
    expect(state.orbiterDirection).toBe(1);
    expect(state.contactEnabled).toBe(true);
    const telegraphSequence = state.orbiterSequence;

    stepUntil(behavior, state, () => state.orbiterPhase === 'commit');
    expect(state.orbiterSequence).toBe(telegraphSequence);
    expect(state.contactEnabled).toBe(true);
    const startX = state.x;
    const startY = state.y;
    behavior.update(state, 0.2, ARENA_RADIUS);
    expect(state.orbiterPhase).toBe('commit');
    expect(Math.hypot(state.x - ARENA_CENTER.x, state.y - ARENA_CENTER.y)).toBeCloseTo(state.orbiterBandRadius, 3);
    expect(Math.hypot(state.x - startX, state.y - startY)).toBeGreaterThan(1);
    expect(Math.abs(state.vy)).toBeGreaterThan(Math.abs(state.vx));
    stepUntil(behavior, state, () => state.orbiterPhase === 'recovery');
    expect(state.contactEnabled).toBe(true);
  });

  it('keeps an announced route committed until it reaches commit', () => {
    const { state, behavior } = prepare(0);
    stepUntil(behavior, state, () => state.orbiterPhase === 'telegraph');
    const committedSector = state.orbiterSector;
    const committedDirection = state.orbiterDirection;
    const committedAngle = state.orbiterStartAngle;
    stepUntil(behavior, state, () => state.orbiterPhase === 'commit');
    expect(state.orbiterPhase).toBe('commit');
    expect(state.orbiterSector).toBe(committedSector);
    expect(state.orbiterDirection).toBe(committedDirection);
    expect(state.orbiterStartAngle).toBe(committedAngle);
    expect(state.contactEnabled).toBe(true);
  });

  it('keeps the authored tangent route stable across render-rate-sized updates', () => {
    const sample = (dt: number) => {
      const { state, behavior } = prepare(1);
      for (let elapsed = 0; elapsed < 3.5; elapsed += dt) {
        behavior.update(state, dt, ARENA_RADIUS);
      }
      return { x: state.x, y: state.y, phase: state.orbiterPhase };
    };
    const at30 = sample(1 / 30);
    const at60 = sample(1 / 60);
    const at144 = sample(1 / 144);
    expect(at30.phase).toBe(at60.phase);
    expect(at144.phase).toBe(at60.phase);
    expect(Math.hypot(at30.x - at60.x, at30.y - at60.y)).toBeLessThan(8);
    expect(Math.hypot(at144.x - at60.x, at144.y - at60.y)).toBeLessThan(8);
  });
});
