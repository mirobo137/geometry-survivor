import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_MAX_RADIUS, ARENA_RADIUS, PLAYER_RADIUS, PLAYER_SPEED } from '../config/constants';
import { PlayerModel } from './PlayerModel';
import { getLaboratoryCombatBonuses } from '../content/meta/LaboratoryDefinitions';

describe('PlayerModel', () => {
  it('moves at a fixed speed independent of frame chunking', () => {
    const oneStep = new PlayerModel();
    const manySteps = new PlayerModel();
    const input = { x: 1, y: 0 };

    oneStep.update(input, 1 / 6);
    for (let index = 0; index < 10; index += 1) manySteps.update(input, 1 / 60);

    expect(oneStep.state.x).toBeCloseTo(manySteps.state.x);
    expect(oneStep.state.x).toBeCloseTo(ARENA_CENTER.x + PLAYER_SPEED / 6);
  });

  it('keeps the player inside the circular arena', () => {
    const player = new PlayerModel();
    for (let index = 0; index < 120; index += 1) player.update({ x: 1, y: 0 }, 1 / 30);

    const distance = Math.hypot(player.state.x - ARENA_CENTER.x, player.state.y - ARENA_CENTER.y);
    expect(distance).toBeLessThanOrEqual(ARENA_RADIUS - PLAYER_RADIUS + 0.0001);
  });

  it('cannot enter the center barrier supplied by a challenge arena', () => {
    const player = new PlayerModel();
    const arena = {
      radius: ARENA_RADIUS,
      shapeFrom: 'circle' as const,
      shapeTo: 'circle' as const,
      morphProgress: 0,
      centerExclusionRadius: 112
    };
    player.update({ x: 0, y: 0 }, 0, arena);
    for (let index = 0; index < 120; index += 1) player.update({ x: 0, y: 1 }, 1 / 60, arena);

    const distance = Math.hypot(player.state.x - ARENA_CENTER.x, player.state.y - ARENA_CENTER.y);
    expect(distance).toBeGreaterThanOrEqual(112 + PLAYER_RADIUS - 0.0001);
  });

  it('uses the current arena radius when the arena expands', () => {
    const player = new PlayerModel();

    player.update({ x: 1, y: 0 }, 10, ARENA_MAX_RADIUS);

    const distance = Math.hypot(player.state.x - ARENA_CENTER.x, player.state.y - ARENA_CENTER.y);
    expect(distance).toBeLessThanOrEqual(ARENA_MAX_RADIUS - PLAYER_RADIUS + 0.0001);
    expect(distance).toBeGreaterThan(ARENA_RADIUS - PLAYER_RADIUS);
  });

  it('applies contact damage with a short invulnerability window', () => {
    const player = new PlayerModel();

    expect(player.takeDamage(20)).toBe(true);
    expect(player.state.health).toBe(80);
    expect(player.takeDamage(20)).toBe(false);

    player.update({ x: 0, y: 0 }, 0.5);
    expect(player.takeDamage(20)).toBe(true);
    expect(player.state.health).toBe(60);
  });

  it('applies movement and vitality upgrades without breaking the arena contract', () => {
    const player = new PlayerModel();

    player.increaseMovementSpeed(25);
    player.increaseMaxHealth(20);
    player.update({ x: 1, y: 0 }, 1 / 6);

    expect(player.state.maxHealth).toBe(120);
    expect(player.state.health).toBe(120);
    expect(player.state.x).toBeCloseTo(ARENA_CENTER.x + (PLAYER_SPEED + 25) / 6);
  });

  it('mitigates contact damage with hardened shell armor', () => {
    const player = new PlayerModel();

    player.increaseArmor(2);
    expect(player.takeDamage(5)).toBe(true);
    expect(player.state.health).toBe(97);
  });

  it('applies capped persistent movement, max-health, and resistance bonuses across run resets', () => {
    const player = new PlayerModel();
    player.setPermanentBonuses(getLaboratoryCombatBonuses({
      movement_speed: 5,
      max_health: 5,
      damage_resistance: 5
    }, 4));

    expect(player.state.maxHealth).toBeCloseTo(114.4);
    expect(player.currentMovementSpeed).toBeCloseTo(PLAYER_SPEED * 1.1);
    expect(player.resolveDamage(10).appliedAmount).toBeCloseTo(9.5);
    expect(player.state.health).toBeCloseTo(104.9);

    player.reset();

    expect(player.state.maxHealth).toBeCloseTo(114.4);
    expect(player.state.health).toBeCloseTo(114.4);
    expect(player.currentMovementSpeed).toBeCloseTo(PLAYER_SPEED * 1.1);
  });

  it('recovers a percentage of max health on a deterministic pulse', () => {
    const player = new PlayerModel();
    player.increaseHealthRecovery(0.02);
    player.takeDamage(50);

    player.update({ x: 0, y: 0 }, 4.99);
    expect(player.state.health).toBe(50);

    player.update({ x: 0, y: 0 }, 0.01);
    expect(player.state.health).toBeCloseTo(52);

    player.update({ x: 0, y: 0 }, 10);
    expect(player.state.health).toBeCloseTo(56);
  });

  it('applies kill healing once per vampirism cooldown', () => {
    const player = new PlayerModel();
    player.increaseVampirism(0.01);
    player.takeDamage(50);

    expect(player.applyVampirism()).toBeCloseTo(1);
    expect(player.state.health).toBeCloseTo(51);
    expect(player.applyVampirism()).toBe(0);

    player.update({ x: 0, y: 0 }, 0.25);
    expect(player.applyVampirism()).toBeCloseTo(1);
    expect(player.state.health).toBeCloseTo(52);
  });

  it('never lets vampirism exceed 2% of maximum health per kill', () => {
    const player = new PlayerModel();
    player.increaseVampirism(0.01);
    player.increaseVampirism(0.01);
    player.increaseVampirism(0.01);
    expect(player.currentVampirism).toBeCloseTo(0.02);
  });

  it('blocks one damage packet with a rechargeable shield', () => {
    const player = new PlayerModel();
    player.enableShield(1);

    expect(player.shieldChargeProgress).toBe(1);
    expect(player.resolveDamage(50).outcome).toBe('shielded');
    expect(player.state.health).toBe(100);
    expect(player.shieldChargeProgress).toBe(0);

    player.update({ x: 0, y: 0 }, 0.45);
    expect(player.shieldChargeProgress).toBeCloseTo(0.45);
    expect(player.resolveDamage(50).outcome).toBe('damaged');
    expect(player.state.health).toBe(50);

    player.update({ x: 0, y: 0 }, 0.5);
    expect(player.shieldChargeProgress).toBeCloseTo(0.95);
    player.update({ x: 0, y: 0 }, 0.05);
    expect(player.resolveDamage(50).outcome).toBe('shielded');
    expect(player.state.health).toBe(50);
  });

  it('revives at the authored percentage and protects the return window', () => {
    const player = new PlayerModel();
    player.takeDamage(200);

    expect(player.revive(0.35, 2)).toBe(true);
    expect(player.state.health).toBeCloseTo(35);
    expect(player.takeDamage(20)).toBe(false);
    player.update({ x: 0, y: 0 }, 2);
    expect(player.takeDamage(20)).toBe(true);
    expect(player.state.health).toBeCloseTo(15);
    expect(player.revive()).toBe(false);
  });

  it('restores the base player state for an in-place restart', () => {
    const player = new PlayerModel();
    player.increaseMovementSpeed(25);
    player.increaseMaxHealth(20);
    player.increaseArmor(2);
    player.takeDamage(10);
    player.update({ x: 1, y: 0 }, 1 / 60);

    player.reset();

    expect(player.state).toEqual({
      x: ARENA_CENTER.x,
      y: ARENA_CENTER.y,
      radius: PLAYER_RADIUS,
      health: 100,
      maxHealth: 100,
      armor: 0
    });
    expect(player.currentMovementSpeed).toBe(PLAYER_SPEED);
    expect(player.currentHealthRecovery).toBe(0);
    expect(player.currentVampirism).toBe(0);
    expect(player.isAlive).toBe(true);
  });
});
