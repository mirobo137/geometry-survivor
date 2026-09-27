import type { AudioCueDefinition, ZzfxRecipe } from '../content/audio/AudioCueDefinitions';

const ZZFX_MASTER_VOLUME = 0.3;
const TWO_PI = Math.PI * 2;

/**
 * ZzFXMicro's complete 21-parameter generator, separated from its eager
 * AudioContext/source creation so samples can share Howler's unlocked context.
 */
export const buildZzfxSamples = (recipe: ZzfxRecipe, sampleRate: number): Float32Array => {
  let [volume = 1, randomness = 0.05, frequency = 220, attack = 0, sustain = 0, release = 0.1,
    shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0, pitchJump = 0, pitchJumpTime = 0,
    repeatTime = 0, noise = 0, modulation = 0, bitCrush = 0, delay = 0, sustainVolume = 1,
    decay = 0, tremolo = 0, filter = 0] = recipe;

  const positive = Math.abs;
  const sign = (value: number): number => value < 0 ? -1 : 1;
  const startSlide = slide *= 500 * TWO_PI / sampleRate / sampleRate;
  let startFrequency = frequency *= (1 + randomness * 2 * Math.random() - randomness) * TWO_PI / sampleRate;
  let modulationOffset = 0;
  let repeat = 0;
  let crush = 0;
  let jump = 1;
  let time = 0;
  let sample = 0;
  let waveFrequency: number;
  let x2 = 0;
  let x1 = 0;
  let y2 = 0;
  let y1 = 0;

  const quality = 2;
  const filterRadians = TWO_PI * positive(filter) * 2 / sampleRate;
  const filterCosine = Math.cos(filterRadians);
  const alpha = Math.sin(filterRadians) / 2 / quality;
  const a0 = 1 + alpha;
  const a1 = -2 * filterCosine / a0;
  const a2 = (1 - alpha) / a0;
  const filterSign = sign(filter);
  const b0 = (1 + filterSign * filterCosine) / 2 / a0;
  const b1 = -(filterSign + filterCosine) / a0;
  const b2 = b0;

  const minAttackSamples = 9;
  attack = attack * sampleRate || minAttackSamples;
  decay *= sampleRate;
  sustain *= sampleRate;
  release *= sampleRate;
  delay *= sampleRate;
  deltaSlide *= 500 * TWO_PI / sampleRate ** 3;
  modulation *= TWO_PI / sampleRate;
  pitchJump *= TWO_PI / sampleRate;
  pitchJumpTime *= sampleRate;
  repeatTime = repeatTime * sampleRate | 0;
  volume *= ZZFX_MASTER_VOLUME;

  const length = Math.max(1, attack + decay + sustain + release + delay | 0);
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    if (!(++crush % (bitCrush * 100 | 0))) {
      if (shape > 4) {
        sample = (time / TWO_PI % 1 < shapeCurve / 2 ? 2 : 0) - 1;
      } else if (shape > 3) {
        sample = Math.sin(time ** 3);
      } else if (shape > 2) {
        sample = Math.max(Math.min(Math.tan(time), 1), -1);
      } else if (shape > 1) {
        sample = 1 - (2 * time / TWO_PI % 2 + 2) % 2;
      } else if (shape > 0) {
        sample = 1 - 4 * positive(Math.round(time / TWO_PI) - time / TWO_PI);
      } else {
        sample = Math.sin(time);
      }

      sample = (repeatTime ? 1 - tremolo + tremolo * Math.sin(TWO_PI * index / repeatTime) : 1)
        * (shape > 4 ? sample : sign(sample) * positive(sample) ** shapeCurve)
        * (index < attack ? index / attack
          : index < attack + decay ? 1 - (index - attack) / decay * (1 - sustainVolume)
            : index < attack + decay + sustain ? sustainVolume
              : index < length - delay ? (length - index - delay) / release * sustainVolume
                : 0);

      if (delay) {
        sample = sample / 2 + (delay > index ? 0
          : (index < length - delay ? 1 : (length - index) / delay)
            * output[index - delay | 0] / 2 / (volume || 1));
      }
      if (filter) {
        sample = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = sample) - a2 * y2 - a1 * (y2 = y1);
      }
    }

    output[index] = sample * volume;
    waveFrequency = (frequency += slide += deltaSlide) * Math.cos(modulation * modulationOffset++);
    time += waveFrequency + waveFrequency * noise * Math.sin(index ** 5);

    if (jump && ++jump > pitchJumpTime) {
      frequency += pitchJump;
      startFrequency += pitchJump;
      jump = 0;
    }

    if (repeatTime && !(++repeat % repeatTime)) {
      frequency = startFrequency;
      slide = startSlide;
      jump ||= 1;
    }
  }
  return output;
};

/** Offline composition: <= 3 ZzFX layers become one reusable mono voice. */
export const renderCueSamples = (definition: AudioCueDefinition, sampleRate: number): Float32Array => {
  const parts = [{ recipe: definition.recipe, delaySeconds: 0 }, ...definition.layers];
  const generated = parts.map(part => ({
    samples: buildZzfxSamples(part.recipe, sampleRate),
    offset: Math.round((part.delaySeconds ?? 0) * sampleRate)
  }));
  const length = Math.max(...generated.map(part => part.offset + part.samples.length));
  const output = new Float32Array(length);
  for (const part of generated) {
    for (let index = 0; index < part.samples.length; index += 1) {
      output[index + part.offset] += part.samples[index];
    }
  }
  let peak = 0;
  for (const sample of output) peak = Math.max(peak, Math.abs(sample));
  // Attenuate only; never auto-amplify a deliberately quiet cue.
  const gain = peak > 0.72 ? 0.72 / peak : 1;
  const fadeSamples = Math.min(Math.round(sampleRate * 0.004), length / 2);
  for (let index = 0; index < length; index += 1) {
    output[index] *= gain * Math.min(1, index / fadeSamples, (length - 1 - index) / fadeSamples);
  }
  return output;
};
