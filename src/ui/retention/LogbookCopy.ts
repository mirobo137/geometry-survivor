const en = {
  description: 'Complete goals in normal runs and claim NOVA here. General goals renew with higher ranks and rewards; campaign goals are one-time.',
  rank: 'Rank', ready: 'COMPLETED · UNCLAIMED', claim: 'CLAIM', follow: 'TRACK GOAL',
  runs: 'Finish {target} normal runs since your last claim.',
  kills: 'Defeat {target} enemies since your last claim.',
  survival: 'Survive {target} min in a new normal run.', stages: 'Complete {target} Overdrive stages in a new run.',
  claimed: 'Reward claimed. Your next goal is now available.',
  'storage-error': 'Could not save. Your reward remains pending; please try again.',
  'wallet-full': 'Not enough room for the full reward. Spend NOVA and claim again.',
  busy: 'Another claim is in progress. Please wait.',
  'not-ready': 'This prize was already claimed or is not ready yet.',
  unavailable: 'Claiming requires HTTPS or localhost and an updated browser. Your reward remains pending.'
};
const es: Record<keyof typeof en, string> = {
  description: 'Completa objetivos en partidas normales y cobra aquí su NOVA. Al cobrar, los generales suben de rango y recompensa; los de campaña son únicos.',
  rank: 'Rango', ready: 'COMPLETADO · POR COBRAR', claim: 'COBRAR', follow: 'SEGUIR OBJETIVO',
  runs: 'Termina {target} partidas normales desde el último cobro.',
  kills: 'Derrota {target} enemigos desde el último cobro.',
  survival: 'Sobrevive {target} min en una nueva partida normal.', stages: 'Completa {target} etapas de Overdrive en una nueva partida.',
  claimed: 'Recompensa cobrada. El siguiente objetivo ya está disponible.',
  'storage-error': 'No se pudo guardar. Tu recompensa sigue pendiente; vuelve a intentar.',
  'wallet-full': 'No hay espacio para toda la recompensa. Gasta NOVA y vuelve a cobrar.',
  busy: 'Ya hay un cobro en curso. Espera un momento.',
  'not-ready': 'Este premio ya se cobró o todavía no está listo.',
  unavailable: 'El cobro requiere HTTPS o localhost y un navegador actualizado. Tu premio sigue pendiente.'
};
export const logbookCopy = (language: string): typeof en => language.startsWith('es') ? es : en;
