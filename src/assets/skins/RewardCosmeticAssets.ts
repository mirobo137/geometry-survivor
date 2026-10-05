import type { RewardShipId, RewardCannonId, RewardBackgroundId, RewardCosmeticId } from '../../content/retention/RewardCosmeticDefinitions';
import asterion from '../skins/ships/asterion/asterion.webp?no-inline';
import solstice from '../skins/ships/solstice/solstice.webp?no-inline';
import ship_riftwake_strider from '../images/reward-catalog/runtime/riftwake-strider.webp?no-inline';
import ship_halo_drifter from '../images/reward-catalog/runtime/halo-drifter.webp?no-inline';
import ship_iron_orchid from '../images/reward-catalog/runtime/iron-orchid.webp?no-inline';
import ship_vesper_kite from '../images/reward-catalog/runtime/vesper-kite.webp?no-inline';
import ship_tidebreaker from '../images/reward-catalog/runtime/tidebreaker.webp?no-inline';
import ship_sunscar from '../images/reward-catalog/runtime/sunscar.webp?no-inline';
import ship_umbra_manta from '../images/reward-catalog/runtime/umbra-manta.webp?no-inline';
import ship_crown_wasp from '../images/reward-catalog/runtime/crown-wasp.webp?no-inline';
import cannon_astral_fang from '../images/reward-catalog/runtime/astral-fang-cannon.webp?no-inline';
import head_astral_fang from '../images/reward-catalog/runtime/astral-fang-head.webp?no-inline';
import trail_astral_fang from '../images/reward-catalog/runtime/astral-fang-trail.webp?no-inline';
import cannon_frostbite from '../images/reward-catalog/runtime/frostbite-cannon.webp?no-inline';
import head_frostbite from '../images/reward-catalog/runtime/frostbite-head.webp?no-inline';
import trail_frostbite from '../images/reward-catalog/runtime/frostbite-trail.webp?no-inline';
import cannon_embercoil from '../images/reward-catalog/runtime/embercoil-cannon.webp?no-inline';
import head_embercoil from '../images/reward-catalog/runtime/embercoil-head.webp?no-inline';
import trail_embercoil from '../images/reward-catalog/runtime/embercoil-trail.webp?no-inline';
import cannon_voidspindle from '../images/reward-catalog/runtime/voidspindle-cannon.webp?no-inline';
import head_voidspindle from '../images/reward-catalog/runtime/voidspindle-head.webp?no-inline';
import trail_voidspindle from '../images/reward-catalog/runtime/voidspindle-trail.webp?no-inline';
import cannon_jade_serpent from '../images/reward-catalog/runtime/jade-serpent-cannon.webp?no-inline';
import head_jade_serpent from '../images/reward-catalog/runtime/jade-serpent-head.webp?no-inline';
import trail_jade_serpent from '../images/reward-catalog/runtime/jade-serpent-trail.webp?no-inline';
import cannon_sunhammer from '../images/reward-catalog/runtime/sunhammer-cannon.webp?no-inline';
import head_sunhammer from '../images/reward-catalog/runtime/sunhammer-head.webp?no-inline';
import trail_sunhammer from '../images/reward-catalog/runtime/sunhammer-trail.webp?no-inline';
import cannon_rose_thorn from '../images/reward-catalog/runtime/rose-thorn-cannon.webp?no-inline';
import head_rose_thorn from '../images/reward-catalog/runtime/rose-thorn-head.webp?no-inline';
import trail_rose_thorn from '../images/reward-catalog/runtime/rose-thorn-trail.webp?no-inline';
import cannon_starweaver from '../images/reward-catalog/runtime/starweaver-cannon.webp?no-inline';
import head_starweaver from '../images/reward-catalog/runtime/starweaver-head.webp?no-inline';
import trail_starweaver from '../images/reward-catalog/runtime/starweaver-trail.webp?no-inline';
import cannon_abyss_maw from '../images/reward-catalog/runtime/abyss-maw-cannon.webp?no-inline';
import head_abyss_maw from '../images/reward-catalog/runtime/abyss-maw-head.webp?no-inline';
import trail_abyss_maw from '../images/reward-catalog/runtime/abyss-maw-trail.webp?no-inline';
import cannon_prism_judge from '../images/reward-catalog/runtime/prism-judge-cannon.webp?no-inline';
import head_prism_judge from '../images/reward-catalog/runtime/prism-judge-head.webp?no-inline';
import trail_prism_judge from '../images/reward-catalog/runtime/prism-judge-trail.webp?no-inline';
import bg_ember_remnant from '../images/reward-catalog/runtime/ember-remnant.webp?no-inline';
import thumb_ember_remnant from '../images/reward-catalog/preview/ember-remnant.webp?no-inline';
import bg_frozen_meridian from '../images/reward-catalog/runtime/frozen-meridian.webp?no-inline';
import thumb_frozen_meridian from '../images/reward-catalog/preview/frozen-meridian.webp?no-inline';
import bg_binary_veil from '../images/reward-catalog/runtime/binary-veil.webp?no-inline';
import thumb_binary_veil from '../images/reward-catalog/preview/binary-veil.webp?no-inline';
import bg_tether_citadel from '../images/reward-catalog/runtime/tether-citadel.webp?no-inline';
import thumb_tether_citadel from '../images/reward-catalog/preview/tether-citadel.webp?no-inline';
import bg_silver_dunes from '../images/reward-catalog/runtime/silver-dunes.webp?no-inline';
import thumb_silver_dunes from '../images/reward-catalog/preview/silver-dunes.webp?no-inline';
import bg_amber_hive from '../images/reward-catalog/runtime/amber-hive.webp?no-inline';
import thumb_amber_hive from '../images/reward-catalog/preview/amber-hive.webp?no-inline';
import bg_pearl_torrent from '../images/reward-catalog/runtime/pearl-torrent.webp?no-inline';
import thumb_pearl_torrent from '../images/reward-catalog/preview/pearl-torrent.webp?no-inline';
import bg_rust_cathedral from '../images/reward-catalog/runtime/rust-cathedral.webp?no-inline';
import thumb_rust_cathedral from '../images/reward-catalog/preview/rust-cathedral.webp?no-inline';
import bg_echo_scar from '../images/reward-catalog/runtime/echo-scar.webp?no-inline';
import thumb_echo_scar from '../images/reward-catalog/preview/echo-scar.webp?no-inline';
import bg_night_garden from '../images/reward-catalog/runtime/night-garden.webp?no-inline';
import thumb_night_garden from '../images/reward-catalog/preview/night-garden.webp?no-inline';

/** URLs only; decoded textures are requested lazily by existing shared loaders. */
export const REWARD_SHIP_ART = {
  'riftwake-strider': { url: ship_riftwake_strider, width: 56, height: 64, anchorX: .5, anchorY: .5 },
  'halo-drifter': { url: ship_halo_drifter, width: 56, height: 64, anchorX: .5, anchorY: .5 },
  'iron-orchid': { url: ship_iron_orchid, width: 56, height: 64, anchorX: .5, anchorY: .5 },
  'vesper-kite': { url: ship_vesper_kite, width: 56, height: 64, anchorX: .5, anchorY: .5 },
  'tidebreaker': { url: ship_tidebreaker, width: 56, height: 64, anchorX: .5, anchorY: .5 },
  'sunscar': { url: ship_sunscar, width: 56, height: 64, anchorX: .5, anchorY: .5 },
  'umbra-manta': { url: ship_umbra_manta, width: 56, height: 64, anchorX: .5, anchorY: .5 },
  'crown-wasp': { url: ship_crown_wasp, width: 56, height: 64, anchorX: .5, anchorY: .5 }
} satisfies Record<RewardShipId, { url: string; width: number; height: number; anchorX: number; anchorY: number }>;
export const REWARD_CANNON_ART = {
  'astral-fang': { url: cannon_astral_fang, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'frostbite': { url: cannon_frostbite, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'embercoil': { url: cannon_embercoil, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'voidspindle': { url: cannon_voidspindle, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'jade-serpent': { url: cannon_jade_serpent, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'sunhammer': { url: cannon_sunhammer, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'rose-thorn': { url: cannon_rose_thorn, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'starweaver': { url: cannon_starweaver, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'abyss-maw': { url: cannon_abyss_maw, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 },
  'prism-judge': { url: cannon_prism_judge, width: 30, height: 39, anchorX: .5, anchorY: .08, cableAnchorY: .9 }
} satisfies Record<RewardCannonId, { url: string; width: number; height: number; anchorX: number; anchorY: number; cableAnchorY: number }>;
export const REWARD_BACKGROUND_URLS = {
  'ember-remnant': bg_ember_remnant,
  'frozen-meridian': bg_frozen_meridian,
  'binary-veil': bg_binary_veil,
  'tether-citadel': bg_tether_citadel,
  'silver-dunes': bg_silver_dunes,
  'amber-hive': bg_amber_hive,
  'pearl-torrent': bg_pearl_torrent,
  'rust-cathedral': bg_rust_cathedral,
  'echo-scar': bg_echo_scar,
  'night-garden': bg_night_garden
} satisfies Record<RewardBackgroundId, string>;
export const REWARD_PROJECTILE_URLS = {
  'shot_astral_fang': head_astral_fang,
  'wake_astral_fang': trail_astral_fang,
  'shot_frostbite': head_frostbite,
  'wake_frostbite': trail_frostbite,
  'shot_embercoil': head_embercoil,
  'wake_embercoil': trail_embercoil,
  'shot_voidspindle': head_voidspindle,
  'wake_voidspindle': trail_voidspindle,
  'shot_jade_serpent': head_jade_serpent,
  'wake_jade_serpent': trail_jade_serpent,
  'shot_sunhammer': head_sunhammer,
  'wake_sunhammer': trail_sunhammer,
  'shot_rose_thorn': head_rose_thorn,
  'wake_rose_thorn': trail_rose_thorn,
  'shot_starweaver': head_starweaver,
  'wake_starweaver': trail_starweaver,
  'shot_abyss_maw': head_abyss_maw,
  'wake_abyss_maw': trail_abyss_maw,
  'shot_prism_judge': head_prism_judge,
  'wake_prism_judge': trail_prism_judge
} as const;
export const REWARD_PROJECTILE_ART = {
  'astral-fang': { headId: 'shot_astral_fang', trailId: 'wake_astral_fang' },
  'frostbite': { headId: 'shot_frostbite', trailId: 'wake_frostbite' },
  'embercoil': { headId: 'shot_embercoil', trailId: 'wake_embercoil' },
  'voidspindle': { headId: 'shot_voidspindle', trailId: 'wake_voidspindle' },
  'jade-serpent': { headId: 'shot_jade_serpent', trailId: 'wake_jade_serpent' },
  'sunhammer': { headId: 'shot_sunhammer', trailId: 'wake_sunhammer' },
  'rose-thorn': { headId: 'shot_rose_thorn', trailId: 'wake_rose_thorn' },
  'starweaver': { headId: 'shot_starweaver', trailId: 'wake_starweaver' },
  'abyss-maw': { headId: 'shot_abyss_maw', trailId: 'wake_abyss_maw' },
  'prism-judge': { headId: 'shot_prism_judge', trailId: 'wake_prism_judge' }
} as const;
export const REWARD_COSMETIC_IMAGES = {
  asterion, solstice,
  'riftwake-strider': ship_riftwake_strider,
  'halo-drifter': ship_halo_drifter,
  'iron-orchid': ship_iron_orchid,
  'vesper-kite': ship_vesper_kite,
  'tidebreaker': ship_tidebreaker,
  'sunscar': ship_sunscar,
  'umbra-manta': ship_umbra_manta,
  'crown-wasp': ship_crown_wasp,
  'astral-fang': cannon_astral_fang,
  'frostbite': cannon_frostbite,
  'embercoil': cannon_embercoil,
  'voidspindle': cannon_voidspindle,
  'jade-serpent': cannon_jade_serpent,
  'sunhammer': cannon_sunhammer,
  'rose-thorn': cannon_rose_thorn,
  'starweaver': cannon_starweaver,
  'abyss-maw': cannon_abyss_maw,
  'prism-judge': cannon_prism_judge,
  'ember-remnant': thumb_ember_remnant,
  'frozen-meridian': thumb_frozen_meridian,
  'binary-veil': thumb_binary_veil,
  'tether-citadel': thumb_tether_citadel,
  'silver-dunes': thumb_silver_dunes,
  'amber-hive': thumb_amber_hive,
  'pearl-torrent': thumb_pearl_torrent,
  'rust-cathedral': thumb_rust_cathedral,
  'echo-scar': thumb_echo_scar,
  'night-garden': thumb_night_garden
} satisfies Record<RewardCosmeticId, string>;

