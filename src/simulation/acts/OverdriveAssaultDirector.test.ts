import { describe, expect, it } from 'vitest';
import { OVERDRIVE_ASSAULT_ENEMY_POOL, OVERDRIVE_ASSAULT_KILLS_PER_BOSS } from '../../content/run/OverdriveAssaultDefinitions';
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

  it('starts at ×1, advances boss and health tiers after each defeat, and caps at ×5', () => {
    const director = new OverdriveAssaultDirector(1);
    expect(director.enemyHealthMultiplier).toBe(1);
    expect(director.bossDefinition.id).toBe('core-sentinel');

    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(2);
    expect(director.bossDefinition.id).toBe('orbital-warden');
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(3);
    expect(director.bossDefinition.id).toBe('fracture-engine');
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(4);
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(5);
    director.recordBossDefeat();
    expect(director.enemyHealthMultiplier).toBe(5);
  });

  it('runs continuously with a bounded faster cadence and an explicit provisional quota', () => {
    const director = new OverdriveAssaultDirector(1);
    expect(OVERDRIVE_ASSAULT_KILLS_PER_BOSS).toBe(100);
    expect(director.getSpawnIntervalSeconds(0)).toBeCloseTo(0.75);
    expect(director.getSpawnIntervalSeconds(10_000)).toBeGreaterThanOrEqual(0.2);
    expect(director.definition.arenaShapeChanges).toEqual([]);
  });
});
