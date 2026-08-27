import { describe, expect, it } from 'vitest';
import { CombatSimulation } from '../combat/CombatSimulation';
import { PlayerModel } from '../PlayerModel';
import { UpgradeApplier } from './UpgradeApplier';

describe('UpgradeApplier', () => {
  it('applies authored player and weapon effects without a UI dependency', () => {
    const player = new PlayerModel();
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(player, combat);

    expect(applier.apply('swift_step')).toBe(true);
    expect(applier.apply('hardened_shell')).toBe(true);
    expect(applier.apply('orbit_blade')).toBe(true);
    expect(applier.apply('chain_lightning')).toBe(true);
    expect(applier.apply('unknown' as never)).toBe(false);
    expect(player.state.armor).toBe(2);
    expect(combat.activeOrbitBlades).toBe(1);
    expect(combat.hasChainLightning).toBe(true);
  });

  it('filters prerequisites and stops finite upgrades at their authored limits', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation());

    expect(applier.canApply('orbit_reach')).toBe(false);
    expect(applier.canApply('chain_overload')).toBe(false);
    expect(applier.apply('orbit_reach')).toBe(false);

    for (let index = 0; index < 6; index += 1) {
      expect(applier.apply('orbit_blade')).toBe(true);
    }
    expect(applier.apply('orbit_blade')).toBe(false);
    expect(applier.canApply('orbit_blade')).toBe(false);
    expect(applier.canApply('orbit_reach')).toBe(true);

    expect(applier.apply('chain_lightning')).toBe(true);
    expect(applier.apply('chain_lightning')).toBe(false);
    expect(applier.canApply('chain_overload')).toBe(true);

    for (let index = 0; index < 4; index += 1) {
      expect(applier.apply('rapid_projectiles')).toBe(true);
    }
    expect(applier.apply('rapid_projectiles')).toBe(false);
  });
});
