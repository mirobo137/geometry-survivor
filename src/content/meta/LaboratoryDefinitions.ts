import type { WeaponPathId } from '../upgrades/UpgradeDefinitions';

export const LABORATORY_MAX_RANK = 5;
export const LABORATORY_RANK_COSTS_NOVA = [875, 1_325, 2_000, 3_000, 4_500] as const;
export const LABORATORY_OFFER_SIZE = 3;
export const LABORATORY_DEFERRED_CHOICES = 2;
export const LABORATORY_HISTORY_LIMIT = 4;
export const LABORATORY_VITALITY_AD_MAX_RANK = 4;
export const LABORATORY_VITALITY_AD_TRIGGER_PURCHASES = 3;
export const LABORATORY_VITALITY_AD_PER_RANK = 0.01;

export type LaboratoryWeaponFamily = WeaponPathId;
export type WeaponDamageUpgradeId = `weapon_damage_${LaboratoryWeaponFamily}`;
export type LaboratoryUpgradeId =
  | 'global_damage'
  | WeaponDamageUpgradeId
  | 'weapon_cadence'
  | 'movement_speed'
  | 'max_health'
  | 'damage_resistance';

export type LaboratoryUpgradeEffect =
  | { readonly type: 'globalDamage'; readonly amountPerRank: number }
  | { readonly type: 'weaponDamage'; readonly family: LaboratoryWeaponFamily; readonly amountPerRank: number }
  | { readonly type: 'cadence'; readonly amountPerRank: number }
  | { readonly type: 'movementSpeed'; readonly amountPerRank: number }
  | { readonly type: 'maxHealth'; readonly amountPerRank: number }
  | { readonly type: 'damageResistance'; readonly amountPerRank: number };

export interface LaboratoryUpgradeDefinition {
  readonly id: LaboratoryUpgradeId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly maxRank: typeof LABORATORY_MAX_RANK;
  readonly costsNova: typeof LABORATORY_RANK_COSTS_NOVA;
  readonly effect: LaboratoryUpgradeEffect;
}

export interface LaboratoryPurchaseRecord {
  readonly upgradeId: LaboratoryUpgradeId;
  readonly rank: number;
  readonly costNova: number;
}

export interface LaboratoryDeferredOffer {
  readonly upgradeId: LaboratoryUpgradeId;
  readonly choicesRemaining: number;
}

/** This is the persistent, bounded research state; no active combat state is saved. */
export interface LaboratorySaveData {
  readonly levels: Readonly<Partial<Record<LaboratoryUpgradeId, number>>>;
  readonly currentOfferIds: readonly LaboratoryUpgradeId[];
  readonly deferredOffers: readonly LaboratoryDeferredOffer[];
  readonly history: readonly LaboratoryPurchaseRecord[];
  readonly purchasesSinceVitalityAd: number;
  readonly vitalityAdRank: number;
  readonly offerStep: number;
}

export interface LaboratoryCombatBonuses {
  /** Global multiplier applied before each weapon-family multiplier. */
  readonly weaponDamageMultiplier: number;
  readonly weaponDamageByFamily: Readonly<Record<WeaponPathId, number>>;
  readonly weaponCadenceMultiplier: number;
  readonly movementSpeedMultiplier: number;
  readonly maxHealthMultiplier: number;
  readonly incomingDamageMultiplier: number;
}

const costs = LABORATORY_RANK_COSTS_NOVA;
const rank: typeof LABORATORY_MAX_RANK = LABORATORY_MAX_RANK;

export const LABORATORY_WEAPON_FAMILIES: readonly {
  readonly id: LaboratoryWeaponFamily;
  readonly label: string;
  readonly icon: string;
}[] = [
  { id: 'projectile', label: 'Proyectil', icon: 'projectile' },
  { id: 'orbit', label: 'Órbita geométrica', icon: 'orbit' },
  { id: 'chain', label: 'Rayo en cadena', icon: 'chain' },
  { id: 'boomerang', label: 'Búmeran', icon: 'boomerang' },
  { id: 'pulse_ring', label: 'Pulse Ring', icon: 'pulse' },
  { id: 'magnetic_charge', label: 'Magnetic Charge', icon: 'magnet' }
];

export const LABORATORY_UPGRADE_DEFINITIONS: readonly LaboratoryUpgradeDefinition[] = [
  {
    id: 'global_damage',
    name: 'Matriz de impacto',
    description: 'Aumenta el daño de todas tus armas, incluidas sus evoluciones.',
    icon: 'critical',
    maxRank: rank,
    costsNova: costs,
    effect: { type: 'globalDamage', amountPerRank: 0.05 }
  },
  ...LABORATORY_WEAPON_FAMILIES.map((family) => ({
    id: `weapon_damage_${family.id}` as const,
    name: `Daño · ${family.label}`,
    description: `Refuerza cada impacto de ${family.label} y sus dos evoluciones.`,
    icon: family.icon,
    maxRank: rank,
    costsNova: costs,
    effect: { type: 'weaponDamage' as const, family: family.id, amountPerRank: 0.02 }
  })),
  {
    id: 'weapon_cadence',
    name: 'Calibración de fuego',
    description: 'Reduce los intervalos de activación de las armas, respetando sus mínimos seguros.',
    icon: 'volley',
    maxRank: rank,
    costsNova: costs,
    effect: { type: 'cadence', amountPerRank: 0.03 }
  },
  {
    id: 'movement_speed',
    name: 'Propulsores vectoriales',
    description: 'Aumenta la velocidad de movimiento base del piloto.',
    icon: 'speed',
    maxRank: rank,
    costsNova: costs,
    effect: { type: 'movementSpeed', amountPerRank: 0.02 }
  },
  {
    id: 'max_health',
    name: 'Integridad del casco',
    description: 'Aumenta la vida máxima y empieza cada partida con el casco completo.',
    icon: 'core',
    maxRank: rank,
    costsNova: costs,
    effect: { type: 'maxHealth', amountPerRank: 0.02 }
  },
  {
    id: 'damage_resistance',
    name: 'Blindaje reactivo',
    description: 'Reduce ligeramente el daño recibido después de aplicar el blindaje de la run.',
    icon: 'armor',
    maxRank: rank,
    costsNova: costs,
    effect: { type: 'damageResistance', amountPerRank: 0.01 }
  }
] as const;

const DEFINITION_BY_ID = new Map(LABORATORY_UPGRADE_DEFINITIONS.map((definition) => [definition.id, definition]));

export const isLaboratoryUpgradeId = (value: unknown): value is LaboratoryUpgradeId => (
  typeof value === 'string' && DEFINITION_BY_ID.has(value as LaboratoryUpgradeId)
);

export const getLaboratoryUpgradeDefinition = (id: LaboratoryUpgradeId): LaboratoryUpgradeDefinition => (
  DEFINITION_BY_ID.get(id) ?? LABORATORY_UPGRADE_DEFINITIONS[0]!
);

export const getWeaponDamageUpgradeId = (family: LaboratoryWeaponFamily): WeaponDamageUpgradeId => (
  `weapon_damage_${family}`
);

export const createDefaultLaboratorySaveData = (): LaboratorySaveData => ({
  levels: {},
  currentOfferIds: [],
  deferredOffers: [],
  history: [],
  purchasesSinceVitalityAd: 0,
  vitalityAdRank: 0,
  offerStep: 0
});

const asRecord = (value: unknown): Record<string, unknown> => (
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
);

const boundedInteger = (value: unknown, max: number): number => (
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(0, Math.floor(value)))
    : 0
);

export const normalizeLaboratorySaveData = (value: unknown): LaboratorySaveData => {
  const raw = asRecord(value);
  const rawLevels = asRecord(raw.levels);
  const levels: Partial<Record<LaboratoryUpgradeId, number>> = {};
  for (const definition of LABORATORY_UPGRADE_DEFINITIONS) {
    const level = boundedInteger(rawLevels[definition.id], definition.maxRank);
    if (level > 0) levels[definition.id] = level;
  }

  const seenOffers = new Set<LaboratoryUpgradeId>();
  const currentOfferIds: LaboratoryUpgradeId[] = [];
  if (Array.isArray(raw.currentOfferIds)) {
    for (const candidate of raw.currentOfferIds) {
      if (!isLaboratoryUpgradeId(candidate) || seenOffers.has(candidate)
        || (levels[candidate] ?? 0) >= getLaboratoryUpgradeDefinition(candidate).maxRank) continue;
      seenOffers.add(candidate);
      currentOfferIds.push(candidate);
      if (currentOfferIds.length >= LABORATORY_OFFER_SIZE) break;
    }
  }

  const deferredOffers: LaboratoryDeferredOffer[] = [];
  const seenDeferred = new Set<LaboratoryUpgradeId>();
  if (Array.isArray(raw.deferredOffers)) {
    for (const candidate of raw.deferredOffers) {
      const deferred = asRecord(candidate);
      const id = deferred.upgradeId;
      if (!isLaboratoryUpgradeId(id) || seenDeferred.has(id) || (levels[id] ?? 0) >= rank) continue;
      const choicesRemaining = boundedInteger(deferred.choicesRemaining, LABORATORY_DEFERRED_CHOICES);
      if (choicesRemaining <= 0) continue;
      seenDeferred.add(id);
      deferredOffers.push({ upgradeId: id, choicesRemaining });
      if (deferredOffers.length >= LABORATORY_UPGRADE_DEFINITIONS.length) break;
    }
  }

  const history: LaboratoryPurchaseRecord[] = [];
  if (Array.isArray(raw.history)) {
    for (const candidate of raw.history.slice(-LABORATORY_HISTORY_LIMIT)) {
      const entry = asRecord(candidate);
      if (!isLaboratoryUpgradeId(entry.upgradeId)) continue;
      history.push({
        upgradeId: entry.upgradeId,
        rank: boundedInteger(entry.rank, rank),
        costNova: boundedInteger(entry.costNova, LABORATORY_RANK_COSTS_NOVA.at(-1) ?? 0)
      });
    }
  }

  return {
    levels,
    currentOfferIds,
    deferredOffers,
    history,
    purchasesSinceVitalityAd: boundedInteger(raw.purchasesSinceVitalityAd, LABORATORY_VITALITY_AD_TRIGGER_PURCHASES),
    vitalityAdRank: boundedInteger(raw.vitalityAdRank, LABORATORY_VITALITY_AD_MAX_RANK),
    offerStep: boundedInteger(raw.offerStep, 1_000_000_000)
  };
};

const safeLevel = (levels: Readonly<Partial<Record<LaboratoryUpgradeId, number>>>, id: LaboratoryUpgradeId): number => {
  const value = levels[id];
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(rank, Math.max(0, Math.floor(value)))
    : 0;
};

export const getLaboratoryEffectTotal = (id: LaboratoryUpgradeId, level: number): number => {
  const definition = getLaboratoryUpgradeDefinition(id);
  const safe = Number.isFinite(level)
    ? Math.min(definition.maxRank, Math.max(0, Math.floor(level)))
    : 0;
  const amount = definition.effect.amountPerRank;
  if (definition.effect.type === 'cadence') return Math.max(0.75, 1 - safe * amount);
  if (definition.effect.type === 'damageResistance') return Math.max(0.95, 1 - safe * amount);
  return 1 + safe * amount;
};

export const getLaboratoryCombatBonuses = (
  levels: Readonly<Partial<Record<LaboratoryUpgradeId, number>>>,
  vitalityAdRank = 0
): LaboratoryCombatBonuses => {
  const globalDamage = getLaboratoryEffectTotal('global_damage', safeLevel(levels, 'global_damage'));
  const weaponDamageByFamily = Object.fromEntries(LABORATORY_WEAPON_FAMILIES.map((family) => {
    const level = safeLevel(levels, getWeaponDamageUpgradeId(family.id));
    return [family.id, 1 + level * 0.02];
  })) as Record<WeaponPathId, number>;

  const cadence = getLaboratoryEffectTotal('weapon_cadence', safeLevel(levels, 'weapon_cadence'));
  const movementSpeed = getLaboratoryEffectTotal('movement_speed', safeLevel(levels, 'movement_speed'));
  const safeVitalityAdRank = Number.isFinite(vitalityAdRank)
    ? Math.min(LABORATORY_VITALITY_AD_MAX_RANK, Math.max(0, Math.floor(vitalityAdRank)))
    : 0;
  const maxHealth = getLaboratoryEffectTotal('max_health', safeLevel(levels, 'max_health'))
    * (1 + safeVitalityAdRank * LABORATORY_VITALITY_AD_PER_RANK);
  const incomingDamage = getLaboratoryEffectTotal('damage_resistance', safeLevel(levels, 'damage_resistance'));

  return {
    weaponDamageMultiplier: globalDamage,
    weaponDamageByFamily,
    weaponCadenceMultiplier: cadence,
    movementSpeedMultiplier: movementSpeed,
    maxHealthMultiplier: maxHealth,
    incomingDamageMultiplier: incomingDamage
  };
};
