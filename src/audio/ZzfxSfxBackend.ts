import { Howler } from 'howler';
import { AUDIO_CUE_DEFINITIONS, type AudioCue, type ZzfxRecipe } from '../content/audio/AudioCueDefinitions';

const ZZFX_MASTER_VOLUME = 0.3;
const TWO_PI = Math.PI * 2;
const MAX_CONCURRENT_VOICES = 8;
const PROJECT_MASTER_GAIN = 1.8;

/**
 * ZzFXMicro v1.3.2 synthesis core adapted under MIT. It writes samples into
 * the already-unlocked Howler context instead of creating its own AudioContext;
 * this preserves the game's mobile gesture/lifecycle contract.
 */
export class ZzfxSfxBackend {
  private readonly bus: GainNode;
  private activeVoices = 0;
  private suspended = false;
  private volume = 1;
  private readonly lastPlayed = new Map<AudioCue, number>();
  private readonly buffers = new Map<AudioCue, AudioBuffer>();

  public constructor(private readonly context: AudioContext) {
    this.bus = context.createGain();
    this.bus.connect(Howler.masterGain ?? context.destination);
  }

  public configure(volume: number): void {
    this.volume = volume;
    this.bus.gain.setTargetAtTime(volume * PROJECT_MASTER_GAIN, this.context.currentTime, 0.01);
  }

  /** Pause blocks new world cues; short voices finish naturally and UI stays audible. */
  public pause(): void {
    this.suspended = true;
  }

  public resume(): void {
    this.suspended = false;
    this.configure(this.volume);
  }

  public play(cue: AudioCue): void {
    const definition = AUDIO_CUE_DEFINITIONS[cue];
    if ((this.suspended && definition.category !== 'ui')
      || this.context.state !== 'running'
      || this.activeVoices >= MAX_CONCURRENT_VOICES) return;
    const now = this.context.currentTime;
    if (now - (this.lastPlayed.get(cue) ?? Number.NEGATIVE_INFINITY) < definition.cooldownSeconds) return;
    this.lastPlayed.set(cue, now);
    try {
      const buffer = this.getBuffer(cue, definition.recipe);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 0.97 + Math.random() * 0.06;
      source.connect(this.bus);
      source.onended = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); };
      source.start();
      this.activeVoices += 1;
    } catch {
      // Procedural sound is decorative; never interrupt gameplay on failure.
    }
  }

  public shutdown(): void {
    this.bus.disconnect();
    this.lastPlayed.clear();
    this.buffers.clear();
    this.activeVoices = 0;
  }

  private getBuffer(cue: AudioCue, recipe: ZzfxRecipe): AudioBuffer {
    const cached = this.buffers.get(cue);
    if (cached) return cached;
    const samples = buildSamples(recipe, this.context.sampleRate);
    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.getChannelData(0).set(samples);
    this.buffers.set(cue, buffer);
    return buffer;
  }
}

/**
 * ZzFXMicro's complete 21-parameter generator, separated from its eager
 * AudioContext/source creation so samples can share Howler's unlocked context.
 */
const buildSamples = (recipe: ZzfxRecipe, sampleRate: number): Float32Array => {
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
