import { describe, expect, it } from 'vitest';
import { BaselineRunRecorder, BASELINE_STORAGE_KEY, formatBaselineReport, type BaselineStorage } from './BaselineRunRecorder';

const createStorage = (): BaselineStorage => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); }
  };
};

describe('BaselineRunRecorder', () => {
  it('captures the first level-up, boss, damage source, maxima and finish profile', () => {
    const recorder = new BaselineRunRecorder(true, createStorage());
    recorder.beginRun('medium');
    recorder.noteLevelUp(14.25);
    recorder.noteLevelUp(31);
    recorder.noteBoss(260);
    recorder.noteDamageSource('laser');
    recorder.noteUpgrade('projectile_damage');
    recorder.noteUpgrade('recharging_shield');
    recorder.observe({ enemies: 12, projectiles: 4, fx: 6 });
    recorder.observe({ enemies: 9, projectiles: 10, fx: 3 });

    const record = recorder.finish({
      outcome: 'game-over',
      elapsedSeconds: 271.5,
      nova: 42,
      frameProfile: { averageMs: 16.67, p95Ms: 18.2 }
    });

    expect(record).toMatchObject({
      runNumber: 1,
      firstLevelUpSeconds: 14.25,
      bossSeconds: 260,
      cause: 'laser',
      maxEnemies: 12,
      maxProjectiles: 10,
      maxFx: 6,
      fpsAverage: 1000 / 16.67
    });
    expect(recorder.isActive).toBe(false);
    expect(recorder.report()).toContain('Runs completadas: 1/10');
  });

  it('persists a bounded ten-run window and makes victory cause explicit', () => {
    const storage = createStorage();
    const recorder = new BaselineRunRecorder(true, storage);
    for (let run = 0; run < 12; run += 1) {
      recorder.beginRun('low');
      recorder.finish({
        outcome: 'victory',
        elapsedSeconds: 300,
        nova: 10,
        frameProfile: { averageMs: null, p95Ms: null }
      });
    }

    expect(recorder.records).toHaveLength(10);
    expect(recorder.records[0]?.runNumber).toBe(3);
    expect(recorder.records.at(-1)?.cause).toBe('boss-defeated');
    expect(storage.getItem(BASELINE_STORAGE_KEY)).not.toBeNull();

    const reloaded = new BaselineRunRecorder(true, storage);
    expect(reloaded.records).toHaveLength(10);
    reloaded.clear();
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });

  it('ignores calls when baseline mode is disabled', () => {
    const recorder = new BaselineRunRecorder(false, createStorage());
    recorder.beginRun('high');
    recorder.noteUpgrade('armor');
    expect(recorder.finish({
      outcome: 'game-over',
      elapsedSeconds: 1,
      nova: 1,
      frameProfile: { averageMs: 16, p95Ms: 17 }
    })).toBeNull();
    expect(formatBaselineReport([], null)).toContain('0/10');
  });

  it('reopens the intermediate death when a rewarded revive continues the run', () => {
    const recorder = new BaselineRunRecorder(true, createStorage());
    recorder.beginRun('medium');
    recorder.noteLevelUp(12);
    recorder.noteDamageSource('contact');
    recorder.finish({
      outcome: 'game-over',
      elapsedSeconds: 20,
      nova: 4,
      frameProfile: { averageMs: 16, p95Ms: 18 }
    });

    recorder.resumeAfterRevive();
    expect(recorder.records).toHaveLength(0);
    expect(recorder.isActive).toBe(true);
    recorder.noteDamageSource('laser');
    const final = recorder.finish({
      outcome: 'game-over',
      elapsedSeconds: 40,
      nova: 8,
      frameProfile: { averageMs: 16, p95Ms: 17 }
    });
    expect(final).toMatchObject({ runNumber: 1, elapsedSeconds: 40, cause: 'laser' });
  });
});
