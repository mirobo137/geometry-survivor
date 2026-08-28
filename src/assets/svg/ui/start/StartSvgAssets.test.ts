import { describe, expect, it } from 'vitest';
import markSvg from './mark.svg?raw';

describe('start screen SVG asset', () => {
  it('keeps the mark vectorial, deterministic and self-contained', () => {
    expect(markSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(markSvg).toContain('viewBox="-72 -72 144 144"');
    expect(markSvg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(markSvg).toMatch(/aria-hidden="true"/);
    expect(markSvg).not.toMatch(/<(?:script|foreignObject|image)\b|(?:url\(|on[a-z]+\s*=|filter\s*=|mask\s*=)/i);
    const ids = [...markSvg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('ui-start-mark-'))).toBe(true);
  });
});
