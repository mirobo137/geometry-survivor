import { describe, expect, it } from 'vitest';
import { ARENA_CENTER } from '../../config/constants';
import { PRISM_WEAVER_DEFINITION } from '../../content/enemies/EnemyDefinitions';
import { EnemyPool } from '../combat/EntityPools';
import { PlayerModel } from '../PlayerModel';
import { PrismWeaverBehavior } from './PrismWeaverBehavior';

const prepare = () => {
  const pool = new EnemyPool(1);
  const state = pool.acquire();
  if (!state) throw new Error('No se pudo preparar el Prism Weaver');
  state.radius = 20;
  state.x = ARENA_CENTER.x + 390;
  state.y = ARENA_CENTER.y;
  state.health = 52;
  state.maxHealth = 52;
  const player = new PlayerModel();
  const behavior = new PrismWeaverBehavior();
  behavior.configure(state, 0, 270);
  return { state, player: player.state, behavior };
};

const advanceUntil = (
  state: ReturnType<typeof prepare>['state'],
  behavior: PrismWeaverBehavior,
  player: ReturnType<typeof prepare>['player'],
  phase: 'telegraph' | 'active'
): void => {
  for (let index = 0; index < 400 && state.prismWeaverPhase !== phase; index += 1) {
    behavior.update(state, 1 / 60, 270, player);
  }
  expect(state.prismWeaverPhase).toBe(phase);
};

describe('PrismWeaverBehavior', () => {
  it('approaches a fixed anchor and commits even when the player enters the route', () => {
    const { state, player, behavior } = prepare();
    advanceUntil(state, behavior, player, 'telegraph');
    const sequence = state.prismWeaverSequence;
    player.x = state.x + 90;
    player.y = state.y;
    for (let index = 0; index < 60; index += 1) behavior.update(state, 1 / 60, 270, player);
    expect(state.prismWeaverPhase).toBe('active');
    expect(state.prismWeaverSequence).toBe(sequence);
  });

  it('moves the three-spoke hazard, damages one time per cast, and exposes safe gaps', () => {
    const { state, player, behavior } = prepare();
    advanceUntil(state, behavior, player, 'active');
    const activeAngle = state.prismWeaverAngle;
    player.x = state.x + 100 * Math.cos(activeAngle);
    player.y = state.y + 100 * Math.sin(activeAngle);
    expect(behavior.update(state, 1 / 60, 270, player).damaged).toBe(true);
    expect(behavior.update(state, 1 / 60, 270, player).damaged).toBe(false);
    for (let index = 0; index < 12; index += 1) behavior.update(state, 1 / 60, 270, player);
    expect(state.prismWeaverAngle).not.toBe(activeAngle);

    const gapAngle = activeAngle + Math.PI / 3;
    player.x = state.x + 100 * Math.cos(gapAngle);
    player.y = state.y + 100 * Math.sin(gapAngle);
    expect(behavior.intersectsPlayer(state, player)).toBe(false);
    expect(PRISM_WEAVER_DEFINITION.spokeCount).toBe(3);
  });

  it('repositions for the next cast instead of teleporting back to the first anchor', () => {
    const { state, player, behavior } = prepare();
    advanceUntil(state, behavior, player, 'active');
    for (let index = 0; index < 160; index += 1) behavior.update(state, 1 / 60, 270, player);
    expect(state.prismWeaverPhase).toBe('approach');
    expect(state.prismWeaverStartAngle).not.toBe(0);
  });
});
