import { expect, it } from 'vitest';
import { normalizeControlScheme } from './ControlScheme';

it('maps all legacy choices to the two visible modes', () => {
  expect(['auto', 'keyboard', 'touch'].map(value => normalizeControlScheme(value as 'auto' | 'keyboard' | 'touch')))
    .toEqual(['touch', 'touch', 'touch']);
  expect(normalizeControlScheme('relative-touch')).toBe('joystick');
  expect(normalizeControlScheme('joystick')).toBe('joystick');
});
