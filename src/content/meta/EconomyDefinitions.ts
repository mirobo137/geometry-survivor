/** The single soft currency used by the local meta-progression loop. */
export const NOVA_CURRENCY = {
  id: 'nova',
  name: 'NOVA',
  description: 'Moneda local de Geometry Survivor',
  symbol: '✦'
} as const;

export type CosmeticTier = 'starter' | 'common' | 'rare' | 'epic';

export interface CosmeticEconomy {
  readonly tier: CosmeticTier;
  readonly priceNova: number;
}

export const COSMETIC_TIER_LABELS: Readonly<Record<CosmeticTier, string>> = {
  starter: 'INICIAL',
  common: 'COMÚN',
  rare: 'RARA',
  epic: 'ÉPICA'
};

/**
 * Small deterministic reward: playtime and kills both matter, while a short
 * run still grants something useful. The function is pure so it can be tuned
 * without touching Game or the renderer.
 */
export interface RunRewardInput {
  readonly kills: number;
  readonly elapsedSeconds: number;
}

export const calculateRunNova = (summary: RunRewardInput): number => {
  const kills = Math.max(0, Math.floor(summary.kills));
  const survivedSeconds = Math.max(0, Math.floor(summary.elapsedSeconds));
  return Math.min(9_999, Math.max(1, kills + Math.floor(survivedSeconds / 30)));
};

export const formatNova = (amount: number): string => (
  Math.max(0, Math.floor(amount)).toLocaleString('en-US')
);
