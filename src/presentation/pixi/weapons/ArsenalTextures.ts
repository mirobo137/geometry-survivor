import { Texture } from 'pixi.js';
import orbitUrl from '../../../assets/fx/arsenal/orbit.png';
import solar_crownUrl from '../../../assets/fx/arsenal/solar-crown.png';
import graviton_haloUrl from '../../../assets/fx/arsenal/graviton-halo.png';
import boomerangUrl from '../../../assets/fx/arsenal/boomerang.png';
import twin_cometUrl from '../../../assets/fx/arsenal/twin-comet.png';
import singularity_returnUrl from '../../../assets/fx/arsenal/singularity-return.png';
import projectileUrl from '../../../assets/fx/arsenal/projectile.png';
import rail_lanceUrl from '../../../assets/fx/arsenal/rail-lance.png';
import pulse_volleyUrl from '../../../assets/fx/arsenal/pulse-volley.png';
import chainUrl from '../../../assets/fx/arsenal/chain.png';
import closed_circuitUrl from '../../../assets/fx/arsenal/closed-circuit.png';
import thunderheadUrl from '../../../assets/fx/arsenal/thunderhead.png';
import pulse_ringUrl from '../../../assets/fx/arsenal/pulse-ring.png';
import echo_shockUrl from '../../../assets/fx/arsenal/echo-shock.png';
import compression_waveUrl from '../../../assets/fx/arsenal/compression-wave.png';
import event_horizonUrl from '../../../assets/fx/arsenal/event-horizon.png';
import polar_collapseUrl from '../../../assets/fx/arsenal/polar-collapse.png';
import recharging_shieldUrl from '../../../assets/fx/arsenal/recharging-shield.png';
import magneticCoreUrl from '../../../assets/fx/magnetic-singularity-core.png';
import magneticTravelUrl from '../../../assets/fx/magnetic-charge-travel.png';
import magneticFieldUrl from '../../../assets/fx/magnetic-charge-field.png';
import magneticBurstUrl from '../../../assets/fx/magnetic-charge-detonation.png';
import thunderheadBurstUrl from '../../../assets/fx/arsenal/thunderhead-burst.png';
import singularitySplitUrl from '../../../assets/fx/arsenal/singularity-split.png';
import singularityShardUrl from '../../../assets/fx/arsenal/singularity-shard.png';

/** Fixed catalogue, owned by the presentation session, never by individual sprites. */
export const ARSENAL_ART = {
  orbit: orbitUrl,
  solar_crown: solar_crownUrl,
  graviton_halo: graviton_haloUrl,
  boomerang: boomerangUrl,
  twin_comet: twin_cometUrl,
  singularity_return: singularity_returnUrl,
  projectile: projectileUrl,
  rail_lance: rail_lanceUrl,
  pulse_volley: pulse_volleyUrl,
  chain: chainUrl,
  closed_circuit: closed_circuitUrl,
  thunderhead: thunderheadUrl,
  pulse_ring: pulse_ringUrl,
  echo_shock: echo_shockUrl,
  compression_wave: compression_waveUrl,
  event_horizon: event_horizonUrl,
  polar_collapse: polar_collapseUrl,
  recharging_shield: recharging_shieldUrl,
  magnetic_core: magneticCoreUrl,
  magnetic_travel: magneticTravelUrl,
  magnetic_field: magneticFieldUrl,
  magnetic_burst: magneticBurstUrl,
  thunderhead_burst: thunderheadBurstUrl,
  singularity_split: singularitySplitUrl,
  singularity_shard: singularityShardUrl
} as const;
export type ArsenalArtId = keyof typeof ARSENAL_ART;
const cache = new Map<ArsenalArtId, Texture | null>();

/** Lazy, once per asset. Decode before upload; errors leave the complete vector fallback. */
export const getArsenalTexture = (id: ArsenalArtId): Texture | null => {
  if (cache.has(id)) return cache.get(id) ?? null;
  if (typeof Image === 'undefined') return null;
  cache.set(id, null);
  const image = new Image();
  image.decoding = 'async';
  image.onload = async () => {
    try {
      await image.decode();
      cache.set(id, Texture.from(image));
    } catch { /* Failed decode/upload: keep fallback; do not retry every frame. */ }
    image.onload = null;
    image.onerror = null;
  };
  image.onerror = () => { image.onload = null; image.onerror = null; };
  image.src = ARSENAL_ART[id];
  return null;
};
