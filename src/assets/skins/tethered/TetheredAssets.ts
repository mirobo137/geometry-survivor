import shipUrl from './tether-ship.png';
import cannonUrl from './tether-cannon.png';

/** Opt-in art trial, not a new cosmetic ID or a migration of saved loadouts. */
export const TETHERED_SHIP_ART = {
  ship: { url: shipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  cannon: { url: cannonUrl, width: 20, height: 26, anchorX: 0.5, anchorY: 0.08 },
  cablePortX: 11,
  cablePortY: 7,
  cableSegments: 8
} as const;
