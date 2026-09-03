import type { Renderer, Texture } from 'pixi.js';
import playerAccentSvg from '../../../../assets/svg/characters/player/player-accent.svg?raw';
import cyanBodySvg from '../../../../assets/svg/characters/player/player-body.svg?raw';
import cyanCoreSvg from '../../../../assets/svg/characters/player/player-core.svg?raw';
import cyanRingSvg from '../../../../assets/svg/characters/player/player-ring.svg?raw';
import playerShadowSvg from '../../../../assets/svg/characters/player/player-shadow.svg?raw';
import amberBodySvg from '../../../../assets/svg/characters/player/skins/amber/body.svg?raw';
import amberCoreSvg from '../../../../assets/svg/characters/player/skins/amber/core.svg?raw';
import amberRingSvg from '../../../../assets/svg/characters/player/skins/amber/ring.svg?raw';
import emeraldBodySvg from '../../../../assets/svg/characters/player/skins/emerald/body.svg?raw';
import emeraldCoreSvg from '../../../../assets/svg/characters/player/skins/emerald/core.svg?raw';
import emeraldRingSvg from '../../../../assets/svg/characters/player/skins/emerald/ring.svg?raw';
import violetBodySvg from '../../../../assets/svg/characters/player/skins/violet/body.svg?raw';
import violetCoreSvg from '../../../../assets/svg/characters/player/skins/violet/core.svg?raw';
import violetRingSvg from '../../../../assets/svg/characters/player/skins/violet/ring.svg?raw';
import { createPlayerSkinSignatureSvg } from '../../../../assets/svg/characters/player/SkinSignatureSvg';
import { CANNON_BARREL_SVG } from '../../../../assets/svg/cannons/CannonSvgMarkup';
import { PLAYER_SKINS } from '../../../../content/visual/VisualTokens';
import type { PlayerSkinId } from '../../../../content/visual/VisualTokens';
import type { CannonSkinId } from '../../../../content/visual/CannonSkinDefinitions';
import { createSvgTexture, type SvgTextureFrame } from '../../SvgTextureFactory';

export interface CannonTexturePair {
  readonly left: Texture;
  readonly right: Texture;
}

export interface PlayerTextureSet {
  readonly shadow: Texture;
  readonly ring: Readonly<Record<PlayerSkinId, Texture>>;
  readonly weapons: Readonly<Record<CannonSkinId, CannonTexturePair>>;
  readonly body: Readonly<Record<PlayerSkinId, Texture>>;
  readonly core: Readonly<Record<PlayerSkinId, Texture>>;
  readonly accent: Texture;
  readonly signature: Readonly<Record<PlayerSkinId, Texture>>;
}

export const PLAYER_TEXTURE_FRAME: SvgTextureFrame = {
  x: -32,
  y: -32,
  width: 64,
  height: 64
};

const HULL_SVG: Readonly<Record<PlayerSkinId, { body: string; ring: string; core: string }>> = {
  cyan: { body: cyanBodySvg, ring: cyanRingSvg, core: cyanCoreSvg },
  violet: { body: violetBodySvg, ring: violetRingSvg, core: violetCoreSvg },
  amber: { body: amberBodySvg, ring: amberRingSvg, core: amberCoreSvg },
  emerald: { body: emeraldBodySvg, ring: emeraldRingSvg, core: emeraldCoreSvg }
};

const rasterizeSkinMap = (
  renderer: Renderer,
  pick: (hull: (typeof HULL_SVG)[PlayerSkinId]) => string
): Record<PlayerSkinId, Texture> => (
  Object.fromEntries(
    (Object.keys(PLAYER_SKINS) as PlayerSkinId[]).map((skin) => [
      skin,
      createSvgTexture(renderer, pick(HULL_SVG[skin]), PLAYER_TEXTURE_FRAME)
    ])
  ) as Record<PlayerSkinId, Texture>
);

/** Rasterizes each player piece once while retaining the SVG masters in src/. */
export const createPlayerTextures = (renderer: Renderer): PlayerTextureSet => ({
  shadow: createSvgTexture(renderer, playerShadowSvg, PLAYER_TEXTURE_FRAME),
  ring: rasterizeSkinMap(renderer, (hull) => hull.ring),
  weapons: {
    basic: {
      left: createSvgTexture(renderer, CANNON_BARREL_SVG.basic.left, PLAYER_TEXTURE_FRAME),
      right: createSvgTexture(renderer, CANNON_BARREL_SVG.basic.right, PLAYER_TEXTURE_FRAME)
    },
    curve: {
      left: createSvgTexture(renderer, CANNON_BARREL_SVG.curve.left, PLAYER_TEXTURE_FRAME),
      right: createSvgTexture(renderer, CANNON_BARREL_SVG.curve.right, PLAYER_TEXTURE_FRAME)
    },
    smoke: {
      left: createSvgTexture(renderer, CANNON_BARREL_SVG.smoke.left, PLAYER_TEXTURE_FRAME),
      right: createSvgTexture(renderer, CANNON_BARREL_SVG.smoke.right, PLAYER_TEXTURE_FRAME)
    },
    rainbow: {
      left: createSvgTexture(renderer, CANNON_BARREL_SVG.rainbow.left, PLAYER_TEXTURE_FRAME),
      right: createSvgTexture(renderer, CANNON_BARREL_SVG.rainbow.right, PLAYER_TEXTURE_FRAME)
    }
  },
  body: rasterizeSkinMap(renderer, (hull) => hull.body),
  core: rasterizeSkinMap(renderer, (hull) => hull.core),
  accent: createSvgTexture(renderer, playerAccentSvg, PLAYER_TEXTURE_FRAME),
  signature: Object.fromEntries(
    (Object.keys(PLAYER_SKINS) as PlayerSkinId[]).map((skin) => [
      skin,
      createSvgTexture(renderer, createPlayerSkinSignatureSvg(skin), PLAYER_TEXTURE_FRAME)
    ])
  ) as Record<PlayerSkinId, Texture>
});
