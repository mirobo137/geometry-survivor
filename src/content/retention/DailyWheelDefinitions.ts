import { getRewardCosmetic, type RewardCosmeticId } from './RewardCosmeticDefinitions';
/** Authored daily rewards. Displayed sectors are prizes, not proportional odds. */
export const DAILY_WHEEL_NOVA = [40, 50, 60, 75, 90, 110, 130, 160, 200, 300] as const;
export const DAILY_WHEEL_SKIN = 'solstice' as const;
export const DAILY_WHEEL_RARE_NOVA = 500;
export const DAILY_WHEEL_PERIOD_MS = 24 * 60 * 60 * 1000;
export const DAILY_WHEEL_SLOT_COUNT = DAILY_WHEEL_NOVA.length + 1;
export const DAILY_WHEEL_SKIN_CHANCE = 0.01;
export const DAILY_WHEEL_MAX_CHANCE_PERCENT = 20;
export type DailyWheelKind = 'free' | 'video';

export interface DailyWheelReceipt {
  readonly id: string;
  readonly cycleStartedAtMs: number;
  readonly claimedAtMs: number;
  readonly kind: DailyWheelKind;
  readonly slot: number;
  readonly nova: number;
  /** Legacy field name retained: now accepts any reward cosmetic family. */
  readonly skin: RewardCosmeticId | null;
  /** Frozen season prize, even if the award was NOVA or storage is retried later. */
  readonly rewardId?: RewardCosmeticId;
}

export interface DailyWheelSaveData {
  /** Probability for the next completed spin; shared by free and video spins. */
  readonly chancePercent: number;
  readonly cycleStartedAtMs: number;
  readonly videoClaimed: boolean;
  readonly lastReceipt: DailyWheelReceipt | null;
}

export interface DailyWheelSnapshot {
  readonly rewardId?: RewardCosmeticId;
  readonly progress: DailyWheelSaveData;
  readonly skinOwned: boolean;
  readonly walletNova: number;
  readonly supported: boolean;
  readonly pendingReward: boolean;
}

export type DailyWheelResult =
  | { readonly status: 'rewarded'; readonly receipt: DailyWheelReceipt }
  | { readonly status: 'busy' | 'cooldown' | 'free-first' | 'storage-error' | 'clock-error' | 'dismissed' | 'unavailable' | 'error' };

export const createDefaultDailyWheel = (): DailyWheelSaveData => ({ chancePercent: 1, cycleStartedAtMs: 0, videoClaimed: false, lastReceipt: null });
const normalizeChance = (value: unknown): number => typeof value === 'number' && Number.isFinite(value)
  ? Math.min(DAILY_WHEEL_MAX_CHANCE_PERCENT, Math.max(1, Math.floor(value))) : 1;
const MAX_CLOCK = 8_640_000_000_000_000 - DAILY_WHEEL_PERIOD_MS;
const timestamp = (value: unknown): number => typeof value === 'number' && Number.isFinite(value)
  ? Math.min(MAX_CLOCK, Math.max(0, Math.floor(value))) : 0;

export const normalizeDailyWheel = (value: unknown): DailyWheelSaveData => {
  if (!value || typeof value !== 'object') return createDefaultDailyWheel();
  const raw = value as Record<string, unknown>;
  const cycleStartedAtMs = timestamp(raw.cycleStartedAtMs);
  const entry = raw.lastReceipt && typeof raw.lastReceipt === 'object' ? raw.lastReceipt as Record<string, unknown> : null;
  const valid = entry && typeof entry.id === 'string' && /^[\w-]{1,80}$/.test(entry.id)
    && (entry.kind === 'free' || entry.kind === 'video')
    && typeof entry.slot === 'number' && Number.isInteger(entry.slot) && entry.slot >= 0 && entry.slot < DAILY_WHEEL_SLOT_COUNT;
  const lastReceipt: DailyWheelReceipt | null = valid ? {
    id: entry.id as string, kind: entry.kind as DailyWheelKind, slot: entry.slot as number,
    cycleStartedAtMs: timestamp(entry.cycleStartedAtMs), claimedAtMs: timestamp(entry.claimedAtMs),
    nova: typeof entry.nova === 'number' && Number.isFinite(entry.nova) ? Math.min(DAILY_WHEEL_RARE_NOVA, Math.max(0, Math.floor(entry.nova))) : 0,
    skin: entry.slot === DAILY_WHEEL_NOVA.length && getRewardCosmetic(entry.skin)?.source === 'daily-wheel' ? entry.skin as RewardCosmeticId : null,
    ...(getRewardCosmetic(entry.rewardId)?.source === 'daily-wheel' ? { rewardId: entry.rewardId as RewardCosmeticId } : {})
  } : null;
  return { chancePercent: normalizeChance(raw.chancePercent), cycleStartedAtMs, videoClaimed: raw.videoClaimed === true && cycleStartedAtMs > 0, lastReceipt };
};

export const dailyWheelAvailability = (data: Pick<DailyWheelSaveData, 'cycleStartedAtMs' | 'videoClaimed'>, nowMs: number) => {
  const validClock = Number.isFinite(nowMs) && nowMs > 0 && nowMs <= MAX_CLOCK;
  const clockAhead = data.cycleStartedAtMs > nowMs;
  return {
    free: validClock && (data.cycleStartedAtMs === 0 || nowMs >= data.cycleStartedAtMs + DAILY_WHEEL_PERIOD_MS),
    video: validClock && !clockAhead && data.cycleStartedAtMs > 0 && !data.videoClaimed
      && nowMs < data.cycleStartedAtMs + DAILY_WHEEL_PERIOD_MS,
    clockAhead: !validClock || clockAhead,
    nextFreeAtMs: data.cycleStartedAtMs + DAILY_WHEEL_PERIOD_MS
  };
};

/** 1,000 equally likely tickets: gold gets chancePercent * 10, NOVA shares the rest. */
export const drawDailyWheelSlot = (randomUnit: number, chancePercent = 1): number => {
  if (!Number.isFinite(randomUnit) || randomUnit < 0 || randomUnit >= 1) throw new Error('Invalid wheel random sample');
  const ticket = Math.floor(randomUnit * 1000);
  const novaTickets = 100 - normalizeChance(chancePercent);
  return ticket >= novaTickets * 10 ? 10 : Math.floor(ticket / novaTickets);
};

export const dailyWheelPrize = (slot: number, _kind: DailyWheelKind, skinOwned: boolean, rewardId: RewardCosmeticId = DAILY_WHEEL_SKIN) => {
  if (!Number.isInteger(slot) || slot < 0 || slot >= DAILY_WHEEL_SLOT_COUNT) throw new Error('Invalid wheel slot');
  const skin = slot === 10 && !skinOwned ? rewardId : null;
  return { skin, nova: skin ? 0 : slot === 10 ? DAILY_WHEEL_RARE_NOVA : DAILY_WHEEL_NOVA[slot] };
};
