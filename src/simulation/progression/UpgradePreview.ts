export type UpgradePreviewStat =
  | 'movementSpeed'
  | 'projectileDamage'
  | 'maxHealth'
  | 'projectileCooldown'
  | 'projectileSpeed'
  | 'orbitRadius'
  | 'chainDamage'
  | 'armor';

/** Runtime values needed by presentation to explain a numeric upgrade. */
export interface UpgradePreview {
  readonly stat: UpgradePreviewStat;
  readonly before: number;
  readonly after: number;
}
