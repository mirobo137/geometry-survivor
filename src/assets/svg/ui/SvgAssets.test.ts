import { describe, expect, it } from 'vitest';
import pauseSvg from './pause.svg?raw';
import settingsSvg from './settings.svg?raw';

const validateIcon = (svg: string, idPrefix: string): void => {
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain('viewBox="0 0 24 24"');
  expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  expect(svg).toContain('aria-hidden="true"');
  expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=/i);
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => id.startsWith(idPrefix))).toBe(true);
};

describe('UI SVG masters', () => {
  it('keeps the pause and settings assets safe and deterministic', () => {
    validateIcon(pauseSvg, 'ui-pause-');
    validateIcon(settingsSvg, 'ui-settings-');
  });
});
