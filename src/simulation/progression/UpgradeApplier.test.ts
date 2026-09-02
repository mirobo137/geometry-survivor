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
    expect(applier.apply('twin_emitters')).toBe(true);
    expect(applier.apply('unknown' as never)).toBe(false);
    expect(player.state.armor).toBe(2);
    expect(combat.activeOrbitBlades).toBe(1);
    expect(combat.hasChainLightning).toBe(true);
    expect(combat.hasTwinEmitters).toBe(true);
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

  it('exposes numeric before-after previews without applying the upgrade', () => {
    const player = new PlayerModel();
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(player, combat);

    expect(applier.getPreview('swift_step')).toEqual({
      stat: 'movementSpeed',
      before: 250,
      after: 275
    });
    const cooldownPreview = applier.getPreview('rapid_projectiles');
    expect(cooldownPreview?.stat).toBe('projectileCooldown');
    expect(cooldownPreview?.before).toBeCloseTo(0.55);
    expect(cooldownPreview?.after).toBeCloseTo(0.47);
    expect(applier.getPreview('orbit_blade')).toBeNull();
    expect(player.currentMovementSpeed).toBe(250);
    expect(combat.currentProjectileCooldown).toBe(0.55);

    expect(applier.apply('swift_step')).toBe(true);
    expect(applier.getPreview('swift_step')).toEqual({
      stat: 'movementSpeed',
      before: 275,
      after: 300
    });
  });

  it('applies the first passive progression cards through their domain contracts', () => {
    const player = new PlayerModel();
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(player, combat);

    expect(applier.apply('resonant_core')).toBe(true);
    expect(applier.apply('regenerative_reactor')).toBe(true);
    expect(applier.apply('vampiric_core')).toBe(true);

    expect(combat.currentExperienceMultiplier).toBeCloseTo(1.12);
    expect(player.currentHealthRecovery).toBeCloseTo(0.02);
    expect(player.currentVampirism).toBeCloseTo(0.01);
    expect(applier.getPreview('resonant_core')).toEqual({
      stat: 'experienceGain',
      before: 0.12,
      after: 0.24
    });
    expect(applier.getPreview('regenerative_reactor')).toEqual({
      stat: 'healthRecovery',
      before: 0.02,
      after: 0.04
    });
    expect(applier.getPreview('vampiric_core')).toEqual({
      stat: 'vampirism',
      before: 0.01,
      after: 0.02
    });
  });

  it('applies critical, shield and phase cards with authored limits', () => {
    const player = new PlayerModel();
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(player, combat);

    expect(applier.apply('critical_impact')).toBe(true);
    expect(combat.currentCriticalChance).toBeCloseTo(0.1);
    expect(applier.getPreview('critical_impact')).toEqual({
      stat: 'criticalChance',
      before: 0.1,
      after: 0.2
    });
    expect(applier.apply('recharging_shield')).toBe(true);
    expect(player.hasShield).toBe(true);
    expect(player.shieldAvailable).toBe(true);
    expect(applier.apply('phase_shift')).toBe(true);
    expect(player.hasPhaseShift).toBe(true);

    expect(applier.apply('recharging_shield')).toBe(false);
    expect(applier.apply('phase_shift')).toBe(false);
    expect(applier.apply('critical_impact')).toBe(true);
    expect(applier.apply('critical_impact')).toBe(true);
    expect(applier.apply('critical_impact')).toBe(false);
    expect(combat.currentCriticalChance).toBeCloseTo(0.3);
  });

  it('clears acquired stacks so a restarted run starts with the base build', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation());
    expect(applier.apply('orbit_blade')).toBe(true);
    expect(applier.apply('chain_lightning')).toBe(true);

    applier.reset();

    expect(applier.getStacks('orbit_blade')).toBe(0);
    expect(applier.getStacks('chain_lightning')).toBe(0);
    expect(applier.canApply('orbit_reach')).toBe(false);
  });
});
