import type { CombatStats } from '../simulation/combat/CombatSimulation';

export type RunOutcome = 'game-over' | 'victory';

export interface RunSummary {
  readonly outcome: RunOutcome;
  readonly elapsedSeconds: number;
  readonly kills: number;
  readonly experience: number;
  readonly score: number;
}

/** Creates a stable end-of-run snapshot without retaining live simulation objects. */
export const createRunSummary = (outcome: RunOutcome, stats: Pick<CombatStats, 'elapsedSeconds' | 'kills' | 'experience'>): RunSummary => {
  const elapsedSeconds = Math.max(0, stats.elapsedSeconds);
  const kills = Math.max(0, Math.floor(stats.kills));
  const experience = Math.max(0, Math.floor(stats.experience));
  // Until authored scoring exists, kills are the transparent deterministic score.
  return { outcome, elapsedSeconds, kills, experience, score: kills };
};
