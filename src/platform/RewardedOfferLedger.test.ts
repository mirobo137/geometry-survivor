import { describe, expect, it } from 'vitest';
import { RewardedOfferLedger } from './RewardedOfferLedger';

describe('RewardedOfferLedger', () => {
  it('blocks overlap and consumes a successful placement once', () => {
    const ledger = new RewardedOfferLedger();

    const token = ledger.begin('double-nova');
    expect(token).not.toBeNull();
    expect(ledger.begin('double-nova')).toBeNull();
    ledger.settle('double-nova', token ?? -1, 'rewarded');
    expect(ledger.canOffer('double-nova')).toBe(false);
  });

  it('keeps a dismissed or failed offer retryable', () => {
    const ledger = new RewardedOfferLedger();

    const first = ledger.begin('revive');
    expect(first).not.toBeNull();
    ledger.settle('revive', first ?? -1, 'dismissed');
    const second = ledger.begin('revive');
    expect(second).not.toBeNull();
    ledger.settle('revive', second ?? -1, 'error');
    expect(ledger.begin('revive')).not.toBeNull();
  });

  it('resets run-scoped state without affecting another placement', () => {
    const ledger = new RewardedOfferLedger();

    const token = ledger.begin('reroll');
    expect(token).not.toBeNull();
    ledger.settle('reroll', token ?? -1, 'rewarded');
    expect(ledger.canOffer('reroll')).toBe(false);
    expect(ledger.canOffer('cosmetic-unlock')).toBe(true);
    ledger.reset();
    expect(ledger.canOffer('reroll')).toBe(true);
  });

  it('ignores a late result from a previous run token', () => {
    const ledger = new RewardedOfferLedger();
    const oldToken = ledger.begin('double-nova');

    ledger.reset();
    ledger.settle('double-nova', oldToken ?? -1, 'rewarded');
    expect(ledger.canOffer('double-nova')).toBe(true);
  });
});
