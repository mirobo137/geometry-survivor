import cyanShipUrl from './ships/cyan.webp?no-inline';
import violetShipUrl from './ships/violet.webp?no-inline';
import amberShipUrl from './ships/amber.webp?no-inline';
import emeraldShipUrl from './ships/emerald.webp?no-inline';
import obsidianShipUrl from './ships/obsidian.webp?no-inline';
import novaShipUrl from './ships/nova.webp?no-inline';
import mantaShipUrl from './ships/manta.webp?no-inline';
import spearheadShipUrl from './tethered/tether-ship.webp?no-inline';
import corsairShipUrl from './ships/corsair.webp?no-inline';
import nautilusShipUrl from './ships/nautilus.webp?no-inline';
import asterionShipUrl from './ships/asterion/asterion.webp?no-inline';
import solsticeShipUrl from './ships/solstice/solstice.webp?no-inline';
import basicCannonUrl from './cannons/basic.webp?no-inline';
import curveCannonUrl from './cannons/curve.webp?no-inline';
import smokeCannonUrl from './cannons/smoke.webp?no-inline';
import rainbowCannonUrl from './cannons/rainbow.webp?no-inline';
import latticeCannonUrl from './cannons/lattice.webp?no-inline';
import helixCannonUrl from './cannons/helix.webp?no-inline';
import bloomCannonUrl from './cannons/bloom.webp?no-inline';
import spearheadCannonUrl from './tethered/tether-cannon.webp?no-inline';
import gyreCannonUrl from './cannons/gyre.webp?no-inline';
import razorCannonUrl from './cannons/razor.webp?no-inline';
import type { CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';

export interface ShipRasterArt {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly anchorX: number;
  readonly anchorY: number;
}

export interface CannonRasterArt extends ShipRasterArt {
  /** Cable end sits near the rear socket of the cannon image. */
  readonly cableAnchorY: number;
}

/** One complete 256px sprite per ship; artwork never changes the hitbox. */
export const PLAYER_SHIP_RASTER_ART: Readonly<Record<PlayerSkinId, ShipRasterArt>> = {
  cyan: { url: cyanShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  violet: { url: violetShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  amber: { url: amberShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  emerald: { url: emeraldShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  obsidian: { url: obsidianShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  nova: { url: novaShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  manta: { url: mantaShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  spearhead: { url: spearheadShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  corsair: { url: corsairShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  nautilus: { url: nautilusShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  asterion: { url: asterionShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 },
  solstice: { url: solsticeShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 }
};

/** One interchangeable 128px cannon image; shared combat/locker frame, unchanged muzzle anchor. */
export const CANNON_SKIN_RASTER_ART: Readonly<Record<CannonSkinId, CannonRasterArt>> = {
  basic: { url: basicCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  curve: { url: curveCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  smoke: { url: smokeCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  rainbow: { url: rainbowCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  lattice: { url: latticeCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  helix: { url: helixCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  bloom: { url: bloomCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  spearhead: { url: spearheadCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.84 },
  gyre: { url: gyreCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  razor: { url: razorCannonUrl, width: 30, height: 39, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 }
};

export const LINKED_CANNON_LAYOUT = {
  cablePortX: 11,
  cablePortY: 7,
  cableSegments: 8
} as const;
