export type UpgradePreviewStat =
  | 'movementSpeed'
  | 'projectileDamage'
  | 'projectileSpeed'
  | 'maxHealth'
  | 'projectileCooldown'
  | 'experienceGain'
  | 'healthRecovery'
  | 'vampirism'
  | 'criticalChance'
  | 'orbitRadius'
  | 'orbitDamage'
  | 'orbitHitCooldown'
  | 'orbitContactRadius'
  | 'chainDamage'
  | 'chainCooldown'
  | 'chainJumpRadius'
  | 'boomerangDamage'
  | 'boomerangCooldown'
  | 'boomerangDistance'
  | 'pulseRingDamage'
  | 'pulseRingCooldown'
  | 'pulseRingRadius'
  | 'magneticChargeDamage'
  | 'magneticChargeCooldown'
  | 'magneticChargeRadius'
  | 'armor';

/** Runtime values needed by presentation to explain a numeric upgrade. */
export interface UpgradePreview {
  readonly stat: UpgradePreviewStat;
  readonly before: number;
  readonly after: number;
}
