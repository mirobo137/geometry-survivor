import {
  CANNON_SKIN_RASTER_ART,
  LINKED_CANNON_LAYOUT,
  PLAYER_SHIP_RASTER_ART
} from '../SkinRasterAssets';

/** Canonical Ivory Spear art and shared cable layout, retained for old QA links. */
export const TETHERED_SHIP_ART = {
  ship: PLAYER_SHIP_RASTER_ART.spearhead,
  cannon: CANNON_SKIN_RASTER_ART.spearhead,
  ...LINKED_CANNON_LAYOUT
} as const;
