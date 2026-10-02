import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import { createTetheredPreview } from './TetheredPreview';

export interface PlayerSkinPreviewOptions {
  readonly animated?: boolean;
}

/** Locker preview isolates the complete PNG ship used in combat. */
export const createPlayerSkinPreviewSvg = (skin: PlayerSkinId, options: PlayerSkinPreviewOptions = {}): string => (
  createTetheredPreview(options.animated === true, skin)
);
