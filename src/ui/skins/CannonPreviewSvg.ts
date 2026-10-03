import { getCannonSkinDefinition } from '../../content/visual/CannonSkinDefinitions';
import type { CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import { CANNON_SKIN_RASTER_ART } from '../../assets/skins/SkinRasterAssets';
import { PROJECTILE_ART_URLS, PROJECTILE_HEAD_SIZE, PROJECTILE_SKIN_ART } from '../../assets/fx/projectiles/ProjectileRasterAssets';
import { PROJECTILE_MUZZLE_OFFSETS } from '../../content/weapons/WeaponDefinitions';
import { CANNON_PROJECTILE_SVG, extractSvgGraphicMarkup, getCannonFallbackId } from '../../assets/svg/cannons/CannonSvgMarkup';

export interface CannonPreviewOptions {
  readonly animated?: boolean;
  readonly layout?: 'thumbnail' | 'modal';
}

const toHex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`;

const trailMarkup = (skin: CannonSkinId, x: number, accent: string): string => {
  if (skin === 'curve') return `<path class="cannon-preview-trail" d="M${x} -16C${x - 6} -25 ${x + 7} -34 ${x + 2} -48" fill="none" stroke="${accent}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 4"/>`;
  if (skin === 'helix') return `<path class="cannon-preview-trail cannon-preview-trail-helix" d="M${x} -16C${x + 7} -23 ${x - 7} -27 ${x} -33S${x + 7} -42 ${x} -49" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 4"/><path d="M${x - 3} -29H${x + 3}M${x - 3} -41H${x + 3}" stroke="#ffd978" stroke-width="1.2"/>`;
  if (skin === 'smoke') return `<path class="cannon-preview-trail" d="M${x} -16V-46" fill="none" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/><g class="cannon-preview-smoke" fill="#b56b53"><circle cx="${x + 3}" cy="-24" r="2.5"/><circle cx="${x - 2}" cy="-33" r="2"/><circle cx="${x + 1}" cy="-42" r="1.4"/></g>`;
  if (skin === 'rainbow') return `<g class="cannon-preview-rainbow" fill="none" stroke-width="1.15" stroke-linecap="round" stroke-dasharray="3 3"><path d="M${x - 3} -16V-47" stroke="#ff668f"/><path d="M${x - 1} -16V-47" stroke="#ffb86b"/><path d="M${x + 1} -16V-47" stroke="#65f2c2"/><path d="M${x + 3} -16V-47" stroke="#75e6ff"/></g>`;
  if (skin === 'lattice') return `<path class="cannon-preview-trail" d="M${x} -16V-47" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"/><path d="M${x} -25l3 3-3 3-3-3zM${x} -38l3 3-3 3-3-3z" fill="none" stroke="#d3e8ff" stroke-width=".8"/>`;
  if (skin === 'bloom') return `<path class="cannon-preview-trail" d="M${x} -16V-47" fill="none" stroke="#9fffe8" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 4"/><path d="M${x} -24c-4-4-6-1-3 2s5 2 3-2M${x} -35c4-4 6-1 3 2s-5 2-3-2M${x} -44c-3-3-5-1-3 2s5 1 3-2" fill="none" stroke="#ff8fd8" stroke-width="1.2" stroke-linecap="round"/>`;
  return `<path class="cannon-preview-trail" d="M${x} -16V-47" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 4"/>`;
};

const roundTripSkin = (skin: CannonSkinId): keyof typeof CANNON_PROJECTILE_SVG => (
  getCannonFallbackId(skin)
);

/** Isolated cannon PNG modules with their projectile/trail package; no hull or cables. */
export const createCannonPreviewSvg = (skin: CannonSkinId, options: CannonPreviewOptions = {}): string => {
  const definition = getCannonSkinDefinition(skin);
  const animated = options.animated !== false;
  const animationClass = animated ? ' is-animated' : ' is-static';
  const accent = toHex(definition.accent);
  const cannon = CANNON_SKIN_RASTER_ART[skin];
  const material = PROJECTILE_SKIN_ART[skin];
  const bullet = extractSvgGraphicMarkup(CANNON_PROJECTILE_SVG[roundTripSkin(skin)]);
  // Cards use one horizontal sample; the modal retains the paired firing package.
  const thumbnail = options.layout === 'thumbnail';
  const muzzles = thumbnail ? [{ x: 0, y: -11 }] : PROJECTILE_MUZZLE_OFFSETS;
  const shots = muzzles.map(muzzle => {
    const body = `<g class="cannon-preview-projectile" transform="translate(${muzzle.x} -46) rotate(-90)"><image class="cannon-preview-head-art" href="${PROJECTILE_ART_URLS[material.headId]}" x="${-PROJECTILE_HEAD_SIZE.width / 2}" y="${-PROJECTILE_HEAD_SIZE.height / 2}" width="${PROJECTILE_HEAD_SIZE.width}" height="${PROJECTILE_HEAD_SIZE.height}" preserveAspectRatio="none"/><g class="cannon-preview-fallback">${bullet}</g></g>`;
    return animated
      ? `<g class="cannon-preview-shot"><g class="cannon-preview-weave">${body}</g></g>`
      : `<g>${body}</g>`;
  }).join('');
  const trails = muzzles.map(muzzle => `<g class="cannon-preview-trail-material"><image class="cannon-preview-trail-art cannon-preview-trail" href="${PROJECTILE_ART_URLS[material.trailId]}" x="-15.5" y="-6" width="31" height="12" transform="translate(${muzzle.x} -31.5) rotate(-90)" preserveAspectRatio="none"/><g class="cannon-preview-fallback">${trailMarkup(skin, muzzle.x, accent)}</g></g>`).join('');
  const muzzleFlashes = animated
    ? muzzles.map(muzzle => `<circle class="cannon-preview-muzzle-flash" cx="${muzzle.x}" cy="-11" r="3.5" fill="${accent}"/>`).join('')
    : '';
  const cannonImages = muzzles.map(muzzle => (
    `<image class="cannon-preview-module" href="${cannon.url}" x="${muzzle.x - cannon.width * cannon.anchorX}" y="${muzzle.y - cannon.height * cannon.anchorY}" width="${cannon.width}" height="${cannon.height}" preserveAspectRatio="none"/>`
  )).join('');

  const viewBox = thumbnail ? '-28 -22 98 44' : '-45 -68 90 100';
  return `<svg xmlns="http://www.w3.org/2000/svg" data-cannon="${skin}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista previa de ${definition.name}">
  <g${thumbnail ? ' transform="rotate(90)"' : ''}>
  <g class="cannon-preview-scene${animationClass}">
    <g class="cannon-preview-routes">${trails}</g>
    ${shots}
    <g class="cannon-preview-craft">
      ${cannonImages}
      ${muzzleFlashes}
    </g>
  </g>
  </g>
</svg>`;
};
