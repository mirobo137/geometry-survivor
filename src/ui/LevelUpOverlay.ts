import type { UpgradeDefinition, UpgradeId } from '../content/upgrades/UpgradeDefinitions';

export type UpgradeSelectionHandler = (upgradeId: UpgradeId) => void;

export class LevelUpOverlay {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement;
  private readonly options: HTMLElement;

  public constructor(root: HTMLElement) {
    const title = root.querySelector<HTMLElement>('#level-up-title');
    const options = root.querySelector<HTMLElement>('#level-up-options');
    if (!title || !options) throw new Error('Faltan elementos del level-up');
    this.root = root;
    this.title = title;
    this.options = options;
  }

  public open(level: number, choices: readonly UpgradeDefinition[], onSelection: UpgradeSelectionHandler): void {
    this.title.textContent = `Nivel ${level}`;
    this.options.replaceChildren();
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.upgradeId = choice.id;
      const title = document.createElement('strong');
      title.textContent = choice.title;
      const description = document.createElement('span');
      description.textContent = choice.description;
      button.append(title, description);
      button.addEventListener('click', () => {
        this.close();
        onSelection(choice.id);
      }, { once: true });
      this.options.appendChild(button);
    }
    this.root.hidden = false;
  }

  public close(): void {
    this.root.hidden = true;
  }
}
