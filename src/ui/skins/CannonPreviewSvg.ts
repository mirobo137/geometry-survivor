import { getCannonSkinDefinition } from '../../content/visual/CannonSkinDefinitions';
import type { CannonSkinId } from '../../content/visual/CannonSkinDefinitions';

export interface CannonPreviewOptions {
  readonly animated?: boolean;
}

const shotMotion = (skin: CannonSkinId, animated: boolean): string => {
  if (!animated) return '';
  const values = skin === 'curve'
    ? '28 0;98 -16;168 8;228 0'
    : '28 0;100 0;172 0;232 0';
  return `<animateTransform attributeName="transform" type="translate" values="${values}" dur="1.25s" repeatCount="indefinite" begin="-0.08s"/>`;
};

const cannonMarkup = (skin: CannonSkinId): string => ({
  basic: `<path d="M-8-4-29-14l4 14-4 14 21-10zM8-4 29-14l-4 14 4 14L8 4z" fill="#75e6ff" stroke="#e5fbff" stroke-width="1.6" stroke-linejoin="round"/><path d="M-12-3-25-9l3 9-3 9 13-6zM12-3 25-9l-3 9 3 9-13-6z" fill="#b8ffd9"/>`,
  curve: `<path d="M-8-8-30-18l8 18-8 18 22-10 6-8zM8-8 30-18l-8 18 8 18-22-10-6-8z" fill="#8e6bce" stroke="#f5eaff" stroke-width="1.5" stroke-linejoin="round"/><path d="M-12-5-25-12l6 12-6 12 13-7 4-5zM12-5 25-12l-6 12 6 12-13-7-4-5z" fill="#d2a8ff"/>`,
  smoke: `<path d="M-8-7h-17l-7 7 7 7h17l5-7zM8-7h17l7 7-7 7H8L3 0z" fill="#d47b42" stroke="#fff0c5" stroke-width="1.6"/><path d="M-12-4h-12l-3 4 3 4h12zM12-4h12l3 4-3 4H12z" fill="#ffb86b"/><circle cx="-18" r="5" fill="none" stroke="#fff0c5" stroke-width="1.4"/><circle cx="18" r="5" fill="none" stroke="#fff0c5" stroke-width="1.4"/>`,
  rainbow: `<path d="M-8-8-30-14l6 14-6 14 22-6 6-8zM8-8 30-14l-6 14 6 14-22-6-6-8z" fill="#65f2c2" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M-12-6-25-10l4 10-4 10 13-4 4-6zM12-6 25-10l-4 10 4 10-13-4-4-6z" fill="#ff668f"/><path d="M-11-3-21-6l3 6-3 6 10-3 3-3zM11-3 21-6l-3 6 3 6-10-3-3-3z" fill="#ffe39a"/>`
}[skin]);

const bulletMarkup = (skin: CannonSkinId): string => ({
  basic: `<path d="M-9 0-3-5 10 0l-3 5z" fill="#fff6a8" stroke="#fff" stroke-width="1.4"/><circle cx="2" r="2.2" fill="#fff"/>`,
  curve: `<path d="M-10 0q6-8 17 0Q-4 8-10 0z" fill="#d2a8ff" stroke="#fff4ff" stroke-width="1.2"/><path d="M-1-3 9 0-1 3z" fill="#ffb8df"/>`,
  smoke: `<path d="M-10-5H2l7 5-7 5h-12l-4-5z" fill="#ffb86b" stroke="#fff0c5" stroke-width="1.3"/><circle cx="2" r="2.2" fill="#fff7d6"/>`,
  rainbow: `<path d="M-10 0-4-6 10 0 4 6z" fill="#65f2c2" stroke="#fff" stroke-width="1.2"/><path d="M-4-6 1-2-1 2-7 0z" fill="#ff668f"/><path d="M1-2 10 0 4 6-1 2z" fill="#ffe39a"/>`
}[skin]);

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
  const smokeAnimation = animated
    ? '<animate attributeName="opacity" values=".15;.72;.08" dur="1.25s" repeatCount="indefinite"/>'
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-62 -58 286 116" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista previa de ${definition.name}">
  <g class="cannon-preview-scene${animationClass}">
    <ellipse cx="0" cy="20" rx="35" ry="13" fill="#020611" opacity=".6"/>
    <g class="cannon-preview-route">${trailMarkup(skin)}</g>
    <g class="cannon-preview-route cannon-preview-route-reverse" transform="scale(-1 1)">${trailMarkup(skin)}</g>
    <g class="cannon-preview-shot cannon-preview-shot-right"><g transform="translate(28 0)">${bulletMarkup(skin)}${shotMotion(skin, animated)}</g></g>
    <g class="cannon-preview-shot cannon-preview-shot-left" transform="scale(-1 1)"><g transform="translate(28 0)">${bulletMarkup(skin)}${shotMotion(skin, animated)}</g></g>
    <g class="cannon-preview-ship">
      <path d="M0-29 25-15 25 15 0 29-25 15-25-15z" fill="#182844" stroke="#b9d7ff" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M0-21 15-12 15 12 0 21-15 12-15-12z" fill="none" stroke="#50739e" stroke-width="1.5"/>
      ${cannonMarkup(skin)}
      <circle cx="0" cy="0" r="10" fill="#75e6ff" stroke="#f4ffff" stroke-width="1.8"/>
      <path d="M0-6V6M-6 0H6" stroke="#10213c" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="2.4" fill="#fff"/>
      ${animated ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0;0 2;0 0" dur="2.8s" repeatCount="indefinite"/>' : ''}
    </g>
    ${animated && skin === 'smoke' ? `<g class="cannon-preview-smoke-pulse" fill="#b56b53" opacity=".2"><circle cx="72" cy="-2" r="5">${smokeAnimation}</circle><circle cx="130" cy="4" r="3">${smokeAnimation}</circle></g>` : ''}
  </g>
</svg>`;
};
