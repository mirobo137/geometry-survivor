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
