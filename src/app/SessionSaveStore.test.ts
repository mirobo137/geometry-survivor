import { describe, expect, it } from 'vitest';
import { createDefaultSaveData, type SaveStore } from '../platform/save/SaveStore';
import { createSessionSaveStore } from './SessionSaveStore';

describe('createSessionSaveStore', () => {
  it('keeps diagnostic changes in memory and leaves the real profile untouched', () => {
    let persisted = createDefaultSaveData();
    const source: SaveStore = {
      load: () => structuredClone(persisted),
      save: data => { persisted = structuredClone(data); return true; },
      clear: () => { persisted = createDefaultSaveData(); }
    };
    const session = createSessionSaveStore(source);

    session.save({ ...session.load(), wallet: { nova: 500 } });

    expect(session.load().wallet.nova).toBe(500);
    expect(source.load().wallet.nova).toBe(0);
    session.clear();
    expect(session.load().wallet.nova).toBe(0);
  });
});
