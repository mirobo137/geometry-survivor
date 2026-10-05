import type { BossId } from '../bosses/BossDefinition';
import type { CampaignActId } from '../../platform/save/SaveStore';

export type RetentionChallengeId = 'core-duel' | 'charger-evasion' | 'warden-duel' | 'fracture-duel';
export const RETENTION_CORE_CENTER_EXCLUSION_RADIUS = 112;
export type RetentionObjectiveId =
  | 'first-flight' | 'ten-flights' | 'hundred-kills' | 'five-hundred-kills' | 'fleet-breaker'
  | 'five-minutes' | 'core-hunter' | 'warden-hunter' | 'fracture-hunter'
  | 'radial-clear' | 'angular-clear' | 'fracture-clear' | 'overdrive-pilot';

export interface RetentionChallengeDefinition {
  readonly id: RetentionChallengeId;
  readonly title: string;
  readonly eyebrow: string;
  readonly briefing: string;
  readonly rules: readonly string[];
  readonly artId: 'core-sentinel' | 'charger' | 'orbital-warden' | 'fracture-engine';
  readonly actId: CampaignActId;
  readonly bossId: BossId | null;
  readonly durationSeconds: number | null;
  readonly noHitRequired: boolean;
  /** Optional physical arena obstacle radius; only the named event receives it. */
  readonly centerExclusionRadius?: number;
}

export const RETENTION_CHALLENGES: readonly RetentionChallengeDefinition[] = [
  {
    id: 'core-duel', title: 'El Guardián del Núcleo', eyebrow: 'DUELO · CORE SENTINEL',
    briefing: 'El núcleo está sellado: mantente fuera del anillo central y derrota al Core Sentinel sin recibir impactos.',
    rules: ['Build de proyectil fija, sin Laboratorio ni cartas.', 'La barrera del núcleo impide entrar en el centro.', 'Un impacto conectado, incluso bloqueado por escudo, termina el intento.', 'Sin oleadas comunes, anuncios o reanimación; reintentos gratuitos.'],
    artId: 'core-sentinel', actId: 'radial', bossId: 'core-sentinel', durationSeconds: null,
    noHitRequired: true, centerExclusionRadius: RETENTION_CORE_CENTER_EXCLUSION_RADIUS
  },
  {
    id: 'warden-duel', title: 'El portanaves orbital', eyebrow: 'DUELO · ORBITAL WARDEN',
    briefing: 'Desarma la formación del Orbital Warden sin recibir impactos. Sus réplicas y todo su arsenal siguen activos.',
    rules: ['Build de proyectil fija, sin Laboratorio ni cartas.', 'Las réplicas caen con dos impactos del Proyectil base.', 'Un impacto, incluso bloqueado por escudo, termina el intento.', 'Réplicas, barridos, cargas, curvas y anillo siguen activos; reintentos gratuitos.'],
    artId: 'orbital-warden', actId: 'angular', bossId: 'orbital-warden', durationSeconds: null, noHitRequired: true
  },
  {
    id: 'fracture-duel', title: 'La máquina de fractura', eyebrow: 'DUELO · FRACTURE ENGINE',
    briefing: 'Silencia al Fracture Engine sin recibir impactos. Lee cada descarga, espina, zigzag y mina.',
    rules: ['Build de proyectil fija, sin Laboratorio ni cartas.', 'Un impacto conectado, incluso bloqueado por escudo, termina el intento.', 'El kit completo del boss permanece activo; sin oleadas comunes, anuncios o reanimación.'],
    artId: 'fracture-engine', actId: 'fracture', bossId: 'fracture-engine', durationSeconds: null, noHitRequired: true
  },
  {
    id: 'charger-evasion', title: 'Línea de impacto', eyebrow: 'EVASIÓN · CHARGERS · 60 S',
    briefing: 'No dispares: sobrevive un minuto leyendo avisos y abriendo rutas de escape entre los arietes.',
    rules: ['Sin armas, órbitas ni daño automático.', 'Hasta cinco Chargers; sólo uno se compromete a embestir a la vez.', 'Cuenta simulación activa: pausa e introducción no consumen tiempo.'],
    artId: 'charger', actId: 'radial', bossId: null, durationSeconds: 60, noHitRequired: false
  }
] as const;

const CHALLENGE_BY_ID = new Map(RETENTION_CHALLENGES.map(definition => [definition.id, definition]));
export const getRetentionChallenge = (id: RetentionChallengeId): RetentionChallengeDefinition => CHALLENGE_BY_ID.get(id)!;
export const isRetentionChallengeId = (value: unknown): value is RetentionChallengeId => (
  typeof value === 'string' && CHALLENGE_BY_ID.has(value as RetentionChallengeId)
);

export interface RetentionWeeklyEdition {
  readonly challenge: RetentionChallengeDefinition;
  readonly editionId: string;
  readonly weekIndex: number;
  readonly startsAtMs: number;
  readonly nextChangeMs: number;
  readonly scheduleStarted: boolean;
}

export const RETENTION_WEEK_ANCHOR_UTC = Date.UTC(2026, 9, 5);
export const RETENTION_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const RETENTION_WEEKLY_SKIN_ID = 'asterion' as const;
export const RETENTION_WEEKLY_NOVA_AFTER_COLLECTION = 250;
const RETENTION_WEEKLY_CHALLENGES = RETENTION_CHALLENGES.filter(challenge => challenge.bossId !== null);
const RETENTION_CATALOG_VERSION = 2;
const MAX_RETENTION_CLOCK_MS = Date.UTC(9999, 11, 31, 23, 59, 59, 999);

/** Fixed UTC calendar: retries and reloads resolve the same authored edition. */
export const getRetentionWeeklyEdition = (nowMs = Date.now()): RetentionWeeklyEdition => {
  const now = Number.isFinite(nowMs) ? Math.min(MAX_RETENTION_CLOCK_MS, Math.max(0, nowMs)) : RETENTION_WEEK_ANCHOR_UTC;
  const weekIndex = Math.max(0, Math.floor((now - RETENTION_WEEK_ANCHOR_UTC) / RETENTION_WEEK_MS));
  const startsAtMs = RETENTION_WEEK_ANCHOR_UTC + weekIndex * RETENTION_WEEK_MS;
  const nextChangeMs = startsAtMs + RETENTION_WEEK_MS;
  const challenge = RETENTION_WEEKLY_CHALLENGES[weekIndex % RETENTION_WEEKLY_CHALLENGES.length];
  const dateKey = new Date(startsAtMs).toISOString().slice(0, 10).replaceAll('-', '');
  return {
    challenge,
    editionId: `rf${RETENTION_CATALOG_VERSION}-${dateKey}-${challenge.id}`,
    weekIndex,
    startsAtMs,
    nextChangeMs,
    scheduleStarted: now >= RETENTION_WEEK_ANCHOR_UTC
  };
};

export type RetentionMetric =
  | 'runsCompleted' | 'totalKills' | 'bestSurvivalSeconds'
  | 'coreBosses' | 'wardenBosses' | 'fractureBosses'
  | 'radialVictories' | 'angularVictories' | 'fractureVictories' | 'overdriveStages';

export interface RetentionObjectiveDefinition {
  readonly id: RetentionObjectiveId;
  readonly title: string;
  readonly description: string;
  readonly artId: RetentionChallengeDefinition['artId'];
  readonly metric: RetentionMetric;
  readonly target: number;
  readonly rewardNova: number;
}

/** Small authored set: recognition and modest NOVA, never permanent power. */
export const RETENTION_OBJECTIVES: readonly RetentionObjectiveDefinition[] = [
  { id: 'first-flight', title: 'Primera travesía', description: 'Termina una run normal.', artId: 'core-sentinel', metric: 'runsCompleted', target: 1, rewardNova: 50 },
  { id: 'ten-flights', title: 'Piloto constante', description: 'Termina diez runs normales.', artId: 'orbital-warden', metric: 'runsCompleted', target: 10, rewardNova: 100 },
  { id: 'hundred-kills', title: 'Primer centenar', description: 'Derrota cien enemigos en runs normales.', artId: 'charger', metric: 'totalKills', target: 100, rewardNova: 50 },
  { id: 'five-hundred-kills', title: 'Control de flota', description: 'Derrota quinientos enemigos en total.', artId: 'fracture-engine', metric: 'totalKills', target: 500, rewardNova: 100 },
  { id: 'fleet-breaker', title: 'Rompelíneas', description: 'Derrota 1,500 enemigos en total.', artId: 'orbital-warden', metric: 'totalKills', target: 1500, rewardNova: 150 },
  { id: 'five-minutes', title: 'Pulso firme', description: 'Alcanza cinco minutos en una run normal.', artId: 'charger', metric: 'bestSurvivalSeconds', target: 300, rewardNova: 75 },
  { id: 'core-hunter', title: 'Centinela abatido', description: 'Derrota al Core Sentinel en campaña.', artId: 'core-sentinel', metric: 'coreBosses', target: 1, rewardNova: 100 },
  { id: 'warden-hunter', title: 'Formación rota', description: 'Derrota al Orbital Warden en campaña.', artId: 'orbital-warden', metric: 'wardenBosses', target: 1, rewardNova: 125 },
  { id: 'fracture-hunter', title: 'Motor silenciado', description: 'Derrota al Fracture Engine en campaña.', artId: 'fracture-engine', metric: 'fractureBosses', target: 1, rewardNova: 150 },
  { id: 'radial-clear', title: 'Ruta radial', description: 'Completa el Acto I.', artId: 'core-sentinel', metric: 'radialVictories', target: 1, rewardNova: 75 },
  { id: 'angular-clear', title: 'Ruta angular', description: 'Completa el Acto II.', artId: 'orbital-warden', metric: 'angularVictories', target: 1, rewardNova: 100 },
  { id: 'fracture-clear', title: 'Ruta Fracture', description: 'Completa el Acto III.', artId: 'fracture-engine', metric: 'fractureVictories', target: 1, rewardNova: 150 },
  { id: 'overdrive-pilot', title: 'Más allá del límite', description: 'Completa tres etapas de Overdrive en una run.', artId: 'charger', metric: 'overdriveStages', target: 3, rewardNova: 200 }
] as const;

const OBJECTIVE_BY_ID = new Map(RETENTION_OBJECTIVES.map(objective => [objective.id, objective]));
export const isOneTimeRetentionObjective = (id: RetentionObjectiveId): boolean =>
  ['core-hunter', 'warden-hunter', 'fracture-hunter', 'radial-clear', 'angular-clear', 'fracture-clear'].includes(id);
export interface RetentionObjectiveCycle { readonly claimed: number; readonly value: number }
export interface RetentionClaimResult {
  readonly status: 'claimed' | 'not-ready' | 'storage-error' | 'busy' | 'wallet-full' | 'unavailable';
  readonly progress: RetentionSaveData;
  readonly walletNova: number;
}
const defaultCycles = () => Object.fromEntries(RETENTION_OBJECTIVES.map(objective => [objective.id, { claimed: 0, value: 0 }])) as Record<RetentionObjectiveId, RetentionObjectiveCycle>;
export const isRetentionObjectiveId = (value: unknown): value is RetentionObjectiveId => (
  typeof value === 'string' && OBJECTIVE_BY_ID.has(value as RetentionObjectiveId)
);

export interface RetentionSaveData {
  readonly objectiveCycles: Readonly<Record<RetentionObjectiveId, RetentionObjectiveCycle>>;
  readonly runsCompleted: number;
  readonly totalKills: number;
  readonly bestSurvivalSeconds: number;
  readonly bossDefeats: Readonly<Record<BossId, number>>;
  readonly actVictories: Readonly<Record<CampaignActId, number>>;
  readonly overdriveStages: number;
  readonly completedObjectiveIds: readonly RetentionObjectiveId[];
  readonly selectedObjectiveId: RetentionObjectiveId;
  readonly weeklyClaimIds: readonly string[];
}

export const createDefaultRetentionSaveData = (): RetentionSaveData => ({
  objectiveCycles: defaultCycles(),
  runsCompleted: 0,
  totalKills: 0,
  bestSurvivalSeconds: 0,
  bossDefeats: { 'core-sentinel': 0, 'orbital-warden': 0, 'fracture-engine': 0 },
  actVictories: { radial: 0, angular: 0, fracture: 0 },
  overdriveStages: 0,
  completedObjectiveIds: [],
  selectedObjectiveId: 'first-flight',
  weeklyClaimIds: []
});

const nonNegativeInt = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? Math.min(1_000_000_000, Math.max(0, Math.floor(value))) : fallback
);

export const normalizeRetentionSaveData = (value: unknown): RetentionSaveData => {
  const defaults = createDefaultRetentionSaveData();
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return defaults;
  const raw = value as Record<string, unknown>;
  const bosses = typeof raw.bossDefeats === 'object' && raw.bossDefeats !== null ? raw.bossDefeats as Record<string, unknown> : {};
  const acts = typeof raw.actVictories === 'object' && raw.actVictories !== null ? raw.actVictories as Record<string, unknown> : {};
  const completed = Array.isArray(raw.completedObjectiveIds)
    ? Array.from(new Set(raw.completedObjectiveIds.filter(isRetentionObjectiveId))).slice(0, RETENTION_OBJECTIVES.length)
    : [];
  const claims = Array.isArray(raw.weeklyClaimIds)
    ? Array.from(new Set(raw.weeklyClaimIds.filter((item): item is string => typeof item === 'string' && /^rf\d+-\d{8}-(core-duel|charger-evasion|warden-duel|fracture-duel)$/.test(item)))).slice(-52)
    : [];
  const base = {
    runsCompleted: nonNegativeInt(raw.runsCompleted),
    totalKills: nonNegativeInt(raw.totalKills),
    bestSurvivalSeconds: Math.min(86_400, Math.max(0, typeof raw.bestSurvivalSeconds === 'number' && Number.isFinite(raw.bestSurvivalSeconds) ? raw.bestSurvivalSeconds : 0)),
    bossDefeats: {
      'core-sentinel': nonNegativeInt(bosses['core-sentinel']),
      'orbital-warden': nonNegativeInt(bosses['orbital-warden']),
      'fracture-engine': nonNegativeInt(bosses['fracture-engine'])
    },
    actVictories: {
      radial: nonNegativeInt(acts.radial), angular: nonNegativeInt(acts.angular), fracture: nonNegativeInt(acts.fracture)
    },
    overdriveStages: nonNegativeInt(raw.overdriveStages),
    completedObjectiveIds: completed,
    selectedObjectiveId: isRetentionObjectiveId(raw.selectedObjectiveId) ? raw.selectedObjectiveId : defaults.selectedObjectiveId,
    weeklyClaimIds: claims
  };
  const cycles = raw.objectiveCycles && typeof raw.objectiveCycles === 'object' ? raw.objectiveCycles as Record<string, unknown> : {};
  const objectiveCycles = defaultCycles();
  for (const objective of RETENTION_OBJECTIVES) {
    const entry = cycles[objective.id];
    const cycle = entry && typeof entry === 'object' ? entry as Record<string, unknown> : null;
    const claimed = Math.max(cycle ? nonNegativeInt(cycle.claimed) : 0, completed.includes(objective.id) ? 1 : 0);
    objectiveCycles[objective.id] = {
      claimed,
      // Legacy completed IDs already received their NOVA. Start a new round,
      // never pay them again. Unclaimed legacy progress remains usable.
      value: cycle ? nonNegativeInt(cycle.value) : claimed > 0 ? 0 : metricValue({ ...base, objectiveCycles }, objective.metric)
    };
  }
  return { ...base, objectiveCycles };
};

export interface RetentionRunRecord {
  readonly outcome: 'game-over' | 'victory';
  readonly kills: number;
  readonly elapsedSeconds: number;
  readonly route: CampaignActId | 'overdrive';
  readonly overdriveStages: number;
  readonly bossDefeats: Readonly<Partial<Record<BossId, number>>>;
}

export interface RetentionRunUpdate {
  readonly progress: RetentionSaveData;
  readonly candidate: RetentionSaveData;
  readonly newlyCompleted: readonly RetentionObjectiveDefinition[];
  readonly rewardNova: number;
}

const metricValue = (data: RetentionSaveData, metric: RetentionMetric): number => {
  switch (metric) {
    case 'runsCompleted': return data.runsCompleted;
    case 'totalKills': return data.totalKills;
    case 'bestSurvivalSeconds': return data.bestSurvivalSeconds;
    case 'coreBosses': return data.bossDefeats['core-sentinel'];
    case 'wardenBosses': return data.bossDefeats['orbital-warden'];
    case 'fractureBosses': return data.bossDefeats['fracture-engine'];
    case 'radialVictories': return data.actVictories.radial;
    case 'angularVictories': return data.actVictories.angular;
    case 'fractureVictories': return data.actVictories.fracture;
    case 'overdriveStages': return data.overdriveStages;
  }
};

export const getRetentionObjectiveProgress = (data: RetentionSaveData, id: RetentionObjectiveId) => {
  const base = OBJECTIVE_BY_ID.get(id)!;
  const cycle = data.objectiveCycles[id];
  const repeatable = !isOneTimeRetentionObjective(id);
  const rank = cycle.claimed + 1;
  const target = Math.min(1_000_000_000, !repeatable ? base.target : base.metric === 'bestSurvivalSeconds'
    ? base.target + cycle.claimed * 60 : base.metric === 'overdriveStages'
      ? base.target + cycle.claimed : Math.ceil(base.target * rank));
  const definition = { ...base, target, rewardNova: base.rewardNova + Math.ceil(base.rewardNova * .25 * (repeatable ? cycle.claimed : 0)) };
  return {
    definition,
    rank, repeatable,
    retired: !repeatable && cycle.claimed > 0,
    value: Math.min(definition.target, cycle.value),
    completed: cycle.value >= definition.target && (repeatable || cycle.claimed === 0)
  };
};

/** Consumes only a ready offer. NOVA is committed by the application service. */
export const claimRetentionObjective = (current: RetentionSaveData, id: RetentionObjectiveId) => {
  const state = getRetentionObjectiveProgress(current, id);
  if (!state.completed) return null;
  let progress = normalizeRetentionSaveData({ ...current,
    completedObjectiveIds: Array.from(new Set([...current.completedObjectiveIds, id])),
    objectiveCycles: { ...current.objectiveCycles, [id]: { claimed: current.objectiveCycles[id].claimed + 1, value: 0 } }
  });
  if (state.retired || (!state.repeatable && current.selectedObjectiveId === id)) {
    progress = { ...progress, selectedObjectiveId: RETENTION_OBJECTIVES.find(objective => !getRetentionObjectiveProgress(progress, objective.id).retired)!.id };
  }
  return { progress, rewardNova: state.definition.rewardNova };
};

export const recordRetentionRun = (current: RetentionSaveData, run: RetentionRunRecord): RetentionRunUpdate => {
  const campaignBossDefeats = run.route === 'overdrive' ? {} : run.bossDefeats;
  const progress = normalizeRetentionSaveData({
    ...current,
    runsCompleted: current.runsCompleted + 1,
    totalKills: current.totalKills + run.kills,
    bestSurvivalSeconds: Math.max(current.bestSurvivalSeconds, run.elapsedSeconds),
    bossDefeats: {
      ...current.bossDefeats,
      'core-sentinel': current.bossDefeats['core-sentinel'] + (campaignBossDefeats['core-sentinel'] ?? 0),
      'orbital-warden': current.bossDefeats['orbital-warden'] + (campaignBossDefeats['orbital-warden'] ?? 0),
      'fracture-engine': current.bossDefeats['fracture-engine'] + (campaignBossDefeats['fracture-engine'] ?? 0)
    },
    actVictories: {
      ...current.actVictories,
      ...(run.outcome === 'victory' && run.route !== 'overdrive' ? { [run.route]: current.actVictories[run.route] + 1 } : {})
    },
    overdriveStages: Math.max(current.overdriveStages, run.route === 'overdrive' ? run.overdriveStages : 0)
  });
  const objectiveCycles = { ...current.objectiveCycles };
  const newlyCompleted: RetentionObjectiveDefinition[] = [];
  for (const objective of RETENTION_OBJECTIVES) {
    const before = getRetentionObjectiveProgress(current, objective.id);
    if (before.retired || before.completed) continue;
    const delta = objective.metric === 'runsCompleted' ? 1 : objective.metric === 'totalKills' ? run.kills
      : objective.metric === 'bestSurvivalSeconds' ? run.elapsedSeconds
      : objective.metric === 'overdriveStages' ? run.route === 'overdrive' ? run.overdriveStages : 0
      : metricValue(progress, objective.metric) - metricValue(current, objective.metric);
    const value = ['bestSurvivalSeconds', 'overdriveStages'].includes(objective.metric)
      ? Math.max(before.value, nonNegativeInt(delta)) : before.value + nonNegativeInt(delta);
    objectiveCycles[objective.id] = { ...current.objectiveCycles[objective.id], value: Math.min(before.definition.target, value) };
    if (value >= before.definition.target) newlyCompleted.push(before.definition);
  }
  const candidate = normalizeRetentionSaveData({ ...progress, objectiveCycles });
  return { progress: candidate, candidate, newlyCompleted, rewardNova: 0 };
};

export const retentionProgressHighlights = (
  data: RetentionSaveData,
  newlyCompleted: readonly RetentionObjectiveDefinition[] = []
): readonly string[] => {
  const completed = newlyCompleted.slice(0, 3).map(objective => `POR COBRAR · ${objective.title} · +${objective.rewardNova} NOVA`);
  const seen = new Set(newlyCompleted.map(objective => objective.id));
  const selected = OBJECTIVE_BY_ID.get(data.selectedObjectiveId);
  const candidates = [selected, ...RETENTION_OBJECTIVES].filter((objective): objective is RetentionObjectiveDefinition => (
    objective !== undefined && !seen.has(objective.id) && !getRetentionObjectiveProgress(data, objective.id).retired
  ));
  for (const objective of candidates) {
    if (completed.length >= 3) break;
    const state = getRetentionObjectiveProgress(data, objective.id);
    const value = state.value;
    if (value === 0 && objective.id !== data.selectedObjectiveId) continue;
    completed.push(state.completed ? `POR COBRAR · ${objective.title} · +${state.definition.rewardNova} NOVA`
      : `BITÁCORA · ${objective.title} · ${value}/${state.definition.target}`);
  }
  return completed;
};
