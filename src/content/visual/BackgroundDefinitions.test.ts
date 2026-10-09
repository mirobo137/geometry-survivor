import { describe, expect, it } from 'vitest';
import { BACKGROUND_DEFINITIONS, getBackgroundDefinition, isBackgroundId } from './BackgroundDefinitions';

describe('BackgroundDefinitions', () => {
  it('keeps ten bounded, presentation-only background identities', () => {
    expect(BACKGROUND_DEFINITIONS).toHaveLength(20);
    expect(new Set(BACKGROUND_DEFINITIONS.map((definition) => definition.id)).size).toBe(20);
    for (const definition of BACKGROUND_DEFINITIONS) {
      expect(definition.name.length).toBeGreaterThan(0);
      expect(isBackgroundId(definition.id)).toBe(true);
      expect(definition.tokens.pattern).toMatch(/^(constellation|nebula|solar|crystal)$/);
      expect(definition.tokens.base).toBeGreaterThanOrEqual(0);
    }
    expect(getBackgroundDefinition('deep-space').id).toBe('deep-space');
    expect(isBackgroundId('crystal-field')).toBe(true);
    expect(isBackgroundId('unknown')).toBe(false);
    expect(getBackgroundDefinition('nacre-orbit').priceNova).toBeGreaterThan(0);
    expect(getBackgroundDefinition('vesper-bloom').priceNova).toBeGreaterThan(0);
  });
});
