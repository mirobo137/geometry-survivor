import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import { createTetheredPreview } from './TetheredPreview';

export interface PlayerSkinPreviewOptions {
  readonly animated?: boolean;
}

/** Locker preview uses the same complete PNG ship and linked cannon modules as combat. */
export const createPlayerSkinPreviewSvg = (skin: PlayerSkinId, options: PlayerSkinPreviewOptions = {}): string => (
  createTetheredPreview(options.animated === true, skin)
);
