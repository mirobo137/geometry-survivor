import { describe, expect, it } from 'vitest';
import { BACKGROUND_DEFINITIONS, getBackgroundDefinition, isBackgroundId } from './BackgroundDefinitions';

describe('BackgroundDefinitions', () => {
  it('keeps four bounded, presentation-only atmosphere presets', () => {
    expect(BACKGROUND_DEFINITIONS).toHaveLength(4);
    expect(new Set(BACKGROUND_DEFINITIONS.map((definition) => definition.id)).size).toBe(4);
    for (const definition of BACKGROUND_DEFINITIONS) {
      expect(definition.name.length).toBeGreaterThan(0);
      expect(definition.tokens.pattern).toMatch(/^(constellation|nebula|solar|crystal)$/);
      expect(definition.tokens.base).toBeGreaterThanOrEqual(0);
    }
    expect(getBackgroundDefinition('deep-space').id).toBe('deep-space');
    expect(isBackgroundId('crystal-field')).toBe(true);
    expect(isBackgroundId('unknown')).toBe(false);
  });
});
