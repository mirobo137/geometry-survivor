import { describe, expect, it } from 'vitest';
import {
  UPGRADE_DEFINITIONS,
  WEAPON_EVOLUTION_DEFINITIONS,
  WEAPON_EVOLUTION_OFFER_DEFINITIONS,
  WEAPON_MASTERY_DEFINITIONS,
  WEAPON_PATH_RANK_DEFINITIONS,
  OVERDRIVE_RESERVE_DEFINITIONS
} from '../../content/upgrades/UpgradeDefinitions';
import { getUpgradeCardVisual } from './UpgradeCardVisual';

describe('upgrade card visual map', () => {
  it('assigns every data-driven upgrade a stable icon, tone and category', () => {
    for (const upgrade of [
      ...UPGRADE_DEFINITIONS,
      ...Object.values(WEAPON_PATH_RANK_DEFINITIONS).flat(),
      ...WEAPON_EVOLUTION_DEFINITIONS,
      ...WEAPON_EVOLUTION_OFFER_DEFINITIONS,
      ...WEAPON_MASTERY_DEFINITIONS,
      ...OVERDRIVE_RESERVE_DEFINITIONS
    ]) {
      const visual = getUpgradeCardVisual(upgrade.id);
      expect(visual.icon).toMatch(/^(speed|projectile|core|orbit|chain|boomerang|pulse|magnet|armor|experience|repair|vampirism|critical|shield|rail|volley|crown|gravity|circuit|thunder|comet|singularity|echo|compression|horizon|collapse)$/);
      expect(visual.tone).toMatch(/^(cyan|gold|violet|amber|rose|mint)$/);
      expect(visual.category.length).toBeGreaterThan(0);
      expect(visual.illustration?.src).toBeTruthy();
      expect(visual.illustration?.label.length).toBeGreaterThan(0);
    }
  });

  it('mantiene el arte base en los rangos y usa la evolución elegida en su maestría', () => {
    expect(getUpgradeCardVisual('projectile_rank_4').illustration)
      .toEqual(getUpgradeCardVisual('focused_projectiles').illustration);
    expect(getUpgradeCardVisual('pulse_ring_mastery_power', { pulse_ring: 'compression_wave' }).illustration)
      .toEqual(getUpgradeCardVisual('compression_wave').illustration);
    expect(getUpgradeCardVisual('overdrive_power_boomerang', { boomerang: 'singularity_return' }).illustration)
      .toEqual(getUpgradeCardVisual('singularity_return').illustration);
  });

  it('da arte visual distinto a cada arma base, evolución y mejora no armada', () => {
    const baseWeapons = [
      'focused_projectiles', 'orbit_blade', 'chain_lightning', 'vector_boomerang', 'pulse_ring', 'magnetic_charge'
    ] as const;
    const nonWeapons = [
      'swift_step', 'reinforced_core', 'resonant_core', 'regenerative_reactor', 'vampiric_core',
      'critical_impact', 'recharging_shield', 'hardened_shell', 'universal_weapon_mastery',
      'overdrive_repair', 'overdrive_nova'
    ] as const;
    const baseSources = baseWeapons.map(id => getUpgradeCardVisual(id).illustration?.src);
    const evolutionSources = WEAPON_EVOLUTION_DEFINITIONS.map(({ id }) => getUpgradeCardVisual(id).illustration?.src);
    const nonWeaponSources = nonWeapons.map(id => getUpgradeCardVisual(id).illustration?.src);

    expect(new Set(baseSources).size).toBe(6);
    expect(new Set(evolutionSources).size).toBe(12);
    expect(new Set(nonWeaponSources).size).toBe(11);
  });

  it('conserva cualquiera de las doce imágenes de evolución en la maestría de su arma', () => {
    const paths = [
      { family: 'projectile', mastery: 'projectile_mastery_power', evolutions: ['rail_lance', 'pulse_volley'] },
      { family: 'orbit', mastery: 'orbit_mastery_power', evolutions: ['solar_crown', 'graviton_halo'] },
      { family: 'chain', mastery: 'chain_mastery_power', evolutions: ['closed_circuit', 'thunderhead'] },
      { family: 'boomerang', mastery: 'boomerang_mastery_power', evolutions: ['twin_comet', 'singularity_return'] },
      { family: 'pulse_ring', mastery: 'pulse_ring_mastery_power', evolutions: ['echo_shock', 'compression_wave'] },
      { family: 'magnetic_charge', mastery: 'magnetic_charge_mastery_power', evolutions: ['event_horizon', 'polar_collapse'] }
    ] as const;

    for (const path of paths) {
      for (const evolution of path.evolutions) {
        expect(getUpgradeCardVisual(path.mastery, { [path.family]: evolution }).illustration)
          .toEqual(getUpgradeCardVisual(evolution).illustration);
      }
    }
  });
});
