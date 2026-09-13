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
  const player = {
    x: ARENA_CENTER.x - 110,
    y: ARENA_CENTER.y - 70,
    radius: 22,
    health: 100,
    maxHealth: 100,
    armor: 0
  };
  const behavior = new OrbiterBehavior();
  behavior.configure(state, spawnIndex, ARENA_RADIUS);
  return { state, behavior, player };
};

const stepUntil = (
  behavior: OrbiterBehavior,
  state: ReturnType<typeof prepare>['state'],
  player: ReturnType<typeof prepare>['player'],
  predicate: () => boolean,
  dt = 1 / 60
) => {
  for (let index = 0; index < 600 && !predicate(); index += 1) {
    behavior.update(state, dt, ARENA_RADIUS, player);
  }
};

describe('OrbiterBehavior', () => {
  it('follows the player, then commits a local arc from its current position', () => {
    const { state, behavior, player } = prepare(0);
    stepUntil(behavior, state, player, () => state.orbiterPhase === 'telegraph');
    expect(state.orbiterSector).toBe(0);
    expect(state.orbiterDirection).toBe(1);
    expect(state.contactEnabled).toBe(true);
    expect(Math.hypot(state.x - player.x, state.y - player.y)).toBeLessThan(160);
    expect(Math.hypot(
      state.orbiterRouteCenterX - ARENA_CENTER.x,
      state.orbiterRouteCenterY - ARENA_CENTER.y
    )).toBeGreaterThan(40);
    expect(Math.hypot(
      state.x - state.orbiterRouteCenterX,
      state.y - state.orbiterRouteCenterY
    )).toBeCloseTo(state.orbiterRouteRadius, 3);
    const telegraphSequence = state.orbiterSequence;

    stepUntil(behavior, state, player, () => state.orbiterPhase === 'commit');
    expect(state.orbiterSequence).toBe(telegraphSequence);
    expect(state.contactEnabled).toBe(true);
    const startX = state.x;
    const startY = state.y;
    behavior.update(state, 0.2, ARENA_RADIUS, player);
    expect(state.orbiterPhase).toBe('commit');
    expect(Math.hypot(
      state.x - state.orbiterRouteCenterX,
      state.y - state.orbiterRouteCenterY
    )).toBeCloseTo(state.orbiterRouteRadius, 3);
    expect(Math.hypot(state.x - startX, state.y - startY)).toBeGreaterThan(1);
    expect(Math.hypot(state.vx, state.vy)).toBeGreaterThan(1);
    stepUntil(behavior, state, player, () => state.orbiterPhase === 'recovery');
    expect(state.contactEnabled).toBe(true);
  });

  it('does not stall when its hull starts in contact with the player', () => {
    const { state, behavior, player } = prepare(0);
    state.x = player.x;
    state.y = player.y;
    behavior.update(state, 1 / 60, ARENA_RADIUS, player);
    expect(state.orbiterPhase).toBe('approach');
    expect(Math.hypot(state.x - player.x, state.y - player.y)).toBeGreaterThan(0);

    for (let index = 0; index < 120 && state.orbiterPhase === 'approach'; index += 1) {
      behavior.update(state, 1 / 60, ARENA_RADIUS, player);
    }
    expect(state.orbiterPhase).toBe('telegraph');
  });

  it('keeps an announced route committed until it reaches commit', () => {
    const { state, behavior, player } = prepare(0);
    stepUntil(behavior, state, player, () => state.orbiterPhase === 'telegraph');
    const committedSector = state.orbiterSector;
    const committedDirection = state.orbiterDirection;
    const committedAngle = state.orbiterStartAngle;
    const committedCenterX = state.orbiterRouteCenterX;
    const committedCenterY = state.orbiterRouteCenterY;
    const committedRadius = state.orbiterRouteRadius;
    player.x = ARENA_CENTER.x + 160;
    player.y = ARENA_CENTER.y + 100;
    stepUntil(behavior, state, player, () => state.orbiterPhase === 'commit');
    expect(state.orbiterPhase).toBe('commit');
    expect(state.orbiterSector).toBe(committedSector);
    expect(state.orbiterDirection).toBe(committedDirection);
    expect(state.orbiterStartAngle).toBe(committedAngle);
    expect(state.orbiterRouteCenterX).toBe(committedCenterX);
    expect(state.orbiterRouteCenterY).toBe(committedCenterY);
    expect(state.orbiterRouteRadius).toBe(committedRadius);
    expect(state.contactEnabled).toBe(true);
  });

  it('gives different orbiters distinct local route biases instead of one shared arena route', () => {
    const first = prepare(0);
    const second = prepare(1);
    stepUntil(first.behavior, first.state, first.player, () => first.state.orbiterPhase === 'telegraph');
    stepUntil(second.behavior, second.state, second.player, () => second.state.orbiterPhase === 'telegraph');
    expect(Math.hypot(
      first.state.orbiterRouteCenterX - second.state.orbiterRouteCenterX,
      first.state.orbiterRouteCenterY - second.state.orbiterRouteCenterY
    )).toBeGreaterThan(1);
  });

  it('updates its approach target when the player changes position before the telegraph', () => {
    const moving = prepare(0);
    const staticTarget = prepare(0);
    for (let index = 0; index < 60; index += 1) {
      moving.behavior.update(moving.state, 1 / 60, ARENA_RADIUS, moving.player);
      staticTarget.behavior.update(staticTarget.state, 1 / 60, ARENA_RADIUS, staticTarget.player);
    }

    moving.player.x = ARENA_CENTER.x + 110;
    moving.player.y = ARENA_CENTER.y - 215;
    for (let index = 0; index < 45; index += 1) {
      moving.behavior.update(moving.state, 1 / 60, ARENA_RADIUS, moving.player);
      staticTarget.behavior.update(staticTarget.state, 1 / 60, ARENA_RADIUS, staticTarget.player);
    }

    expect(moving.state.orbiterPhase).toBe('approach');
    expect(moving.state.x).toBeGreaterThan(staticTarget.state.x + 20);
    expect(Math.hypot(moving.state.x - moving.player.x, moving.state.y - moving.player.y)).toBeLessThan(240);
  });

  it('keeps the authored tangent route stable across render-rate-sized updates', () => {
    const sample = (dt: number) => {
      const { state, behavior, player } = prepare(1);
      for (let elapsed = 0; elapsed < 3.5; elapsed += dt) {
        behavior.update(state, dt, ARENA_RADIUS, player);
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
