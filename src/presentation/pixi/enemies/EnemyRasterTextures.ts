import { Texture } from 'pixi.js';
import chaserUrl from '../../../assets/images/enemies/chaser.webp?no-inline';
import fastUrl from '../../../assets/images/enemies/fast.webp?no-inline';
import tankUrl from '../../../assets/images/enemies/tank.webp?no-inline';
import eliteUrl from '../../../assets/images/enemies/elite.webp?no-inline';
import orbiterUrl from '../../../assets/images/enemies/orbiter.webp?no-inline';
import chargerUrl from '../../../assets/images/enemies/charger.webp?no-inline';
import splitterUrl from '../../../assets/images/enemies/splitter.webp?no-inline';
import prismWeaverUrl from '../../../assets/images/enemies/prism-weaver.webp?no-inline';
import wardenReplicaUrl from '../../../assets/images/enemies/warden-replica.webp?no-inline';
import fractureGunnerUrl from '../../../assets/images/enemies/fracture-gunner.webp?no-inline';
import thornBastionUrl from '../../../assets/images/enemies/thorn-bastion.webp?no-inline';
import zigzagReaverUrl from '../../../assets/images/enemies/zigzag-reaver.webp?no-inline';
import riftMinerUrl from '../../../assets/images/enemies/rift-miner.webp?no-inline';
import coreSentinelUrl from '../../../assets/images/enemies/core-sentinel.webp?no-inline';
import orbitalWardenUrl from '../../../assets/images/enemies/orbital-warden.webp?no-inline';
import fractureEngineUrl from '../../../assets/images/enemies/fracture-engine.webp?no-inline';

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

/** Decode raster bodies before creating shared textures; failed loads keep SVG. */
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
        if (image.naturalWidth <= 0 || image.naturalWidth !== image.naturalHeight) {
          settle(null);
          return;
        }
        // Physical pixels carry extra art detail, not a larger combat hull.
        // Source resolution keeps the sprite AND its death fragments in the
        // same 64/112 logical frame as the authored SVG fallback.
        const logicalSize = (ENEMY_RASTER_BOSS_IDS as readonly string[]).includes(id) ? 112 : 64;
        settle(Texture.from({ resource: image, resolution: image.naturalWidth / logicalSize }));
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

/** Shared session textures; each SVG remains until its matching image decodes. */
export const loadEnemyRasterTextures = async (): Promise<Partial<Record<EnemyRasterAssetId, Texture>>> => {
  const textures: Partial<Record<EnemyRasterAssetId, Texture>> = {};
  await Promise.all((Object.keys(ENEMY_RASTER_ASSETS) as EnemyRasterAssetId[]).map(async (id) => {
    const texture = await loadTexture(id);
    if (texture) textures[id] = texture;
  }));
  return textures;
};
