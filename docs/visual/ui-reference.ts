import '../../src/styles.css';
import mark from '../../src/assets/svg/ui/start/mark.svg?raw';
import pause from '../../src/assets/svg/ui/pause.svg?raw';
import settings from '../../src/assets/svg/ui/settings.svg?raw';
import oldIcons from '../../src/assets/svg/ui/level-up/icons.svg?raw';
import { LevelUpOverlay } from '../../src/ui/level-up/LevelUpOverlay';
import { UPGRADE_DEFINITIONS } from '../../src/content/upgrades/UpgradeDefinitions';
import { PlayerModel } from '../../src/simulation/PlayerModel';
import { CombatSimulation } from '../../src/simulation/combat/CombatSimulation';
import { UpgradeApplier } from '../../src/simulation/progression/UpgradeApplier';

// Place gallery layout overrides after Vite's injected production stylesheet.
document.head.appendChild(document.querySelector('style')!);
const root = document.querySelector<HTMLElement>('#level-up')!;
const overlay = new LevelUpOverlay(root);
const applier = new UpgradeApplier(new PlayerModel(), new CombatSimulation());
const choices = UPGRADE_DEFINITIONS.filter(c => ['focused_projectiles', 'reinforced_core', 'swift_step'].includes(c.id));
const open = () => overlay.open(2, choices, () => window.setTimeout(open, 300), c => applier.getPreview(c));
open();
document.querySelector('#mark')!.innerHTML = `${mark}<p>Un reactor empotrado, bisel localizado<br>y estructura orbital secundaria.</p>`;
document.querySelector('#controls')!.innerHTML = `<button aria-label="Pausar">${pause}</button><button>${settings} Ajustes</button><button disabled>${settings.replaceAll('ui-settings-', 'ui-disabled-settings-')} No disponible</button>`;
document.querySelector('#theme')!.addEventListener('click', () => document.body.classList.toggle('light'));
const ids = Array.from(root.querySelectorAll('symbol'), s => s.id);
const icon = (id: string, size = 48) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><use href="#${id}"/></svg>`;
document.querySelector('#icons')!.innerHTML = ids.map(id => `<div class="tile">${icon(id)}<small>${id.replace('ui-upgrade-icon-', '')}</small></div>`).join('');
const oldSprite = oldIcons.replaceAll('ui-upgrade-', 'ui-before-').replace('<svg ', '<svg style="position:absolute;width:0;height:0;overflow:hidden" ');
document.body.insertAdjacentHTML('beforeend', oldSprite);
document.querySelector('#comparison')!.innerHTML = `<section>Anterior<br>${icon('ui-before-icon-core')} ${icon('ui-before-icon-projectile')}</section><section>Candidato<br>${icon('ui-upgrade-icon-core')} ${icon('ui-upgrade-icon-projectile')}</section>`;
