import { describe, expect, it } from 'vitest';
import novaSvg from './nova.svg?raw';

describe('NOVA SVG master', () => {
  it('keeps the currency emblem self-contained and scalable', () => {
    expect(novaSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(novaSvg).toContain('viewBox="0 0 64 64"');
    expect(novaSvg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(novaSvg).toContain('role="presentation"');
    expect(novaSvg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=/i);
  });
});
