import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareImage, observeVisibleImages, stopObservingImages } from './ImageReadiness';

class ImageStub extends EventTarget {
  loading = 'lazy';
  dataset: Record<string, string> = {};
  isConnected = true;
  complete = false;
  naturalWidth = 0;
  src = 'original';
  currentSrc = 'original';
  decode = vi.fn(async () => {});
  asImage(): HTMLImageElement { return this as unknown as HTMLImageElement; }
}

describe('bounded UI image readiness', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it('waits for decode, not merely the network load event', async () => {
    const image = new ImageStub();
    let decoded!: () => void;
    image.decode.mockImplementation(() => new Promise(resolve => { decoded = resolve; }));
    const ready = prepareImage(image.asImage());
    image.naturalWidth = 256;
    image.dispatchEvent(new Event('load'));
    expect(image.dataset.artState).toBe('loading');
    decoded();
    expect(await ready).toBe(true);
    expect(image.dataset.artState).toBe('ready');
  });
  it('keeps fallback stable after timeout and removes late event callbacks', async () => {
    vi.useFakeTimers();
    const image = new ImageStub();
    const ready = prepareImage(image.asImage(), 50);
    await vi.advanceTimersByTimeAsync(50);
    expect(await ready).toBe(false);
    image.naturalWidth = 256;
    image.dispatchEvent(new Event('load'));
    expect(image.dataset.artState).toBe('fallback');
    expect(image.decode).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not update detached modal art or block on failed decode', async () => {
    const image = new ImageStub();
    const ready = prepareImage(image.asImage());
    image.isConnected = false;
    image.naturalWidth = 256;
    image.decode.mockRejectedValueOnce(new Error('decode'));
    image.dispatchEvent(new Event('load'));
    expect(await ready).toBe(false);
    expect(image.dataset.artState).toBe('loading');
  });

  it('disconnects observers of discarded modals/hands and reuses one for static collections', () => {
    const instances: { disconnect: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal('IntersectionObserver', class {
      disconnect = vi.fn();
      constructor() { instances.push(this); }
    });
    const root = { querySelectorAll: () => [] } as unknown as HTMLElement;
    observeVisibleImages(root);
    observeVisibleImages(root);
    expect(instances).toHaveLength(1);
    stopObservingImages(root);
    expect(instances[0].disconnect).toHaveBeenCalledOnce();
    observeVisibleImages(root);
    expect(instances).toHaveLength(2);
    stopObservingImages(root);
  });
});
