import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAudioService } from './AudioService';

class FakeNode {
  public readonly connect = vi.fn((destination: unknown) => destination);
}

class FakeAudioContext {
  public static readonly instances: FakeAudioContext[] = [];
  public state: AudioContextState = 'suspended';
  public currentTime = 0;
  public readonly destination = new FakeNode() as unknown as AudioDestinationNode;
  public readonly resume = vi.fn(async () => {
    this.state = 'running';
  });
  public readonly suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  public readonly close = vi.fn(async () => {
    this.state = 'closed';
  });
  public readonly createGain = vi.fn(() => {
    const node = new FakeNode() as FakeNode & { gain: Record<string, ReturnType<typeof vi.fn>> };
    node.gain = {
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    };
    return node as unknown as GainNode;
  });
  public readonly createOscillator = vi.fn(() => {
    const node = new FakeNode() as FakeNode & {
      type: OscillatorType;
      frequency: Record<string, ReturnType<typeof vi.fn>>;
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    };
    node.type = 'sine';
    node.frequency = { setValueAtTime: vi.fn() };
    node.start = vi.fn();
    node.stop = vi.fn();
    return node as unknown as OscillatorNode;
  });

  public constructor() {
    FakeAudioContext.instances.push(this);
  }
}

describe('WebAudioService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeAudioContext.instances.length = 0;
    vi.stubGlobal('window', {
      AudioContext: FakeAudioContext as unknown as typeof AudioContext,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('desbloquea, reproduce música/cue y respeta el lifecycle', async () => {
    const service = new WebAudioService();
    service.configure({ musicVolume: 1, sfxVolume: 1, muted: false });

    await service.unlock();

    const context = FakeAudioContext.instances[0];
    expect(context).toBeDefined();
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.createOscillator).toHaveBeenCalled();

    service.playCue('level-up');
    expect(context.createOscillator.mock.calls.length).toBeGreaterThan(8);

    service.pause();
    expect(context.suspend).toHaveBeenCalledTimes(1);
    service.resume();
    await Promise.resolve();
    expect(context.resume).toHaveBeenCalledTimes(2);

    service.stopMusic();
    service.shutdown();
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it('no falla cuando el navegador no expone Web Audio', async () => {
    vi.stubGlobal('window', { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout });
    const service = new WebAudioService();

    await expect(service.unlock()).resolves.toBeUndefined();
    expect(() => {
      service.pause();
      service.resume();
      service.startMusic();
      service.playCue('damage');
      service.shutdown();
    }).not.toThrow();
  });

  it('degrada a silencio si el constructor de Web Audio falla', async () => {
    const throwingAudioContext = vi.fn(() => {
      throw new Error('AudioContext bloqueado por el navegador');
    });
    vi.stubGlobal('window', {
      AudioContext: throwingAudioContext,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    });
    const service = new WebAudioService();

    await expect(service.unlock()).resolves.toBeUndefined();
    expect(throwingAudioContext).toHaveBeenCalledTimes(1);
    expect(() => {
      service.pause();
      service.resume();
      service.startMusic();
      service.playCue('damage');
      service.shutdown();
    }).not.toThrow();
  });
});
