import { describe, expect, it } from 'vitest';
import type { BossDefinition, BossPattern } from '../../content/bosses/BossDefinition';
import {
  ANGULAR_ACT_DEFINITION,
  FRACTURE_ACT_DEFINITION,
  RADIAL_ACT_DEFINITION
} from '../../content/run/ActDefinitions';
import {
  createRetentionActDirector,
  RETENTION_BOSS_ACTIVE_TIME_MULTIPLIER,
  RETENTION_BOSS_RECOVERY_TIME_MULTIPLIER
} from './RetentionActDirector';

const acts = [
  { id: 'radial', authored: RADIAL_ACT_DEFINITION },
  { id: 'angular', authored: ANGULAR_ACT_DEFINITION },
  { id: 'fracture', authored: FRACTURE_ACT_DEFINITION }
] as const;

const patternDuration = (pattern: BossPattern, boss: BossDefinition): number => {
  switch (pattern) {
    case 'sweep':
    case 'battery':
      return boss.sweepTelegraphSeconds + boss.sweepActiveSeconds;
    case 'ring':
      return boss.ringTelegraphSeconds + boss.ringActiveSeconds;
    case 'charge':
    case 'spikes':
      return boss.chargeTelegraphSeconds + boss.chargeActiveSeconds;
    case 'curve':
    case 'zigzag':
      return boss.curveTelegraphSeconds + boss.curveActiveSeconds;
    case 'replicas':
    case 'mines':
      return boss.replicasTelegraphSeconds + boss.replicasActiveSeconds;
  }
};

const fullCycleSeconds = (boss: BossDefinition): number =>
  boss.patternOrder.reduce((total, pattern) => total + patternDuration(pattern, boss) + boss.recoverySeconds, 0);

describe('RetentionActDirector', () => {
  it.each(acts)('gives $id a faster challenge-only boss cadence and preserves its warnings', ({ id, authored }) => {
    const authoredBoss = authored.boss;
    const authoredSnapshot = structuredClone(authoredBoss);
    const challengeBoss = createRetentionActDirector(id).bossDefinition;
    const cadenceIncrease = fullCycleSeconds(authoredBoss) / fullCycleSeconds(challengeBoss);

    expect(challengeBoss.startSeconds).toBe(0);
    expect(cadenceIncrease).toBeGreaterThanOrEqual(1.45);
    expect(challengeBoss.recoverySeconds).toBeCloseTo(
      authoredBoss.recoverySeconds * RETENTION_BOSS_RECOVERY_TIME_MULTIPLIER
    );
    expect(RETENTION_BOSS_RECOVERY_TIME_MULTIPLIER).toBeGreaterThan(0.25);
    for (const field of [
      'sweepTelegraphSeconds',
      'ringTelegraphSeconds',
      'chargeTelegraphSeconds',
      'curveTelegraphSeconds',
      'replicasTelegraphSeconds'
    ] as const) {
      expect(challengeBoss[field]).toBe(authoredBoss[field]);
    }
    expect(challengeBoss.sweepActiveSeconds).toBeCloseTo(
      authoredBoss.sweepActiveSeconds * RETENTION_BOSS_ACTIVE_TIME_MULTIPLIER
    );
    expect(authored.boss).toEqual(authoredSnapshot);
  });
});
