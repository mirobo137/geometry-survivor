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

  it('unlocks Vector Boomerang and enforces the three-weapon cap', () => {
    const player = new PlayerModel();
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(player, combat);

    expect(applier.apply('vector_boomerang')).toBe(true);
    expect(combat.hasVectorBoomerang).toBe(true);
    expect(applier.getPreview('vector_boomerang')).toBeNull();

    expect(applier.apply('orbit_blade')).toBe(true);
    expect(applier.canApply('chain_lightning')).toBe(false);
    expect(applier.apply('chain_lightning')).toBe(false);
  });

  it('unlocks Pulse Ring as the fifth authored weapon family', () => {
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(new PlayerModel(), combat);

    expect(applier.apply('pulse_ring')).toBe(true);
    expect(combat.hasPulseRing).toBe(true);
    expect(applier.getPreview('pulse_ring')).toBeNull();
    expect(applier.apply('pulse_ring')).toBe(false);
  });

  it('unlocks Magnetic Charge as the sixth authored weapon family', () => {
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(new PlayerModel(), combat);

    expect(applier.apply('magnetic_charge')).toBe(true);
    expect(combat.hasMagneticCharge).toBe(true);
    expect(applier.getPreview('magnetic_charge')).toBeNull();
    expect(applier.apply('magnetic_charge')).toBe(false);
  });

  it('can prioritize either new weapon card without bypassing the cap', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x1234);

    expect(applier.getChoicesWithPriority(1, 'pulse_ring')[0].id).toBe('pulse_ring');
    expect(applier.apply('orbit_blade')).toBe(true);
    expect(applier.apply('chain_lightning')).toBe(true);
    expect(applier.getChoicesWithPriority(1, 'magnetic_charge').some((choice) => choice.id === 'magnetic_charge')).toBe(false);
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

  it('applies critical and shield cards with authored limits', () => {
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
    expect(applier.apply('recharging_shield')).toBe(false);
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

  it('generates a deterministic reroll without repeating the current cards', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x1234);
    const current = applier.getChoices(2);
    const rerolled = applier.getRerollChoices(2, current);
    const mirror = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x1234);
    const mirrorCurrent = mirror.getChoices(2);
    const repeated = mirror.getRerollChoices(2, mirrorCurrent);

    expect(rerolled).toHaveLength(3);
    expect(new Set(rerolled.map((choice) => choice.id)).size).toBe(3);
    expect(rerolled.map((choice) => choice.id)).toEqual(repeated.map((choice) => choice.id));
    expect(rerolled.every((choice) => !current.some((currentChoice) => currentChoice.id === choice.id))).toBe(true);
  });

  it('offers exactly two mutually-exclusive routes for every authored weapon family', () => {
    const families = [
      { base: undefined, ids: ['rail_lance', 'pulse_volley'] as const },
      { base: 'orbit_blade' as const, ids: ['solar_crown', 'graviton_halo'] as const },
      { base: 'chain_lightning' as const, ids: ['closed_circuit', 'thunderhead'] as const },
      { base: 'vector_boomerang' as const, ids: ['twin_comet', 'singularity_return'] as const },
      { base: 'pulse_ring' as const, ids: ['echo_shock', 'compression_wave'] as const },
      { base: 'magnetic_charge' as const, ids: ['event_horizon', 'polar_collapse'] as const }
    ];

    for (const family of families) {
      const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation());
      if (family.base !== undefined) expect(applier.apply(family.base)).toBe(true);
      const choices = applier.getEvolutionChoices(7, family.ids[0]);
      expect(choices.map((choice) => choice.id)).toEqual([...family.ids]);
      expect(applier.apply(family.ids[0])).toBe(true);
      expect(applier.apply(family.ids[1])).toBe(false);
      expect(applier.getEvolutionChoices(7, family.ids[0])).toHaveLength(0);
    }
  });

  it('keeps the normal hand intact until Projectile reaches rank VII', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x77);

    expect(applier.getChoices(6)).toHaveLength(3);
    expect(applier.getChoices(7)).toHaveLength(3);
    expect(applier.getChoices(7).some((choice) => choice.id === 'projectile_evolution_offer')).toBe(false);
    for (const rank of [2, 3, 4, 5, 6, 7] as const) {
      expect(applier.apply(`projectile_rank_${rank}`)).toBe(true);
    }
    expect(applier.getChoices(7).some((choice) => choice.id === 'projectile_evolution_offer')).toBe(true);
    expect(applier.apply('projectile_evolution_offer')).toBe(false);
    expect(applier.apply('rail_lance')).toBe(true);
    expect(applier.getChoices(7)).toHaveLength(3);
  });

  it('offers each unowned weapon with the same seeded probability and respects the cap', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation());
    const weaponIds = ['projectile_rank_2', 'orbit_blade', 'chain_lightning', 'vector_boomerang', 'pulse_ring', 'magnetic_charge'] as const;
    const counts = new Map(weaponIds.map((id) => [id, 0]));
    for (let index = 0; index < 600; index += 1) {
      const weapon = applier.getChoices(1).find((choice) => weaponIds.includes(choice.id as typeof weaponIds[number]));
      if (weapon) counts.set(weapon.id as typeof weaponIds[number], counts.get(weapon.id as typeof weaponIds[number])! + 1);
    }
    expect([...counts.values()].every((count) => count > 70)).toBe(true);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThan(70);

    expect(applier.apply('orbit_blade')).toBe(true);
    expect(applier.apply('chain_lightning')).toBe(true);
    const cappedHand = applier.getChoices(3);
    expect(cappedHand.some((choice) => ['orbit_blade', 'chain_lightning', 'vector_boomerang', 'pulse_ring', 'magnetic_charge'].includes(choice.id))).toBe(false);
    expect(cappedHand.some((choice) => choice.id === 'projectile_rank_2')).toBe(true);
  });

  it('offers the rare universal mastery only after three evolved families', () => {
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(new PlayerModel(), combat);
    const families = [
      { path: 'projectile' as const, base: undefined, evolution: 'rail_lance' as const },
      { path: 'orbit' as const, base: 'orbit_blade' as const, evolution: 'solar_crown' as const },
      { path: 'chain' as const, base: 'chain_lightning' as const, evolution: 'closed_circuit' as const }
    ];

    for (const family of families) {
      if (family.base) expect(applier.apply(family.base)).toBe(true);
      for (const rank of [2, 3, 4, 5, 6, 7] as const) {
        expect(applier.apply(`${family.path}_rank_${rank}`)).toBe(true);
      }
      expect(applier.apply(family.evolution)).toBe(true);
    }

    expect(applier.canApply('universal_weapon_mastery')).toBe(true);
    expect(applier.getChoices(20).some((choice) => choice.id === 'universal_weapon_mastery')).toBe(true);
    expect(applier.getUniversalMasteryChoices().map((choice) => choice.id)).toEqual([
      'projectile_mastery_power',
      'orbit_mastery_power',
      'chain_mastery_power'
    ]);
    expect(applier.apply('universal_weapon_mastery')).toBe(false);
    expect(applier.applyUniversalMastery('projectile_mastery_power')).toBe(true);
    expect(applier.getStacks('universal_weapon_mastery')).toBe(1);
  });

  it('keeps campaign hands inside the authored pools and reserves a pending evolution', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x12ab);
    const acquisitionIds = new Set(['projectile_rank_2', 'orbit_blade', 'chain_lightning', 'vector_boomerang', 'pulse_ring', 'magnetic_charge']);
    const legacyWeaponIds = new Set(['twin_emitters', 'focused_projectiles', 'rapid_projectiles', 'orbit_reach', 'chain_overload']);

    for (let index = 0; index < 24; index += 1) {
      const hand = applier.getChoices(index + 1);
      expect(hand.filter((choice) => acquisitionIds.has(choice.id)).length).toBeLessThanOrEqual(1);
      expect(hand.some((choice) => legacyWeaponIds.has(choice.id))).toBe(false);
    }

    const acquiredOrbit = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x33);
    expect(acquiredOrbit.apply('orbit_blade')).toBe(true);
    for (let index = 0; index < 12; index += 1) {
      expect(acquiredOrbit.getChoices(index + 1).some((choice) => choice.id === 'orbit_blade')).toBe(false);
    }

    for (const rank of [2, 3, 4, 5, 6, 7] as const) expect(applier.apply(`projectile_rank_${rank}`)).toBe(true);
    for (let index = 0; index < 6; index += 1) {
      const hand = applier.getChoices(index + 30);
      expect(hand.filter((choice) => choice.effect.type === 'evolutionOffer')).toHaveLength(1);
    }
  });

  it('varies run seeds while preserving deterministic seeded hands', () => {
    const sameA = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x1001);
    const sameB = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x1001);
    const other = new UpgradeApplier(new PlayerModel(), new CombatSimulation(), 0x1002);
    expect(sameA.getChoices(1).map((choice) => choice.id)).toEqual(sameB.getChoices(1).map((choice) => choice.id));
    expect(sameA.getChoices(2).map((choice) => choice.id)).not.toEqual(other.getChoices(1).map((choice) => choice.id));
  });

  it('caps universal mastery, requires a valid target and keeps Solar Crown at its fixed radius', () => {
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(new PlayerModel(), combat, 0x4444);
    const families = [
      { path: 'projectile' as const, base: undefined, evolution: 'rail_lance' as const },
      { path: 'orbit' as const, base: 'orbit_blade' as const, evolution: 'solar_crown' as const },
      { path: 'chain' as const, base: 'chain_lightning' as const, evolution: 'closed_circuit' as const }
    ];
    for (const family of families) {
      if (family.base) expect(applier.apply(family.base)).toBe(true);
      for (const rank of [2, 3, 4, 5, 6, 7] as const) expect(applier.apply(`${family.path}_rank_${rank}`)).toBe(true);
      expect(applier.apply(family.evolution)).toBe(true);
    }

    expect(combat.currentOrbitRadius).toBe(94);
    expect(applier.getPreview('orbit_mastery_coverage')).toEqual({
      stat: 'orbitContactRadius',
      before: 10,
      after: 14
    });
    expect(applier.apply('orbit_mastery_coverage')).toBe(true);
    expect(combat.currentOrbitRadius).toBe(94);
    expect(applier.applyUniversalMastery('projectile_mastery_power')).toBe(true);
    expect(applier.applyUniversalMastery('projectile_mastery_power')).toBe(true);
    expect(applier.applyUniversalMastery('projectile_mastery_power')).toBe(true);
    expect(applier.canApply('universal_weapon_mastery')).toBe(false);

    for (const target of ['orbit_mastery_power', 'chain_mastery_power'] as const) {
      for (let index = 0; index < 3; index += 1) expect(applier.apply(target)).toBe(true);
    }
    expect(applier.getUniversalMasteryChoices()).toHaveLength(0);
  });

  it('extends both fixed-radius evolution branches through coverage mastery', () => {
    const pulseCombat = new CombatSimulation();
    const pulse = new UpgradeApplier(new PlayerModel(), pulseCombat, 0x9001);
    expect(pulse.apply('pulse_ring')).toBe(true);
    for (const rank of [2, 3, 4, 5, 6, 7] as const) expect(pulse.apply(`pulse_ring_rank_${rank}`)).toBe(true);
    expect(pulse.apply('compression_wave')).toBe(true);
    expect(pulseCombat.currentPulseRingEndRadius).toBe(320);
    expect(pulse.apply('pulse_ring_mastery_coverage')).toBe(true);
    expect(pulseCombat.currentPulseRingEndRadius).toBe(342);

    const magneticCombat = new CombatSimulation();
    const magnetic = new UpgradeApplier(new PlayerModel(), magneticCombat, 0x9002);
    expect(magnetic.apply('magnetic_charge')).toBe(true);
    for (const rank of [2, 3, 4, 5, 6, 7] as const) expect(magnetic.apply(`magnetic_charge_rank_${rank}`)).toBe(true);
    expect(magnetic.apply('event_horizon')).toBe(true);
    expect(magneticCombat.currentMagneticChargeOuterRadius).toBe(110);
    expect(magnetic.apply('magnetic_charge_mastery_coverage')).toBe(true);
    expect(magneticCombat.currentMagneticChargeOuterRadius).toBe(134);
  });

  it('limits a normal campaign hand to one evolution decision', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation());
    const families = [
      { path: 'projectile' as const, base: undefined },
      { path: 'orbit' as const, base: 'orbit_blade' as const },
      { path: 'chain' as const, base: 'chain_lightning' as const }
    ];

    for (const family of families) {
      if (family.base) expect(applier.apply(family.base)).toBe(true);
      for (const rank of [2, 3, 4, 5, 6, 7] as const) {
        expect(applier.apply(`${family.path}_rank_${rank}`)).toBe(true);
      }
    }

    const choices = applier.getChoices(20);
    expect(choices.filter((choice) => choice.effect.type === 'evolutionOffer')).toHaveLength(1);
  });

  it('walks the focused Projectile path through rank VI before evolution', () => {
    const combat = new CombatSimulation();
    const applier = new UpgradeApplier(new PlayerModel(), combat);
    const ranks = [2, 3, 4, 5, 6] as const;

    for (const rank of ranks) {
      const choices = applier.getWeaponPathRankChoices('projectile', rank);
      expect(choices).toHaveLength(1);
      expect(choices[0]?.effect).toEqual({ type: 'weaponRank', family: 'projectile', rank });
      expect(applier.apply(choices[0]!.id)).toBe(true);
      expect(combat.currentProjectileRank).toBe(rank);
    }

    expect(applier.getWeaponPathRankChoices('projectile', 7)).toHaveLength(1);
    expect(applier.getWeaponPathEvolutionChoices('projectile').map((choice) => choice.id)).toEqual([
      'rail_lance',
      'pulse_volley'
    ]);
    expect(applier.getWeaponPathEvolutionOfferChoices('projectile')).toEqual([
      expect.objectContaining({ id: 'projectile_evolution_offer' })
    ]);
  });

  it('keeps the Projectile evolution behind a recognisable no-stat gate', () => {
    const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation());
    for (const rank of [2, 3, 4, 5, 6] as const) {
      expect(applier.apply(`projectile_rank_${rank}`)).toBe(true);
    }

    const offer = applier.getWeaponPathEvolutionOfferChoices('projectile');
    expect(offer).toHaveLength(1);
    expect(offer[0]).toMatchObject({
      id: 'projectile_evolution_offer',
      effect: { type: 'evolutionOffer', family: 'projectile' }
    });
    expect(applier.apply('projectile_evolution_offer')).toBe(false);
    expect(applier.getWeaponPathEvolutionChoices('projectile').map((choice) => choice.id)).toEqual([
      'rail_lance',
      'pulse_volley'
    ]);
  });

  it('walks every focused weapon family through VI and exposes its level-seven gate', () => {
    const families = [
      { path: 'projectile' as const, evolution: 'rail_lance' as const },
      { path: 'orbit' as const, base: 'orbit_blade' as const, evolution: 'solar_crown' as const },
      { path: 'chain' as const, base: 'chain_lightning' as const, evolution: 'closed_circuit' as const },
      { path: 'boomerang' as const, base: 'vector_boomerang' as const, evolution: 'twin_comet' as const },
      { path: 'pulse_ring' as const, base: 'pulse_ring' as const, evolution: 'echo_shock' as const },
      { path: 'magnetic_charge' as const, base: 'magnetic_charge' as const, evolution: 'event_horizon' as const }
    ];

    for (const family of families) {
      const combat = new CombatSimulation();
      const applier = new UpgradeApplier(new PlayerModel(), combat);
      if (family.base !== undefined) expect(applier.apply(family.base)).toBe(true);
      for (const rank of [2, 3, 4, 5, 6] as const) {
        const choices = applier.getWeaponPathRankChoices(family.path, rank);
        expect(choices).toHaveLength(1);
        expect(applier.apply(choices[0]!.id)).toBe(true);
        expect(combat.getWeaponPathRank(family.path)).toBe(rank);
      }
      expect(applier.getWeaponPathEvolutionOfferChoices(family.path)).toHaveLength(1);
      expect(applier.getWeaponPathEvolutionChoices(family.path).map((choice) => choice.id)).toContain(family.evolution);
      expect(applier.apply(family.evolution)).toBe(true);
      expect(applier.apply(family.evolution)).toBe(false);
    }
  });
});
