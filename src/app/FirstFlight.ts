import type { SaveData } from '../platform/save/SaveStore';

/** Older profiles never used tutorialSeen; their progress still proves they played. */
export const needsFirstFlight = (save: SaveData): boolean => !save.tutorialSeen
  && save.best.timeSeconds === 0 && save.best.score === 0
  && save.retention.runsCompleted === 0 && save.retention.totalKills === 0
  && save.retention.bestSurvivalSeconds === 0 && save.retention.completedObjectiveIds.length === 0
  && Object.values(save.retention.objectiveCycles).every(cycle => cycle.claimed === 0 && cycle.value === 0)
  && save.retention.weeklyClaimIds.length === 0
  && save.unlockedActs.length === 1 && !save.overdrive.unlocked;

export const firstFlightStep = (seconds: number, moved: boolean, choosing: boolean): 'move' | 'xp' | 'card' =>
  choosing ? 'card' : seconds >= 4 && moved ? 'xp' : 'move';
