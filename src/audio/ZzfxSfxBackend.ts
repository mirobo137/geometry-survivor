import { Howler } from 'howler';
import { AUDIO_CUE_DEFINITIONS, type AudioCue } from '../content/audio/AudioCueDefinitions';
import { renderCueSamples } from './ZzfxSynth';

export const MAX_SFX_VOICES = 8;
const DETAIL_VOICE_LIMIT = 6;
interface Voice {
  source: AudioBufferSourceNode;
  cue: AudioCue;
  priority: number;
}

/** One shared-context SFX bus; composed ZzFX buffers are independent of music. */
export class ZzfxSfxBackend {
  private readonly bus: GainNode;
  private readonly limiter: DynamicsCompressorNode;
  private readonly voices: Voice[] = [];
  private suspended = false;
  private closed = false;
  private readonly lastPlayed = new Map<AudioCue, number>();
  private readonly buffers = new Map<AudioCue, AudioBuffer>();
  private readonly warmCues = Object.keys(AUDIO_CUE_DEFINITIONS) as AudioCue[];
  private warmIndex = 0;
  private warmHandle: number | null = null;

  public constructor(private readonly context: AudioContext) {
    this.bus = context.createGain();
    this.limiter = context.createDynamicsCompressor();
    this.limiter.threshold.value = -9;
    this.limiter.knee.value = 12;
    this.limiter.ratio.value = 6;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.12;
    this.bus.connect(this.limiter);
    this.limiter.connect(Howler.masterGain ?? context.destination);
    this.scheduleWarmup();
  }

  public configure(volume: number): void {
    const level = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0;
    this.bus.gain.setTargetAtTime(level, this.context.currentTime, 0.01);
  }

  public pause(): void {
    this.suspended = true;
    // No tails or laser beds continue under ads/background. UI remains available.
    for (let index = this.voices.length - 1; index >= 0; index -= 1) {
      if (AUDIO_CUE_DEFINITIONS[this.voices[index].cue].category === 'gameplay') this.stopVoice(this.voices[index]);
    }
  }

  public resume(): void {
    this.suspended = false;
    this.scheduleWarmup();
  }

  public play(cue: AudioCue): void {
    const definition = AUDIO_CUE_DEFINITIONS[cue];
    if (this.closed || (this.suspended && definition.category !== 'ui')
      || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    if (now - (this.lastPlayed.get(cue) ?? -Infinity) < definition.cooldownSeconds) return;
    // Leave two physical slots available for hazard/player signals.
    if (definition.priority < 2 && this.voices.length >= DETAIL_VOICE_LIMIT) return;
    let victim: Voice | undefined;
    if (this.voices.length >= MAX_SFX_VOICES) {
      for (const voice of this.voices) {
        if (voice.priority < definition.priority && (!victim || voice.priority < victim.priority)) victim = voice;
      }
      if (!victim) return;
    }

    let source: AudioBufferSourceNode | undefined;
    try {
      const buffer = this.getBuffer(cue);
      source = this.context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 1 + (Math.random() * 2 - 1) * definition.pitchVariation;
      source.connect(this.bus);
      const voice: Voice = { source, cue, priority: definition.priority };
      source.onended = () => this.releaseVoice(voice);
      if (victim) this.stopVoice(victim);
      source.start();
      this.voices.push(voice);
      this.lastPlayed.set(cue, now);
    } catch {
      source?.disconnect();
      // Audio failure must never interrupt combat; a failed start consumes no slot.
    }
  }

  public shutdown(): void {
    this.closed = true;
    if (this.warmHandle !== null) window.cancelIdleCallback(this.warmHandle);
    this.warmHandle = null;
    while (this.voices.length) this.stopVoice(this.voices[this.voices.length - 1]);
    this.bus.disconnect();
    this.limiter.disconnect();
    this.lastPlayed.clear();
    this.buffers.clear();
  }

  private stopVoice(voice: Voice): void {
    voice.source.onended = null;
    try { voice.source.stop(); } catch { /* Already finished or context lost. */ }
    this.releaseVoice(voice);
  }

  private getBuffer(cue: AudioCue): AudioBuffer {
    const cached = this.buffers.get(cue);
    if (cached) return cached;
    const samples = renderCueSamples(AUDIO_CUE_DEFINITIONS[cue], this.context.sampleRate);
    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.getChannelData(0).set(samples);
    this.buffers.set(cue, buffer);
    return buffer;
  }

  private scheduleWarmup(): void {
    // Optional idle prewarming during menu/intro. No eager AudioContext, timers
    // or background work on browsers without this API; first use still works.
    if (this.closed || this.suspended || this.warmHandle !== null
      || this.warmIndex >= this.warmCues.length || typeof window === 'undefined'
      || typeof window.requestIdleCallback !== 'function') return;
    this.warmHandle = window.requestIdleCallback(deadline => {
      this.warmHandle = null;
      if (this.closed || this.suspended) return;
      if (deadline.timeRemaining() >= 6) {
        try { this.getBuffer(this.warmCues[this.warmIndex]); } catch { /* First use can retry. */ }
        this.warmIndex += 1;
      }
      this.scheduleWarmup();
    });
  }

  private releaseVoice(voice: Voice): void {
    voice.source.disconnect();
    const index = this.voices.indexOf(voice);
    if (index >= 0) this.voices.splice(index, 1);
  }
}
