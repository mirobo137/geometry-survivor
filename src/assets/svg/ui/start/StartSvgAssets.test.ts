import { describe, expect, it } from 'vitest';
import markSvg from './mark.svg?raw';

const validateStartAsset = (svg: string, viewBox: string, idPrefix: string): void => {
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain(`viewBox="${viewBox}"`);
  expect(svg).toContain('preserveAspectRatio=');
  expect(svg).toMatch(/aria-hidden="true"/);
  expect(svg).not.toMatch(/<(?:script|foreignObject|image)\b|(?:url\(|on[a-z]+\s*=|filter\s*=|mask\s*=)/i);
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => id.startsWith(idPrefix))).toBe(true);
};

describe('start screen SVG asset', () => {
  it('keeps the mark vectorial, deterministic and self-contained', () => {
    validateStartAsset(markSvg, '-72 -72 144 144', 'ui-start-mark-');
    expect(markSvg).toContain('preserveAspectRatio="xMidYMid meet"');
  });

});
