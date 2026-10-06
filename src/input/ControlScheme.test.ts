import { expect, it } from 'vitest';
import { normalizeControlScheme } from './ControlScheme';
import { createDefaultSaveData, migrateSaveData, SAVE_SCHEMA_VERSION } from '../platform/save/SaveStore';

it('defaults to joystick everywhere and preserves new saved choices', () => {
  expect(createDefaultSaveData().settings.controlScheme).toBe('joystick');
  expect(migrateSaveData(null).settings.controlScheme).toBe('joystick');
  expect(migrateSaveData({ settings: {} }).settings.controlScheme).toBe('joystick');
  expect(migrateSaveData({ schemaVersion: SAVE_SCHEMA_VERSION, settings: { controlScheme: 'touch' } }).settings.controlScheme).toBe('touch');
  expect(migrateSaveData({ settings: { controlScheme: 'joystick' } }).settings.controlScheme).toBe('joystick');
});

it('resets only old controls once, keeping progress and subsequent finger-follow choices', () => {
  const defaults = createDefaultSaveData();
  const old = { ...defaults, schemaVersion: 13, settings: { ...defaults.settings, controlScheme: 'touch' }, wallet: { nova: 4321 } };
  const migrated = migrateSaveData(old);
  expect(migrated).toEqual({ ...old, schemaVersion: SAVE_SCHEMA_VERSION, settings: { ...defaults.settings, controlScheme: 'joystick' } });
  const chosen = { ...migrated, settings: { ...migrated.settings, controlScheme: 'touch' } };
  expect(migrateSaveData(chosen).settings.controlScheme).toBe('touch');
  expect(migrateSaveData(chosen).wallet.nova).toBe(4321);
});

it('maps all legacy choices to the two visible modes', () => {
  expect(['auto', 'keyboard', 'touch'].map(value => normalizeControlScheme(value as 'auto' | 'keyboard' | 'touch')))
    .toEqual(['touch', 'touch', 'touch']);
  expect(normalizeControlScheme('relative-touch')).toBe('joystick');
  expect(normalizeControlScheme('joystick')).toBe('joystick');
});
