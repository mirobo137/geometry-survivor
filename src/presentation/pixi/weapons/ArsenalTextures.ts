import { Texture } from 'pixi.js';
import type { UpgradeDefinition, WeaponPathId } from '../../../content/upgrades/UpgradeDefinitions';
import type { WeaponEvolutionId } from '../../../content/weapons/WeaponEvolutionDefinitions';
import orbitUrl from '../../../assets/fx/arsenal/orbit.webp?no-inline';
import solar_crownUrl from '../../../assets/fx/arsenal/solar-crown.webp?no-inline';
import graviton_haloUrl from '../../../assets/fx/arsenal/graviton-halo.webp?no-inline';
import boomerangUrl from '../../../assets/fx/arsenal/boomerang.webp?no-inline';
import twin_cometUrl from '../../../assets/fx/arsenal/twin-comet.webp?no-inline';
import singularity_returnUrl from '../../../assets/fx/arsenal/singularity-return.webp?no-inline';
import projectileUrl from '../../../assets/fx/arsenal/projectile.webp?no-inline';
import rail_lanceUrl from '../../../assets/fx/arsenal/rail-lance.webp?no-inline';
import pulse_volleyUrl from '../../../assets/fx/arsenal/pulse-volley.webp?no-inline';
import chainUrl from '../../../assets/fx/arsenal/chain.webp?no-inline';
import closed_circuitUrl from '../../../assets/fx/arsenal/closed-circuit.webp?no-inline';
import thunderheadUrl from '../../../assets/fx/arsenal/thunderhead.webp?no-inline';
import pulse_ringUrl from '../../../assets/fx/arsenal/pulse-ring.webp?no-inline';
import echo_shockUrl from '../../../assets/fx/arsenal/echo-shock.webp?no-inline';
import compression_waveUrl from '../../../assets/fx/arsenal/compression-wave.webp?no-inline';
import event_horizonUrl from '../../../assets/fx/arsenal/event-horizon.webp?no-inline';
import polar_collapseUrl from '../../../assets/fx/arsenal/polar-collapse.webp?no-inline';
import recharging_shieldUrl from '../../../assets/fx/arsenal/recharging-shield.webp?no-inline';
import magneticCoreUrl from '../../../assets/fx/magnetic-singularity-core.png';
import magneticTravelUrl from '../../../assets/fx/magnetic-charge-travel.png';
import magneticFieldUrl from '../../../assets/fx/magnetic-charge-field.webp?no-inline';
import magneticBurstUrl from '../../../assets/fx/magnetic-charge-detonation.png';
import thunderheadBurstUrl from '../../../assets/fx/arsenal/thunderhead-burst.webp?no-inline';
import singularitySplitUrl from '../../../assets/fx/arsenal/singularity-split.webp?no-inline';
import singularityShardUrl from '../../../assets/fx/arsenal/singularity-shard.webp?no-inline';
import { PROJECTILE_ART_URLS } from '../../../assets/fx/projectiles/ProjectileRasterAssets';

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
  singularity_shard: singularityShardUrl,
  ...PROJECTILE_ART_URLS
} as const;
export type ArsenalArtId = keyof typeof ARSENAL_ART;
const cache = new Map<ArsenalArtId, Texture | null>();
const pending = new Map<ArsenalArtId, Promise<Texture | null>>();

/** Explicit preparation shares exactly the same images as the lazy render path. */
export const loadArsenalTexture = (id: ArsenalArtId): Promise<Texture | null> => {
  const existing = pending.get(id);
  if (existing) return existing;
  let finish!: (texture: Texture | null) => void;
  const promise = new Promise<Texture | null>(resolve => { finish = resolve; });
  pending.set(id, promise);
  cache.set(id, null);
  if (typeof Image === 'undefined') { finish(null); return promise; }
  const image = new Image();
  image.decoding = 'async';
  const settle = (texture: Texture | null): void => {
    cache.set(id, texture);
    image.onload = null;
    image.onerror = null;
    finish(texture);
  };
  image.onload = async () => {
    try { await image.decode(); settle(Texture.from(image)); }
    catch { settle(null); }
  };
  image.onerror = () => settle(null);
  image.src = ARSENAL_ART[id];
  return promise;
};

export const MAGNETIC_ART_IDS = ['magnetic_core', 'magnetic_field', 'magnetic_travel', 'magnetic_burst'] as const;
export const ART_FAMILIES: readonly WeaponPathId[] = ['projectile', 'orbit', 'chain', 'boomerang', 'pulse_ring', 'magnetic_charge'];
const EVOLUTION_FAMILY: Record<WeaponEvolutionId, WeaponPathId> = {
  rail_lance: 'projectile', pulse_volley: 'projectile', solar_crown: 'orbit', graviton_halo: 'orbit',
  closed_circuit: 'chain', thunderhead: 'chain', twin_comet: 'boomerang', singularity_return: 'boomerang',
  echo_shock: 'pulse_ring', compression_wave: 'pulse_ring', event_horizon: 'magnetic_charge', polar_collapse: 'magnetic_charge'
};

/** Only material actually consumed by this equipped/offered recipe. */
export const getWeaponArtIds = (family: WeaponPathId, evolution?: WeaponEvolutionId | null): readonly ArsenalArtId[] => {
  switch (family) {
    case 'projectile': return [evolution as ArsenalArtId ?? 'projectile'];
    case 'orbit': return [evolution as ArsenalArtId ?? 'orbit', 'event_horizon'];
    case 'chain': return evolution === 'thunderhead'
      ? ['thunderhead', 'magnetic_core', 'thunderhead_burst'] : [evolution as ArsenalArtId ?? 'chain', 'magnetic_core'];
    case 'boomerang': return evolution === 'singularity_return'
      ? ['singularity_return', 'singularity_split', 'singularity_shard', 'magnetic_travel']
      : [evolution as ArsenalArtId ?? 'boomerang', 'magnetic_travel'];
    case 'pulse_ring': return [evolution as ArsenalArtId ?? 'pulse_ring'];
    case 'magnetic_charge': return evolution ? [...MAGNETIC_ART_IDS, evolution as ArsenalArtId] : MAGNETIC_ART_IDS;
  }
};

/** Finite deadline. Slow/error assets retain fallback; never gate combat forever. */
export const getUpgradeArtIds = (
  choice: UpgradeDefinition, selected: Partial<Record<WeaponPathId, WeaponEvolutionId>>
): readonly ArsenalArtId[] => {
  const effect = choice.effect;
  if (effect.type === 'weaponEvolution') return getWeaponArtIds(EVOLUTION_FAMILY[effect.evolution], effect.evolution);
  if (effect.type === 'shield') return ['recharging_shield'];
  let family: WeaponPathId | undefined;
  if ('family' in effect) family = effect.family;
  else if (effect.type === 'orbitBlade' || effect.type === 'orbitRadius') family = 'orbit';
  else if (effect.type === 'chainLightning' || effect.type === 'chainDamage') family = 'chain';
  else if (effect.type === 'vectorBoomerang') family = 'boomerang';
  else if (effect.type === 'pulseRing') family = 'pulse_ring';
  else if (effect.type === 'magneticCharge') family = 'magnetic_charge';
  else if (effect.type === 'projectileDamage' || effect.type === 'projectileCooldown' || effect.type === 'twinEmitters') family = 'projectile';
  return family ? getWeaponArtIds(family, selected[family]) : [];
};

/** Finite deadline; preparation does not own simulation or disable controls. */
export const prepareArsenalTextures = async (ids: readonly ArsenalArtId[], timeoutMs = 2500): Promise<void> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.all([...new Set(ids)].map(loadArsenalTexture)),
      new Promise<void>(resolve => { timer = setTimeout(resolve, timeoutMs); })
    ]);
  } finally { clearTimeout(timer); }
};

/** Lazy, once per asset. Decode before upload; errors leave the complete vector fallback. */
export const getArsenalTexture = (id: ArsenalArtId): Texture | null => {
  if (cache.has(id)) return cache.get(id) ?? null;
  void loadArsenalTexture(id);
  return null;
};
