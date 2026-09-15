import type { UpgradeId } from '../../content/upgrades/UpgradeDefinitions';

export type UpgradeCardIconId =
  | 'speed'
  | 'projectile'
  | 'core'
  | 'orbit'
  | 'chain'
  | 'boomerang'
  | 'pulse'
  | 'magnet'
  | 'armor'
  | 'experience'
  | 'repair'
  | 'vampirism'
  | 'critical'
  | 'shield'
  | 'rail'
  | 'volley'
  | 'crown'
  | 'gravity'
  | 'circuit'
  | 'thunder'
  | 'comet'
  | 'singularity'
  | 'echo'
  | 'compression'
  | 'horizon'
  | 'collapse';

export type UpgradeCardTone = 'cyan' | 'gold' | 'violet' | 'amber' | 'rose' | 'mint';

export interface UpgradeCardVisual {
  readonly icon: UpgradeCardIconId;
  readonly tone: UpgradeCardTone;
  readonly category: string;
}

const UPGRADE_CARD_VISUALS: Record<UpgradeId, UpgradeCardVisual> = {
  swift_step: { icon: 'speed', tone: 'cyan', category: 'MOVILIDAD' },
  focused_projectiles: { icon: 'projectile', tone: 'gold', category: 'ARSENAL' },
  twin_emitters: { icon: 'projectile', tone: 'rose', category: 'ARSENAL' },
  reinforced_core: { icon: 'core', tone: 'mint', category: 'NÚCLEO' },
  orbit_blade: { icon: 'orbit', tone: 'violet', category: 'ÓRBITA' },
  chain_lightning: { icon: 'chain', tone: 'cyan', category: 'ENERGÍA' },
  vector_boomerang: { icon: 'boomerang', tone: 'amber', category: 'RETORNO' },
  pulse_ring: { icon: 'pulse', tone: 'cyan', category: 'ONDA' },
  magnetic_charge: { icon: 'magnet', tone: 'violet', category: 'CONTROL REMOTO' },
  rapid_projectiles: { icon: 'projectile', tone: 'amber', category: 'ARSENAL' },
  resonant_core: { icon: 'experience', tone: 'gold', category: 'PROGRESIÓN' },
  regenerative_reactor: { icon: 'repair', tone: 'mint', category: 'RECUPERACIÓN' },
  vampiric_core: { icon: 'vampirism', tone: 'rose', category: 'SUPERVIVENCIA' },
  critical_impact: { icon: 'critical', tone: 'amber', category: 'ARSENAL' },
  recharging_shield: { icon: 'shield', tone: 'cyan', category: 'DEFENSA' },
  orbit_reach: { icon: 'orbit', tone: 'violet', category: 'ÓRBITA' },
  chain_overload: { icon: 'chain', tone: 'rose', category: 'ENERGÍA' },
  hardened_shell: { icon: 'armor', tone: 'mint', category: 'DEFENSA' },
  projectile_rank_2: { icon: 'projectile', tone: 'rose', category: 'PROJECTILE · II' },
  projectile_rank_3: { icon: 'projectile', tone: 'gold', category: 'PROJECTILE · III' },
  projectile_rank_4: { icon: 'projectile', tone: 'amber', category: 'PROJECTILE · IV' },
  projectile_rank_5: { icon: 'projectile', tone: 'gold', category: 'PROJECTILE · V' },
  projectile_rank_6: { icon: 'projectile', tone: 'cyan', category: 'PROJECTILE · VI' },
  projectile_rank_7: { icon: 'projectile', tone: 'violet', category: 'PROJECTILE · VII' },
  projectile_evolution_offer: { icon: 'rail', tone: 'violet', category: 'EVOLUCION DISPONIBLE' },
  orbit_rank_2: { icon: 'orbit', tone: 'violet', category: 'ÓRBITA · II' },
  orbit_rank_3: { icon: 'orbit', tone: 'cyan', category: 'ÓRBITA · III' },
  orbit_rank_4: { icon: 'orbit', tone: 'gold', category: 'ÓRBITA · IV' },
  orbit_rank_5: { icon: 'orbit', tone: 'amber', category: 'ÓRBITA · V' },
  orbit_rank_6: { icon: 'orbit', tone: 'violet', category: 'ÓRBITA · VI' },
  orbit_rank_7: { icon: 'orbit', tone: 'gold', category: 'ÓRBITA · VII' },
  orbit_evolution_offer: { icon: 'crown', tone: 'violet', category: 'EVOLUCIÓN DISPONIBLE' },
  chain_rank_2: { icon: 'chain', tone: 'cyan', category: 'CADENA · II' },
  chain_rank_3: { icon: 'chain', tone: 'gold', category: 'CADENA · III' },
  chain_rank_4: { icon: 'chain', tone: 'amber', category: 'CADENA · IV' },
  chain_rank_5: { icon: 'chain', tone: 'cyan', category: 'CADENA · V' },
  chain_rank_6: { icon: 'chain', tone: 'rose', category: 'CADENA · VI' },
  chain_rank_7: { icon: 'chain', tone: 'violet', category: 'CADENA · VII' },
  chain_evolution_offer: { icon: 'circuit', tone: 'violet', category: 'EVOLUCIÓN DISPONIBLE' },
  boomerang_rank_2: { icon: 'boomerang', tone: 'amber', category: 'BÚMERAN · II' },
  boomerang_rank_3: { icon: 'boomerang', tone: 'cyan', category: 'BÚMERAN · III' },
  boomerang_rank_4: { icon: 'boomerang', tone: 'gold', category: 'BÚMERAN · IV' },
  boomerang_rank_5: { icon: 'boomerang', tone: 'rose', category: 'BÚMERAN · V' },
  boomerang_rank_6: { icon: 'boomerang', tone: 'amber', category: 'BÚMERAN · VI' },
  boomerang_rank_7: { icon: 'boomerang', tone: 'violet', category: 'BÚMERAN · VII' },
  boomerang_evolution_offer: { icon: 'comet', tone: 'violet', category: 'EVOLUCIÓN DISPONIBLE' },
  pulse_ring_rank_2: { icon: 'pulse', tone: 'cyan', category: 'PULSO · II' },
  pulse_ring_rank_3: { icon: 'pulse', tone: 'gold', category: 'PULSO · III' },
  pulse_ring_rank_4: { icon: 'pulse', tone: 'rose', category: 'PULSO · IV' },
  pulse_ring_rank_5: { icon: 'pulse', tone: 'amber', category: 'PULSO · V' },
  pulse_ring_rank_6: { icon: 'pulse', tone: 'cyan', category: 'PULSO · VI' },
  pulse_ring_rank_7: { icon: 'pulse', tone: 'violet', category: 'PULSO · VII' },
  pulse_ring_evolution_offer: { icon: 'echo', tone: 'violet', category: 'EVOLUCIÓN DISPONIBLE' },
  magnetic_charge_rank_2: { icon: 'magnet', tone: 'violet', category: 'MAGNÉTICA · II' },
  magnetic_charge_rank_3: { icon: 'magnet', tone: 'cyan', category: 'MAGNÉTICA · III' },
  magnetic_charge_rank_4: { icon: 'magnet', tone: 'gold', category: 'MAGNÉTICA · IV' },
  magnetic_charge_rank_5: { icon: 'magnet', tone: 'rose', category: 'MAGNÉTICA · V' },
  magnetic_charge_rank_6: { icon: 'magnet', tone: 'amber', category: 'MAGNÉTICA · VI' },
  magnetic_charge_rank_7: { icon: 'magnet', tone: 'violet', category: 'MAGNÉTICA · VII' },
  magnetic_charge_evolution_offer: { icon: 'horizon', tone: 'violet', category: 'EVOLUCIÓN DISPONIBLE' },
  rail_lance: { icon: 'rail', tone: 'gold', category: 'EVOLUCION' },
  pulse_volley: { icon: 'volley', tone: 'cyan', category: 'EVOLUCION' },
  solar_crown: { icon: 'crown', tone: 'gold', category: 'EVOLUCION' },
  graviton_halo: { icon: 'gravity', tone: 'violet', category: 'EVOLUCION' },
  closed_circuit: { icon: 'circuit', tone: 'cyan', category: 'EVOLUCION' },
  thunderhead: { icon: 'thunder', tone: 'rose', category: 'EVOLUCION' },
  twin_comet: { icon: 'comet', tone: 'amber', category: 'EVOLUCION' },
  singularity_return: { icon: 'singularity', tone: 'violet', category: 'EVOLUCION' },
  echo_shock: { icon: 'echo', tone: 'cyan', category: 'EVOLUCION' },
  compression_wave: { icon: 'compression', tone: 'rose', category: 'EVOLUCION' },
  event_horizon: { icon: 'horizon', tone: 'violet', category: 'EVOLUCION' },
  polar_collapse: { icon: 'collapse', tone: 'gold', category: 'EVOLUCION' }
};

export const getUpgradeCardVisual = (upgradeId: UpgradeId): UpgradeCardVisual => UPGRADE_CARD_VISUALS[upgradeId];
