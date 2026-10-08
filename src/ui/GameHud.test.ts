import { describe, expect, it } from 'vitest';
import { GameHud, formatExperience, formatHealth, getLevelExperience, getMeterPercent } from './GameHud';

describe('GameHud', () => {
  it('updates actual HUD fill and accessible values even when integer labels stay the same', () => {
    const nodes = new Map<string, { textContent: string; hidden: boolean; dataset: Record<string, string>; attributes: Map<string, string>; styles: Map<string, string>; style: { setProperty: (key: string, value: string) => void }; setAttribute: (key: string, value: string) => void }>();
    for (const id of ['time', 'health', 'xp', 'kills', 'level', 'assault', 'health-meter', 'xp-meter']) {
      const attributes = new Map<string, string>();
      const styles = new Map<string, string>();
      nodes.set(`#hud-${id}`, { textContent: '', hidden: false, dataset: {}, attributes, styles,
        style: { setProperty: (key, value) => { styles.set(key, value); } },
        setAttribute: (key, value) => { attributes.set(key, value); } });
    }
    const hud = new GameHud({ querySelector: (selector: string) => nodes.get(selector) } as unknown as HTMLElement);
    const values = { elapsedSeconds: 10, health: 20.5, maxHealth: 100, xp: 14, levelStartExperience: 8, nextLevelExperience: 20, kills: 1, level: 2 };
    hud.update(values);
    expect(nodes.get('#hud-health')!.textContent).toBe('HP 21/100');
    expect(nodes.get('#hud-health-meter')!.dataset.critical).toBe('true');
    expect(nodes.get('#hud-xp')!.textContent).toBe('XP 6/12');
    expect(nodes.get('#hud-xp-meter')!.attributes.get('aria-valuenow')).toBe('50');
    hud.update({ ...values, health: 20.1 });
    expect(nodes.get('#hud-health')!.textContent).toBe('HP 21/100');
    expect(nodes.get('#hud-health-meter')!.styles.get('--meter-scale')).toBe('0.201');
    hud.update({ ...values, health: 80 });
    expect(nodes.get('#hud-health-meter')!.dataset.critical).toBe('false');
    hud.update({ ...values, assault: { healthMultiplier: 2, bossesDefeated: 3, killsTowardNextBoss: 29, killsPerBoss: 100, bossActive: false, nextBossQueued: false } });
    expect(nodes.get('#hud-assault')!.hidden).toBe(true);
    expect(nodes.get('#hud-assault')!.textContent).toContain('29/100');
  });
  it('shows progress within the current level rather than cumulative XP', () => {
    expect(getLevelExperience(4, 0, 8)).toEqual({ current: 4, required: 8 });
    expect(getLevelExperience(8, 8, 20)).toEqual({ current: 0, required: 12 });
    expect(getLevelExperience(14.5, 8, 20)).toEqual({ current: 6.5, required: 12 });
    expect(getLevelExperience(50, 8, 20)).toEqual({ current: 12, required: 12 });
  });
  it('keeps meter fills bounded and uses fractional HP without display rounding', () => {
    expect(getMeterPercent(25, 100)).toBe(25);
    expect(getMeterPercent(104.03999999999, 104.03999999999)).toBe(100);
    expect(getMeterPercent(0.2, 100)).toBe(0.2);
    expect(getMeterPercent(-1, 100)).toBe(0);
    expect(getMeterPercent(150, 100)).toBe(100);
    expect(getMeterPercent(1, 0)).toBe(0);
    expect(getMeterPercent(NaN, 100)).toBe(0);
  });
  it('displays current and maximum HP as consistent whole numbers', () => {
    expect(formatHealth(104.03999999999999, 104.03999999999999)).toBe('HP 105/105');
    expect(formatHealth(70.25, 104.03999999999999)).toBe('HP 71/105');
    expect(formatHealth(0, 104.03999999999999)).toBe('HP 0/105');
    expect(formatHealth(0.2, 104.03999999999999)).toBe('HP 1/105');
    expect(formatHealth(120, 104.03999999999999)).toBe('HP 105/105');
    expect(formatHealth(-1, 100)).toBe('HP 0/100');
  });
  it('keeps fractional simulation XP out of the compact HUD indicator', () => {
    expect(formatExperience(12.7999999999)).toBe('12');
    expect(formatExperience(0.99)).toBe('0');
    expect(formatExperience(-4)).toBe('0');
  });
});
