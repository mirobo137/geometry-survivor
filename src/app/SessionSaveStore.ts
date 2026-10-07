import type { SaveStore } from '../platform/save/SaveStore';

/** A diagnostic copy of a save: reads the current profile, but keeps every write in memory. */
export const createSessionSaveStore = (source: SaveStore): SaveStore => {
  const initial = source.load();
  let current = structuredClone(initial);
  return {
    load: () => structuredClone(current),
    save: data => { current = structuredClone(data); return true; },
    saveDurably: data => { current = structuredClone(data); return true; },
    clear: () => { current = structuredClone(initial); }
  };
};
