/** Stable cosmetic IDs. Pure content: no renderer, storage or DOM. */
export const REWARD_SHIP_IDS = ["riftwake-strider","halo-drifter","iron-orchid","vesper-kite","tidebreaker","sunscar","umbra-manta","crown-wasp"] as const;
export const REWARD_CANNON_IDS = ["astral-fang","frostbite","embercoil","voidspindle","jade-serpent","sunhammer","rose-thorn","starweaver","abyss-maw","prism-judge"] as const;
export const REWARD_BACKGROUND_IDS = ["ember-remnant","frozen-meridian","binary-veil","tether-citadel","silver-dunes","amber-hive","pearl-torrent","rust-cathedral","echo-scar","night-garden"] as const;
export type RewardShipId = typeof REWARD_SHIP_IDS[number];
export type RewardCannonId = typeof REWARD_CANNON_IDS[number];
export type RewardBackgroundId = typeof REWARD_BACKGROUND_IDS[number];
export type RewardCosmeticFamily = 'ship' | 'cannon' | 'background';
export type RewardCosmeticSource = 'weekly-logbook' | 'daily-wheel';
export const REWARD_COSMETICS = [
  {
    "id": "asterion",
    "family": "ship",
    "name": "Asterion Courier",
    "subtitle": "Mensajero de la última órbita",
    "description": "Escolta de marfil y titanio oscuro con reactor menta.",
    "source": "weekly-logbook"
  },
  {
    "id": "solstice",
    "family": "ship",
    "name": "Solstice Regent",
    "subtitle": "Corona del eclipse",
    "description": "Tres proas de oro y obsidiana alrededor de un reactor carmesí.",
    "source": "daily-wheel"
  },
  {
    "id": "riftwake-strider",
    "family": "ship",
    "name": "Riftwake Strider",
    "subtitle": "Quilla asimétrica",
    "description": "Una media luna grafito y tres aletas escalonadas escoltan un reactor de hielo.",
    "source": "weekly-logbook"
  },
  {
    "id": "halo-drifter",
    "family": "ship",
    "name": "Halo Drifter",
    "subtitle": "Órbita abierta",
    "description": "Un anillo abierto de cerámica índigo enmarca el vacío con dos motores gemelos.",
    "source": "daily-wheel"
  },
  {
    "id": "iron-orchid",
    "family": "ship",
    "name": "Iron Orchid",
    "subtitle": "Bastión transversal",
    "description": "Una proa de titanio rojo, ancha y pesada, protege una cintura de perla.",
    "source": "weekly-logbook"
  },
  {
    "id": "vesper-kite",
    "family": "ship",
    "name": "Vesper Kite",
    "subtitle": "Velas del ocaso",
    "description": "Cuatro velas ahumadas sostienen un diamante de latón y energía magenta.",
    "source": "daily-wheel"
  },
  {
    "id": "tidebreaker",
    "family": "ship",
    "name": "Tidebreaker",
    "subtitle": "Pinzas de la marea",
    "description": "Dos pinzas de jade abrazan una cabina compacta de porcelana.",
    "source": "weekly-logbook"
  },
  {
    "id": "sunscar",
    "family": "ship",
    "name": "Sunscar",
    "subtitle": "Aguja de la forja",
    "description": "Una proa bifurcada de cobre quemado corta el espacio con su espina naranja.",
    "source": "daily-wheel"
  },
  {
    "id": "umbra-manta",
    "family": "ship",
    "name": "Umbra Manta",
    "subtitle": "Alas de sombra",
    "description": "Alas dentadas de obsidiana rodean una cresta plateada y respiraderos granate.",
    "source": "weekly-logbook"
  },
  {
    "id": "crown-wasp",
    "family": "ship",
    "name": "Crown Wasp",
    "subtitle": "Caparazón de luz",
    "description": "Un casco dorado segmentado conserva dos mandíbulas y puntos de luz lima.",
    "source": "daily-wheel"
  },
  {
    "id": "astral-fang",
    "family": "cannon",
    "name": "Astral Fang",
    "subtitle": "Colmillo estelar",
    "description": "Colmillo de marfil; diamante azul y dos filamentos ámbar se curvan al salir.",
    "source": "weekly-logbook"
  },
  {
    "id": "frostbite",
    "family": "cannon",
    "name": "Frostbite",
    "subtitle": "Cristal polar",
    "description": "Prisma de escarcha; una esquirla de hielo serpentea sobre vapor bifurcado.",
    "source": "daily-wheel"
  },
  {
    "id": "embercoil",
    "family": "cannon",
    "name": "Embercoil",
    "subtitle": "Bobina de la forja",
    "description": "Bobina de cobre; un pulso fundido arrastra una cinta de brasas.",
    "source": "weekly-logbook"
  },
  {
    "id": "voidspindle",
    "family": "cannon",
    "name": "Voidspindle",
    "subtitle": "Huso del vacío",
    "description": "Huso telescópico oscuro; una lente violeta curva deja bandas de interferencia.",
    "source": "daily-wheel"
  },
  {
    "id": "jade-serpent",
    "family": "cannon",
    "name": "Jade Serpent",
    "subtitle": "Cintas de jade",
    "description": "Cuello de jade; una media luna menta ondula entre dos cintas esmeralda.",
    "source": "weekly-logbook"
  },
  {
    "id": "sunhammer",
    "family": "cannon",
    "name": "Sunhammer",
    "subtitle": "Martillo solar",
    "description": "Martillo industrial; un cincel ámbar deja una estela de plasma segmentado.",
    "source": "daily-wheel"
  },
  {
    "id": "rose-thorn",
    "family": "cannon",
    "name": "Rose Thorn",
    "subtitle": "Espina de la rosa",
    "description": "Espina granate; una aguja rosa deja pétalos encadenados.",
    "source": "weekly-logbook"
  },
  {
    "id": "starweaver",
    "family": "cannon",
    "name": "Starweaver",
    "subtitle": "Tejedor de constelaciones",
    "description": "Trenza de plata; una estrella blanca teje filamentos turquesa.",
    "source": "daily-wheel"
  },
  {
    "id": "abyss-maw",
    "family": "cannon",
    "name": "Abyss Maw",
    "subtitle": "Mandíbula abisal",
    "description": "Mandíbula abisal; un pulso anular dibuja dos lóbulos sobre una estela ondulada.",
    "source": "weekly-logbook"
  },
  {
    "id": "prism-judge",
    "family": "cannon",
    "name": "Prism Judge",
    "subtitle": "Veredicto prismático",
    "description": "Cuña de amatista; un chevrón lima vibra sobre cortes violeta.",
    "source": "daily-wheel"
  },
  {
    "id": "ember-remnant",
    "family": "background",
    "name": "Ember Remnant",
    "subtitle": "Vidrio de la supernova",
    "description": "Un remanente de vidrio fundido enmarca un gran vacío negro.",
    "source": "weekly-logbook"
  },
  {
    "id": "frozen-meridian",
    "family": "background",
    "name": "Frozen Meridian",
    "subtitle": "Meridiano glaciar",
    "description": "Acantilados de hielo antiguo resguardan un meridiano oscuro.",
    "source": "daily-wheel"
  },
  {
    "id": "binary-veil",
    "family": "background",
    "name": "Binary Veil",
    "subtitle": "Velos de estrellas gemelas",
    "description": "Dos lentes carmesí lejanas velan el vacío en esquinas opuestas.",
    "source": "weekly-logbook"
  },
  {
    "id": "tether-citadel",
    "family": "background",
    "name": "Tether Citadel",
    "subtitle": "Ciudad suspendida",
    "description": "Una ciudad suspendida de marfil rodea la penumbra.",
    "source": "daily-wheel"
  },
  {
    "id": "silver-dunes",
    "family": "background",
    "name": "Silver Dunes",
    "subtitle": "Desierto de plata",
    "description": "Dunas de polvo metálico reciben una aurora de plata.",
    "source": "weekly-logbook"
  },
  {
    "id": "amber-hive",
    "family": "background",
    "name": "Amber Hive",
    "subtitle": "Colmena fósil",
    "description": "Cavidades de piedra fósil conservan vetas de resina ámbar.",
    "source": "daily-wheel"
  },
  {
    "id": "pearl-torrent",
    "family": "background",
    "name": "Pearl Torrent",
    "subtitle": "Torrente de nácar",
    "description": "Láminas líquidas de nácar se pliegan alrededor de la oscuridad.",
    "source": "weekly-logbook"
  },
  {
    "id": "rust-cathedral",
    "family": "background",
    "name": "Rust Cathedral",
    "subtitle": "Catedral de óxido",
    "description": "Tubos de acero corroído forman una catedral distante.",
    "source": "daily-wheel"
  },
  {
    "id": "echo-scar",
    "family": "background",
    "name": "Echo Scar",
    "subtitle": "Cicatriz de ecos",
    "description": "Una cicatriz mineral corta el borde de un asteroide oscuro.",
    "source": "weekly-logbook"
  },
  {
    "id": "night-garden",
    "family": "background",
    "name": "Night Garden",
    "subtitle": "Jardín nocturno",
    "description": "Corales cósmicos apagados crecen fuera del espacio de combate.",
    "source": "daily-wheel"
  }
] as const;
export type RewardCosmetic = typeof REWARD_COSMETICS[number];
export type RewardCosmeticId = RewardCosmetic['id'];
export const getRewardCosmetic = (id: unknown): RewardCosmetic | undefined =>
  REWARD_COSMETICS.find(reward => reward.id === id);
export const REWARD_WEEK_ANCHOR = Date.UTC(2026, 9, 5);
export const REWARD_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** Boss rotation stays three weeks; reward editions independently rotate all 15 prizes per source. */
export const getSeasonalReward = (source: RewardCosmeticSource, nowMs = Date.now()): RewardCosmetic => {
  const now = Number.isFinite(nowMs) ? Math.min(Date.UTC(9999, 11, 31), Math.max(0, nowMs)) : REWARD_WEEK_ANCHOR;
  const week = Math.max(0, Math.floor((now - REWARD_WEEK_ANCHOR) / REWARD_WEEK_MS));
  const pool = REWARD_COSMETICS.filter(reward => reward.source === source);
  return pool[week % pool.length];
};
export const isRewardAvailable = (id: unknown, nowMs = Date.now()): boolean => {
  const reward = getRewardCosmetic(id);
  return !!reward && getSeasonalReward(reward.source, nowMs).id === reward.id;
};
