import type { Renderer, Texture } from 'pixi.js';
import { PLAYER_HULL_SVG } from '../../../../assets/svg/characters/player/PlayerHullSvg';
import playerAccentSvg from '../../../../assets/svg/characters/player/player-accent.svg?raw';
import playerShadowSvg from '../../../../assets/svg/characters/player/player-shadow.svg?raw';
import { createPlayerSkinSignatureSvg } from '../../../../assets/svg/characters/player/SkinSignatureSvg';
import { CANNON_BARREL_SVG, getCannonFallbackId } from '../../../../assets/svg/cannons/CannonSvgMarkup';
import { PLAYER_SKINS } from '../../../../content/visual/VisualTokens';
import type { PlayerSkinId } from '../../../../content/visual/VisualTokens';
import { CANNON_SKIN_DEFINITIONS, type CannonSkinId } from '../../../../content/visual/CannonSkinDefinitions';
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



const lazyMap = <K extends string, V>(keys: readonly K[], build: (key: K) => V): Record<K, V> => {
  const cache = new Map<K, V>();
  const result = {} as Record<K, V>;
  for (const key of keys) Object.defineProperty(result, key, { enumerable: true, get: () => {
    if (!cache.has(key)) cache.set(key, build(key));
    return cache.get(key)!;
  } });
  return result;
};

const rasterizeSkinMap = (
  renderer: Renderer,
  pick: (hull: (typeof PLAYER_HULL_SVG)[PlayerSkinId]) => string
): Record<PlayerSkinId, Texture> => {
  const textures: Record<PlayerSkinId, Texture> = lazyMap(Object.keys(PLAYER_SKINS) as PlayerSkinId[], skin =>
    skin === 'spearhead' || skin === 'corsair' || skin === 'nautilus' ? textures.cyan : createSvgTexture(renderer, pick(PLAYER_HULL_SVG[skin]), PLAYER_TEXTURE_FRAME));
  return textures;
};

const rasterizeSignatures = (renderer: Renderer): Record<PlayerSkinId, Texture> => {
  const textures: Record<PlayerSkinId, Texture> = lazyMap(Object.keys(PLAYER_SKINS) as PlayerSkinId[], skin =>
    skin === 'spearhead' || skin === 'corsair' || skin === 'nautilus' ? textures.cyan : createSvgTexture(renderer, createPlayerSkinSignatureSvg(skin), PLAYER_TEXTURE_FRAME));
  return textures;
};

const rasterizeCannons = (renderer: Renderer): Record<CannonSkinId, CannonTexturePair> => {
  const textures: Record<CannonSkinId, CannonTexturePair> = lazyMap(
    CANNON_SKIN_DEFINITIONS.map(definition => definition.id), skin => getCannonFallbackId(skin) !== skin ? textures[getCannonFallbackId(skin)] : {
      left: createSvgTexture(renderer, CANNON_BARREL_SVG[skin].left, PLAYER_TEXTURE_FRAME),
      right: createSvgTexture(renderer, CANNON_BARREL_SVG[skin].right, PLAYER_TEXTURE_FRAME)
    });
  return textures;
};

/** Only rasterize pieces actually requested, once, retaining the SVG masters. */
export const createPlayerTextures = (renderer: Renderer): PlayerTextureSet => ({
  shadow: createSvgTexture(renderer, playerShadowSvg, PLAYER_TEXTURE_FRAME),
  ring: rasterizeSkinMap(renderer, (hull) => hull.ring),
  weapons: rasterizeCannons(renderer),
  body: rasterizeSkinMap(renderer, (hull) => hull.body),
  core: rasterizeSkinMap(renderer, (hull) => hull.core),
  accent: createSvgTexture(renderer, playerAccentSvg, PLAYER_TEXTURE_FRAME),
  signature: rasterizeSignatures(renderer)
});
