import { describe, expect, it } from 'vitest';
import { ENEMY_DEFINITIONS } from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import { PlayerModel } from '../PlayerModel';
import { EnemyPool } from '../combat/EntityPools';
import { ChargerBehavior } from './ChargerBehavior';

describe('ChargerBehavior', () => {
  it('samples one line before warning and crosses that fixed line without homing', () => {
    const state = new EnemyPool(1).acquire(); if (!state) throw new Error('No charger slot');
    state.kind = 'charger'; state.radius = ENEMY_DEFINITIONS.charger.radius;
    state.x = ARENA_CENTER.x + ARENA_RADIUS + 80; state.y = ARENA_CENTER.y;
    const player = new PlayerModel(); const behavior = new ChargerBehavior(); behavior.configure(state);
    for (let index = 0; index < 600 && state.chargerPhase !== 'telegraph'; index += 1) behavior.update(state, 1 / 60, player.state, ARENA_RADIUS);
    expect(state.chargerPhase).toBe('telegraph'); expect(state.contactEnabled).toBe(true);
    const endX = state.chargerEndX; const endY = state.chargerEndY;
    player.state.x -= 150; player.state.y += 110;
    for (let index = 0; index < 100 && state.chargerPhase !== 'charge'; index += 1) behavior.update(state, 1 / 60, player.state, ARENA_RADIUS);
    expect(state.chargerPhase).toBe('charge'); expect(state.chargerEndX).toBe(endX); expect(state.chargerEndY).toBe(endY);
  });
});
