import { describe, expect, it } from 'vitest';
import {
  calculateRunNova,
  calculateVoluntaryWithdrawalNova,
  formatNova,
  NOVA_CURRENCY
} from './EconomyDefinitions';

describe('EconomyDefinitions', () => {
  it('exposes a readable, single local currency', () => {
    expect(NOVA_CURRENCY.name).toBe('NOVA');
    expect(NOVA_CURRENCY.symbol.length).toBeGreaterThan(0);
  });

  it('rewards short and long runs deterministically without decimals', () => {
    expect(calculateRunNova({ kills: 0, elapsedSeconds: 0 })).toBe(1);
    expect(calculateRunNova({ kills: 10, elapsedSeconds: 61 })).toBe(12);
    expect(calculateRunNova({ kills: -4, elapsedSeconds: -1 })).toBe(1);
    expect(calculateRunNova({ kills: 1_000_000, elapsedSeconds: 1_000_000 })).toBe(9_999);
    expect(formatNova(1_234.9)).toBe('1,234');
  });

  it('forfeits half of an Overdrive run only when the player voluntarily withdraws', () => {
    expect(calculateVoluntaryWithdrawalNova(1_052)).toEqual({
      generatedNova: 1_052,
      forfeitedNova: 526,
      payoutNova: 526
    });
    expect(calculateVoluntaryWithdrawalNova(501)).toEqual({
      generatedNova: 501,
      forfeitedNova: 251,
      payoutNova: 250
    });
    expect(calculateVoluntaryWithdrawalNova(0)).toEqual({
      generatedNova: 0,
      forfeitedNova: 0,
      payoutNova: 0
    });
    expect(calculateVoluntaryWithdrawalNova(Number.NaN).payoutNova).toBe(0);
  });
});
