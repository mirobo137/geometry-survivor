import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import { LASER_DEFINITION } from '../../content/hazards/LaserDefinition';
import { PlayerModel } from '../PlayerModel';
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
});
