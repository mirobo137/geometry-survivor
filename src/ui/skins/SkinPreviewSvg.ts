import { getPlayerSkinDefinition } from '../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';

const toHex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`;

/** Small code-first preview; the runtime player still uses its cached SVG pieces. */
export const createPlayerSkinPreviewSvg = (skin: PlayerSkinId): string => {
  const colors = getPlayerSkinDefinition(skin).palette;
  const shadow = toHex(colors.shadow);
  const outer = toHex(colors.outer);
  const body = toHex(colors.body);
  const detail = toHex(colors.bodyDetail);
  const core = toHex(colors.core);
  const weapon = toHex(colors.weapon);
  const accent = toHex(colors.accent);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100" role="img" aria-label="Vista previa de ${getPlayerSkinDefinition(skin).name}">
  <ellipse cx="0" cy="12" rx="36" ry="23" fill="${shadow}" opacity=".5"/>
  <circle cx="0" cy="0" r="37" fill="none" stroke="${outer}" stroke-width="2.6" opacity=".55"/>
  <path d="M0-45v9M0 36v9M-45 0h9M36 0h9" stroke="${outer}" stroke-width="3" stroke-linecap="round"/>
  <path d="M-23-7-38-17l3 20zM23-7l15-10-3 20z" fill="${weapon}" stroke="${accent}" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M0-29 25-15 25 15 0 29-25 15-25-15z" fill="${body}" stroke="${outer}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M0-20 15-11 15 11 0 20-15 11-15-11z" fill="none" stroke="${detail}" stroke-width="2" opacity=".9"/>
  <circle cx="0" cy="0" r="12" fill="${core}" stroke="${accent}" stroke-width="2"/>
  <path d="M0-8v16M-8 0h16" stroke="${body}" stroke-width="2" stroke-linecap="round"/>
  <circle cx="-20" cy="0" r="3" fill="${accent}"/><circle cx="20" cy="0" r="3" fill="${accent}"/>
</svg>`;
};
