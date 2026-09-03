import { getCannonSkinDefinition } from '../../content/visual/CannonSkinDefinitions';
import type { CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import {
  CANNON_BARREL_SVG,
  CANNON_PROJECTILE_SVG,
  extractSvgGraphicMarkup
} from '../../assets/svg/cannons/CannonSvgMarkup';

export interface CannonPreviewOptions {
  readonly animated?: boolean;
}

const toHex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`;

const shotMotion = (skin: CannonSkinId, animated: boolean): string => {
  if (!animated) return '';
  const values = skin === 'curve'
    ? '28 0;98 -16;168 8;228 0'
    : '28 0;100 0;172 0;232 0';
  return `<animateTransform attributeName="transform" type="translate" values="${values}" dur="1.25s" repeatCount="indefinite" begin="-0.08s"/>`;
};

const barrelRecoil = (side: 'left' | 'right', animated: boolean): string => {
  if (!animated) return '';
  const values = side === 'left' ? '0 0;3 1.4;0 0' : '0 0;-3 1.4;0 0';
  return `<animateTransform attributeName="transform" type="translate" values="${values}" dur="1.25s" repeatCount="indefinite"/>`;
};

const muzzleFlash = (x: number, color: string, animated: boolean): string => {
  if (!animated) return '';
  return `<circle class="cannon-preview-muzzle-flash" cx="${x}" cy="-11" r="5" fill="${color}" opacity="0">
    <animate attributeName="opacity" values="0;.9;0" dur="1.25s" repeatCount="indefinite"/>
    <animate attributeName="r" values="2.2;7.5;2.2" dur="1.25s" repeatCount="indefinite"/>
  </circle>`;
};

const trailMarkup = (skin: CannonSkinId): string => {
  if (skin === 'curve') return `<path class="cannon-preview-trail cannon-preview-trail-curve" d="M30 0Q98-28 190 0" fill="none" stroke="#d2a8ff" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 7"/>`;
  if (skin === 'smoke') return `<path class="cannon-preview-trail" d="M30 0H190" fill="none" stroke="#ffb86b" stroke-width="2.4" stroke-linecap="round"/><g class="cannon-preview-smoke" fill="#b56b53"><circle cx="66" cy="4" r="6"/><circle cx="103" cy="-3" r="4.5"/><circle cx="140" cy="4" r="3.3"/></g>`;
  if (skin === 'rainbow') return `<path class="cannon-preview-trail" d="M30-5H190M30-2H190M30 2H190M30 5H190" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="7 4"/><path d="M30-5H190" stroke="#ff668f" stroke-width="1.6"/><path d="M30-2H190" stroke="#ffb86b" stroke-width="1.6"/><path d="M30 2H190" stroke="#65f2c2" stroke-width="1.6"/><path d="M30 5H190" stroke="#75e6ff" stroke-width="1.6"/>`;
  return `<path class="cannon-preview-trail" d="M30 0H190" fill="none" stroke="#fff6a8" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="5 7"/>`;
};

/** Code-first DOM preview for a complete cannon/projectile/trail package. */
export const createCannonPreviewSvg = (skin: CannonSkinId, options: CannonPreviewOptions = {}): string => {
  const definition = getCannonSkinDefinition(skin);
  const animated = options.animated !== false;
  const animationClass = animated ? ' is-animated' : ' is-static';
  const accent = toHex(definition.accent);
  const barrels = CANNON_BARREL_SVG[skin];
  const bullet = extractSvgGraphicMarkup(CANNON_PROJECTILE_SVG[skin]);
  const smokeAnimation = animated
    ? '<animate attributeName="opacity" values=".15;.72;.08" dur="1.25s" repeatCount="indefinite"/>'
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-62 -58 286 116" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista previa de ${definition.name}">
  <g class="cannon-preview-scene${animationClass}">
    <ellipse cx="0" cy="20" rx="35" ry="13" fill="#020611" opacity=".6"/>
    <g class="cannon-preview-route">${trailMarkup(skin)}</g>
    <g class="cannon-preview-route cannon-preview-route-reverse" transform="scale(-1 1)">${trailMarkup(skin)}</g>
    <g class="cannon-preview-shot cannon-preview-shot-right"><g transform="translate(28 0)">${bullet}${shotMotion(skin, animated)}</g></g>
    <g class="cannon-preview-shot cannon-preview-shot-left" transform="scale(-1 1)"><g transform="translate(28 0)">${bullet}${shotMotion(skin, animated)}</g></g>
    <g class="cannon-preview-ship">
      <g class="cannon-preview-barrel cannon-preview-barrel-left">${extractSvgGraphicMarkup(barrels.left)}${barrelRecoil('left', animated)}${muzzleFlash(-27, accent, animated)}</g>
      <g class="cannon-preview-barrel cannon-preview-barrel-right">${extractSvgGraphicMarkup(barrels.right)}${barrelRecoil('right', animated)}${muzzleFlash(27, accent, animated)}</g>
      <path d="M0-29 25-15 25 15 0 29-25 15-25-15z" fill="#182844" stroke="#b9d7ff" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M0-21 15-12 15 12 0 21-15 12-15-12z" fill="none" stroke="#50739e" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="10" fill="#75e6ff" stroke="#f4ffff" stroke-width="1.8"/>
      <path d="M0-6V6M-6 0H6" stroke="#10213c" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="2.4" fill="#fff"/>
      ${animated ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0;0 2;0 0" dur="2.8s" repeatCount="indefinite"/>' : ''}
    </g>
    ${animated && skin === 'smoke' ? `<g class="cannon-preview-smoke-pulse" fill="#b56b53" opacity=".2"><circle cx="72" cy="-2" r="5">${smokeAnimation}</circle><circle cx="130" cy="4" r="3">${smokeAnimation}</circle></g>` : ''}
  </g>
</svg>`;
};
