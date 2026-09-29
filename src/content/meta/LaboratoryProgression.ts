import {
  createDefaultLaboratorySaveData,
  getLaboratoryUpgradeDefinition,
  isLaboratoryUpgradeId,
  LABORATORY_DEFERRED_CHOICES,
  LABORATORY_HISTORY_LIMIT,
  LABORATORY_OFFER_SIZE,
  LABORATORY_RANK_COSTS_NOVA,
  LABORATORY_UPGRADE_DEFINITIONS,
  LABORATORY_VITALITY_AD_MAX_RANK,
  LABORATORY_VITALITY_AD_TRIGGER_PURCHASES,
  type LaboratorySaveData,
  type LaboratoryUpgradeId
} from './LaboratoryDefinitions';

export interface LaboratoryOfferResult {
  readonly data: LaboratorySaveData;
  readonly changed: boolean;
}

export interface LaboratoryPurchaseResult {
  readonly laboratory: LaboratorySaveData;
  readonly nova: number;
  readonly purchased: boolean;
}

const getEligibleIds = (data: LaboratorySaveData): LaboratoryUpgradeId[] => (
  LABORATORY_UPGRADE_DEFINITIONS
    .filter((definition) => (data.levels[definition.id] ?? 0) < definition.maxRank)
    .map((definition) => definition.id)
);

const shuffleDeterministically = (items: readonly LaboratoryUpgradeId[], step: number): LaboratoryUpgradeId[] => {
  const result = [...items];
  let state = (Math.imul(step + 1, 0x9e3779b1) ^ 0x6d2b79f5) >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const target = (state >>> 0) % (index + 1);
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
};

const normalizedDeferredMap = (data: LaboratorySaveData): Map<LaboratoryUpgradeId, number> => (
  new Map(data.deferredOffers.map((entry) => [entry.upgradeId, entry.choicesRemaining]))
);

const offerFor = (
  data: LaboratorySaveData,
  deferred: ReadonlyMap<LaboratoryUpgradeId, number>,
  step = data.offerStep
): readonly LaboratoryUpgradeId[] => {
  const eligible = getEligibleIds(data);
  const ready = eligible.filter((id) => (deferred.get(id) ?? 0) <= 0);
  const deferredEligible = eligible.filter((id) => (deferred.get(id) ?? 0) > 0);
  const candidates = shuffleDeterministically([...ready, ...deferredEligible], step);
  // Cooldown is a preference, not a dead-end: if fewer than three branches
  // remain ready, fill from the oldest deferred branches.
  const readySet = new Set(ready);
  candidates.sort((left, right) => Number(readySet.has(right)) - Number(readySet.has(left)));
  return candidates.slice(0, LABORATORY_OFFER_SIZE);
};

/** Keeps the currently displayed choices stable across menu visits and reloads. */
export const ensureLaboratoryOffer = (data: LaboratorySaveData): LaboratoryOfferResult => {
  const existing = data.currentOfferIds.filter((id) => (
    isLaboratoryUpgradeId(id)
    && (data.levels[id] ?? 0) < getLaboratoryUpgradeDefinition(id).maxRank
  ));
  if (existing.length > 0 && existing.length === data.currentOfferIds.length) {
    return { data, changed: false };
  }
  const deferred = normalizedDeferredMap(data);
  const currentOfferIds = offerFor(data, deferred);
  return {
    data: { ...data, currentOfferIds },
    changed: true
  };
};

export const getLaboratoryRadarIds = (
  data: LaboratorySaveData,
  count = 3
): readonly LaboratoryUpgradeId[] => {
  const current = new Set(data.currentOfferIds);
  const eligible = getEligibleIds(data).filter((id) => !current.has(id));
  const forecast = shuffleDeterministically(eligible, data.offerStep + 1);
  return forecast.slice(0, Math.max(0, Math.floor(count)));
};

export const purchaseLaboratoryUpgrade = (
  currentData: LaboratorySaveData,
  currentNova: number,
  upgradeId: LaboratoryUpgradeId
): LaboratoryPurchaseResult => {
  const ensured = ensureLaboratoryOffer(currentData).data;
  const definition = LABORATORY_UPGRADE_DEFINITIONS.find((candidate) => candidate.id === upgradeId);
  const currentRank = ensured.levels[upgradeId] ?? 0;
  const cost = definition?.costsNova[currentRank];
  if (!definition || !ensured.currentOfferIds.includes(upgradeId)
    || cost === undefined || !Number.isFinite(currentNova) || currentNova < cost) {
    return { laboratory: ensured, nova: currentNova, purchased: false };
  }

  const deferred = normalizedDeferredMap(ensured);
  for (const [id, remaining] of deferred) {
    const next = remaining - 1;
    if (next <= 0) deferred.delete(id);
    else deferred.set(id, next);
  }
  for (const id of ensured.currentOfferIds) {
    if (id !== upgradeId && (ensured.levels[id] ?? 0) < getLaboratoryUpgradeDefinition(id).maxRank) {
      deferred.set(id, LABORATORY_DEFERRED_CHOICES);
    }
  }

  const rank = currentRank + 1;
  const history = [
    ...ensured.history,
    { upgradeId, rank, costNova: cost }
  ].slice(-LABORATORY_HISTORY_LIMIT);
  const withoutOffer: LaboratorySaveData = {
    ...ensured,
    levels: { ...ensured.levels, [upgradeId]: rank },
    currentOfferIds: [],
    deferredOffers: Array.from(deferred, ([id, choicesRemaining]) => ({ upgradeId: id, choicesRemaining })),
    history,
    purchasesSinceVitalityAd: Math.min(
      LABORATORY_VITALITY_AD_TRIGGER_PURCHASES,
      ensured.purchasesSinceVitalityAd + 1
    ),
    offerStep: ensured.offerStep + 1
  };
  const nextOffer = offerFor(withoutOffer, deferred);
  return {
    laboratory: { ...withoutOffer, currentOfferIds: nextOffer },
    nova: Math.max(0, Math.floor(currentNova - cost)),
    purchased: true
  };
};

export const canClaimLaboratoryVitalityAd = (data: LaboratorySaveData): boolean => (
  data.vitalityAdRank < LABORATORY_VITALITY_AD_MAX_RANK
  && data.purchasesSinceVitalityAd >= LABORATORY_VITALITY_AD_TRIGGER_PURCHASES
);

/** Reward only advances after a confirmed rewarded result at the app boundary. */
export const claimLaboratoryVitalityAd = (data: LaboratorySaveData): LaboratorySaveData | null => {
  if (!canClaimLaboratoryVitalityAd(data)) return null;
  return {
    ...data,
    vitalityAdRank: data.vitalityAdRank + 1,
    purchasesSinceVitalityAd: 0
  };
};

export const createFreshLaboratory = (): LaboratorySaveData => {
  const data = createDefaultLaboratorySaveData();
  return ensureLaboratoryOffer(data).data;
};

export const getNextLaboratoryRankCost = (rank: number): number | null => (
  LABORATORY_RANK_COSTS_NOVA[Math.max(0, Math.floor(rank))] ?? null
);
