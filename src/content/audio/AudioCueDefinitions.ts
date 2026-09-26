/**
 * ZzFXMicro recipe order (ZzFX 1.3.2):
 * volume, randomness, frequency, attack, sustain, release, shape, shapeCurve,
 * slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation,
 * bitCrush, delay, sustainVolume, decay, tremolo, filter.
 *
 * This is procedural sound content, not a set of imported recordings. Keep
 * recipes short and authored for their event; the backend enforces the shared
 * SFX voice budget and each cue's cooldown.
 */
export type ZzfxRecipe = readonly [
  volume?: number,
  randomness?: number,
  frequency?: number,
  attack?: number,
  sustain?: number,
  release?: number,
  shape?: number,
  shapeCurve?: number,
  slide?: number,
  deltaSlide?: number,
  pitchJump?: number,
  pitchJumpTime?: number,
  repeatTime?: number,
  noise?: number,
  modulation?: number,
  bitCrush?: number,
  delay?: number,
  sustainVolume?: number,
  decay?: number,
  tremolo?: number,
  filter?: number
];

export type AudioCue =
  | 'damage'
  | 'player-guard'
  | 'player-shot'
  | 'critical-hit'
  | 'enemy-hit'
  | 'enemy-defeated'
  | 'level-up'
  | 'run-entry'
  | 'transition-rise'
  | 'stage-entry'
  | 'arena-shift'
  | 'hazard-warning'
  | 'enemy-warning'
  | 'boss-arrival'
  | 'boss-warning'
  | 'orbit-fire'
  | 'chain-fire'
  | 'boomerang-fire'
  | 'boomerang-return'
  | 'pulse-ring-fire'
  | 'magnetic-fire'
  | 'boss-defeated'
  | 'player-defeated'
  | 'ui-click'
  | 'ui-confirm'
  | 'ui-back'
  | 'ui-select'
  | 'ui-adjust'
  | 'purchase'
  | 'reward-claimed';

export interface AudioCueDefinition {
  readonly category: 'gameplay' | 'ui';
  readonly cooldownSeconds: number;
  readonly recipe: ZzfxRecipe;
}

/**
 * Event-to-sound map. Recipe gain is authored against the project's shared
 * ZzFX master level; Howler remains responsible only for background music.
 */
export const AUDIO_CUE_DEFINITIONS: Record<AudioCue, AudioCueDefinition> = {
  damage: {
    category: 'gameplay', cooldownSeconds: 0.12,
    recipe: [0.82, 0.05, 126, 0.003, 0.025, 0.13, 3, 1.2, -12, 0, -30, 0.012, 0, 0.08, 0, 0, 0, 0.72, 0.015, 0, 1400]
  },
  'player-guard': {
    category: 'gameplay', cooldownSeconds: 0.1,
    recipe: [0.72, 0.015, 640, 0.002, 0.025, 0.12, 0, 1, -18, 0, 240, 0.018, 0, 0, 0, 0, 0, 0.6, 0.01, 0, 3000]
  },
  'player-shot': {
    category: 'gameplay', cooldownSeconds: 0.085,
    recipe: [0.34, 0.025, 520, 0.001, 0.008, 0.045, 0, 1, 38, 0, 24, 0.01, 0, 0.015, 0, 0, 0, 0.55, 0, 0, 2400]
  },
  'critical-hit': {
    category: 'gameplay', cooldownSeconds: 0.16,
    recipe: [0.7, 0.02, 880, 0.002, 0.016, 0.11, 1, 1.4, -32, 0, 480, 0.018, 0, 0.015, 0, 0, 0, 0.62, 0.012, 0, 4200]
  },
  'enemy-hit': {
    category: 'gameplay', cooldownSeconds: 0.075,
    recipe: [0.42, 0.12, 260, 0.001, 0.006, 0.04, 1, 1.7, -16, 0, 0, 0, 0, 0.025, 0, 0, 0, 0.35, 0, 0, 1800]
  },
  'enemy-defeated': {
    category: 'gameplay', cooldownSeconds: 0.085,
    recipe: [0.54, 0.07, 350, 0.002, 0.012, 0.095, 1, 1.25, 22, 0, 190, 0.018, 0, 0.025, 0, 0, 0, 0.7, 0.008, 0, 2800]
  },
  'level-up': {
    category: 'gameplay', cooldownSeconds: 0.3,
    recipe: [0.92, 0.01, 490, 0.008, 0.05, 0.2, 0, 1, 15, 0, 230, 0.055, 0, 0, 0.08, 0, 0.035, 0.58, 0.015, 0.04, 3600]
  },
  'run-entry': {
    category: 'gameplay', cooldownSeconds: 0.45,
    recipe: [0.9, 0.01, 330, 0.01, 0.065, 0.25, 0, 1, 36, 0, 300, 0.09, 0, 0, 0.11, 0, 0.04, 0.55, 0.02, 0.05, 2600]
  },
  'transition-rise': {
    category: 'gameplay', cooldownSeconds: 0.35,
    recipe: [0.72, 0.01, 190, 0.025, 0.12, 0.19, 0, 1, 105, 0, 160, 0.12, 0, 0.015, 0.12, 0, 0.035, 0.42, 0.045, 0.06, 1700]
  },
  'stage-entry': {
    category: 'gameplay', cooldownSeconds: 0.45,
    recipe: [0.76, 0.015, 410, 0.006, 0.035, 0.16, 1, 1.1, 28, 0, 300, 0.035, 0, 0.01, 0.05, 0, 0.025, 0.55, 0.012, 0.03, 3200]
  },
  'arena-shift': {
    category: 'gameplay', cooldownSeconds: 0.45,
    recipe: [0.64, 0.02, 240, 0.012, 0.035, 0.16, 2, 1, 34, 0, 170, 0.045, 0, 0.015, 0.13, 0, 0.02, 0.46, 0.018, 0.03, 1900]
  },
  'hazard-warning': {
    category: 'gameplay', cooldownSeconds: 0.32,
    recipe: [0.65, 0.005, 720, 0.002, 0.012, 0.095, 0, 1, -44, 0, -180, 0.025, 0, 0, 0.05, 0, 0, 0.5, 0, 0, 4400]
  },
  'enemy-warning': {
    category: 'gameplay', cooldownSeconds: 0.28,
    recipe: [0.52, 0.01, 470, 0.003, 0.012, 0.1, 1, 1.2, -22, 0, -110, 0.02, 0, 0.02, 0.04, 0, 0.01, 0.46, 0.008, 0, 2300]
  },
  'boss-arrival': {
    category: 'gameplay', cooldownSeconds: 0.7,
    recipe: [1.24, 0.005, 92, 0.025, 0.13, 0.37, 3, 1.2, -14, 0, -42, 0.08, 0.18, 0.045, 0.04, 0, 0.06, 0.52, 0.04, 0.07, 800]
  },
  'boss-warning': {
    category: 'gameplay', cooldownSeconds: 0.3,
    recipe: [0.92, 0.01, 260, 0.008, 0.04, 0.19, 3, 1.15, -20, 0, -135, 0.035, 0.08, 0.02, 0.09, 0, 0.02, 0.52, 0.015, 0.04, 1200]
  },
  'orbit-fire': {
    category: 'gameplay', cooldownSeconds: 0.2,
    recipe: [0.56, 0.015, 560, 0.003, 0.022, 0.13, 0, 1, 64, 0, 180, 0.03, 0, 0, 0.08, 0, 0.02, 0.52, 0.015, 0.025, 3000]
  },
  'chain-fire': {
    category: 'gameplay', cooldownSeconds: 0.18,
    recipe: [0.68, 0.04, 360, 0.002, 0.018, 0.12, 1, 1.7, -38, 0, 140, 0.02, 0.03, 0.035, 0.07, 0, 0.025, 0.48, 0.01, 0.035, 2100]
  },
  'boomerang-fire': {
    category: 'gameplay', cooldownSeconds: 0.18,
    recipe: [0.58, 0.025, 420, 0.004, 0.025, 0.16, 2, 1, 50, 0, 110, 0.035, 0, 0.015, 0.1, 0, 0.025, 0.5, 0.014, 0.04, 2600]
  },
  'boomerang-return': {
    category: 'gameplay', cooldownSeconds: 0.18,
    recipe: [0.62, 0.01, 700, 0.002, 0.02, 0.12, 0, 1, -54, 0, 240, 0.018, 0, 0, 0.1, 0, 0.018, 0.52, 0.01, 0.035, 3800]
  },
  'pulse-ring-fire': {
    category: 'gameplay', cooldownSeconds: 0.24,
    recipe: [0.8, 0.01, 220, 0.015, 0.055, 0.2, 0, 1, 72, 0, 120, 0.045, 0, 0.015, 0.1, 0, 0.03, 0.5, 0.018, 0.045, 1800]
  },
  'magnetic-fire': {
    category: 'gameplay', cooldownSeconds: 0.28,
    recipe: [0.95, 0.02, 150, 0.006, 0.06, 0.25, 3, 1.2, 38, 0, 190, 0.08, 0.06, 0.05, 0.12, 0, 0.04, 0.48, 0.025, 0.05, 1500]
  },
  'boss-defeated': {
    category: 'gameplay', cooldownSeconds: 0.5,
    recipe: [1.45, 0.008, 170, 0.015, 0.12, 0.42, 1, 1.1, 45, 0, 440, 0.14, 0.16, 0.04, 0.1, 0, 0.055, 0.58, 0.03, 0.055, 1700]
  },
  'player-defeated': {
    category: 'gameplay', cooldownSeconds: 0.8,
    recipe: [1.1, 0.01, 112, 0.025, 0.1, 0.55, 0, 1, -24, 0, -64, 0.12, 0, 0.02, 0.035, 0, 0.045, 0.45, 0.025, 0.03, 900]
  },
  'ui-click': {
    category: 'ui', cooldownSeconds: 0.035,
    recipe: [0.48, 0.01, 680, 0.001, 0.006, 0.035, 0, 1, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0.65, 0, 0, 4200]
  },
  'ui-confirm': {
    category: 'ui', cooldownSeconds: 0.09,
    recipe: [0.68, 0.01, 520, 0.002, 0.018, 0.11, 0, 1, 48, 0, 220, 0.025, 0, 0, 0.04, 0, 0.018, 0.58, 0.008, 0.02, 3400]
  },
  'ui-back': {
    category: 'ui', cooldownSeconds: 0.07,
    recipe: [0.55, 0.01, 390, 0.002, 0.012, 0.085, 1, 1.2, -32, 0, -80, 0.025, 0, 0, 0.025, 0, 0.01, 0.54, 0.006, 0, 2600]
  },
  'ui-select': {
    category: 'ui', cooldownSeconds: 0.06,
    recipe: [0.57, 0.015, 760, 0.002, 0.012, 0.075, 1, 1.1, 28, 0, 125, 0.016, 0, 0.01, 0.045, 0, 0.012, 0.55, 0.006, 0.015, 3800]
  },
  'ui-adjust': {
    category: 'ui', cooldownSeconds: 0.1,
    recipe: [0.4, 0, 920, 0.001, 0.006, 0.045, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.58, 0, 0, 4500]
  },
  purchase: {
    category: 'ui', cooldownSeconds: 0.35,
    recipe: [0.82, 0.015, 620, 0.004, 0.032, 0.18, 0, 1, 38, 0, 290, 0.04, 0.035, 0, 0.08, 0, 0.025, 0.55, 0.012, 0.025, 3200]
  },
  'reward-claimed': {
    category: 'ui', cooldownSeconds: 0.4,
    recipe: [0.92, 0.01, 460, 0.006, 0.045, 0.24, 1, 1.1, 54, 0, 350, 0.06, 0, 0, 0.11, 0, 0.04, 0.54, 0.02, 0.04, 3000]
  }
};
