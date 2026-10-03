import { PLAYER_SHIP_RASTER_ART } from '../../assets/skins/SkinRasterAssets';
import { getPlayerSkinDefinition } from '../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import './tethered.css';

/** Ship-only locker preview; its logical aspect ratio matches the combat sprite. */
export const createTetheredPreview = (
  animated: boolean,
  shipSkin: PlayerSkinId = 'spearhead'
): string => {
  const ship = PLAYER_SHIP_RASTER_ART[shipSkin];
  const accessibleName = `Vista previa de ${getPlayerSkinDefinition(shipSkin).name}`;

  return `<span class="player-skin-preview tethered-preview ${animated ? 'is-animated' : 'is-static'}" role="img" aria-label="${accessibleName}">
    <span class="tethered-preview-craft">
      <img class="tethered-preview-ship" src="${ship.url}" style="--ship-preview-aspect: ${ship.width} / ${ship.height}" alt="" width="256" height="256" loading="${animated ? 'eager' : 'lazy'}" decoding="async" draggable="false"/>
    </span>
  </span>`;
};
