export interface FrameProfileSnapshot {
  readonly enabled: boolean;
  readonly samples: number;
  readonly averageMs: number;
  readonly p95Ms: number;
  readonly maxMs: number;
  readonly longFrames: number;
  readonly heapUsedMb: number | null;
}

const SAMPLE_CAPACITY = 240;
const LONG_FRAME_MS = 25;
const REPORT_INTERVAL_MS = 500;

const DISABLED_SNAPSHOT: FrameProfileSnapshot = {
  enabled: false,
  samples: 0,
  averageMs: 0,
  p95Ms: 0,
  maxMs: 0,
  longFrames: 0,
  heapUsedMb: null
};

/** Optional low-overhead frame sampler for real-device comparisons. */
export class FrameProfiler {
  private readonly samples = new Float64Array(SAMPLE_CAPACITY);
  private readonly sortedSamples = new Float64Array(SAMPLE_CAPACITY);
  private sampleCount = 0;
  private cursor = 0;
  private longFrames = 0;
  private lastReportAtMs = Number.NEGATIVE_INFINITY;
  private cachedSnapshot: FrameProfileSnapshot = DISABLED_SNAPSHOT;

  public constructor(public readonly enabled = false) {}

  public record(frameMs: number): void {
    if (!this.enabled) return;
    const value = Math.min(1000, Math.max(0, frameMs));
    this.samples[this.cursor] = value;
    this.cursor = (this.cursor + 1) % SAMPLE_CAPACITY;
    this.sampleCount = Math.min(SAMPLE_CAPACITY, this.sampleCount + 1);
    if (value >= LONG_FRAME_MS) this.longFrames += 1;
  }

  public snapshot(nowMs = performance.now()): FrameProfileSnapshot {
    if (!this.enabled) return DISABLED_SNAPSHOT;
    if (nowMs - this.lastReportAtMs < REPORT_INTERVAL_MS) return this.cachedSnapshot;
    this.lastReportAtMs = nowMs;

    if (this.sampleCount === 0) {
      this.cachedSnapshot = {
        enabled: true,
        samples: 0,
        averageMs: 0,
        p95Ms: 0,
        maxMs: 0,
        longFrames: this.longFrames,
        heapUsedMb: this.readHeapUsedMb()
      };
      return this.cachedSnapshot;
    }

    let total = 0;
    let max = 0;
    for (let index = 0; index < this.sampleCount; index += 1) {
      const value = this.samples[index];
      this.sortedSamples[index] = value;
      total += value;
      max = Math.max(max, value);
    }
    this.sortedSamples.subarray(0, this.sampleCount).sort();
    const p95Index = Math.max(0, Math.ceil(this.sampleCount * 0.95) - 1);
    this.cachedSnapshot = {
      enabled: true,
      samples: this.sampleCount,
      averageMs: total / this.sampleCount,
      p95Ms: this.sortedSamples[p95Index],
      maxMs: max,
      longFrames: this.longFrames,
      heapUsedMb: this.readHeapUsedMb()
    };
    return this.cachedSnapshot;
  }

  private readHeapUsedMb(): number | null {
    if (typeof performance === 'undefined') return null;
    const memory = (performance as Performance & {
      memory?: { readonly usedJSHeapSize: number };
    }).memory;
    return memory ? memory.usedJSHeapSize / (1024 * 1024) : null;
  }
}
