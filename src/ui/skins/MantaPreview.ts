import { MANTA_WING } from '../../assets/skins/manta/MantaAssets';
import { PLAYER_HULL_SVG, tintPlayerSvgMarkup } from '../../assets/svg/characters/player/PlayerHullSvg';
import { createPlayerSkinSignatureSvg } from '../../assets/svg/characters/player/SkinSignatureSvg';
import { PLAYER_SKINS } from '../../content/visual/VisualTokens';
import './manta.css';

/** PNGs remain HTML siblings, never embedded in the SVG masters. */
export const createMantaPreview = (animated: boolean): string => {
  const colors = PLAYER_SKINS.manta;
  const scale = 1.35 / 104 * 100;
  const wing = MANTA_WING;
  const fins = [-1, 1].map(side => `<span class="manta-fin" style="left:${50 + side * wing.rootX * scale}%;width:${wing.width * scale}%;height:${wing.height * scale}%;transform:scaleX(${-side})"><span class="manta-fin-motion"><img src="${wing.url}" alt="" width="256" height="256" loading="lazy" decoding="async" style="transform:translate(${-wing.anchorX * 100}%,${-wing.anchorY * 100}%)"/></span></span>`).join('');
  return `<span class="player-skin-preview manta-preview ${animated ? 'is-animated' : 'is-static'}" role="img" aria-label="Vista previa de Manta Veil" style="--manta-cycle:${wing.cycleSeconds}s;--manta-flex:${wing.amplitude}rad">
    ${fins}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 -52 104 104" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g transform="scale(1.35)">
      <g class="skin-art-signature">${tintPlayerSvgMarkup(createPlayerSkinSignatureSvg('manta'), colors.outer)}</g>
      <g class="skin-art-hull">${tintPlayerSvgMarkup(PLAYER_HULL_SVG.manta.body, colors.body)}</g>
      <g class="skin-art-core">${tintPlayerSvgMarkup(PLAYER_HULL_SVG.manta.core, colors.core)}</g>
    </g></svg>
  </span>`;
};
