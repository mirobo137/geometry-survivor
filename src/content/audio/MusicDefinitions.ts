export interface MusicStep {
  readonly lead: number;
  readonly bass: number;
  readonly harmony: readonly number[];
}

/**
 * Short deterministic score for the prototype. Keeping notes in content
 * makes it possible to replace the score or a future local audio asset
 * without changing the Web Audio adapter or the simulation.
 */
export const MUSIC_PATTERN: readonly MusicStep[] = [
  { lead: 220, bass: 110, harmony: [220, 277.18, 329.63] },
  { lead: 277.18, bass: 110, harmony: [220, 277.18, 329.63] },
  { lead: 329.63, bass: 123.47, harmony: [246.94, 293.66, 369.99] },
  { lead: 277.18, bass: 123.47, harmony: [246.94, 293.66, 369.99] },
  { lead: 196, bass: 98, harmony: [196, 246.94, 293.66] },
  { lead: 246.94, bass: 98, harmony: [196, 246.94, 293.66] },
  { lead: 293.66, bass: 110, harmony: [220, 277.18, 329.63] },
  { lead: 246.94, bass: 110, harmony: [220, 277.18, 329.63] }
] as const;
