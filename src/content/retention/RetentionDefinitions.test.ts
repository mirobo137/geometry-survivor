import { describe, expect, it } from 'vitest';
import {
  RETENTION_CHALLENGES,
  RETENTION_OBJECTIVES,
  RETENTION_CORE_CENTER_EXCLUSION_RADIUS,
  RETENTION_WEEK_ANCHOR_UTC,
  RETENTION_WEEK_MS,
  createDefaultRetentionSaveData,
  claimRetentionObjective,
  getRetentionObjectiveProgress,
  getRetentionWeeklyEdition,
  normalizeRetentionSaveData,
  recordRetentionRun
} from './RetentionDefinitions';

describe('RetentionDefinitions', () => {
  it('keeps the weekly challenge deterministic on a versioned UTC rotation', () => {
    const beforeLaunch = getRetentionWeeklyEdition(RETENTION_WEEK_ANCHOR_UTC - 1);
    const firstWeek = getRetentionWeeklyEdition(RETENTION_WEEK_ANCHOR_UTC);
    const nextWeek = getRetentionWeeklyEdition(RETENTION_WEEK_ANCHOR_UTC + RETENTION_WEEK_MS);
    const thirdWeek = getRetentionWeeklyEdition(RETENTION_WEEK_ANCHOR_UTC + RETENTION_WEEK_MS * 2);
    const fourthWeek = getRetentionWeeklyEdition(RETENTION_WEEK_ANCHOR_UTC + RETENTION_WEEK_MS * 3);

    expect(beforeLaunch.scheduleStarted).toBe(false);
    expect(beforeLaunch.editionId).toBe(firstWeek.editionId);
    expect(firstWeek.challenge.id).toBe('core-duel');
    expect(firstWeek.scheduleStarted).toBe(true);
    expect(nextWeek.challenge.id).toBe('warden-duel');
    expect(thirdWeek.challenge.id).toBe('fracture-duel');
    expect(fourthWeek.challenge.id).toBe('core-duel');
    expect(firstWeek.challenge.centerExclusionRadius).toBe(RETENTION_CORE_CENTER_EXCLUSION_RADIUS);
    expect(nextWeek.challenge.centerExclusionRadius).toBeUndefined();
    expect(thirdWeek.challenge.centerExclusionRadius).toBeUndefined();
    expect(RETENTION_CHALLENGES.filter(challenge => challenge.bossId !== null)
      .every(challenge => challenge.noHitRequired)).toBe(true);
    expect(fourthWeek.editionId).not.toBe(firstWeek.editionId);
    expect(RETENTION_CHALLENGES.filter(challenge => challenge.bossId !== null)).toHaveLength(3);
    expect(getRetentionWeeklyEdition(Number.MAX_SAFE_INTEGER).editionId).toMatch(/^rf\d+-\d{8}-.+$/);
  });

  it('bounds corrupted progress and keeps future-version weekly receipts', () => {
    const receiptIds = Array.from({ length: 60 }, (_, index) => `rf2-2026${String(index).padStart(4, '0')}-core-duel`);
    const normalized = normalizeRetentionSaveData({
      runsCompleted: -10,
      totalKills: Number.POSITIVE_INFINITY,
      bestSurvivalSeconds: 1_000_000,
      bossDefeats: { 'core-sentinel': 5, unexpected: 500 },
      completedObjectiveIds: ['first-flight', 'unknown-objective', 'first-flight'],
      selectedObjectiveId: 'unknown-objective',
      weeklyClaimIds: [...receiptIds, 'not-a-receipt']
    });

    expect(normalized.runsCompleted).toBe(0);
    expect(normalized.totalKills).toBe(0);
    expect(normalized.bestSurvivalSeconds).toBe(86_400);
    expect(normalized.bossDefeats['core-sentinel']).toBe(5);
    expect(normalized.completedObjectiveIds).toEqual(['first-flight']);
    expect(normalized.selectedObjectiveId).toBe('first-flight');
    expect(normalized.weeklyClaimIds).toHaveLength(52);
    expect(normalized.weeklyClaimIds[0]).toBe(receiptIds[8]);
  });

  it('leaves completed goals pending without paying and keeps Overdrive bosses out of campaign goals', () => {
    const empty = createDefaultRetentionSaveData();
    const campaign = recordRetentionRun(empty, {
      outcome: 'game-over',
      kills: 100,
      elapsedSeconds: 300,
      route: 'radial',
      overdriveStages: 0,
      bossDefeats: { 'core-sentinel': 1 }
    });
    const completedIds = campaign.newlyCompleted.map((objective) => objective.id);
    expect(completedIds).toEqual(expect.arrayContaining(['first-flight', 'hundred-kills', 'five-minutes', 'core-hunter']));
    expect(campaign.rewardNova).toBe(0);
    expect(campaign.candidate.completedObjectiveIds).not.toContain('first-flight');
    expect(getRetentionObjectiveProgress(campaign.progress, 'first-flight').completed).toBe(true);

    const repeat = recordRetentionRun(campaign.candidate, {
      outcome: 'game-over',
      kills: 100,
      elapsedSeconds: 300,
      route: 'overdrive',
      overdriveStages: 3,
      bossDefeats: { 'core-sentinel': 2, 'orbital-warden': 1 }
    });
    expect(repeat.newlyCompleted.some((objective) => objective.id === 'first-flight')).toBe(false);
    expect(repeat.progress.bossDefeats['core-sentinel']).toBe(1);
    expect(repeat.progress.bossDefeats['orbital-warden']).toBe(0);
    expect(repeat.progress.overdriveStages).toBe(3);
    expect(RETENTION_OBJECTIVES).toHaveLength(13);
  });

  it('keeps the completed offer until manual collection, then renews without historical auto-completion', () => {
    const initial = createDefaultRetentionSaveData();
    const update = recordRetentionRun(initial, {
      outcome: 'victory', kills: 0, elapsedSeconds: 10,
      route: 'radial', overdriveStages: 0, bossDefeats: {}
    });

    expect(initial.completedObjectiveIds).toEqual([]);
    expect(initial.selectedObjectiveId).toBe('first-flight');
    expect(update.candidate.completedObjectiveIds).not.toContain('first-flight');
    expect(update.candidate.selectedObjectiveId).toBe('first-flight');
    expect(update.candidate.actVictories.radial).toBe(1);
    const claimed = claimRetentionObjective(update.progress, 'first-flight')!;
    expect(claimed.rewardNova).toBe(50);
    expect(getRetentionObjectiveProgress(claimed.progress, 'first-flight')).toMatchObject({
      rank: 2, completed: false, value: 0, definition: { target: 2, rewardNova: 63 }
    });
    expect(claimRetentionObjective(claimed.progress, 'first-flight')).toBeNull();
  });
  it('retires campaign boss and act offers after collection', () => {
    const update = recordRetentionRun(createDefaultRetentionSaveData(), {
      outcome: 'victory', kills: 0, elapsedSeconds: 300, route: 'radial', overdriveStages: 0, bossDefeats: { 'core-sentinel': 1 }
    });
    for (const id of ['radial-clear', 'core-hunter'] as const) {
      const claimed = claimRetentionObjective(update.progress, id)!;
      expect(getRetentionObjectiveProgress(claimed.progress, id).retired).toBe(true);
      expect(claimRetentionObjective(claimed.progress, id)).toBeNull();
    }
  });
  it('requires fresh survival and stages for new ranks, not all-time best values', () => {
    const update = recordRetentionRun(createDefaultRetentionSaveData(), {
      outcome: 'game-over', kills: 10000, elapsedSeconds: 3600, route: 'overdrive', overdriveStages: 10, bossDefeats: {}
    });
    let progress = claimRetentionObjective(update.progress, 'five-minutes')!.progress;
    progress = claimRetentionObjective(progress, 'overdrive-pilot')!.progress;
    const next = recordRetentionRun(progress, { outcome: 'game-over', kills: 0, elapsedSeconds: 350, route: 'overdrive', overdriveStages: 3, bossDefeats: {} });
    expect(getRetentionObjectiveProgress(next.progress, 'five-minutes')).toMatchObject({ completed: false, value: 350, definition: { target: 360 } });
    expect(getRetentionObjectiveProgress(next.progress, 'overdrive-pilot')).toMatchObject({ completed: false, value: 3, definition: { target: 4 } });
  });
});
