import type { CampaignActId } from '../../platform/save/SaveStore';
import { ANGULAR_ACT_DEFINITION, FRACTURE_ACT_DEFINITION, RADIAL_ACT_DEFINITION } from '../../content/run/ActDefinitions';
import type { BossDefinition } from '../../content/bosses/BossDefinition';
import { RadialActDirector } from './RadialActDirector';

/** Challenge-only tuning: preserve warnings and allow a modestly longer recovery between attacks. */
export const RETENTION_BOSS_ACTIVE_TIME_MULTIPLIER = 0.7;
export const RETENTION_BOSS_RECOVERY_TIME_MULTIPLIER = 0.33;

const createRetentionBossDefinition = (authored: BossDefinition): BossDefinition => ({
  ...authored,
  startSeconds: 0,
  sweepActiveSeconds: authored.sweepActiveSeconds * RETENTION_BOSS_ACTIVE_TIME_MULTIPLIER,
  ringActiveSeconds: authored.ringActiveSeconds * RETENTION_BOSS_ACTIVE_TIME_MULTIPLIER,
  chargeActiveSeconds: authored.chargeActiveSeconds * RETENTION_BOSS_ACTIVE_TIME_MULTIPLIER,
  curveActiveSeconds: authored.curveActiveSeconds * RETENTION_BOSS_ACTIVE_TIME_MULTIPLIER,
  replicasActiveSeconds: authored.replicasActiveSeconds * RETENTION_BOSS_ACTIVE_TIME_MULTIPLIER,
  recoverySeconds: authored.recoverySeconds * RETENTION_BOSS_RECOVERY_TIME_MULTIPLIER
});

/** Weekly duels reuse each authored kit, with a separate and isolated cadence profile. */
export const createRetentionActDirector = (actId: CampaignActId): RadialActDirector => {
  const authored = actId === 'angular'
    ? ANGULAR_ACT_DEFINITION
    : actId === 'fracture' ? FRACTURE_ACT_DEFINITION : RADIAL_ACT_DEFINITION;
  return new RadialActDirector({
    ...authored,
    durationSeconds: 0,
    bossStartSeconds: 0,
    boss: createRetentionBossDefinition(authored.boss)
  });
};
