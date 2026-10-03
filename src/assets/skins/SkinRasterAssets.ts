import cyanShipUrl from './ships/cyan.png';
import violetShipUrl from './ships/violet.png';
import amberShipUrl from './ships/amber.png';
import emeraldShipUrl from './ships/emerald.png';
import obsidianShipUrl from './ships/obsidian.png';
import novaShipUrl from './ships/nova.png';
import mantaShipUrl from './ships/manta.png';
import spearheadShipUrl from './tethered/tether-ship.png';
import basicCannonUrl from './cannons/basic.png';
import curveCannonUrl from './cannons/curve.png';
import smokeCannonUrl from './cannons/smoke.png';
import rainbowCannonUrl from './cannons/rainbow.png';
import latticeCannonUrl from './cannons/lattice.png';
import helixCannonUrl from './cannons/helix.png';
import bloomCannonUrl from './cannons/bloom.png';
import spearheadCannonUrl from './tethered/tether-cannon.png';
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
  spearhead: { url: spearheadShipUrl, width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 }
};

/** One interchangeable 128px cannon image; +20% visual size, unchanged muzzle anchor. */
export const CANNON_SKIN_RASTER_ART: Readonly<Record<CannonSkinId, CannonRasterArt>> = {
  basic: { url: basicCannonUrl, width: 24, height: 31.2, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  curve: { url: curveCannonUrl, width: 24, height: 31.2, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  smoke: { url: smokeCannonUrl, width: 24, height: 31.2, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  rainbow: { url: rainbowCannonUrl, width: 24, height: 31.2, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  lattice: { url: latticeCannonUrl, width: 24, height: 31.2, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  helix: { url: helixCannonUrl, width: 24, height: 31.2, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  bloom: { url: bloomCannonUrl, width: 24, height: 31.2, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.9 },
  spearhead: { url: spearheadCannonUrl, width: 24, height: 31.2, anchorX: 0.5, anchorY: 0.08, cableAnchorY: 0.84 }
};

export const LINKED_CANNON_LAYOUT = {
  cablePortX: 11,
  cablePortY: 7,
  cableSegments: 8
} as const;
