import type { PlayerSkinId } from './VisualTokens';

/** Nozzles measured in the existing 56x64 intact PNG frame, nose facing up. */
export const PLAYER_ENGINE_PORTS: Readonly<Record<PlayerSkinId, readonly (readonly [number, number])[]>> = {
  spearhead: [[0, 23]],
  cyan: [[0, 20]],
  violet: [[0, 26]],
  amber: [[-3.3, 27], [3.3, 27]],
  emerald: [[0, 25]],
  obsidian: [[0, 24]],
  nova: [[-6.5, 28], [0, 19], [6.5, 28]],
  manta: [[0, 20]],
  corsair: [[-10, 28], [10, 28]],
  nautilus: [[-3, 28], [3, 28]],
  asterion: [[-8, 27], [0, 21], [8, 27]],
  solstice: [[-7.8, 24], [0, 28], [7.8, 24]]
};

export const PLAYER_ENGINE_FALLBACK_PORTS = [[-5, 13], [5, 13]] as const;
export const PLAYER_ENGINE_MAX_PORTS = 3;
