import { describe, expect, it } from 'vitest';
import { createDefaultDailyWheel, DAILY_WHEEL_PERIOD_MS, DAILY_WHEEL_NOVA, dailyWheelAvailability,
  dailyWheelPrize, drawDailyWheelSlot, normalizeDailyWheel } from './DailyWheelDefinitions';

describe('daily wheel content', () => {
  it.each([1, 2, 10, 20])('assigns exact ticket probabilities at %s percent', chance => {
    const counts = Array.from({ length: 11 }, () => 0);
    for (let ticket = 0; ticket < 1000; ticket++) counts[drawDailyWheelSlot((ticket + 0.5) / 1000, chance)]++;
    expect(counts).toEqual([...DAILY_WHEEL_NOVA.map(() => 100 - chance), chance * 10]);
    for (const sample of [NaN, Infinity, -0.1, 1]) expect(() => drawDailyWheelSlot(sample)).toThrow();
  });
  it('awards skins for both spin kinds without duplicating ownership', () => {
    expect(dailyWheelPrize(10, 'free', false)).toEqual({ skin: 'solstice', nova: 0 });
    expect(dailyWheelPrize(10, 'free', true)).toEqual({ skin: null, nova: 500 });
    expect(dailyWheelPrize(10, 'video', false)).toEqual({ skin: 'solstice', nova: 0 });
    expect(dailyWheelPrize(10, 'video', true)).toEqual({ skin: null, nova: 500 });
    expect(() => dailyWheelPrize(11, 'free', false)).toThrow();
  });
  it('uses a rolling 24h cycle with one non-accumulating optional video', () => {
    const start = 1_800_000_000_000;
    expect(dailyWheelAvailability(createDefaultDailyWheel(), start).free).toBe(true);
    const used = { cycleStartedAtMs: start, videoClaimed: false, lastReceipt: null };
    expect(dailyWheelAvailability(used, start + 1)).toMatchObject({ free: false, video: true });
    expect(dailyWheelAvailability({ ...used, videoClaimed: true }, start + 1).video).toBe(false);
    expect(dailyWheelAvailability(used, start + DAILY_WHEEL_PERIOD_MS)).toMatchObject({ free: true, video: false });
    expect(dailyWheelAvailability(used, start - 1)).toMatchObject({ free: false, video: false, clockAhead: true });
  });
  it('sanitizes malformed clocks, receipts and video ownership', () => {
    expect(normalizeDailyWheel({ cycleStartedAtMs: NaN, videoClaimed: true, lastReceipt: { id: '<script>' } })).toEqual(createDefaultDailyWheel());
    const value = normalizeDailyWheel({ cycleStartedAtMs: 10, lastReceipt: {
      id: 'receipt-1', kind: 'video', slot: 10, skin: 'solstice', nova: Infinity, claimedAtMs: -4
    } });
    expect(value.lastReceipt).toMatchObject({ skin: 'solstice', nova: 0, claimedAtMs: 0 });
    expect(normalizeDailyWheel({ chancePercent: 999 }).chancePercent).toBe(20);
    expect(normalizeDailyWheel({ chancePercent: -10 }).chancePercent).toBe(1);
    expect(normalizeDailyWheel({ chancePercent: NaN }).chancePercent).toBe(1);
  });
});
