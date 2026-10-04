import { Texture } from 'pixi.js';
import chaserUrl from '../../../assets/images/enemies/chaser.png';
import fastUrl from '../../../assets/images/enemies/fast.png';
import tankUrl from '../../../assets/images/enemies/tank.png';
import eliteUrl from '../../../assets/images/enemies/elite.png';
import orbiterUrl from '../../../assets/images/enemies/orbiter.png';
import chargerUrl from '../../../assets/images/enemies/charger.png';
import splitterUrl from '../../../assets/images/enemies/splitter.png';
import prismWeaverUrl from '../../../assets/images/enemies/prism-weaver.png';
import wardenReplicaUrl from '../../../assets/images/enemies/warden-replica.png';
import fractureGunnerUrl from '../../../assets/images/enemies/fracture-gunner.png';
import thornBastionUrl from '../../../assets/images/enemies/thorn-bastion.png';
import zigzagReaverUrl from '../../../assets/images/enemies/zigzag-reaver.png';
import riftMinerUrl from '../../../assets/images/enemies/rift-miner.png';
import coreSentinelUrl from '../../../assets/images/enemies/core-sentinel.png';
import orbitalWardenUrl from '../../../assets/images/enemies/orbital-warden.png';
import fractureEngineUrl from '../../../assets/images/enemies/fracture-engine.png';

export const ENEMY_RASTER_COMMON_IDS = [
  'chaser', 'fast', 'tank', 'elite', 'orbiter', 'charger', 'splitter',
  'prism-weaver', 'warden-replica', 'fracture-gunner', 'thorn-bastion',
  'zigzag-reaver', 'rift-miner'
] as const;

export const ENEMY_RASTER_BOSS_IDS = [
  'core-sentinel', 'orbital-warden', 'fracture-engine'
] as const;

export type EnemyRasterAssetId = typeof ENEMY_RASTER_COMMON_IDS[number]
  | typeof ENEMY_RASTER_BOSS_IDS[number];

const ENEMY_RASTER_ASSETS: Readonly<Record<EnemyRasterAssetId, string>> = {
  chaser: chaserUrl,
  fast: fastUrl,
  tank: tankUrl,
  elite: eliteUrl,
  orbiter: orbiterUrl,
  charger: chargerUrl,
  splitter: splitterUrl,
  'prism-weaver': prismWeaverUrl,
  'warden-replica': wardenReplicaUrl,
  'fracture-gunner': fractureGunnerUrl,
  'thorn-bastion': thornBastionUrl,
  'zigzag-reaver': zigzagReaverUrl,
  'rift-miner': riftMinerUrl,
  'core-sentinel': coreSentinelUrl,
  'orbital-warden': orbitalWardenUrl,
  'fracture-engine': fractureEngineUrl
};

const texturePromises = new Map<EnemyRasterAssetId, Promise<Texture | null>>();

/** Decode PNGs before creating shared Pixi textures; failed loads keep the SVG body. */
const loadTexture = (id: EnemyRasterAssetId): Promise<Texture | null> => {
  const cached = texturePromises.get(id);
  if (cached) return cached;
  if (typeof Image === 'undefined') return Promise.resolve(null);

  const image = new Image();
  image.decoding = 'async';
  const promise = new Promise<Texture | null>((resolve) => {
    const settle = (texture: Texture | null): void => {
      image.onload = null;
      image.onerror = null;
      resolve(texture);
    };
    image.onload = async () => {
      try {
        await image.decode();
        settle(Texture.from(image));
      } catch {
        settle(null);
      }
    };
    image.onerror = () => settle(null);
    image.src = ENEMY_RASTER_ASSETS[id];
  });
  texturePromises.set(id, promise);
  return promise;
};

/** Shared session textures; each SVG remains visible until its matching PNG decodes. */
export const loadEnemyRasterTextures = async (): Promise<Partial<Record<EnemyRasterAssetId, Texture>>> => {
  const textures: Partial<Record<EnemyRasterAssetId, Texture>> = {};
  await Promise.all((Object.keys(ENEMY_RASTER_ASSETS) as EnemyRasterAssetId[]).map(async (id) => {
    const texture = await loadTexture(id);
    if (texture) textures[id] = texture;
  }));
  return textures;
};
