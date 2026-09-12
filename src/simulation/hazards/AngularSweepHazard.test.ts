import { describe, expect, it } from 'vitest';
import { ARENA_RADIUS } from '../../config/constants';
import { PlayerModel } from '../PlayerModel';
import { AngularSweepHazard } from './AngularSweepHazard';

const definition = {
  firstTriggerSeconds: 0,
  intervalSeconds: 1,
  lastTriggerSeconds: 10,
  telegraphSeconds: 0.1,
  attackSeconds: 0.3,
  recoverySeconds: 0.1,
  damage: 22,
  dangerHalfAngle: 0.18,
  travelRadians: 0.7,
  sectorCount: 8,
  startAngleStep: Math.PI / 4
};

describe('AngularSweepHazard', () => {
  it('separa idle, telegraph, active y recovery', () => {
    const hazard = new AngularSweepHazard(definition);
    const player = new PlayerModel();

    hazard.update(0.05, 0, player.state, ARENA_RADIUS);
    expect(hazard.state.phase).toBe('telegraph');
    expect(hazard.state.travelProgress).toBe(0);

    hazard.update(0.1, 0, player.state, ARENA_RADIUS);
    expect(hazard.state.phase).toBe('active');
    expect(hazard.state.angle).not.toBe(hazard.state.startAngle);

    hazard.update(0.1, 0, player.state, ARENA_RADIUS);
    hazard.update(0.1, 0, player.state, ARENA_RADIUS);
    hazard.update(0.1, 0, player.state, ARENA_RADIUS);
    expect(hazard.state.phase).toBe('recovery');
    hazard.update(0.1, 0, player.state, ARENA_RADIUS);
    expect(hazard.state.phase).toBe('idle');
  });

  it('permite una ruta lateral y solo aplica un hit por cast', () => {
    const hazard = new AngularSweepHazard(definition);
    const player = new PlayerModel();
    hazard.update(0.1, 0, player.state, ARENA_RADIUS);
    const safeAngle = hazard.state.startAngle + Math.PI / 2;
    player.state.x = 640 + Math.cos(safeAngle) * 150;
    player.state.y = 360 + Math.sin(safeAngle) * 150;

    expect(hazard.update(0.12, 0, player.state, ARENA_RADIUS).damaged).toBe(false);

    const dangerAngle = hazard.state.angle;
    player.state.x = 640 + Math.cos(dangerAngle) * 150;
    player.state.y = 360 + Math.sin(dangerAngle) * 150;
    expect(hazard.update(0.05, 0, player.state, ARENA_RADIUS).damaged).toBe(true);
    expect(hazard.update(0.05, 0, player.state, ARENA_RADIUS).damaged).toBe(false);
  });

  it('alternates committed travel direction and resets the sequence', () => {
    const hazard = new AngularSweepHazard(definition);
    const player = new PlayerModel();
    for (let index = 0; index < 5; index += 1) hazard.update(0.1, 0, player.state, ARENA_RADIUS);
    for (let index = 0; index < 5; index += 1) hazard.update(0.1, 0, player.state, ARENA_RADIUS);
    hazard.update(0.05, 1, player.state, ARENA_RADIUS);
    expect(['telegraph', 'active']).toContain(hazard.state.phase);
    expect(hazard.state.travelRadians).toBeLessThan(0);
    expect(hazard.state.sequence).toBe(2);

    hazard.reset();
    expect(hazard.state.phase).toBe('idle');
    expect(hazard.state.sequence).toBe(0);
  });
});
