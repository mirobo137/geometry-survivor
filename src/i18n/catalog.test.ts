import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as ts from 'typescript';
import { CATALOG, CATALOG_EN, CATALOG_ES } from './catalog';
import { detectBrowserLanguage, isLanguagePreference } from './index';
import { RETENTION_CHALLENGES, RETENTION_OBJECTIVES } from '../content/retention/RetentionDefinitions';
import { REWARD_COSMETICS } from '../content/retention/RewardCosmeticDefinitions';
import { LABORATORY_UPGRADE_DEFINITIONS, LABORATORY_WEAPON_FAMILIES } from '../content/meta/LaboratoryDefinitions';
import { PLAYER_SKIN_DEFINITIONS } from '../content/visual/SkinDefinitions';
import { CANNON_SKIN_DEFINITIONS } from '../content/visual/CannonSkinDefinitions';
import { BACKGROUND_DEFINITIONS } from '../content/visual/BackgroundDefinitions';
import { CALIBRATION_DEFINITIONS } from '../content/run/CalibrationDefinitions';
import {
  OVERDRIVE_RESERVE_DEFINITIONS,
  UPGRADE_DEFINITIONS,
  WEAPON_EVOLUTION_DEFINITIONS,
  WEAPON_EVOLUTION_OFFER_DEFINITIONS,
  WEAPON_MASTERY_DEFINITIONS,
  WEAPON_PATH_RANK_DEFINITIONS
} from '../content/upgrades/UpgradeDefinitions';
import { getUpgradeCardVisual } from '../ui/level-up/UpgradeCardVisual';
import { dailyWheelCopy } from '../ui/retention/DailyWheelCopy';
import { logbookCopy } from '../ui/retention/LogbookCopy';

const spanishCopy = (value: string): boolean => /[áéíóúüñ¿¡]/i.test(value)
  || /\b(?:al|aumenta|cada|con|de|del|desde|el|en|es|esta|este|la|las|los|más|para|por|que|se|sin|sobre|una|un|y)\b/i.test(value);

const uiSpanishCopy = (value: string): boolean => value.length > 2 && (
  /[áéíóúüñ¿¡]/i.test(value)
  || /\b(?:al|abrir|acercar|adquirido|arma|aumenta|bajas|bitácora|bloqueado|cañón|cada|campaña|carta|cerrar|completa|configuración|con|cobrar|daño|de|del|desbloquear|desafío|desde|disponible|el|elige|en|es|esta|este|experiencia|falta|faltan|fondo|gratis|iniciar|jugar|laboratorio|la|las|los|más|mejora|menú|modo|mueve|nave|nivel|para|por|puntuación|que|recompensa|recupera|reto|ruleta|se|selecciona|sin|sobre|tiempo|una|un|usa|velocidad|vida|volver|y)\b/i.test(value)
);

const collectTypeScriptFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
  });

const visibleSpanishLiterals = (): Map<string, string> => {
  const phrases = new Map<string, string>();
  const add = (phrase: string, source: string) => {
    const normalized = phrase.trim();
    if (/^(?:en-US|es-MX)$/i.test(normalized)) return;
    if (normalized && uiSpanishCopy(normalized)) phrases.set(normalized, source);
  };

  for (const file of collectTypeScriptFiles(join(process.cwd(), 'src/ui'))) {
    const sourceText = readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const visit = (node: ts.Node) => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        add(node.text, `${relative(process.cwd(), file)}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  let html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  for (const match of html.matchAll(/>([^<]+)</g)) add(match[1], 'index.html');
  for (const match of html.matchAll(/\b(?:aria-label|title|placeholder|alt)="([^"]+)"/g)) add(match[1], 'index.html attribute');
  return phrases;
};

const visibleDefinitions = [
  ...UPGRADE_DEFINITIONS,
  ...WEAPON_EVOLUTION_DEFINITIONS,
  ...Object.values(WEAPON_PATH_RANK_DEFINITIONS).flat(),
  ...WEAPON_EVOLUTION_OFFER_DEFINITIONS,
  ...WEAPON_MASTERY_DEFINITIONS,
  ...OVERDRIVE_RESERVE_DEFINITIONS
];

describe('player-facing localization catalog', () => {
  it('does not map one Spanish phrase to conflicting English copy', () => {
    const translations = new Map<string, Set<string>>();
    for (const { es, en } of CATALOG) {
      const values = translations.get(es) ?? new Set<string>();
      values.add(en);
      translations.set(es, values);
    }
    const conflicts = [...translations].filter(([, values]) => values.size > 1).map(([source]) => source);
    expect(conflicts).toEqual([]);
  });

  it('has a non-empty English translation for every catalog phrase', () => {
    for (const { es, en } of CATALOG) {
      expect(en.trim(), es).not.toBe('');
      expect(CATALOG_EN[es], es).toBe(en);
    }
  });

  it('detects only supported browser languages and validates saved preferences', () => {
    expect(detectBrowserLanguage(['fr-CA', 'es-MX'])).toBe('es');
    expect(detectBrowserLanguage(['pt-BR', 'en-GB'])).toBe('en');
    expect(detectBrowserLanguage(['fr-FR', 'ja-JP'])).toBe('en');
    expect(isLanguagePreference('auto')).toBe(true);
    expect(isLanguagePreference('es')).toBe(true);
    expect(isLanguagePreference('en')).toBe(true);
    expect(isLanguagePreference('fr')).toBe(false);
    expect(isLanguagePreference(null)).toBe(false);
  });

  it('can switch English retention copy back to Spanish without reloading', () => {
    for (const [english, spanish] of [
      [dailyWheelCopy('en'), dailyWheelCopy('es')],
      [logbookCopy('en'), logbookCopy('es')]
    ] as const) {
      for (const key of Object.keys(english) as (keyof typeof english)[]) {
        const englishValue = english[key];
        const spanishValue = spanish[key];
        if (typeof englishValue !== 'string' || typeof spanishValue !== 'string') continue;
        expect(CATALOG_ES[englishValue] ?? englishValue, `${String(key)}: ${englishValue}`).toBe(spanishValue);
      }
    }
  });

  it('covers visible upgrade, mastery, evolution, cosmetic, challenge, and menu copy', () => {
    const phrases = new Set<string>();
    const add = (value: string | undefined) => { if (value && spanishCopy(value)) phrases.add(value); };

    for (const definition of visibleDefinitions) {
      add(definition.title);
      add(definition.description);
      const visual = getUpgradeCardVisual(definition.id);
      add(visual.category);
      add(visual.illustration?.label);
    }
    for (const definition of LABORATORY_UPGRADE_DEFINITIONS) {
      add(definition.name);
      add(definition.description);
    }
    for (const family of LABORATORY_WEAPON_FAMILIES) add(family.label);
    for (const definition of [...PLAYER_SKIN_DEFINITIONS, ...CANNON_SKIN_DEFINITIONS, ...BACKGROUND_DEFINITIONS]) {
      add(definition.name);
      add(definition.subtitle);
      add(definition.description);
      add(definition.rarity);
    }
    for (const reward of REWARD_COSMETICS) {
      add(reward.name);
      add(reward.subtitle);
      add(reward.description);
    }
    for (const challenge of RETENTION_CHALLENGES) {
      add(challenge.title);
      add(challenge.eyebrow);
      add(challenge.briefing);
      challenge.rules.forEach(add);
    }
    for (const objective of RETENTION_OBJECTIVES) {
      add(objective.title);
      add(objective.description);
    }
    for (const calibration of CALIBRATION_DEFINITIONS) {
      add(calibration.title);
      add(calibration.description);
    }
    Object.values(dailyWheelCopy('es')).forEach(add);
    Object.values(logbookCopy('es')).forEach(add);

    const missing = [...phrases].filter(phrase => !Object.hasOwn(CATALOG_EN, phrase)).sort();
    expect(missing).toEqual([]);
  });

  it('has a catalog entry for every static Spanish phrase in the game UI', () => {
    const missing = [...visibleSpanishLiterals()]
      .filter(([phrase]) => !Object.hasOwn(CATALOG_EN, phrase))
      .map(([phrase, source]) => `${source}: ${phrase}`)
      .sort();
    expect(missing).toEqual([]);
  });
});
