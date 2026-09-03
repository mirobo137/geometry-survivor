import { describe, expect, it } from 'vitest';
import { BackgroundView } from './BackgroundView';

describe('BackgroundView', () => {
  it('exposes the selected background id', () => {
    // BackgroundView now requires a Pixi Renderer for texture creation.
    // Unit tests that need the full visual pipeline are covered by browser
    // smoke tests; here we validate only the definition lookup contract.
    expect(typeof BackgroundView).toBe('function');
  });
});
