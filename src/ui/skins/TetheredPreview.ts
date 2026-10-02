import {
  CANNON_SKIN_RASTER_ART,
  LINKED_CANNON_LAYOUT,
  PLAYER_SHIP_RASTER_ART
} from '../../assets/skins/SkinRasterAssets';
import type { CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import { getCannonSkinDefinition } from '../../content/visual/CannonSkinDefinitions';
import { getPlayerSkinDefinition } from '../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import { PROJECTILE_MUZZLE_OFFSETS } from '../../content/weapons/WeaponDefinitions';
import './tethered.css';

/** Same PNG sources, frame geometry and pivots as the playable player view. */
export const createTetheredPreview = (
  animated: boolean,
  shipSkin: PlayerSkinId = 'spearhead',
  cannonSkin: CannonSkinId = 'spearhead'
): string => {
  const ship = PLAYER_SHIP_RASTER_ART[shipSkin];
  const cannon = CANNON_SKIN_RASTER_ART[cannonSkin];
  const cablePaths = PROJECTILE_MUZZLE_OFFSETS.map((muzzle, index) => {
    const side = index === 0 ? -1 : 1;
    const rear = muzzle.y + cannon.height * (cannon.cableAnchorY - cannon.anchorY);
    return `<path d="M${side * LINKED_CANNON_LAYOUT.cablePortX} ${LINKED_CANNON_LAYOUT.cablePortY}Q${side * 20} 13 ${muzzle.x} ${rear}" fill="none" stroke="#304451" stroke-width="2.7"/><path d="M${side * LINKED_CANNON_LAYOUT.cablePortX} ${LINKED_CANNON_LAYOUT.cablePortY}Q${side * 20} 13 ${muzzle.x} ${rear}" fill="none" stroke="#75d9eb" stroke-width=".7"/>`;
  }).join('');
  const accessibleName = `Vista previa de ${getPlayerSkinDefinition(shipSkin).name} con ${getCannonSkinDefinition(cannonSkin).name}`;

  return `<span class="player-skin-preview tethered-preview ${animated ? 'is-animated' : 'is-static'}" role="img" aria-label="${accessibleName}">
    <span class="tethered-preview-craft">
      <svg viewBox="-45 -40 90 80" aria-hidden="true" focusable="false">${cablePaths}</svg>
      <img class="tethered-preview-ship" src="${ship.url}" alt="" width="256" height="256" loading="lazy" decoding="async" draggable="false"/>
      <img class="tethered-preview-gun is-left" src="${cannon.url}" alt="" width="128" height="128" loading="lazy" decoding="async" draggable="false"/>
      <img class="tethered-preview-gun is-right" src="${cannon.url}" alt="" width="128" height="128" loading="lazy" decoding="async" draggable="false"/>
    </span>
  </span>`;
};
