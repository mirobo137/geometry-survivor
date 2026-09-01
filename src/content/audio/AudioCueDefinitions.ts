export type AudioCue = 'damage' | 'player-shot' | 'enemy-defeated' | 'level-up' | 'boss-defeated' | 'player-defeated';
export type ZzfxRecipe = readonly number[];

export interface AudioCueDefinition {
  readonly cooldownSeconds: number;
  readonly recipe: ZzfxRecipe;
}

/** Add future effects here; keep high-frequency cues short and rate-limited. */
export const AUDIO_CUE_DEFINITIONS: Record<AudioCue, AudioCueDefinition> = {
  damage: { cooldownSeconds: 0.12, recipe: [0.7, 0.04, 120, 0.01, 0.01, 0.13, 3, 1.2, -6] },
  'player-shot': { cooldownSeconds: 0.08, recipe: [0.16, 0.02, 420, 0.005, 0.012, 0.08, 0, 1, 35, 0] },
  'enemy-defeated': { cooldownSeconds: 0.08, recipe: [0.22, 0.09, 340, 0.005, 0.01, 0.08, 1, 1, 1.2] },
  'level-up': { cooldownSeconds: 0.3, recipe: [0.45, 0.02, 440, 0.01, 0.08, 0.24, 0, 1, 2.5, 0, 180, 0.09] },
  'boss-defeated': { cooldownSeconds: 0.5, recipe: [0.65, 0.01, 174, 0.02, 0.16, 0.46, 1, 1, 1.8, 0, 392, 0.18] },
  // Low descending sine: a short, sad release rather than another attack hit.
  'player-defeated': { cooldownSeconds: 0.8, recipe: [0.5, 0.01, 110, 0.03, 0.12, 0.75, 0, 1, -22, 0] }
};
