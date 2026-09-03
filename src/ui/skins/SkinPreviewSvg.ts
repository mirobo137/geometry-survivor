import { getPlayerSkinDefinition } from '../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import { getCannonSkinDefinition } from '../../content/visual/CannonSkinDefinitions';

const toHex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`;

const signatureMarkup = (skin: PlayerSkinId, outer: string, detail: string, accent: string): string => {
  const signature = getPlayerSkinDefinition(skin).signature;
  return {
    aurora: `<g class="skin-art-orbit" fill="none" stroke="${outer}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0-42 8-31 0-25-8-31zM0 42 8 31 0 25-8 31zM-42 0-31-8-25 0-31 8zM42 0 31-8 25 0 31 8z" stroke-width="2.2"/>
      <path d="M-28-28 0-36 28-28 36 0 28 28 0 36-28 28-36 0z" stroke-width="1.4" stroke-dasharray="4 5" opacity=".86"/>
    </g>`,
    prism: `<g class="skin-art-shards" fill="${outer}" stroke="${accent}" stroke-linejoin="round">
      <path d="M0-43 10-29 0-23-10-29zM0 43 10 29 0 23-10 29zM-43 0-29-10-23 0-29 10zM43 0 29-10 23 0 29 10z" stroke-width="1.8"/>
      <path d="M-31-31-15-28-23-15zM31-31 15-28 23-15zM-31 31-15 28-23 15zM31 31 15 28 23 15z" stroke-width="1.35" opacity=".92"/>
    </g>`,
    solar: `<g class="skin-art-crown" fill="none" stroke="${outer}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0-44 10-30 0-23-10-30zM0 44 10 30 0 23-10 30zM-44 0-30-10-23 0-30 10zM44 0 30-10 23 0 30 10z" fill="${outer}" stroke="${accent}" stroke-width="1.8"/>
      <path d="M-31-13-41-20M31-13 41-20M-31 13-41 20M31 13 41 20" stroke-width="3"/>
      <path d="M-28-28 0-37 28-28 37 0 28 28 0 37-28 28-37 0z" stroke-width="1.6" opacity=".86"/>
    </g>`,
    verdant: `<g class="skin-art-blades" fill="${outer}" stroke="${detail}" stroke-linejoin="round">
      <path d="M0-45 12-28 0-19-12-28zM0 45 12 28 0 19-12 28zM-45 0-28-12-19 0-28 12zM45 0 28-12 19 0 28 12z" stroke-width="1.7"/>
      <path d="M-33-33-15-25-25-15zM33-33 15-25 25-15zM-33 33-15 25-25 15zM33 33 15 25 25 15z" stroke-width="1.5"/>
      <path d="M0-38 5-22M38 0 22 5M0 38-5 22M-38 0-22-5" fill="none" stroke="${accent}" stroke-width="1.5" opacity=".9"/>
    </g>`
  }[signature];
};

const ringMarkup = (skin: PlayerSkinId, outer: string): string => {
  if (skin === 'violet') {
    return `<g class="skin-art-ring" fill="none" stroke="${outer}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13-34 34-34 34-13" stroke-width="2.4"/>
      <path d="M34 13 34 34 13 34" stroke-width="2.4"/>
      <path d="M-13 34-34 34-34 13" stroke-width="2.4"/>
      <path d="M-34-13-34-34-13-34" stroke-width="2.4"/>
    </g>`;
  }
  if (skin === 'amber') {
    return `<g class="skin-art-ring" fill="none" stroke="${outer}" stroke-linecap="round">
      <circle cx="0" cy="0" r="33" stroke-width="2.2"/>
      <path d="M0-40v6M0 34v6M-40 0h6M34 0h6M-26-26-32-32M26-26 32-32M26 26 32 32M-26 26-32 32" stroke-width="2.6"/>
    </g>`;
  }
  if (skin === 'emerald') {
    return `<g class="skin-art-ring" fill="none" stroke="${outer}" stroke-linecap="round">
      <path d="M-14-32A34 34 0 0 1 14-32" stroke-width="2.4"/>
      <path d="M32-14A34 34 0 0 1 32 14" stroke-width="2.4"/>
      <path d="M14 32A34 34 0 0 1-14 32" stroke-width="2.4"/>
      <path d="M-32 14A34 34 0 0 1-32-14" stroke-width="2.4"/>
    </g>`;
  }
  return `<g class="skin-art-ring" fill="none" stroke="${outer}" stroke-linecap="round">
    <circle cx="0" cy="0" r="33" stroke-width="2.4"/>
    <path d="M0-38v8M0 30v8M-38 0h8M30 0h8" stroke-width="2.8"/>
  </g>`;
};

const hullMarkup = (skin: PlayerSkinId, body: string, detail: string, accent: string): string => {
  if (skin === 'violet') {
    return `<g class="skin-art-hull" stroke-linejoin="round">
      <path d="M0-30 23 0 11 16 0 30-11 16-23 0z" fill="${body}" stroke="${accent}" stroke-width="3.2"/>
      <path d="M0-16 14 0 0 16-14 0z" fill="none" stroke="${detail}" stroke-width="2" opacity=".92"/>
      <path d="M0-30 0 30M-23 0 23 0" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".55"/>
    </g>`;
  }
  if (skin === 'amber') {
    return `<g class="skin-art-hull" stroke-linejoin="round">
      <path d="M0-32 16-11 21 8 16 24-16 24-21 8-16-11z" fill="${body}" stroke="${accent}" stroke-width="3.2"/>
      <path d="M0-18 9-5 11 13 0 18-11 13-9-5z" fill="none" stroke="${detail}" stroke-width="2" opacity=".92"/>
      <path d="M-21 5-29 16-16 21M21 5 29 16 16 21" fill="none" stroke="${accent}" stroke-width="2"/>
    </g>`;
  }
  if (skin === 'emerald') {
    return `<g class="skin-art-hull" stroke-linejoin="round">
      <path d="M0-27 16-8 11 19 0 27-11 19-16-8z" fill="${body}" stroke="${accent}" stroke-width="3.2"/>
      <path d="M-21-21-8-24-13-11zM21-21 8-24 13-11zM-21 19-13 8-8 24zM21 19 13 8 8 24z" fill="${body}" stroke="${detail}" stroke-width="1.8"/>
      <path d="M0-16 9-4 7 13 0 19-7 13-9-4z" fill="none" stroke="${accent}" stroke-width="1.4" opacity=".8"/>
    </g>`;
  }
  return `<g class="skin-art-hull" stroke-linejoin="round">
    <path d="M0-28 25-15 25 15 0 28-25 15-25-15z" fill="${body}" stroke="${accent}" stroke-width="3.2"/>
    <path d="M0-20 15-11 15 11 0 20-15 11-15-11z" fill="none" stroke="${detail}" stroke-width="2" opacity=".92"/>
    <path d="M-14-12 0-20 14-12M-14 12 0 20 14 12" fill="none" stroke="${accent}" stroke-width="1.3" opacity=".72"/>
  </g>`;
};

const coreMarkup = (skin: PlayerSkinId, core: string, body: string, accent: string): string => {
  if (skin === 'violet') {
    return `<g class="skin-art-core">
      <path d="M0-12 10 0 0 12-10 0z" fill="${core}" stroke="${accent}" stroke-width="2.2"/>
      <path d="M0-6 5 0 0 6-5 0z" fill="none" stroke="${body}" stroke-width="1.6"/>
    </g>`;
  }
  if (skin === 'amber') {
    return `<g class="skin-art-core">
      <path d="M0-12 10-6 10 6 0 12-10 6-10-6z" fill="${core}" stroke="${accent}" stroke-width="2.2"/>
      <circle cx="0" cy="0" r="3.4" fill="${accent}"/>
    </g>`;
  }
  if (skin === 'emerald') {
    return `<g class="skin-art-core">
      <path d="M0-13C8-13 11-1 0 13C-11-1-8-13 0-13z" fill="${core}" stroke="${accent}" stroke-width="2.2"/>
      <circle cx="0" cy="-3" r="2.8" fill="${accent}"/>
    </g>`;
  }
  return `<g class="skin-art-core">
    <circle cx="0" cy="0" r="12" fill="${core}" stroke="${accent}" stroke-width="2.2"/>
    <path d="M0-8v16M-8 0h16" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="3" fill="${accent}"/>
  </g>`;
};

/** A code-first presentation preview; gameplay uses the cached player pieces. */
export const createPlayerSkinPreviewSvg = (skin: PlayerSkinId): string => {
  const definition = getPlayerSkinDefinition(skin);
  const colors = definition.palette;
  const shadow = toHex(colors.shadow);
  const outer = toHex(colors.outer);
  const body = toHex(colors.body);
  const detail = toHex(colors.bodyDetail);
  const core = toHex(colors.core);
  const weapon = toHex(getCannonSkinDefinition('basic').accent);
  const accent = toHex(colors.accent);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 -52 104 104" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista previa de ${definition.name}">
  <ellipse cx="0" cy="16" rx="35" ry="18" fill="${shadow}" opacity=".55"/>
  ${signatureMarkup(skin, outer, detail, accent)}
  ${ringMarkup(skin, outer)}
  ${hullMarkup(skin, body, detail, accent)}
  <g class="skin-art-emitters" fill="${weapon}" stroke="${accent}" stroke-width="1.3" stroke-linejoin="round">
    <path d="M-22-7-39-18l4 21z"/><path d="M22-7 39-18l-4 21z"/>
  </g>
  ${coreMarkup(skin, core, body, accent)}
  <g class="skin-art-pips" fill="${accent}"><circle cx="-20" cy="0" r="2.6"/><circle cx="20" cy="0" r="2.6"/></g>
</svg>`;
};
