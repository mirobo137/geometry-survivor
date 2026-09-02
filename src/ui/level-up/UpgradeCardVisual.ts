import type { UpgradeId } from '../../content/upgrades/UpgradeDefinitions';

export type UpgradeCardIconId =
  | 'speed'
  | 'projectile'
  | 'core'
  | 'orbit'
  | 'chain'
  | 'armor'
  | 'experience'
  | 'repair'
  | 'vampirism'
  | 'critical'
  | 'shield';

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
  rapid_projectiles: { icon: 'projectile', tone: 'amber', category: 'ARSENAL' },
  resonant_core: { icon: 'experience', tone: 'gold', category: 'PROGRESIÓN' },
  regenerative_reactor: { icon: 'repair', tone: 'mint', category: 'RECUPERACIÓN' },
  vampiric_core: { icon: 'vampirism', tone: 'rose', category: 'SUPERVIVENCIA' },
  critical_impact: { icon: 'critical', tone: 'amber', category: 'ARSENAL' },
  recharging_shield: { icon: 'shield', tone: 'cyan', category: 'DEFENSA' },
  orbit_reach: { icon: 'orbit', tone: 'violet', category: 'ÓRBITA' },
  chain_overload: { icon: 'chain', tone: 'rose', category: 'ENERGÍA' },
  hardened_shell: { icon: 'armor', tone: 'mint', category: 'DEFENSA' }
};

export const getUpgradeCardVisual = (upgradeId: UpgradeId): UpgradeCardVisual => UPGRADE_CARD_VISUALS[upgradeId];
