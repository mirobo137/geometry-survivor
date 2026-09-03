import { getPlayerSkinDefinition } from '../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';

export interface PlayerSkinPreviewOptions {
  readonly animated?: boolean;
}

const toHex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`;

const motion = (animated: boolean, markup: string): string => (animated ? markup : '');

const signatureMarkup = (skin: PlayerSkinId, outer: string, detail: string, accent: string, animated: boolean): string => {
  const signature = getPlayerSkinDefinition(skin).signature;
  const spin = motion(
    animated,
    '<animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="12s" repeatCount="indefinite"/>'
  );
  const reverseSpin = motion(
    animated,
    '<animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="8s" repeatCount="indefinite"/>'
  );
  const sway = motion(
    animated,
    '<animateTransform attributeName="transform" type="rotate" values="-4 0 0;4 0 0;-4 0 0" dur="2.8s" repeatCount="indefinite"/>'
  );
  return {
    aurora: `<g class="skin-art-orbit" fill="none" stroke="${outer}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0-42 8-31 0-25-8-31zM0 42 8 31 0 25-8 31zM-42 0-31-8-25 0-31 8zM42 0 31-8 25 0 31 8z" stroke-width="2.2"/>
      <path d="M-28-28 0-36 28-28 36 0 28 28 0 36-28 28-36 0z" stroke-width="1.4" stroke-dasharray="4 5" opacity=".86"/>
      ${spin}
    </g>`,
    prism: `<g class="skin-art-shards" fill="${outer}" stroke="${accent}" stroke-linejoin="round">
      <path d="M0-43 10-29 0-23-10-29zM0 43 10 29 0 23-10 29zM-43 0-29-10-23 0-29 10zM43 0 29-10 23 0 29 10z" stroke-width="1.8"/>
      <path d="M-31-31-15-28-23-15zM31-31 15-28 23-15zM-31 31-15 28-23 15zM31 31 15 28 23 15z" stroke-width="1.35" opacity=".92"/>
      ${sway}
    </g>`,
    solar: `<g class="skin-art-crown" fill="none" stroke="${outer}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0-44 10-30 0-23-10-30zM0 44 10 30 0 23-10 30zM-44 0-30-10-23 0-30 10zM44 0 30-10 23 0 30 10z" fill="${outer}" stroke="${accent}" stroke-width="1.8"/>
      <path d="M-31-13-41-20M31-13 41-20M-31 13-41 20M31 13 41 20" stroke-width="3"/>
      <path d="M-28-28 0-37 28-28 37 0 28 28 0 37-28 28-37 0z" stroke-width="1.6" opacity=".86"/>
      ${spin}
    </g>`,
    verdant: `<g class="skin-art-blades" fill="${outer}" stroke="${detail}" stroke-linejoin="round">
      <path d="M0-45 12-28 0-19-12-28zM0 45 12 28 0 19-12 28zM-45 0-28-12-19 0-28 12zM45 0 28-12 19 0 28 12z" stroke-width="1.7"/>
      <path d="M-33-33-15-25-25-15zM33-33 15-25 25-15zM-33 33-15 25-25 15zM33 33 15 25 25 15z" stroke-width="1.5"/>
      <path d="M0-38 5-22M38 0 22 5M0 38-5 22M-38 0-22-5" fill="none" stroke="${accent}" stroke-width="1.5" opacity=".9"/>
      ${reverseSpin}
    </g>`
  }[signature];
};

const ringMarkup = (skin: PlayerSkinId, outer: string, animated: boolean): string => {
  const spin = motion(
    animated,
    '<animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="22s" repeatCount="indefinite"/>'
  );
  if (skin === 'violet') {
    return `<g class="skin-art-ring" fill="none" stroke="${outer}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13-34 34-34 34-13" stroke-width="2.4"/>
      <path d="M34 13 34 34 13 34" stroke-width="2.4"/>
      <path d="M-13 34-34 34-34 13" stroke-width="2.4"/>
      <path d="M-34-13-34-34-13-34" stroke-width="2.4"/>
      ${spin}
    </g>`;
  }
  if (skin === 'amber') {
    return `<g class="skin-art-ring" fill="none" stroke="${outer}" stroke-linecap="round">
      <circle cx="0" cy="0" r="33" stroke-width="2.2"/>
      <path d="M0-40v6M0 34v6M-40 0h6M34 0h6M-26-26-32-32M26-26 32-32M26 26 32 32M-26 26-32 32" stroke-width="2.6"/>
      ${spin}
    </g>`;
  }
  if (skin === 'emerald') {
    return `<g class="skin-art-ring" fill="none" stroke="${outer}" stroke-linecap="round">
      <path d="M-14-32A34 34 0 0 1 14-32" stroke-width="2.4"/>
      <path d="M32-14A34 34 0 0 1 32 14" stroke-width="2.4"/>
      <path d="M14 32A34 34 0 0 1-14 32" stroke-width="2.4"/>
      <path d="M-32 14A34 34 0 0 1-32-14" stroke-width="2.4"/>
      ${spin}
    </g>`;
  }
  return `<g class="skin-art-ring" fill="none" stroke="${outer}" stroke-linecap="round">
    <circle cx="0" cy="0" r="33" stroke-width="2.4"/>
    <path d="M0-38v8M0 30v8M-38 0h8M30 0h8" stroke-width="2.8"/>
    ${spin}
  </g>`;
};

const hullMarkup = (skin: PlayerSkinId, body: string, detail: string, accent: string, animated: boolean): string => {
  const breathe = motion(
    animated,
    '<animateTransform attributeName="transform" type="scale" values="1;1.04;1" dur="3.2s" repeatCount="indefinite"/>'
  );
  if (skin === 'violet') {
    return `<g class="skin-art-hull" stroke-linejoin="round">
      <path d="M0-30 23 0 11 16 0 30-11 16-23 0z" fill="${body}" stroke="${accent}" stroke-width="3.2"/>
      <path d="M0-16 14 0 0 16-14 0z" fill="none" stroke="${detail}" stroke-width="2" opacity=".92"/>
      <path d="M0-30 0 30M-23 0 23 0" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".55"/>
      ${breathe}
    </g>`;
  }
  if (skin === 'amber') {
    return `<g class="skin-art-hull" stroke-linejoin="round">
      <path d="M0-32 16-11 21 8 16 24-16 24-21 8-16-11z" fill="${body}" stroke="${accent}" stroke-width="3.2"/>
      <path d="M0-18 9-5 11 13 0 18-11 13-9-5z" fill="none" stroke="${detail}" stroke-width="2" opacity=".92"/>
      <path d="M-21 5-29 16-16 21M21 5 29 16 16 21" fill="none" stroke="${accent}" stroke-width="2"/>
      ${breathe}
    </g>`;
  }
  if (skin === 'emerald') {
    return `<g class="skin-art-hull" stroke-linejoin="round">
      <path d="M0-27 16-8 11 19 0 27-11 19-16-8z" fill="${body}" stroke="${accent}" stroke-width="3.2"/>
      <path d="M-21-21-8-24-13-11zM21-21 8-24 13-11zM-21 19-13 8-8 24zM21 19 13 8 8 24z" fill="${body}" stroke="${detail}" stroke-width="1.8"/>
      <path d="M0-16 9-4 7 13 0 19-7 13-9-4z" fill="none" stroke="${accent}" stroke-width="1.4" opacity=".8"/>
      ${breathe}
    </g>`;
  }
  return `<g class="skin-art-hull" stroke-linejoin="round">
    <path d="M0-28 25-15 25 15 0 28-25 15-25-15z" fill="${body}" stroke="${accent}" stroke-width="3.2"/>
    <path d="M0-20 15-11 15 11 0 20-15 11-15-11z" fill="none" stroke="${detail}" stroke-width="2" opacity=".92"/>
    <path d="M-14-12 0-20 14-12M-14 12 0 20 14 12" fill="none" stroke="${accent}" stroke-width="1.3" opacity=".72"/>
    ${breathe}
  </g>`;
};

const coreMarkup = (skin: PlayerSkinId, core: string, body: string, accent: string, animated: boolean): string => {
  const pulse = motion(
    animated,
    '<animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="2.2s" repeatCount="indefinite"/>'
  );
  if (skin === 'violet') {
    return `<g class="skin-art-core">
      <path d="M0-12 10 0 0 12-10 0z" fill="${core}" stroke="${accent}" stroke-width="2.2"/>
      <path d="M0-6 5 0 0 6-5 0z" fill="none" stroke="${body}" stroke-width="1.6"/>
      ${pulse}
    </g>`;
  }
  if (skin === 'amber') {
    return `<g class="skin-art-core">
      <path d="M0-12 10-6 10 6 0 12-10 6-10-6z" fill="${core}" stroke="${accent}" stroke-width="2.2"/>
      <circle cx="0" cy="0" r="3.4" fill="${accent}"/>
      ${pulse}
    </g>`;
  }
  if (skin === 'emerald') {
    return `<g class="skin-art-core">
      <path d="M0-13C8-13 11-1 0 13C-11-1-8-13 0-13z" fill="${core}" stroke="${accent}" stroke-width="2.2"/>
      <circle cx="0" cy="-3" r="2.8" fill="${accent}"/>
      ${pulse}
    </g>`;
  }
  return `<g class="skin-art-core">
    <circle cx="0" cy="0" r="12" fill="${core}" stroke="${accent}" stroke-width="2.2"/>
    <path d="M0-8v16M-8 0h16" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="3" fill="${accent}"/>
    ${pulse}
  </g>`;
};

/** Hull-only locker preview. Cannons belong to the separate loadout tab. */
export const createPlayerSkinPreviewSvg = (
  skin: PlayerSkinId,
  options: PlayerSkinPreviewOptions = {}
): string => {
  const definition = getPlayerSkinDefinition(skin);
  const colors = definition.palette;
  const shadow = toHex(colors.shadow);
  const outer = toHex(colors.outer);
  const body = toHex(colors.body);
  const detail = toHex(colors.bodyDetail);
  const core = toHex(colors.core);
  const accent = toHex(colors.accent);
  const animated = options.animated === true;
  const sceneClass = animated ? 'player-skin-preview is-animated' : 'player-skin-preview is-static';

  return `<svg xmlns="http://www.w3.org/2000/svg" class="${sceneClass}" viewBox="-52 -52 104 104" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista previa de ${definition.name}">
  <ellipse cx="0" cy="16" rx="35" ry="18" fill="${shadow}" opacity=".55"/>
  ${signatureMarkup(skin, outer, detail, accent, animated)}
  ${ringMarkup(skin, outer, animated)}
  ${hullMarkup(skin, body, detail, accent, animated)}
  ${coreMarkup(skin, core, body, accent, animated)}
</svg>`;
};
