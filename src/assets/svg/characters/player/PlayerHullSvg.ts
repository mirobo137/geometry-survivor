import type { PlayerSkinId } from '../../../../content/visual/VisualTokens';
import cyanBodySvg from './player-body.svg?raw';
import cyanCoreSvg from './player-core.svg?raw';
import cyanRingSvg from './player-ring.svg?raw';
import amberBodySvg from './skins/amber/body.svg?raw';
import amberCoreSvg from './skins/amber/core.svg?raw';
import amberRingSvg from './skins/amber/ring.svg?raw';
import emeraldBodySvg from './skins/emerald/body.svg?raw';
import emeraldCoreSvg from './skins/emerald/core.svg?raw';
import emeraldRingSvg from './skins/emerald/ring.svg?raw';
import violetBodySvg from './skins/violet/body.svg?raw';
import violetCoreSvg from './skins/violet/core.svg?raw';
import violetRingSvg from './skins/violet/ring.svg?raw';

export const PLAYER_HULL_SVG: Readonly<Record<PlayerSkinId, { body: string; ring: string; core: string }>> = {
  cyan: { body: cyanBodySvg, ring: cyanRingSvg, core: cyanCoreSvg },
  violet: { body: violetBodySvg, ring: violetRingSvg, core: violetCoreSvg },
  amber: { body: amberBodySvg, ring: amberRingSvg, core: amberCoreSvg },
  emerald: { body: emeraldBodySvg, ring: emeraldRingSvg, core: emeraldCoreSvg }
};

/** DOM preview mirrors Sprite.tint on explicit RGB source attributes. No runtime parsing. */
export const tintPlayerSvgMarkup = (svg: string, tint: number): string => svg
  .replace(/<svg\b[^>]*>|<\/svg>|<title\b[^>]*>[\s\S]*?<\/title>|<desc\b[^>]*>[\s\S]*?<\/desc>/g, '')
  .replace(/\s+id="[^"]+"/g, '')
  .replace(/#([0-9a-f]{6})/gi, (_, hex: string) => {
    const color = Number.parseInt(hex, 16);
    const channel = (shift: number): number => Math.round(((color >> shift) & 255) * ((tint >> shift) & 255) / 255);
    return '#' + ((channel(16) << 16) | (channel(8) << 8) | channel(0)).toString(16).padStart(6, '0');
  }).trim();

