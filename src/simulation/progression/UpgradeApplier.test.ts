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
});
