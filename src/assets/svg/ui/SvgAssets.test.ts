import { describe, expect, it } from 'vitest';
import pauseSvg from './pause.svg?raw';
import pauseActionIcons from './pause-icons.svg?raw';
import pausePanelFrame from './pause-panel-frame.svg?raw';
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

  it('keeps the pause action sprite and structural frame within their budgets', () => {
    expect(pauseActionIcons).toContain('class="pause-icon-sprite"');
    expect(pauseActionIcons.match(/<symbol\b/g)?.length).toBe(6);
    const symbolIds = [...pauseActionIcons.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(symbolIds).size).toBe(symbolIds.length);
    expect(symbolIds.every((id) => id.startsWith('ui-pause-action-'))).toBe(true);
    expect(pauseActionIcons).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=/i);
    expect(new TextEncoder().encode(pauseActionIcons).byteLength).toBeLessThanOrEqual(3072);

    expect(pausePanelFrame).toContain('viewBox="0 0 640 520"');
    expect(pausePanelFrame).toContain('preserveAspectRatio="none"');
    expect(pausePanelFrame).not.toMatch(/id="|<script|<foreignObject|<image|url\(|on[a-z]+=/i);
    expect(new TextEncoder().encode(pausePanelFrame).byteLength).toBeLessThanOrEqual(3072);
  });
});
