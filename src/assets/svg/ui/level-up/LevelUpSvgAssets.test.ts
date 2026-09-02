import { describe, expect, it } from 'vitest';
import cardFrameSvg from './card-frame.svg?raw';
import iconsSvg from './icons.svg?raw';

const unsafeSvg = /<(?:script|foreignObject|image)\b|(?:url\(|on[a-z]+\s*=|filter\s*=|mask\s*=)/i;

describe('level-up SVG assets', () => {
  it('keeps the card frame responsive and free of external/raster dependencies', () => {
    expect(cardFrameSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(cardFrameSvg).toContain('viewBox="0 0 320 260"');
    expect(cardFrameSvg).toContain('preserveAspectRatio="none"');
    expect(cardFrameSvg).toContain('aria-hidden="true"');
    expect(cardFrameSvg).not.toMatch(unsafeSvg);
  });

  it('keeps a single prefixed icon sprite with stable symbol ids', () => {
    expect(iconsSvg).toContain('id="ui-upgrade-icons"');
    expect(iconsSvg).toContain('viewBox="0 0 48 48"');
    expect(iconsSvg).toContain('preserveAspectRatio="xMidYMid meet"');
    const ids = [...iconsSvg.matchAll(/<symbol\s+id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(9);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('ui-upgrade-icon-'))).toBe(true);
    expect(iconsSvg).not.toMatch(unsafeSvg);
  });
});
