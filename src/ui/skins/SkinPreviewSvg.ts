import { getPlayerSkinDefinition } from '../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import { PLAYER_HULL_SVG, tintPlayerSvgMarkup } from '../../assets/svg/characters/player/PlayerHullSvg';
import { createPlayerSkinSignatureSvg } from '../../assets/svg/characters/player/SkinSignatureSvg';

export interface PlayerSkinPreviewOptions {
  readonly animated?: boolean;
}

/** Same source pieces and multiplicative palette as Pixi; cannon loadout is independent. */
export const createPlayerSkinPreviewSvg = (skin: PlayerSkinId, options: PlayerSkinPreviewOptions = {}): string => {
  const definition = getPlayerSkinDefinition(skin);
  const colors = definition.palette;
  const hull = PLAYER_HULL_SVG[skin];
  const animated = options.animated === true;
  const spin = animated ? '<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="32s" repeatCount="indefinite"/>' : '';
  const breathe = animated ? '<animateTransform attributeName="transform" type="scale" values="1;1.012;1" dur="3s" repeatCount="indefinite"/>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="player-skin-preview ${animated ? 'is-animated' : 'is-static'}" viewBox="-52 -52 104 104" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista previa de ${definition.name}">
    <g transform="scale(1.35)">
      <g class="skin-art-signature">${tintPlayerSvgMarkup(createPlayerSkinSignatureSvg(skin), colors.outer)}${spin}</g>
      <g class="skin-art-ring">${tintPlayerSvgMarkup(hull.ring, colors.outer)}</g>
      <g class="skin-art-hull">${tintPlayerSvgMarkup(hull.body, colors.body)}${breathe}</g>
      <g class="skin-art-core">${tintPlayerSvgMarkup(hull.core, colors.core)}</g>
    </g>
  </svg>`;
};
