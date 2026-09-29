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
  | 'damage' | 'player-guard' | 'player-shot' | 'rail-fire' | 'volley-fire' | 'critical-hit' | 'enemy-hit' | 'enemy-defeated'
  | 'level-up' | 'run-entry' | 'transition-rise' | 'stage-entry' | 'arena-shift'
  | 'hazard-warning' | 'enemy-warning' | 'boss-arrival' | 'boss-warning'
  | 'orbit-fire' | 'chain-fire' | 'chain-burst' | 'boomerang-fire' | 'boomerang-return' | 'boomerang-blast'
  | 'pulse-ring-fire' | 'pulse-return' | 'magnetic-fire' | 'magnetic-capture' | 'magnetic-collapse'
  | 'boss-defeated' | 'player-defeated'
  | 'laser-charge' | 'laser-ignite' | 'laser-sustain' | 'laser-release'
  | 'hostile-ring' | 'angular-cut' | 'enemy-dash' | 'enemy-spikes' | 'hostile-shot'
  | 'mine-arm' | 'mine-explode' | 'replica-spawn'
  | 'ui-click' | 'ui-confirm' | 'ui-back' | 'ui-select' | 'ui-adjust' | 'purchase' | 'reward-claimed';

export interface SoundLayer {
  readonly recipe: ZzfxRecipe;
  readonly delaySeconds?: number;
}

export interface AudioCueDefinition {
  readonly category: 'gameplay' | 'ui';
  readonly cooldownSeconds: number;
  /** 0: detail, 1: weapon, 2: threat/UI, 3: player damage / major encounter. */
  readonly priority: 0 | 1 | 2 | 3;
  readonly pitchVariation: number;
  readonly recipe: ZzfxRecipe;
  /** Mixed and cached into ONE buffer/voice, never separate live sources. */
  readonly layers: readonly SoundLayer[];
}

// Named authoring controls prevent accidentally applying a high-pass to the
// entire sound. ZzFX 1.3.2: NEGATIVE filter = low-pass; positive = high-pass.
interface Tone {
  hz: number; gain?: number; attack?: number; hold?: number; release?: number;
  shape?: number; slide?: number; jump?: number; jumpAt?: number;
  noise?: number; modulation?: number; repeat?: number; tremolo?: number;
  lowpass?: number; highpass?: number; delay?: number;
}
const tone = (p: Tone): ZzfxRecipe => [
  p.gain ?? 0.6, 0, p.hz, p.attack ?? 0.003, p.hold ?? 0.015, p.release ?? 0.12,
  p.shape ?? 0, 1, p.slide ?? 0, 0, p.jump ?? 0, p.jumpAt ?? 0, p.repeat ?? 0,
  p.noise ?? 0, p.modulation ?? 0, 0, p.delay ?? 0, 0.65, 0.015, p.tremolo ?? 0,
  p.highpass ?? -(p.lowpass ?? 3600)
];
const layer = (p: Tone, delaySeconds = 0): SoundLayer => ({ recipe: tone(p), delaySeconds });
const body = (hz: number, gain = 0.4, release = 0.16): SoundLayer =>
  layer({ hz, gain, release, slide: -12, lowpass: 1800 });
const air = (gain = 0.12, release = 0.065): SoundLayer =>
  layer({ hz: 520, gain, shape: 4, release, highpass: 900 });
const cue = (p: Tone, layers: readonly SoundLayer[] = [],
  priority: AudioCueDefinition['priority'] = 1, cooldownSeconds = 0.16,
  category: AudioCueDefinition['category'] = 'gameplay', pitchVariation = 0.025
): AudioCueDefinition => ({ recipe: tone(p), layers, priority, cooldownSeconds, category, pitchVariation });

/** Sci-fi palette: physical transient + tonal body + restrained delayed accent.
 * Danger uses tense descending intervals; player weapons use brighter consonant
 * attacks. Durations and gain are deliberately bounded for six-weapon builds.
 */
export const AUDIO_CUE_DEFINITIONS: Record<AudioCue, AudioCueDefinition> = {
  'player-shot': cue({ hz: 740, gain: 0.32, shape: 1, attack: 0.001, hold: 0.006, release: 0.044, slide: -4 },
    [body(190, 0.24, 0.044), air(0.065, 0.016)], 0, 0.085),
  'rail-fire': cue({ hz: 1320, gain: 0.29, shape: 1, attack: 0.001, hold: 0.004, release: 0.085, slide: -7 },
    [body(175, 0.2, 0.065), air(0.04, 0.02)], 1, 0.12),
  'volley-fire': cue({ hz: 880, gain: 0.24, shape: 1, attack: 0.001, hold: 0.004, release: 0.04, slide: -5 },
    [body(210, 0.14, 0.04), layer({ hz: 1244, gain: 0.12, attack: 0.001, hold: 0.004, release: 0.035, slide: -5 }, 0.045)], 1, 0.085),
  'enemy-hit': cue({ hz: 245, gain: 0.13, shape: 1, attack: 0.001, hold: 0.002, release: 0.026, slide: -2 },
    [body(145, 0.09, 0.025), air(0.018, 0.009)], 0, 0.09),
  'critical-hit': cue({ hz: 1046, gain: 0.25, release: 0.11, slide: -72, jump: 260, jumpAt: 0.025 },
    [body(262, 0.35, 0.09), air(0.11, 0.03)], 1, 0.18),
  'enemy-defeated': cue({ hz: 410, gain: 0.22, shape: 1, attack: 0.001, hold: 0.003, release: 0.06, slide: -3 },
    [body(195, 0.12, 0.045), layer({ hz: 780, gain: 0.085, attack: 0.001, hold: 0.003, release: 0.04, slide: -18 }, 0.012)], 0, 0.095),
  damage: cue({ hz: 185, gain: 0.76, shape: 1, attack: 0.001, hold: 0.012, release: 0.16, slide: -4, noise: 0.012 },
    [layer({ hz: 1960, gain: 0.34, attack: 0.001, hold: 0.003, release: 0.065, slide: -14, noise: 0.04, highpass: 1200 }),
      layer({ hz: 262, gain: 0.3, attack: 0.002, hold: 0.012, release: 0.13, slide: -3, jump: -65, jumpAt: 0.035 })], 3, 0.14),
  'player-guard': cue({ hz: 1174, gain: 0.36, release: 0.15, slide: -26 },
    [body(294, 0.32, 0.15), layer({ hz: 1760, gain: 0.15, release: 0.12 }, 0.032)], 2, 0.15),
  'orbit-fire': cue({ hz: 494, gain: 0.25, shape: 0, attack: 0.005, hold: 0.012, release: 0.105, slide: 3, jump: 60, jumpAt: 0.03 },
    [body(247, 0.15, 0.09), layer({ hz: 740, gain: 0.1, attack: 0.005, hold: 0.006, release: 0.07 }, 0.018)], 1, 0.22),
  'chain-fire': cue({ hz: 784, gain: 0.22, shape: 2, attack: 0.001, hold: 0.003, release: 0.065, slide: -8, repeat: 0.035, tremolo: 0.12 },
    [air(0.07, 0.035), body(196, 0.19, 0.055)], 1, 0.19),
  'chain-burst': cue({ hz: 262, gain: 0.37, shape: 1, attack: 0.001, hold: 0.006, release: 0.14, slide: -5 },
    [air(0.09, 0.05), layer({ hz: 1568, gain: 0.14, attack: 0.001, hold: 0.002, release: 0.055, slide: -12 }, 0.015)], 1, 0.25),
  'boomerang-fire': cue({ hz: 294, gain: 0.23, shape: 1, attack: 0.002, hold: 0.01, release: 0.11, slide: 12 },
    [air(0.09, 0.06), body(196, 0.13, 0.09)], 1, 0.2),
  'boomerang-return': cue({ hz: 880, gain: 0.22, shape: 1, attack: 0.002, hold: 0.004, release: 0.085, slide: -8, jump: -160, jumpAt: 0.03 },
    [body(294, 0.16, 0.075)], 1, 0.22),
  'boomerang-blast': cue({ hz: 330, gain: 0.32, shape: 1, attack: 0.001, hold: 0.006, release: 0.18, slide: -8 },
    [body(165, 0.25, 0.15), air(0.08, 0.045)], 1, 0.22),
  'pulse-ring-fire': cue({ hz: 196, gain: 0.42, shape: 1, attack: 0.003, hold: 0.008, release: 0.17, slide: -3 },
    [layer({ hz: 392, gain: 0.2, attack: 0.006, hold: 0.01, release: 0.14, slide: -6 }, 0.012), air(0.06, 0.06)], 1, 0.09),
  'pulse-return': cue({ hz: 523, gain: 0.22, shape: 1, attack: 0.018, hold: 0.006, release: 0.12, slide: 12 },
    [body(262, 0.17, 0.1)], 1, 0.2),
  'magnetic-fire': cue({ hz: 262, gain: 0.28, shape: 1, attack: 0.005, hold: 0.008, release: 0.11, slide: 10, jump: 110, jumpAt: 0.04 },
    [body(131, 0.16, 0.1), air(0.035, 0.03)], 1, 0.24),
  'magnetic-capture': cue({ hz: 165, gain: 0.18, shape: 1, attack: 0.012, hold: 0.035, release: 0.045, modulation: 0.3, repeat: 0.06, tremolo: 0.12 },
    [layer({ hz: 330, gain: 0.1, attack: 0.01, hold: 0.03, release: 0.045, slide: 8, modulation: 0.12 }, 0.01)], 1, 0.22),
  'magnetic-collapse': cue({ hz: 130, gain: 0.46, shape: 1, attack: 0.002, hold: 0.01, release: 0.22, slide: -5 },
    [air(0.12, 0.1), layer({ hz: 520, gain: 0.22, attack: 0.002, hold: 0.008, release: 0.13, slide: -18 }, 0.02)], 1, 0.18),

  'laser-charge': cue({ hz: 330, gain: 0.34, attack: 0.05, hold: 0.1, release: 0.13, slide: 155,
    modulation: 0.12, repeat: 0.09, tremolo: 0.1 },
    [layer({ hz: 494, gain: 0.17, attack: 0.045, release: 0.16, slide: 205 })], 3, 0.24, 'gameplay', 0),
  'laser-ignite': cue({ hz: 147, gain: 0.58, shape: 1, attack: 0.002, release: 0.22, slide: -24 },
    [layer({ hz: 1568, gain: 0.23, release: 0.12, slide: -190 }), air(0.22, 0.07)], 2, 0.14),
  'laser-sustain': cue({ hz: 196, gain: 0.27, shape: 1, attack: 0.025, hold: 0.09, release: 0.075,
    modulation: 0.52, repeat: 0.07, tremolo: 0.11 },
    [layer({ hz: 587, gain: 0.11, attack: 0.025, hold: 0.09, release: 0.075, modulation: 0.24 })], 2, 0.14, 'gameplay', 0),
  'laser-release': cue({ hz: 494, gain: 0.21, release: 0.15, slide: -110 }, [body(220, 0.13, 0.13), air(0.045, 0.04)], 1, 0.18),
  'hazard-warning': cue({ hz: 587, gain: 0.3, release: 0.09, jump: 196, jumpAt: 0.028 },
    [layer({ hz: 880, gain: 0.14, release: 0.075 }, 0.082)], 3, 0.32, 'gameplay', 0),
  'hostile-ring': cue({ hz: 196, gain: 0.45, shape: 1, attack: 0.008, release: 0.3, slide: -42 },
    [layer({ hz: 392, gain: 0.23, release: 0.24, slide: -72 }), air(0.1, 0.17)], 2, 0.22),
  'angular-cut': cue({ hz: 392, gain: 0.42, shape: 2, attack: 0.006, release: 0.22, slide: -68 },
    [air(0.17, 0.16), body(164, 0.36, 0.19)], 2, 0.2),
  'enemy-warning': cue({ hz: 523, gain: 0.26, release: 0.12, jump: -131, jumpAt: 0.038 },
    [body(196, 0.17, 0.095)], 2, 0.32, 'gameplay', 0),
  'enemy-dash': cue({ hz: 294, gain: 0.32, shape: 1, attack: 0.01, release: 0.2, slide: 140 },
    [body(147, 0.24, 0.14), air(0.14, 0.13)], 2, 0.2),
  'enemy-spikes': cue({ hz: 330, gain: 0.41, shape: 2, attack: 0.002, release: 0.18, slide: -38 },
    [body(165, 0.33, 0.16), air(0.13, 0.04)], 2, 0.22),
  'hostile-shot': cue({ hz: 262, gain: 0.25, shape: 2, release: 0.1, slide: -62 },
    [body(131, 0.23, 0.075)], 2, 0.16),
  'mine-arm': cue({ hz: 784, gain: 0.23, release: 0.085, jump: -262, jumpAt: 0.025 }, [], 2, 0.2, 'gameplay', 0),
  'mine-explode': cue({ hz: 110, gain: 0.52, shape: 1, attack: 0.003, release: 0.31, slide: -18 },
    [air(0.25, 0.18)], 2, 0.2),
  'replica-spawn': cue({ hz: 262, gain: 0.36, shape: 1, attack: 0.018, release: 0.22, slide: 72 },
    [layer({ hz: 523, gain: 0.19, release: 0.16, slide: -42 }, 0.055)], 2, 0.3),
  'arena-shift': cue({ hz: 147, gain: 0.43, shape: 1, attack: 0.04, hold: 0.08, release: 0.29, slide: 22 },
    [air(0.1, 0.19), layer({ hz: 440, gain: 0.2, release: 0.25, slide: 36 }, 0.05)], 2, 0.5),
  'boss-arrival': cue({ hz: 82, gain: 0.68, shape: 1, attack: 0.035, hold: 0.13, release: 0.52, slide: -7 },
    [layer({ hz: 123, gain: 0.3, hold: 0.12, release: 0.44 }, 0.065), air(0.2, 0.25)], 3, 0.7),
  'boss-warning': cue({ hz: 277, gain: 0.46, shape: 1, hold: 0.045, release: 0.23, jump: -69, jumpAt: 0.075 },
    [layer({ hz: 392, gain: 0.2, release: 0.17 }, 0.078)], 3, 0.32, 'gameplay', 0),
  'boss-defeated': cue({ hz: 165, gain: 0.66, release: 0.5, slide: -8 },
    [air(0.26, 0.24), layer({ hz: 494, gain: 0.31, hold: 0.06, release: 0.36, jump: 165, jumpAt: 0.1 }, 0.09)], 3, 0.6),
  'player-defeated': cue({ hz: 196, gain: 0.52, shape: 1, hold: 0.08, release: 0.48, slide: -28 },
    [layer({ hz: 294, gain: 0.23, release: 0.4, slide: -42 }, 0.07)], 3, 0.8, 'gameplay', 0),

  'level-up': cue({ hz: 523, gain: 0.42, shape: 0, attack: 0.004, hold: 0.012, release: 0.19 },
    [layer({ hz: 659, gain: 0.31, attack: 0.004, hold: 0.012, release: 0.17 }, 0.055),
      layer({ hz: 784, gain: 0.25, attack: 0.004, hold: 0.02, release: 0.21 }, 0.11)], 3, 0.3, 'gameplay', 0),
  'transition-rise': cue({ hz: 174, gain: 0.25, shape: 1, attack: 0.05, hold: 0.04, release: 0.24, slide: 18 },
    [layer({ hz: 261, gain: 0.1, attack: 0.07, hold: 0.01, release: 0.18, slide: 24 }, 0.05),
      layer({ hz: 520, gain: 0.025, shape: 4, attack: 0.06, hold: 0.02, release: 0.14, highpass: 1200 }, 0.015)], 2, 0.4),
  'run-entry': cue({ hz: 220, gain: 0.32, shape: 0, attack: 0.008, hold: 0.018, release: 0.22, slide: -3 },
    [layer({ hz: 277, gain: 0.15, attack: 0.012, hold: 0.015, release: 0.2, slide: -4 }, 0.04),
      layer({ hz: 440, gain: 0.08, attack: 0.02, hold: 0.01, release: 0.18, slide: -8 }, 0.085)], 3, 0.5),
  'stage-entry': cue({ hz: 440, gain: 0.38, shape: 1, release: 0.2 },
    [layer({ hz: 660, gain: 0.23, release: 0.18 }, 0.06)], 2, 0.45),
  'ui-click': cue({ hz: 698, gain: 0.23, shape: 1, release: 0.028 }, [body(262, 0.12, 0.028)], 2, 0.04, 'ui'),
  'ui-select': cue({ hz: 784, gain: 0.25, release: 0.062 },
    [layer({ hz: 1174, gain: 0.15, release: 0.052 }, 0.024)], 2, 0.07, 'ui'),
  'ui-confirm': cue({ hz: 587, gain: 0.31, shape: 1, release: 0.11 },
    [layer({ hz: 880, gain: 0.22, release: 0.12 }, 0.04)], 2, 0.1, 'ui'),
  'ui-back': cue({ hz: 587, gain: 0.25, release: 0.085, jump: -147, jumpAt: 0.025 }, [], 2, 0.08, 'ui'),
  'ui-adjust': cue({ hz: 880, gain: 0.17, release: 0.035 }, [], 2, 0.1, 'ui', 0),
  purchase: cue({ hz: 494, gain: 0.34, release: 0.15 },
    [layer({ hz: 740, gain: 0.25, release: 0.15 }, 0.06), layer({ hz: 988, gain: 0.19, release: 0.15 }, 0.12)], 2, 0.35, 'ui', 0),
  'reward-claimed': cue({ hz: 587, gain: 0.36, release: 0.2 },
    [layer({ hz: 880, gain: 0.28, release: 0.19 }, 0.08), layer({ hz: 1174, gain: 0.2, release: 0.22 }, 0.16)], 2, 0.4, 'ui', 0)
};
