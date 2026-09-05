import type { Renderer, Texture } from 'pixi.js';
import { PLAYER_HULL_SVG } from '../../../../assets/svg/characters/player/PlayerHullSvg';
import playerAccentSvg from '../../../../assets/svg/characters/player/player-accent.svg?raw';
import playerShadowSvg from '../../../../assets/svg/characters/player/player-shadow.svg?raw';
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



const rasterizeSkinMap = (
  renderer: Renderer,
  pick: (hull: (typeof PLAYER_HULL_SVG)[PlayerSkinId]) => string
): Record<PlayerSkinId, Texture> => (
  Object.fromEntries(
    (Object.keys(PLAYER_SKINS) as PlayerSkinId[]).map((skin) => [
      skin,
      createSvgTexture(renderer, pick(PLAYER_HULL_SVG[skin]), PLAYER_TEXTURE_FRAME)
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
    },
    lattice: {
      left: createSvgTexture(renderer, CANNON_BARREL_SVG.lattice.left, PLAYER_TEXTURE_FRAME),
      right: createSvgTexture(renderer, CANNON_BARREL_SVG.lattice.right, PLAYER_TEXTURE_FRAME)
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
