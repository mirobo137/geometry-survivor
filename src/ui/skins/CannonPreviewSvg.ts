import { getCannonSkinDefinition } from '../../content/visual/CannonSkinDefinitions';
import type { CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import { CANNON_SKIN_RASTER_ART, LINKED_CANNON_LAYOUT, PLAYER_SHIP_RASTER_ART } from '../../assets/skins/SkinRasterAssets';
import { PROJECTILE_MUZZLE_OFFSETS } from '../../content/weapons/WeaponDefinitions';
import { CANNON_PROJECTILE_SVG, extractSvgGraphicMarkup } from '../../assets/svg/cannons/CannonSvgMarkup';

export interface CannonPreviewOptions {
  readonly animated?: boolean;
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
  skin === 'spearhead' ? 'basic' : skin
);

/** Preview the actual linked PNG modules, with their saved projectile/trail package. */
export const createCannonPreviewSvg = (skin: CannonSkinId, options: CannonPreviewOptions = {}): string => {
  const definition = getCannonSkinDefinition(skin);
  const animated = options.animated !== false;
  const animationClass = animated ? ' is-animated' : ' is-static';
  const accent = toHex(definition.accent);
  const ship = PLAYER_SHIP_RASTER_ART.spearhead;
  const cannon = CANNON_SKIN_RASTER_ART[skin];
  const bullet = extractSvgGraphicMarkup(CANNON_PROJECTILE_SVG[roundTripSkin(skin)]);
  const cable = PROJECTILE_MUZZLE_OFFSETS.map((muzzle, index) => {
    const side = index === 0 ? -1 : 1;
    const rear = muzzle.y + cannon.height * (cannon.cableAnchorY - cannon.anchorY);
    return `<path d="M${side * LINKED_CANNON_LAYOUT.cablePortX} ${LINKED_CANNON_LAYOUT.cablePortY}Q${side * 20} 13 ${muzzle.x} ${rear}" fill="none" stroke="#304451" stroke-width="2.7"/><path d="M${side * LINKED_CANNON_LAYOUT.cablePortX} ${LINKED_CANNON_LAYOUT.cablePortY}Q${side * 20} 13 ${muzzle.x} ${rear}" fill="none" stroke="#75d9eb" stroke-width=".7"/>`;
  }).join('');
  const shots = PROJECTILE_MUZZLE_OFFSETS.map(muzzle => {
    const body = `<g transform="translate(${muzzle.x} -46) rotate(-90)">${bullet}</g>`;
    return animated
      ? `<g class="cannon-preview-shot">${body}</g>`
      : `<g>${body}</g>`;
  }).join('');
  const trails = PROJECTILE_MUZZLE_OFFSETS.map(muzzle => trailMarkup(skin, muzzle.x, accent)).join('');
  const muzzleFlashes = animated
    ? PROJECTILE_MUZZLE_OFFSETS.map(muzzle => `<circle class="cannon-preview-muzzle-flash" cx="${muzzle.x}" cy="-11" r="3.5" fill="${accent}"/>`).join('')
    : '';
  const cannonImages = PROJECTILE_MUZZLE_OFFSETS.map(muzzle => (
    `<image href="${cannon.url}" x="${muzzle.x - cannon.width * cannon.anchorX}" y="${muzzle.y - cannon.height * cannon.anchorY}" width="${cannon.width}" height="${cannon.height}" preserveAspectRatio="none"/>`
  )).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-45 -53 90 97" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista previa de ${definition.name}">
  <g class="cannon-preview-scene${animationClass}">
    <g class="cannon-preview-routes">${trails}</g>
    ${shots}
    <g class="cannon-preview-craft">
      <g class="cannon-preview-cables">${cable}</g>
      <image href="${ship.url}" x="-28" y="-32" width="56" height="64" preserveAspectRatio="none"/>
      ${cannonImages}
      ${muzzleFlashes}
    </g>
  </g>
</svg>`;
};
