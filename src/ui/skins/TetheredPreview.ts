import { TETHERED_SHIP_ART as ART } from '../../assets/skins/tethered/TetheredAssets';
import './tethered.css';

/** Same ship/cannon sources and logical geometry as the playable skin. */
export const createTetheredPreview = (animated: boolean): string => `
  <span class="player-skin-preview tethered-preview ${animated ? 'is-animated' : 'is-static'}" role="img" aria-label="Vista previa de Ivory Spear">
    <span class="tethered-preview-craft">
      <svg viewBox="-48 -48 96 96" aria-hidden="true" focusable="false">
        <path d="M-11 7Q-21 14-27 8.76M11 7Q21 14 27 8.76" fill="none" stroke="#304451" stroke-width="2.7"/>
        <path d="M-11 7Q-21 14-27 8.76M11 7Q21 14 27 8.76" fill="none" stroke="#75d9eb" stroke-width=".7"/>
      </svg>
      <img class="tethered-preview-ship" src="${ART.ship.url}" alt="" width="256" height="256" loading="lazy" decoding="async"/>
      <img class="tethered-preview-gun is-left" src="${ART.cannon.url}" alt="" width="128" height="128" loading="lazy" decoding="async"/>
      <img class="tethered-preview-gun is-right" src="${ART.cannon.url}" alt="" width="128" height="128" loading="lazy" decoding="async"/>
    </span>
  </span>`;
