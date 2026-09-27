import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  howlPlay: vi.fn(() => 1001),
  howlPause: vi.fn(),
  howlStop: vi.fn(),
  howlUnload: vi.fn(),
  howlVolume: vi.fn(),
  createBufferSource: vi.fn(),
  context: null as FakeAudioContext | null,
  masterGain: null as GainNode | null,
  allowContext: true
}));

class FakeNode {
  public readonly connect = vi.fn((destination: unknown) => destination);
  public readonly disconnect = vi.fn();
  public readonly gain = { setTargetAtTime: vi.fn() };
}

class FakeAudioContext {
  public readonly sampleRate = 48000;
  public state: AudioContextState = 'suspended';
  public currentTime = 0;
  public readonly destination = new FakeNode() as unknown as AudioDestinationNode;
  public readonly resume = vi.fn(async () => { this.state = 'running'; });
  public readonly createGain = vi.fn(() => new FakeNode() as unknown as GainNode);
  public readonly createDynamicsCompressor = vi.fn(() => Object.assign(new FakeNode(), {
    threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 },
    attack: { value: 0 }, release: { value: 0 }
  }) as unknown as DynamicsCompressorNode);
  public readonly createBuffer = vi.fn((_channels: number, length: number) => ({
    getChannelData: vi.fn(() => new Float32Array(length))
  }) as unknown as AudioBuffer);
  public readonly createBufferSource = vi.fn(() => {
    const source = new FakeNode() as FakeNode & { buffer: AudioBuffer | null; playbackRate: { value: number }; onended: (() => void) | null; start: ReturnType<typeof vi.fn> };
    source.buffer = null;
    source.playbackRate = { value: 1 };
    source.onended = null;
    source.start = vi.fn();
    Object.assign(source, { stop: vi.fn() });
    return source as unknown as AudioBufferSourceNode;
  });
}

vi.mock('howler', () => {
  const Howler = {
    get ctx() { return mocks.context as unknown as AudioContext | null; },
    get masterGain() { return mocks.masterGain; }
  };
  class Howl {
    public constructor() {
      if (!mocks.allowContext) return;
      mocks.context ??= new FakeAudioContext();
      mocks.masterGain ??= mocks.context.createGain() as unknown as GainNode;
    }
    public playing = vi.fn(() => false);
    public play = mocks.howlPlay;
    public pause = mocks.howlPause;
    public stop = mocks.howlStop;
    public unload = mocks.howlUnload;
    public volume = mocks.howlVolume;
  }
  return { Howl, Howler };
});

import { AudioManager } from './AudioService';

describe('AudioManager', () => {
  beforeEach(() => {
    mocks.context = null;
    mocks.masterGain = null;
    mocks.allowContext = true;
    mocks.howlPlay.mockClear();
    mocks.howlPause.mockClear();
    mocks.howlStop.mockClear();
    mocks.howlUnload.mockClear();
    mocks.howlVolume.mockClear();
  });

  it('creates audio only on unlock and resumes one persistent background track', async () => {
    const service = new AudioManager();
    service.startMusic();
    expect(mocks.context).toBeNull();

    await service.unlock();

    expect(mocks.context?.resume).toHaveBeenCalledTimes(1);
    expect(mocks.howlPlay).toHaveBeenCalledTimes(1);
    service.pause();
    expect(mocks.howlPause).toHaveBeenCalledTimes(1);
    service.resume();
    expect(mocks.howlPlay).toHaveBeenCalledTimes(2);
  });

  it('routes procedural cues through the shared unlocked context and respects mute', async () => {
    const service = new AudioManager();
    await service.unlock();
    const context = mocks.context!;
    service.playCue('enemy-defeated');
    expect(context.createBufferSource).toHaveBeenCalledTimes(1);

    service.configure({ musicVolume: 0.2, sfxVolume: 1, muted: true });
    service.playCue('damage');
    expect(context.createBufferSource).toHaveBeenCalledTimes(1);
  });

  it('stays safe if Howler cannot provide an audio context', async () => {
    mocks.allowContext = false;
    const service = new AudioManager();
    await expect(service.unlock()).resolves.toBeUndefined();
    expect(() => {
      service.pause();
      service.resume();
      service.startMusic();
      service.playCue('damage');
      service.shutdown();
    }).not.toThrow();
  });

  it('caches layered synthesis and disposes finished sources', async () => {
    const service = new AudioManager();
    await service.unlock();
    const ctx = mocks.context!;
    service.playCue('laser-ignite');
    const first = ctx.createBufferSource.mock.results[0].value;
    first.onended?.(new Event('ended'));
    ctx.currentTime = 1;
    service.playCue('laser-ignite');
    expect(ctx.createBuffer).toHaveBeenCalledTimes(1);
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(2);
    expect(first.disconnect).toHaveBeenCalled();
    service.shutdown();
  });

  it('reserves danger slots and preempts detail without exceeding eight voices', async () => {
    const service = new AudioManager();
    await service.unlock();
    const ctx = mocks.context!;
    for (let i = 0; i < 8; i += 1) {
      ctx.currentTime = i;
      service.playCue('enemy-hit');
    }
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(6);
    service.playCue('laser-ignite');
    service.playCue('boss-warning');
    service.playCue('damage');
    const sources = ctx.createBufferSource.mock.results.map(result => result.value);
    expect(sources.length).toBe(9);
    expect(sources.filter(source => vi.mocked(source.stop).mock.calls.length === 0)).toHaveLength(8);
    expect(sources[0].stop).toHaveBeenCalledOnce();
    service.shutdown();
    expect(sources.every(source => vi.mocked(source.disconnect).mock.calls.length > 0)).toBe(true);
  });

  it('stops combat tails on pause while allowing UI without starting music', async () => {
    const service = new AudioManager();
    await service.unlock();
    service.playCue('laser-sustain');
    const ctx = mocks.context!;
    const source = ctx.createBufferSource.mock.results[0].value;
    service.pause();
    expect(source.stop).toHaveBeenCalledOnce();
    await service.unlock();
    service.playCue('laser-sustain');
    service.playCue('ui-click');
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(2);
    expect(mocks.howlPlay).not.toHaveBeenCalled();
    service.shutdown();
  });

  it('a rejected source start neither consumes a voice nor silences its retry', async () => {
    const service = new AudioManager();
    await service.unlock();
    const ctx = mocks.context!;
    const failed = ctx.createBufferSource();
    vi.mocked(failed.start).mockImplementation(() => { throw new Error('context interrupted'); });
    ctx.createBufferSource.mockReturnValueOnce(failed);
    service.playCue('laser-ignite');
    expect(failed.disconnect).toHaveBeenCalled();
    const count = ctx.createBufferSource.mock.calls.length;
    service.playCue('laser-ignite');
    expect(ctx.createBufferSource.mock.calls.length).toBe(count + 1);
    service.shutdown();
  });
});
