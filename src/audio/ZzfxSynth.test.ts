import { describe, expect, it } from 'vitest';
import { AUDIO_CUE_DEFINITIONS } from '../content/audio/AudioCueDefinitions';
import { buildZzfxSamples, renderCueSamples } from './ZzfxSynth';

const rms = (samples: Float32Array): number =>
  Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);

describe('ZzFX sound design', () => {
  for (const sampleRate of [44100, 48000]) {
    it('renders every layered cue finite, audible and bounded at ' + sampleRate, () => {
      let bytes = 0;
      for (const [name, definition] of Object.entries(AUDIO_CUE_DEFINITIONS)) {
        const samples = renderCueSamples(definition, sampleRate);
        bytes += samples.byteLength;
        expect(definition.layers.length, name).toBeLessThanOrEqual(2);
        expect(samples.length, name).toBeLessThan(sampleRate * 0.95);
        expect(samples.every(Number.isFinite), name).toBe(true);
        expect(samples.every(value => Math.abs(value) <= 0.721), name).toBe(true);
        expect(rms(samples), name).toBeGreaterThan(0.003);
        expect(samples[0], name).toBe(0);
        expect(Math.abs(samples[samples.length - 1]), name).toBe(0);
      }
      expect(bytes).toBeLessThan(5 * 1024 * 1024);
    });
  }
  it('keeps the tonal body with negative low-pass instead of filtering it away', () => {
    const low = buildZzfxSamples([1, 0, 220, 0.01, 0.1, 0.1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, -2000], 48000);
    const high = buildZzfxSamples([1, 0, 220, 0.01, 0.1, 0.1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2000], 48000);
    expect(rms(low)).toBeGreaterThan(rms(high) * 30);
  });
});
