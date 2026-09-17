import { describe, expect, it } from 'vitest';
import base from './joystick-base.svg?raw';
import thumb from './joystick-thumb.svg?raw';

describe('Joystick instrument assets', () => {
  for (const [name, svg] of [['base', base], ['thumb', thumb]]) {
    it(`${name} stays bounded, decorative and self-contained`, () => {
      expect(svg).toContain('viewBox=');
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toMatch(/<filter|<mask|<script|<foreignObject|<image|url\(|on[a-z]+=/i);
      expect(svg.length).toBeLessThan(2500);
      expect((svg.match(/<(path|circle|polygon)\b/g) ?? []).length).toBeLessThanOrEqual(14);
    });
  }
});
