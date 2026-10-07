import { describe, expect, it } from 'vitest';
import {
  getOverdriveAssaultHealthMultiplier,
  OVERDRIVE_ASSAULT_ENEMY_POOL,
  OVERDRIVE_ASSAULT_KILLS_PER_BOSS
} from '../../content/run/OverdriveAssaultDefinitions';
import { OverdriveAssaultDirector } from './OverdriveAssaultDirector';

describe('OverdriveAssaultDirector', () => {
  it('uses a deterministic common-enemy mix spanning all three authored acts', () => {
    const first = new OverdriveAssaultDirector(0x1234);
    const second = new OverdriveAssaultDirector(0x1234);
    const sequence = Array.from({ length: 240 }, (_, index) => first.selectEnemyKind(0, index));

    expect(sequence).toEqual(Array.from({ length: 240 }, (_, index) => second.selectEnemyKind(0, index)));
    expect(new Set(sequence)).toEqual(new Set(OVERDRIVE_ASSAULT_ENEMY_POOL));
    expect(sequence).not.toContain('boss');
    expect(sequence).not.toContain('warden-replica');
  });

  it('starts at ×0.25 and escalates boss tiers without an authored ×5 cap', () => {
    const director = new OverdriveAssaultDirector(1);
    expect(director.enemyHealthMultiplier).toBe(0.25);
    expect(director.commonEnemyExperienceMultiplier).toBe(0.5);
    expect(director.bossDefinition.id).toBe('core-sentinel');

    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(0.5);
    expect(director.commonEnemyExperienceMultiplier).toBe(1);
    expect(director.bossDefinition.id).toBe('orbital-warden');
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(1);
    expect(director.bossDefinition.id).toBe('fracture-engine');
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(2);
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(3);
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(4);
    expect(getOverdriveAssaultHealthMultiplier(7)).toBe(6);
  });

  it('resets the escalating health and opening XP profile for a fresh run', () => {
    const director = new OverdriveAssaultDirector(1);
    director.recordBossDefeat();
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(1);
    expect(director.commonEnemyExperienceMultiplier).toBe(1);
    director.reset();
    expect(director.enemyHealthMultiplier).toBe(0.25);
    expect(director.commonEnemyExperienceMultiplier).toBe(0.5);
  });

  it('runs continuously with a modest faster cadence and an explicit provisional quota', () => {
    const director = new OverdriveAssaultDirector(1);
    expect(OVERDRIVE_ASSAULT_KILLS_PER_BOSS).toBe(100);
    expect(director.getSpawnIntervalSeconds(0)).toBeCloseTo(0.9);
    expect(director.getSpawnIntervalSeconds(10_000)).toBeGreaterThanOrEqual(0.2);
    expect(director.definition.arenaShapeChanges).toEqual([]);
  });

  it('caps sparse-field acceleration at 10% and returns to baseline by eight enemies', () => {
    const director = new OverdriveAssaultDirector(1);
    const baseline = director.getSpawnIntervalSeconds(0);
    expect(director.getAdaptiveSpawnIntervalSeconds(0, 0)).toBeCloseTo(baseline * 0.9);
    expect(director.getAdaptiveSpawnIntervalSeconds(0, 4)).toBeCloseTo(baseline * 0.95);
    expect(director.getAdaptiveSpawnIntervalSeconds(0, 8)).toBeCloseTo(baseline);
    for (const elapsed of [0, 120, 10_000]) {
      const currentBaseline = director.getSpawnIntervalSeconds(elapsed);
      let previous = 0;
      for (let count = 0; count <= 250; count++) {
        const interval = director.getAdaptiveSpawnIntervalSeconds(elapsed, count);
        expect(interval).toBeGreaterThanOrEqual(Math.max(0.2, currentBaseline * 0.9));
        expect(interval).toBeGreaterThanOrEqual(previous);
        expect(interval).toBeLessThanOrEqual(currentBaseline);
        previous = interval;
      }
      expect(director.getAdaptiveSpawnIntervalSeconds(elapsed, 250))
        .toBeCloseTo(currentBaseline);
    }
  });
});
