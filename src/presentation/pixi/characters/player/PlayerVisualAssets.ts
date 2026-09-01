import type { Renderer, Texture } from 'pixi.js';
import playerAccentSvg from '../../../../assets/svg/characters/player/player-accent.svg?raw';
import playerBodySvg from '../../../../assets/svg/characters/player/player-body.svg?raw';
import playerCoreSvg from '../../../../assets/svg/characters/player/player-core.svg?raw';
import playerRingSvg from '../../../../assets/svg/characters/player/player-ring.svg?raw';
import playerShadowSvg from '../../../../assets/svg/characters/player/player-shadow.svg?raw';
import cannonBasicSvg from '../../../../assets/svg/cannons/cannon-basic.svg?raw';
import cannonCurveSvg from '../../../../assets/svg/cannons/cannon-curve.svg?raw';
import cannonSmokeSvg from '../../../../assets/svg/cannons/cannon-smoke.svg?raw';
import cannonRainbowSvg from '../../../../assets/svg/cannons/cannon-rainbow.svg?raw';
import { createPlayerSkinSignatureSvg } from '../../../../assets/svg/characters/player/SkinSignatureSvg';
import { PLAYER_SKINS } from '../../../../content/visual/VisualTokens';
import type { PlayerSkinId } from '../../../../content/visual/VisualTokens';
import type { CannonSkinId } from '../../../../content/visual/CannonSkinDefinitions';
import { createSvgTexture, type SvgTextureFrame } from '../../SvgTextureFactory';

export interface PlayerTextureSet {
  readonly shadow: Texture;
  readonly ring: Texture;
  readonly weapons: Readonly<Record<CannonSkinId, Texture>>;
  readonly body: Texture;
  readonly core: Texture;
  readonly accent: Texture;
  readonly signature: Readonly<Record<PlayerSkinId, Texture>>;
}

export const PLAYER_TEXTURE_FRAME: SvgTextureFrame = {
  x: -32,
  y: -32,
  width: 64,
  height: 64
};

/** Rasterizes each player piece once while retaining the SVG masters in src/. */
export const createPlayerTextures = (renderer: Renderer): PlayerTextureSet => ({
  shadow: createSvgTexture(renderer, playerShadowSvg, PLAYER_TEXTURE_FRAME),
  ring: createSvgTexture(renderer, playerRingSvg, PLAYER_TEXTURE_FRAME),
  weapons: {
    basic: createSvgTexture(renderer, cannonBasicSvg, PLAYER_TEXTURE_FRAME),
    curve: createSvgTexture(renderer, cannonCurveSvg, PLAYER_TEXTURE_FRAME),
    smoke: createSvgTexture(renderer, cannonSmokeSvg, PLAYER_TEXTURE_FRAME),
    rainbow: createSvgTexture(renderer, cannonRainbowSvg, PLAYER_TEXTURE_FRAME)
  },
  body: createSvgTexture(renderer, playerBodySvg, PLAYER_TEXTURE_FRAME),
  core: createSvgTexture(renderer, playerCoreSvg, PLAYER_TEXTURE_FRAME),
  accent: createSvgTexture(renderer, playerAccentSvg, PLAYER_TEXTURE_FRAME),
  signature: Object.fromEntries(
    (Object.keys(PLAYER_SKINS) as PlayerSkinId[]).map((skin) => [
      skin,
      createSvgTexture(renderer, createPlayerSkinSignatureSvg(skin), PLAYER_TEXTURE_FRAME)
    ])
  ) as Record<PlayerSkinId, Texture>
});
