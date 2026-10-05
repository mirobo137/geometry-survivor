import { getRewardCosmetic, isRewardAvailable, type RewardCosmeticSource } from '../../content/retention/RewardCosmeticDefinitions';

/** Normal catalogue never purchases a season reward for its zero metadata price. */
export const getRewardCatalogAction = (id: unknown) => {
  const reward = getRewardCosmetic(id);
  if (!reward) return null;
  const available = isRewardAvailable(id);
  const source: RewardCosmeticSource = reward.source;
  const destination = source === 'daily-wheel' ? 'Ruleta diaria' : 'Retos y Bitácora';
  return {
    source, available,
    label: available ? `Ir a ${destination}` : 'Fuera de temporada',
    card: available ? source === 'daily-wheel' ? 'IR A RULETA · VER' : 'IR A BITÁCORA · VER' : 'PRÓXIMA TEMPORADA · VER',
    status: available ? `Recompensa actual de ${destination}; sin ventajas de combate.` : `No se ofrece esta semana. Volverá en la rotación de ${destination}.`
  };
};
