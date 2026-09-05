import { getPlayerSkinDefinition } from '../../../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../../../content/visual/VisualTokens';

/**
 * Distinctive silhouette accents shared by the locker preview and the Pixi
 * player. They are rasterized once per skin, never rebuilt during a run.
 */
export const createPlayerSkinSignatureSvg = (skin: PlayerSkinId): string => {
  const signature = getPlayerSkinDefinition(skin).signature;
  const markup = {
    aurora: `
      <g id="player-signature-aurora" class="skin-art-orbit" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
        <path d="M0-31 5-25 0-22-5-25z" stroke-width="1.8"/>
        <path d="M0 31 5 25 0 22-5 25z" stroke-width="1.8"/>
        <path d="M-31 0-25-5-22 0-25 5zM31 0 25-5 22 0 25 5z" stroke-width="1.8"/>
        <path d="M-21-21 0-27 21-21 27 0 21 21 0 27-21 21-27 0z" stroke-width="1.1" stroke-dasharray="3 4" opacity=".8"/>
      </g>`,
    prism: `
      <g id="player-signature-prism" class="skin-art-shards" fill="#ffffff" stroke="#ffffff" stroke-linejoin="round">
        <path d="M0-34 7-24 0-20-7-24z" stroke-width="1.4"/>
        <path d="M0 34 7 24 0 20-7 24z" stroke-width="1.4"/>
        <path d="M-34 0-24-7-20 0-24 7zM34 0 24-7 20 0 24 7z" stroke-width="1.4"/>
        <path d="M-24-24-12-22-18-12zM24-24 12-22 18-12zM-24 24-12 22-18 12zM24 24 12 22 18 12z" stroke-width="1" opacity=".82"/>
      </g>`,
    solar: `
      <g id="player-signature-solar" class="skin-art-crown" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
        <path d="M0-35 6-24 0-20-6-24zM0 35 6 24 0 20-6 24z" fill="#ffffff" stroke-width="1.5"/>
        <path d="M-35 0-24-6-20 0-24 6zM35 0 24-6 20 0 24 6z" fill="#ffffff" stroke-width="1.5"/>
        <path d="M-27-11-34-16M27-11 34-16M-27 11-34 16M27 11 34 16" stroke-width="2.5"/>
        <path d="M-17-17 0-23 17-17 23 0 17 17 0 23-17 17-23 0z" stroke-width="1.3" opacity=".82"/>
      </g>`,
    verdant: `
      <g id="player-signature-verdant" class="skin-art-blades" fill="#ffffff" stroke="#ffffff" stroke-linejoin="round">
        <path d="M0-36 8-23 0-17-8-23zM0 36 8 23 0 17-8 23z" stroke-width="1.2"/>
        <path d="M-36 0-23-8-17 0-23 8zM36 0 23-8 17 0 23 8z" stroke-width="1.2"/>
        <path d="M-26-26-13-20-20-13zM26-26 13-20 20-13zM-26 26-13 20-20 13zM26 26 13 20 20 13z" stroke-width="1.2" opacity=".88"/>
        <path d="M0-30 4-18M30 0 18 4M0 30-4 18M-30 0-18-4" fill="none" stroke-width="1.6" opacity=".8"/>
      </g>`,
    quasar: `
      <g id="player-signature-quasar" class="skin-art-quasar" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
        <path d="M0-36 6-26 0-21-6-26zM0 36 6 26 0 21-6 26zM-36 0-26-6-21 0-26 6zM36 0 26-6 21 0 26 6z" fill="#ffffff" stroke-width="1.4"/>
        <path d="M-27-16 0-29 27-16 29 0 16 27 0 29-16 27-29 0z" stroke-width="1.3" stroke-dasharray="5 6" opacity=".84"/>
        <path d="M-17-7A18 18 0 0 1 17-7M17 7A18 18 0 0 1-17 7" stroke-width="1.8" opacity=".9"/>
      </g>`
  }[signature];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="player-signature-title player-signature-desc">
  <title id="player-signature-title">Firma visual de ${getPlayerSkinDefinition(skin).name}</title>
  <desc id="player-signature-desc">Piezas geométricas animables que diferencian esta skin.</desc><g transform="scale(0.82)">${markup}</g>
</svg>`;
};
