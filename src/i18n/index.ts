import i18next from 'i18next';
import { CATALOG_EN, CATALOG_ES } from './catalog';

export type Language = 'es' | 'en';
export type LanguagePreference = 'auto' | Language;

export const LANGUAGE_PREFERENCE_KEY = 'geometry-survivor:language-preference';
export const LANGUAGE_CHANGE_EVENT = 'geometry-survivor:language-changed';

const resources = {
  es: { translation: CATALOG_ES },
  en: { translation: CATALOG_EN }
} as const;

let domObserver: MutationObserver | null = null;
const translatedText = new WeakMap<Text, { source: string; output: string }>();
const translatedAttributes = new WeakMap<Element, Map<string, { source: string; output: string }>>();
const localizedAttributes = ['aria-label', 'aria-description', 'title', 'placeholder', 'alt'] as const;

export const detectBrowserLanguage = (languages: readonly string[]): Language => {
  for (const candidate of languages) {
    const base = candidate.trim().toLowerCase().split(/[-_]/, 1)[0];
    if (base === 'es' || base === 'en') return base;
  }
  return 'en';
};

export const isLanguagePreference = (value: unknown): value is LanguagePreference => (
  value === 'auto' || value === 'es' || value === 'en'
);

const readPreference = (): LanguagePreference => {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    return isLanguagePreference(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
};

const browserLanguages = (): readonly string[] => {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
};

const resolvedLanguage = (preference: LanguagePreference): Language => (
  preference === 'auto' ? detectBrowserLanguage(browserLanguages()) : preference
);

export const getLanguagePreference = (): LanguagePreference => readPreference();
export const getLanguage = (): Language => i18next.language.startsWith('es') ? 'es' : 'en';
export const getFormattingLocale = (): 'es-MX' | 'en-US' => getLanguage() === 'es' ? 'es-MX' : 'en-US';

const translateDynamicText = (source: string, language: Language): string | null => {
  if (language === 'en') {
    const patterns: readonly [RegExp, (match: RegExpMatchArray) => string][] = [
      [/^ASALTO ×(\d+) · JEFE (\d+) · (\d+)\/(\d+)$/, match => `ASSAULT ×${match[1]} · BOSS ${match[2]} · ${match[3]}/${match[4]}`],
      [/^ASALTO ×(\d+) · JEFE (\d+) · LISTO$/, match => `ASSAULT ×${match[1]} · BOSS ${match[2]} · READY`],
      [/^ASALTO ×(\d+) · SIG\. (\d+) · (\d+)\/(\d+)$/, match => `ASSAULT ×${match[1]} · NEXT ${match[2]} · ${match[3]}/${match[4]}`],
      [/^ASALTO ×(\d+) · SIG\. (\d+) · LISTO$/, match => `ASSAULT ×${match[1]} · NEXT ${match[2]} · READY`],
      [/^Tiempo (.+)$/, match => `Time ${match[1]}`],
      [/^Bajas (.+)$/, match => `Kills ${match[1]}`],
      [/^Experiencia (.+)$/, match => `Experience ${match[1]}`],
      [/^Puntuación (.+)$/, match => `Score ${match[1]}`],
      [/^Mejor (.+) · (.+) puntos$/, match => `Best ${match[1]} · ${match[2]} points`],
      [/^NAVE EQUIPADA · (.+)$/, match => `EQUIPPED SHIP · ${i18next.t(match[1], { defaultValue: match[1] })}`],
      [/^OVERDRIVE · VUELTA (\d+)$/, match => `OVERDRIVE · LAP ${match[1]}`],
      [/^TRAMO (\d+)$/, match => `STAGE ${match[1]}`],
      [/^Nivel (\d+) · EVOLUCIÓN DISPONIBLE$/, match => `Level ${match[1]} · EVOLUTION AVAILABLE`],
      [/^Nivel (\d+) · EVOLUCIÓN$/, match => `Level ${match[1]} · EVOLUTION`],
      [/^Nivel (\d+) · MAESTRÍA$/, match => `Level ${match[1]} · MASTERY`],
      [/^Valor actual (.+), siguiente (.+)$/, match => `Current value ${match[1]}, next ${match[2]}`],
      [/^RANGO (\d+) · PROGRESO (\d+)\/(\d+)$/, match => `RANK ${match[1]} · PROGRESS ${match[2]}/${match[3]}`],
      [/^RANGO (\d+) DE (\d+) · ACTUAL (\d+)\/(\d+)$/, match => `RANK ${match[1]} OF ${match[2]} · CURRENT ${match[3]}/${match[4]}`],
      [/^Daño · (.+)$/, match => `Damage · ${i18next.t(match[1], { defaultValue: match[1] })}`],
      [/^Refuerza cada impacto de (.+) y sus dos evoluciones\.$/, match => `Strengthens every hit from ${i18next.t(match[1], { defaultValue: match[1] })} and its two evolutions.`],
      [/^\+(.+) de daño global por rango$/, match => `+${match[1]} global damage per rank`],
      [/^\+(.+) de daño de esta familia por rango$/, match => `+${match[1]} family damage per rank`],
      [/^−(.+) de intervalo por rango$/, match => `−${match[1]} cooldown per rank`],
      [/^\+(.+) de velocidad por rango$/, match => `+${match[1]} movement speed per rank`],
      [/^\+(.+) de vida máxima por rango$/, match => `+${match[1]} max health per rank`],
      [/^−(.+) de daño recibido por rango$/, match => `−${match[1]} damage taken per rank`],
      [/^Daño global \+(.+)$/, match => `Global damage +${match[1]}`],
      [/^Intervalo de armas −(.+)$/, match => `Weapon cooldown −${match[1]}`],
      [/^Velocidad \+(.+)$/, match => `Movement speed +${match[1]}`],
      [/^Vida máxima NOVA \+(.+)$/, match => `NOVA max health +${match[1]}`],
      [/^Daño recibido −(.+)$/, match => `Damage taken −${match[1]}`],
      [/^Progreso de compras: (\d+)\/3 NOVA · Vitalidad acumulada: \+(.+)$/, match => `Purchase progress: ${match[1]}/3 NOVA · Total vitality: +${match[2]}`],
      [/^Este rango ya está integrado\. Tu rama ya avanzó hasta R(\d+)\.$/, match => `This rank is already integrated. Your branch has advanced to R${match[1]}.`],
      [/^Tu rama ya avanzó hasta R(\d+)\.$/, match => `Your branch has advanced to R${match[1]}.`],
      [/^Tienes una oferta pendiente: (.+)\.$/, match => `You have a pending offer: ${match[1]}.`],
      [/^NAVE EXCLUSIVA · (.+)$/, match => `EXCLUSIVE SHIP · ${match[1]}`],
      [/^CAÑÓN EXCLUSIVO · (.+)$/, match => `EXCLUSIVE CANNON · ${match[1]}`],
      [/^FONDO EXCLUSIVO · (.+)$/, match => `EXCLUSIVE BACKGROUND · ${match[1]}`],
      [/^SIGUIENTE ROTACIÓN · (.+)$/, match => `NEXT ROTATION · ${match[1]}`],
      [/^LA ROTACIÓN COMIENZA · (.+)$/, match => `ROTATION BEGINS · ${match[1]}`],
      [/^POR COBRAR · (.+) · \+(.+) NOVA$/, match => `READY TO CLAIM · ${match[1]} · +${match[2]} NOVA`],
      [/^BITÁCORA · (.+) · (.+)\/(.+)$/, match => `LOGBOOK · ${match[1]} · ${match[2]}/${match[3]}`],
      [/^(.+) · Rango (\d+)$/, match => `${translateText(match[1])} · Rank ${match[2]}`],
      [/^Termina (.+) partidas normales desde el último cobro\.$/, match => `Finish ${match[1]} normal runs since your last claim.`],
      [/^Derrota (.+) enemigos desde el último cobro\.$/, match => `Defeat ${match[1]} enemies since your last claim.`],
      [/^Sobrevive (.+) min en una nueva partida normal\.$/, match => `Survive ${match[1]} min in a new normal run.`],
      [/^Completa (.+) etapas de Overdrive en una nueva partida\.$/, match => `Complete ${match[1]} Overdrive stages in a new run.`],
      [/^Próximo giro: (.+)% de conseguir la skin\. Sólo apariencia, sin ventajas\.$/, match => `Next spin: ${match[1]}% chance to win the skin. Cosmetic only; no advantages.`],
      [/^Las ranuras muestran premios, no probabilidades\. Próximo giro: cada ranura NOVA (.+)%; dorada (.+)%\.$/, match => `Slots show prizes, not odds. Next spin: each NOVA slot ${match[1]}%; gold slot ${match[2]}%.`],
      [/^(.+) desbloqueada$/, match => `${i18next.t(match[1], { defaultValue: match[1] })} unlocked`],
      [/^(.+) desbloqueado y equipado\.$/, match => `${i18next.t(match[1], { defaultValue: match[1] })} unlocked and equipped.`],
      [/^Mira un anuncio para desbloquear y equipar este cosmético, o cómpralo por (.+) NOVA\.$/, match => `Watch a video to unlock and equip this cosmetic, or buy it for ${match[1]} NOVA.`],
      [/^Este rango ya está integrado\. (.+)$/, match => `This rank is already integrated. ${match[1]}`],
      [/^La vitalidad se calibró: (.+)\. Los siguientes rangos requieren más compras NOVA\.$/, match => `Vitality calibrated: ${match[1]}. Further ranks require more NOVA purchases.`],
      [/^(.+?) ([-+−]?\d[\d.,]*(?:%|\s*(?:s|u\/s))?) → (.+)$/, match => `${i18next.t(match[1], { defaultValue: match[1] })} ${match[2]} → ${match[3]}`],
      [/^Este rango ya está integrado\. Es tu rango actual\.$/, () => 'This rank is already integrated. This is your current rank.'],
      [/^Este rango ya fue reclamado\.$/, () => 'This rank has already been claimed.'],
      [/^Recompensa disponible\. Solo se aplica si el anuncio termina correctamente\.$/, () => 'Reward available. It is applied only if the video completes successfully.'],
      [/^Compra (\d+) mejora(s?) con NOVA para habilitar el anuncio\.$/, match => `Buy ${match[1]} upgrade${match[2]} with NOVA to unlock the video.`],
      [/^Total actual: (.+) · siguiente: (.+)$/, match => `Current total: ${translateText(match[1])} · next: ${translateText(match[2])}`],
      [/^Total actual: (.+) · tope alcanzado$/, match => `Current total: ${translateText(match[1])} · maximum reached`],
      [/^Oferta actual · costo (.+) NOVA\.$/, match => `Current offer · cost: ${match[1]} NOVA.`],
      [/^Oferta actual, pero faltan (.+) NOVA para adquirirla\.$/, match => `Current offer, but you need ${match[1]} more NOVA to acquire it.`],
      [/^\+(.+) de vida máxima por anuncio completado$/, match => `+${match[1]} max health per completed video`],
      [/^La rotación comienza · (.+) UTC$/, match => `Rotation begins · ${match[1]} UTC`],
      [/^SIGUIENTE ROTACIÓN · (.+)$/, match => `NEXT ROTATION · ${match[1]}`],
      [/^Ver reglas del reto · (\d+)$/, match => `View challenge rules · ${match[1]}`],
      [/^NOVA DE EVENTO · (\d+)$/, match => `EVENT NOVA · ${match[1]}`],
      [/^NOVA DE EVENTO · BILLETERA LLENA$/, () => 'EVENT NOVA · WALLET FULL'],
      [/^INICIAR (.+)$/, match => `START ${translateText(match[1])}`],
      [/^Acto II · Angular · Angular se desbloquea al vencer Acto I$/, () => 'Act II · Angular · Unlock by completing Act I'],
      [/^Acto III · Fracture · Fracture se desbloquea al vencer Acto II$/, () => 'Act III · Fracture · Unlock by completing Act II'],
      [/^Modo Infinito bloqueado: vence el Acto III$/, () => 'Infinite mode locked: complete Act III'],
      [/^Derrota al boss del Acto III para desbloquearlo$/, () => 'Defeat the Act III boss to unlock it'],
      [/^Laboratorio bloqueado: completa el Acto I para desbloquear el Acto II$/, () => 'Laboratory locked: complete Act I to unlock Act II'],
      [/^Derrota al boss del Acto I para desbloquear el Laboratorio$/, () => 'Defeat the Act I boss to unlock the Laboratory'],
      [/^Mejoras permanentes que aplican a todos los modos$/, () => 'Permanent upgrades that apply to every mode'],
      [/^Seleccionar modo Infinito Overdrive$/, () => 'Select Infinite Overdrive mode'],
      [/^Seleccionar Overdrive$/, () => 'Select Overdrive'],
      [/^Abrir Laboratorio de mejoras permanentes$/, () => 'Open the permanent-upgrade Laboratory'],
      [/^Mira un anuncio para desbloquear y equipar este cosmético, o cómpralo por (.+) NOVA\.$/, match => `Watch a video to unlock and equip this cosmetic, or buy it for ${match[1]} NOVA.`],
      [/^Oferta opcional: cambia estas tres cartas por alternativas\.$/, () => 'Optional offer: replace these three cards with alternatives.'],
      [/^Cartas renovadas\.$/, () => 'Cards refreshed.'],
      [/^Anuncio no disponible\. Elige una carta actual\.$/, () => 'Video unavailable. Choose one of the current cards.'],
      [/^Anuncio cancelado\. Puedes elegir una carta o intentarlo otra vez\.$/, () => 'Video cancelled. Choose a card or try again.'],
      [/^No se pudo completar el anuncio\. Puedes elegir una carta o reintentarlo\.$/, () => 'The video could not be completed. Choose a card or retry.'],
      [/^Puedes inspeccionar la rama; solo se puede comprar cuando aparezca entre las tres calibraciones de la rotación\.$/, () => 'You can inspect this branch; it can only be purchased when it appears among the three calibration offers in the rotation.'],
      [/^Acto (I|II|III) · (.+)$/, match => `Act ${match[1]} · ${i18next.t(match[2], { defaultValue: match[2] })}`],
      [/^No se pudo iniciar el juego\. (.+)$/, match => `The game could not start. ${translateText(match[1])}`],
      [/^Recarga la página\.$/, () => 'Reload the page.'],
      [/^Error de inicialización\.$/, () => 'Initialization error.'],
      [/^Faltan elementos de la vista previa de cosméticos$/, () => 'Missing cosmetic-preview elements'],
      [/^Faltan elementos del panel de cañones$/, () => 'Missing cannon-panel elements'],
      [/^Faltan elementos del panel de fondos$/, () => 'Missing background-panel elements'],
      [/^(.+) está lista; abre la carta para comparar sus dos rutas$/, match => `${translateText(match[1])} is ready; open the card to compare its two paths`],
      [/^Elige una ruta y confirma cómo cambia (.+)$/, match => `Choose a path and confirm how it changes ${translateText(match[1])}`],
      [/^FALTAN (.+) · VER$/, match => `NEED ${match[1]} MORE · VIEW`],
      [/^Faltan (.+) NOVA$/, match => `Need ${match[1]} more NOVA`],
      [/^Desbloquear y equipar · (.+) NOVA$/, match => `Unlock & equip · ${match[1]} NOVA`],
      [/^Recompensa actual de (.+); sin ventajas de combate\.$/, match => `Current reward from ${translateText(match[1])}; no combat advantages.`],
      [/^No se ofrece esta semana\. Volverá en la rotación de (.+)\.$/, match => `Not offered this week. It will return in the ${translateText(match[1])} rotation.`],
      [/^Vista previa de (.+)$/, match => `Preview of ${translateText(match[1])}`],
      [/^Ver (.+), exclusiva de ruleta diaria$/, match => `View ${translateText(match[1])}, daily-wheel exclusive`],
      [/^Ver (.+), exclusiva de reto semanal$/, match => `View ${translateText(match[1])}, weekly-challenge exclusive`],
      [/^(.+), rango (\d+) de (\d+), (.+)\. Abrir detalles\.$/, match => `${translateText(match[1])}, rank ${match[2]} of ${match[3]}, ${translateText(match[4])}. Open details.`],
      [/^Pulso de vitalidad, rango (\d+) de (\d+), (.+)\. Abrir detalles\.$/, match => `Vitality Pulse, rank ${match[1]} of ${match[2]}, ${translateText(match[3])}. Open details.`],
      [/^(.+)\. Abre las dos evoluciones de (.+)\.$/, match => `${translateText(match[1])}. Opens both evolutions for ${translateText(match[2])}.`],
      [/^(.+)\. Abre la selección de un arma evolucionada\.$/, match => `${translateText(match[1])}. Opens the evolved-weapon selection.`],
      [/^Ver (.+), (equipada|equipado|disponible|gratis)$/, match => `View ${translateText(match[1])}, ${translateText(match[2])}`],
      [/^Ver (.+), (.+) NOVA$/, match => `View ${translateText(match[1])}, ${match[2]} NOVA`],
      [/^(.+) desbloqueado y equipado\.$/, match => `${i18next.t(match[1], { defaultValue: match[1] })} unlocked and equipped.`],
      [/^NAVE EXCLUSIVA · (.+)$/, match => `EXCLUSIVE SHIP · ${match[1]}`],
      [/^CAÑÓN EXCLUSIVO · (.+)$/, match => `EXCLUSIVE CANNON · ${match[1]}`],
      [/^FONDO EXCLUSIVO · (.+)$/, match => `EXCLUSIVE BACKGROUND · ${match[1]}`]
    ];
    for (const [pattern, render] of patterns) {
      const match = source.match(pattern);
      if (match) return render(match);
    }
    return null;
  }

  const patterns: readonly [RegExp, (match: RegExpMatchArray) => string][] = [
    [/^ASSAULT ×(\d+) · BOSS (\d+) · (\d+)\/(\d+)$/, match => `ASALTO ×${match[1]} · JEFE ${match[2]} · ${match[3]}/${match[4]}`],
    [/^ASSAULT ×(\d+) · BOSS (\d+) · READY$/, match => `ASALTO ×${match[1]} · JEFE ${match[2]} · LISTO`],
    [/^ASSAULT ×(\d+) · NEXT (\d+) · (\d+)\/(\d+)$/, match => `ASALTO ×${match[1]} · SIG. ${match[2]} · ${match[3]}/${match[4]}`],
    [/^ASSAULT ×(\d+) · NEXT (\d+) · READY$/, match => `ASALTO ×${match[1]} · SIG. ${match[2]} · LISTO`],
    [/^Time (.+)$/, match => `Tiempo ${match[1]}`],
    [/^Kills (.+)$/, match => `Bajas ${match[1]}`],
    [/^Experience (.+)$/, match => `Experiencia ${match[1]}`],
    [/^Score (.+)$/, match => `Puntuación ${match[1]}`],
    [/^Best (.+) · (.+) points$/, match => `Mejor ${match[1]} · ${match[2]} puntos`],
    [/^OVERDRIVE · LAP (\d+)$/, match => `OVERDRIVE · VUELTA ${match[1]}`],
    [/^STAGE (\d+)$/, match => `TRAMO ${match[1]}`],
    [/^Level (\d+) · EVOLUTION AVAILABLE$/, match => `Nivel ${match[1]} · EVOLUCIÓN DISPONIBLE`],
    [/^Level (\d+) · EVOLUTION$/, match => `Nivel ${match[1]} · EVOLUCIÓN`],
    [/^Level (\d+) · MASTERY$/, match => `Nivel ${match[1]} · MAESTRÍA`],
    [/^Current value (.+), next (.+)$/, match => `Valor actual ${match[1]}, siguiente ${match[2]}`],
    [/^RANK (\d+) · PROGRESS (\d+)\/(\d+)$/, match => `RANGO ${match[1]} · PROGRESO ${match[2]}/${match[3]}`],
    [/^RANK (\d+) OF (\d+) · CURRENT (\d+)\/(\d+)$/, match => `RANGO ${match[1]} DE ${match[2]} · ACTUAL ${match[3]}/${match[4]}`],
    [/^Damage · (.+)$/, match => `Daño · ${i18next.t(match[1], { defaultValue: match[1] })}`],
    [/^Purchase progress: (\d+)\/3 NOVA · Total vitality: \+(.+)$/, match => `Progreso de compras: ${match[1]}/3 NOVA · Vitalidad acumulada: +${match[2]}`],
    [/^NEXT ROTATION · (.+)$/, match => `SIGUIENTE ROTACIÓN · ${match[1]}`],
    [/^ROTATION BEGINS · (.+)$/, match => `LA ROTACIÓN COMIENZA · ${match[1]}`],
    [/^READY TO CLAIM · (.+) · \+(.+) NOVA$/, match => `POR COBRAR · ${match[1]} · +${match[2]} NOVA`],
    [/^LOGBOOK · (.+) · (.+)\/(.+)$/, match => `BITÁCORA · ${match[1]} · ${match[2]}/${match[3]}`],
    [/^Current total: (.+) · next: (.+)$/, match => `Total actual: ${translateText(match[1])} · siguiente: ${translateText(match[2])}`],
    [/^Current total: (.+) · maximum reached$/, match => `Total actual: ${translateText(match[1])} · tope alcanzado`],
    [/^Current offer · cost: (.+) NOVA\.$/, match => `Oferta actual · costo ${match[1]} NOVA.`],
    [/^Current offer, but you need (.+) more NOVA to acquire it\.$/, match => `Oferta actual, pero faltan ${match[1]} NOVA para adquirirla.`],
    [/^\+(.+) max health per completed video$/, match => `+${match[1]} de vida máxima por anuncio completado`],
    [/^Rotation begins · (.+) UTC$/, match => `LA ROTACIÓN COMIENZA · ${match[1]} UTC`],
    [/^View challenge rules · (\d+)$/, match => `Ver reglas del reto · ${match[1]}`],
    [/^EVENT NOVA · (\d+)$/, match => `NOVA DE EVENTO · ${match[1]}`],
    [/^EVENT NOVA · WALLET FULL$/, () => 'NOVA DE EVENTO · BILLETERA LLENA'],
    [/^START (.+)$/, match => `INICIAR ${translateText(match[1])}`],
    [/^Act II · Angular · Unlock by completing Act I$/, () => 'Acto II · Angular · Angular se desbloquea al vencer Acto I'],
    [/^Act III · Fracture · Unlock by completing Act II$/, () => 'Acto III · Fracture · Fracture se desbloquea al vencer Acto II'],
    [/^Infinite mode locked: complete Act III$/, () => 'Modo Infinito bloqueado: vence el Acto III'],
    [/^Defeat the Act III boss to unlock it$/, () => 'Derrota al boss del Acto III para desbloquearlo'],
    [/^Laboratory locked: complete Act I to unlock Act II$/, () => 'Laboratorio bloqueado: completa el Acto I para desbloquear el Acto II'],
    [/^Defeat the Act I boss to unlock the Laboratory$/, () => 'Derrota al boss del Acto I para desbloquear el Laboratorio'],
    [/^Permanent upgrades that apply to every mode$/, () => 'Mejoras permanentes que aplican a todos los modos'],
    [/^Select Infinite Overdrive mode$/, () => 'Seleccionar modo Infinito Overdrive'],
    [/^Select Overdrive$/, () => 'Seleccionar Overdrive'],
    [/^Open the permanent-upgrade Laboratory$/, () => 'Abrir Laboratorio de mejoras permanentes'],
    [/^Watch a video to unlock and equip this cosmetic, or buy it for (.+) NOVA\.$/, match => `Mira un anuncio para desbloquear y equipar este cosmético, o cómpralo por ${match[1]} NOVA.`],
    [/^Optional offer: replace these three cards with alternatives\.$/, () => 'Oferta opcional: cambia estas tres cartas por alternativas.'],
    [/^Cards refreshed\.$/, () => 'Cartas renovadas.'],
    [/^Video unavailable\. Choose one of the current cards\.$/, () => 'Anuncio no disponible. Elige una carta actual.'],
    [/^Video cancelled\. Choose a card or try again\.$/, () => 'Anuncio cancelado. Puedes elegir una carta o intentarlo otra vez.'],
    [/^The video could not be completed\. Choose a card or retry\.$/, () => 'No se pudo completar el anuncio. Puedes elegir una carta o reintentarlo.'],
    [/^You can inspect this branch; it can only be purchased when it appears among the three calibration offers in the rotation\.$/, () => 'Puedes inspeccionar la rama; solo se puede comprar cuando aparezca entre las tres calibraciones de la rotación.'],
    [/^Act (I|II|III) · (.+)$/, match => `Acto ${match[1]} · ${i18next.t(match[2], { defaultValue: match[2] })}`],
    [/^Reload the page\.$/, () => 'Recarga la página.'],
    [/^Initialization error\.$/, () => 'Error de inicialización.'],
    [/^(.+) · Rank (\d+)$/, match => `${translateText(match[1])} · Rango ${match[2]}`],
    [/^Finish (.+) normal runs since your last claim\.$/, match => `Termina ${match[1]} partidas normales desde el último cobro.`],
    [/^Defeat (.+) enemies since your last claim\.$/, match => `Derrota ${match[1]} enemigos desde el último cobro.`],
    [/^Survive (.+) min in a new normal run\.$/, match => `Sobrevive ${match[1]} min en una nueva partida normal.`],
    [/^Complete (.+) Overdrive stages in a new run\.$/, match => `Completa ${match[1]} etapas de Overdrive en una nueva partida.`],
    [/^Next spin: (.+)% chance to win the skin\. Cosmetic only; no advantages\.$/, match => `Próximo giro: ${match[1]}% de conseguir la skin. Sólo apariencia, sin ventajas.`],
    [/^Slots show prizes, not odds\. Next spin: each NOVA slot (.+)%; gold slot (.+)%\.$/, match => `Las ranuras muestran premios, no probabilidades. Próximo giro: cada ranura NOVA ${match[1]}%; dorada ${match[2]}%.`],
    [/^(.+) unlocked and equipped\.$/, match => `${i18next.t(match[1], { defaultValue: match[1] })} desbloqueado y equipado.`]
  ];
  for (const [pattern, render] of patterns) {
    const match = source.match(pattern);
    if (match) return render(match);
  }
  return null;
};

export const translateText = (source: string): string => {
  if (!source || !source.trim()) return source;
  const exact = i18next.t(source, { defaultValue: source }) as string;
  if (exact !== source) return exact;
  return translateDynamicText(source, getLanguage()) ?? source;
};

const applyText = (node: Text): void => {
  const previous = translatedText.get(node);
  const source = previous && node.data === previous.output ? previous.source : node.data;
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  const phrase = source.slice(leading.length, source.length - trailing.length || undefined);
  if (!phrase) return;
  const output = `${leading}${translateText(phrase)}${trailing}`;
  translatedText.set(node, { source, output });
  if (output !== node.data) node.data = output;
};

const applyAttribute = (element: Element, attribute: typeof localizedAttributes[number]): void => {
  const value = element.getAttribute(attribute);
  if (value === null || !value.trim()) return;
  let values = translatedAttributes.get(element);
  if (!values) {
    values = new Map();
    translatedAttributes.set(element, values);
  }
  const previous = values.get(attribute);
  const source = previous && value === previous.output ? previous.source : value;
  const output = translateText(source);
  values.set(attribute, { source, output });
  if (output !== value) element.setAttribute(attribute, output);
};

const localizeNode = (node: Node): void => {
  if (node.nodeType === Node.TEXT_NODE) {
    applyText(node as Text);
    return;
  }
  if (!(node instanceof Element)) return;
  for (const attribute of localizedAttributes) applyAttribute(node, attribute);
  for (const child of node.childNodes) localizeNode(child);
};

/** Applies the bundled catalog to existing UI and language/accessibility attributes. */
export const localizeDocument = (root: ParentNode = document): void => {
  const documentRoot = root instanceof Document ? root.documentElement : root;
  if (documentRoot instanceof Element) localizeNode(documentRoot);
  else for (const child of documentRoot.childNodes) localizeNode(child);

  const language = getLanguage();
  document.documentElement.lang = language;
  document.title = language === 'es' ? 'Geometry Survivor' : 'Geometry Survivor';
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    language === 'es'
      ? 'Geometry Survivor: supervivencia geométrica en el espacio.'
      : 'Geometry Survivor: geometric space survival.'
  );
};

const installDomLocalization = (): void => {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
  localizeDocument(document);
  domObserver?.disconnect();
  domObserver = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData' && record.target instanceof Text) {
        applyText(record.target);
      } else if (record.type === 'attributes' && record.target instanceof Element) {
        const attribute = record.attributeName;
        if (attribute && localizedAttributes.includes(attribute as typeof localizedAttributes[number])) {
          applyAttribute(record.target, attribute as typeof localizedAttributes[number]);
        }
      } else {
        for (const node of record.addedNodes) localizeNode(node);
      }
    }
  });
  domObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...localizedAttributes]
  });
};

const syncLanguageControls = (): void => {
  const preference = readPreference();
  document.querySelectorAll<HTMLSelectElement>('[data-language-selector]').forEach(select => {
    select.value = preference;
  });
};

export const initializeLocalization = async (): Promise<void> => {
  if (!i18next.isInitialized) {
    await i18next.init({
      resources,
      lng: resolvedLanguage(readPreference()),
      fallbackLng: 'en',
      supportedLngs: ['es', 'en'],
      nonExplicitSupportedLngs: true,
      load: 'languageOnly',
      keySeparator: false,
      nsSeparator: false,
      interpolation: { escapeValue: false },
      returnNull: false
    });
  } else {
    await i18next.changeLanguage(resolvedLanguage(readPreference()));
  }
  installDomLocalization();
  syncLanguageControls();
};

export const setLanguagePreference = async (preference: LanguagePreference): Promise<void> => {
  if (!isLanguagePreference(preference)) return;
  try {
    window.localStorage.setItem(LANGUAGE_PREFERENCE_KEY, preference);
  } catch {
    // Keep the current session usable when storage is disabled or full.
  }
  await i18next.changeLanguage(resolvedLanguage(preference));
  localizeDocument(document);
  syncLanguageControls();
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { preference, language: getLanguage() } }));
};

export const bindLanguageControls = (root: ParentNode = document): void => {
  root.querySelectorAll<HTMLSelectElement>('[data-language-selector]').forEach(select => {
    if (select.dataset.languageBound === 'true') return;
    select.dataset.languageBound = 'true';
    select.value = readPreference();
    select.addEventListener('change', () => {
      if (isLanguagePreference(select.value)) void setLanguagePreference(select.value);
    });
  });
};

export const getCatalogResources = () => resources;
