import { Howler } from 'howler';
import { AUDIO_CUE_DEFINITIONS, type AudioCue, type ZzfxRecipe } from '../content/audio/AudioCueDefinitions';

const SAMPLE_RATE = 44_100;
const TWO_PI = Math.PI * 2;
const MAX_CONCURRENT_VOICES = 8;

/**
 * ZzFX-compatible procedural SFX player adapted from ZzFX 1.3.2 (MIT).
 * Unlike the package entrypoint, it receives Howler's already-unlocked
 * AudioContext, avoiding a second eager context on mobile browsers.
 */
export class ZzfxSfxBackend {
  private readonly bus: GainNode;
  private activeVoices = 0;
  private suspended = false;
  private volume = 1;
  private readonly lastPlayed = new Map<AudioCue, number>();

  public constructor(private readonly context: AudioContext) {
    this.bus = context.createGain();
    this.bus.connect(Howler.masterGain ?? context.destination);
  }

  public configure(volume: number): void {
    this.volume = volume;
    this.bus.gain.setTargetAtTime(volume * 0.55, this.context.currentTime, 0.01);
  }

  public pause(): void {
    this.suspended = true;
    this.bus.gain.setTargetAtTime(0, this.context.currentTime, 0.01);
  }

  public resume(): void {
    this.suspended = false;
    this.configure(this.volume);
  }

  public play(cue: AudioCue): void {
    if (this.suspended || this.context.state !== 'running' || this.activeVoices >= MAX_CONCURRENT_VOICES) return;
    const definition = AUDIO_CUE_DEFINITIONS[cue];
    const now = this.context.currentTime;
    if (now - (this.lastPlayed.get(cue) ?? Number.NEGATIVE_INFINITY) < definition.cooldownSeconds) return;
    this.lastPlayed.set(cue, now);
    try {
      const samples = buildSamples(definition.recipe);
      const buffer = this.context.createBuffer(1, samples.length, SAMPLE_RATE);
      buffer.getChannelData(0).set(samples);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 0.96 + Math.random() * 0.08;
      source.connect(this.bus);
      this.activeVoices += 1;
      source.onended = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); };
      source.start();
    } catch {
      // Procedural sound is decorative; never interrupt gameplay on failure.
    }
  }

  public shutdown(): void {
    this.bus.disconnect();
    this.lastPlayed.clear();
    this.activeVoices = 0;
  }
}

// The ZzFX recipe parameter order is preserved: volume, randomness,
// frequency, attack, sustain, release, shape, curve, slide, delta slide.
const buildSamples = (recipe: ZzfxRecipe): Float32Array => {
  const [volume = 1, randomness = 0.05, frequency = 220, attack = 0, sustain = 0, release = 0.1,
    shape = 0, curve = 1, slide = 0, deltaSlide = 0] = recipe;
  const attackSamples = attack * SAMPLE_RATE || 9;
  const sustainSamples = sustain * SAMPLE_RATE;
  const releaseSamples = release * SAMPLE_RATE;
  const length = Math.max(1, Math.floor(attackSamples + sustainSamples + releaseSamples));
  const output = new Float32Array(length);
  let phase = 0;
  let rate = frequency * (1 + randomness * (Math.random() * 2 - 1)) * TWO_PI / SAMPLE_RATE;
  let currentSlide = slide * 500 * TWO_PI / SAMPLE_RATE ** 2;
  const slideDelta = deltaSlide * 500 * TWO_PI / SAMPLE_RATE ** 3;
  for (let index = 0; index < length; index += 1) {
    const amplitude = index < attackSamples ? index / attackSamples
      : index < attackSamples + sustainSamples ? 1
        : (length - index) / Math.max(1, releaseSamples);
    const sample = wave(shape, phase, curve);
    output[index] = Math.sign(sample) * Math.abs(sample) ** curve * amplitude * volume;
    phase += rate;
    rate += currentSlide;
    currentSlide += slideDelta;
  }
  return output;
};

const wave = (shape: number, phase: number, curve: number): number => {
  if (shape === 3) return Math.max(-1, Math.min(1, Math.tan(phase)));
  if (shape === 2) return 1 - ((2 * phase / TWO_PI % 2 + 2) % 2);
  if (shape === 1) return 1 - 4 * Math.abs(Math.round(phase / TWO_PI) - phase / TWO_PI);
  if (shape > 4) return (phase / TWO_PI % 1 < curve / 2 ? 2 : 0) - 1;
  return Math.sin(phase);
};
