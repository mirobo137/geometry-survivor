import upgradeIconsSvg from '../../assets/svg/ui/level-up/premium-icons.svg?raw';
import novaSvg from '../../assets/svg/ui/nova.svg?raw';
import { formatNova } from '../../content/meta/EconomyDefinitions';
import {
  getLaboratoryEffectTotal,
  getLaboratoryUpgradeDefinition,
  LABORATORY_HISTORY_LIMIT,
  LABORATORY_MAX_RANK,
  LABORATORY_UPGRADE_DEFINITIONS,
  LABORATORY_VITALITY_AD_MAX_RANK,
  LABORATORY_VITALITY_AD_PER_RANK,
  type LaboratorySaveData,
  type LaboratoryUpgradeDefinition,
  type LaboratoryUpgradeId
} from '../../content/meta/LaboratoryDefinitions';
import {
  canClaimLaboratoryVitalityAd,
  ensureLaboratoryOffer,
  purchaseLaboratoryUpgrade
} from '../../content/meta/LaboratoryProgression';
import type { RewardedAdResult } from '../../platform/Platform';
import type { WalletSaveData } from '../../platform/save/SaveStore';

export interface LaboratoryPanelOptions {
  readonly laboratory: LaboratorySaveData;
  readonly wallet: WalletSaveData;
  readonly vitalityAdAvailable: boolean;
  readonly onPurchase: (laboratory: LaboratorySaveData, wallet: WalletSaveData) => boolean;
  readonly onVitalityAd: () => Promise<{ readonly result: RewardedAdResult; readonly laboratory?: LaboratorySaveData }>;
}

type SelectedNode =
  | { readonly kind: 'upgrade'; readonly id: LaboratoryUpgradeId; readonly rank: number }
  | { readonly kind: 'vitality'; readonly rank: number };

interface TreePoint { readonly x: number; readonly y: number; }
interface PointerPoint { readonly x: number; readonly y: number; }

const TREE_WIDTH = 1_900;
const TREE_HEIGHT = 1_500;
const CORE: TreePoint = { x: 250, y: 760 };
const ARSENAL_TRUNK_X = 620;
const FIRST_RANK_X = 650;
const RANK_SPACING = 94;
const ARSENAL_FIRST_Y = 260;
const ARSENAL_ROW_SPACING = 94;
const PILOT_FIRST_Y = 1_090;
const PILOT_ROW_SPACING = 100;
const VITALITY_CORE: TreePoint = { x: 1_250, y: 760 };
const VITALITY_FIRST_RANK_X = VITALITY_CORE.x + 82;
const VITALITY_RANK_SPACING = 92;
const MIN_ZOOM = 0.52;
const MAX_ZOOM = 1.28;
const ZOOM_STEP = 0.12;

const isPilotUpgrade = (definition: LaboratoryUpgradeDefinition): boolean => (
  definition.effect.type === 'movementSpeed'
  || definition.effect.type === 'maxHealth'
  || definition.effect.type === 'damageResistance'
);

const getUpgradeGroup = (definition: LaboratoryUpgradeDefinition) => (
  isPilotUpgrade(definition)
    ? { id: 'pilot' as const, definitions: LABORATORY_UPGRADE_DEFINITIONS.filter(isPilotUpgrade), firstY: PILOT_FIRST_Y, spacing: PILOT_ROW_SPACING, hub: { x: 490, y: 1_190 } }
    : { id: 'arsenal' as const, definitions: LABORATORY_UPGRADE_DEFINITIONS.filter(candidate => !isPilotUpgrade(candidate)), firstY: ARSENAL_FIRST_Y, spacing: ARSENAL_ROW_SPACING, hub: { x: 490, y: 589 } }
);

const upgradeRootPoint = (definition: LaboratoryUpgradeDefinition): TreePoint => {
  const group = getUpgradeGroup(definition);
  const row = group.definitions.findIndex(candidate => candidate.id === definition.id);
  return { x: FIRST_RANK_X, y: group.firstY + row * group.spacing };
};

const upgradeRankPoint = (definition: LaboratoryUpgradeDefinition, rank: number): TreePoint => {
  const root = upgradeRootPoint(definition);
  return { x: root.x + (rank - 1) * RANK_SPACING, y: root.y };
};

const percent = (value: number): string => `${Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, '')}%`;

const effectTotalPercent = (definition: LaboratoryUpgradeDefinition, level: number): number => {
  const total = getLaboratoryEffectTotal(definition.id, level);
  return definition.effect.type === 'cadence' || definition.effect.type === 'damageResistance'
    ? (1 - total) * 100
    : (total - 1) * 100;
};

const rankDeltaLabel = (definition: LaboratoryUpgradeDefinition): string => {
  const amount = definition.effect.amountPerRank * 100;
  switch (definition.effect.type) {
    case 'globalDamage': return `+${percent(amount)} de daño global por rango`;
    case 'weaponDamage': return `+${percent(amount)} de daño de esta familia por rango`;
    case 'cadence': return `−${percent(amount)} de intervalo por rango`;
    case 'movementSpeed': return `+${percent(amount)} de velocidad por rango`;
    case 'maxHealth': return `+${percent(amount)} de vida máxima por rango`;
    case 'damageResistance': return `−${percent(amount)} de daño recibido por rango`;
  }
};

const effectSummary = (definition: LaboratoryUpgradeDefinition, level: number): string => {
  const total = effectTotalPercent(definition, level);
  switch (definition.effect.type) {
    case 'globalDamage': return `Daño global +${percent(total)}`;
    case 'weaponDamage': return `${definition.name}: +${percent(total)}`;
    case 'cadence': return `Intervalo de armas −${percent(total)}`;
    case 'movementSpeed': return `Velocidad +${percent(total)}`;
    case 'maxHealth': return `Vida máxima NOVA +${percent(total)}`;
    case 'damageResistance': return `Daño recibido −${percent(total)}`;
  }
};

const createIcon = (iconName: string): SVGSVGElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#ui-upgrade-icon-${iconName}`);
  svg.append(use);
  return svg;
};

const appendNovaIcon = (host: HTMLElement): void => {
  host.insertAdjacentHTML('afterbegin', novaSvg);
  const icon = host.querySelector('svg');
  icon?.setAttribute('aria-hidden', 'true');
  icon?.setAttribute('focusable', 'false');
};

const distance = (a: PointerPoint, b: PointerPoint): number => Math.hypot(a.x - b.x, a.y - b.y);

/** DOM/SVG-only skill map. Save, offers, costs and effects remain owned by content/Game. */
export class LaboratoryPanel {
  private readonly walletValue: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly world: HTMLElement;
  private readonly links: SVGSVGElement;
  private readonly nodes: HTMLElement;
  private readonly coreFace: HTMLElement;
  private readonly vitalityCoreFace: HTMLElement;
  private readonly zoomValue: HTMLOutputElement;
  private readonly zoomIn: HTMLButtonElement;
  private readonly zoomOut: HTMLButtonElement;
  private readonly zoomReset: HTMLButtonElement;
  private readonly historyList: HTMLOListElement;
  private readonly dialog: HTMLDialogElement;
  private readonly dialogClose: HTMLButtonElement;
  private readonly dialogIcon: HTMLElement;
  private readonly dialogEyebrow: HTMLElement;
  private readonly dialogTitle: HTMLElement;
  private readonly dialogDescription: HTMLElement;
  private readonly dialogRank: HTMLElement;
  private readonly dialogProgress: HTMLElement;
  private readonly dialogDelta: HTMLElement;
  private readonly dialogTotal: HTMLElement;
  private readonly dialogStatus: HTMLElement;
  private readonly dialogAction: HTMLButtonElement;
  private laboratory: LaboratorySaveData;
  private wallet: WalletSaveData = { nova: 0 };
  private options: LaboratoryPanelOptions | null = null;
  private selectedNode: SelectedNode | null = null;
  private opener: HTMLButtonElement | null = null;
  private vitalityPending = false;
  private vitalityFeedback: string | null = null;
  private vitalityRequestToken = 0;
  private cameraScale = 0.94;
  private cameraPanX = 0;
  private cameraPanY = 0;
  private readonly pointers = new Map<number, PointerPoint>();
  private dragPointerId: number | null = null;
  private lastPointer: PointerPoint | null = null;
  private keyboardNavigationPending = false;
  private pinchSeed: { readonly ids: readonly [number, number]; readonly distance: number; readonly scale: number; readonly world: TreePoint } | null = null;

  public constructor(root: HTMLElement) {
    const walletValue = root.querySelector<HTMLElement>('#start-meta-nova-value');
    const stage = root.querySelector<HTMLElement>('#start-lab-tree-stage');
    const world = root.querySelector<HTMLElement>('#start-lab-tree-world');
    const links = root.querySelector<SVGSVGElement>('#start-lab-tree-links');
    const nodes = root.querySelector<HTMLElement>('#start-meta-cards');
    const coreFace = root.querySelector<HTMLElement>('#start-lab-tree-core .lab-tree-core-face');
    const vitalityCoreFace = root.querySelector<HTMLElement>('#start-lab-vitality-core .lab-tree-core-face');
    const zoomValue = root.querySelector<HTMLOutputElement>('#start-lab-zoom-value');
    const zoomIn = root.querySelector<HTMLButtonElement>('#start-lab-zoom-in');
    const zoomOut = root.querySelector<HTMLButtonElement>('#start-lab-zoom-out');
    const zoomReset = root.querySelector<HTMLButtonElement>('#start-lab-zoom-reset');
    const historyList = root.querySelector<HTMLOListElement>('#start-lab-history-list');
    const document = root.ownerDocument;
    const dialog = document.querySelector<HTMLDialogElement>('#start-lab-node-dialog');
    const dialogClose = document.querySelector<HTMLButtonElement>('#start-lab-node-close');
    const dialogIcon = document.querySelector<HTMLElement>('#start-lab-node-icon');
    const dialogEyebrow = document.querySelector<HTMLElement>('#start-lab-node-eyebrow');
    const dialogTitle = document.querySelector<HTMLElement>('#start-lab-node-title');
    const dialogDescription = document.querySelector<HTMLElement>('#start-lab-node-description');
    const dialogRank = document.querySelector<HTMLElement>('#start-lab-node-rank');
    const dialogProgress = document.querySelector<HTMLElement>('#start-lab-node-progress');
    const dialogDelta = document.querySelector<HTMLElement>('#start-lab-node-delta');
    const dialogTotal = document.querySelector<HTMLElement>('#start-lab-node-total');
    const dialogStatus = document.querySelector<HTMLElement>('#start-lab-node-status');
    const dialogAction = document.querySelector<HTMLButtonElement>('#start-lab-node-action');
    if (!walletValue || !stage || !world || !links || !nodes || !coreFace || !vitalityCoreFace || !zoomValue || !zoomIn || !zoomOut || !zoomReset || !historyList
      || !dialog || !dialogClose || !dialogIcon || !dialogEyebrow || !dialogTitle || !dialogDescription || !dialogRank
      || !dialogProgress || !dialogDelta || !dialogTotal || !dialogStatus || !dialogAction) {
      throw new Error('Faltan elementos de la consola del Laboratorio');
    }
    this.walletValue = walletValue;
    this.stage = stage;
    this.world = world;
    this.links = links;
    this.nodes = nodes;
    this.coreFace = coreFace;
    this.vitalityCoreFace = vitalityCoreFace;
    this.zoomValue = zoomValue;
    this.zoomIn = zoomIn;
    this.zoomOut = zoomOut;
    this.zoomReset = zoomReset;
    this.historyList = historyList;
    this.dialog = dialog;
    this.dialogClose = dialogClose;
    this.dialogIcon = dialogIcon;
    this.dialogEyebrow = dialogEyebrow;
    this.dialogTitle = dialogTitle;
    this.dialogDescription = dialogDescription;
    this.dialogRank = dialogRank;
    this.dialogProgress = dialogProgress;
    this.dialogDelta = dialogDelta;
    this.dialogTotal = dialogTotal;
    this.dialogStatus = dialogStatus;
    this.dialogAction = dialogAction;
    this.laboratory = { levels: {}, currentOfferIds: [], deferredOffers: [], history: [], purchasesSinceVitalityAd: 0, vitalityAdRank: 0, offerStep: 0 };

    if (!root.ownerDocument.getElementById('ui-upgrade-icons')) root.insertAdjacentHTML('afterbegin', upgradeIconsSvg);
    this.coreFace.append(createIcon('core'));
    this.vitalityCoreFace.append(createIcon('core'));
    this.zoomIn.addEventListener('click', () => this.zoomBy(ZOOM_STEP));
    this.zoomOut.addEventListener('click', () => this.zoomBy(-ZOOM_STEP));
    this.zoomReset.addEventListener('click', () => this.resetCamera());
    this.stage.addEventListener('wheel', event => this.onWheel(event), { passive: false });
    this.stage.addEventListener('pointerdown', event => this.onPointerDown(event));
    this.stage.addEventListener('pointermove', event => this.onPointerMove(event));
    this.stage.addEventListener('pointerup', event => this.onPointerEnd(event));
    this.stage.addEventListener('pointercancel', event => this.onPointerEnd(event));
    this.stage.addEventListener('lostpointercapture', event => this.onPointerEnd(event as PointerEvent));
    this.stage.addEventListener('keydown', event => {
      if (event.key === 'Tab') this.keyboardNavigationPending = true;
    });
    this.nodes.addEventListener('focusin', event => {
      const node = (event.target as HTMLElement).closest<HTMLButtonElement>('.lab-tree-node');
      if (node && this.keyboardNavigationPending) this.centerNodeIfClipped(node);
      this.keyboardNavigationPending = false;
    });
    this.dialogClose.addEventListener('click', () => this.dialog.close());
    this.dialogAction.addEventListener('click', () => this.activateSelectedNode());
    this.dialog.addEventListener('click', event => {
      if (event.target === this.dialog) this.dialog.close();
    });
    this.dialog.addEventListener('close', () => {
      this.selectedNode = null;
      if (this.opener?.isConnected && !this.stage.closest('[hidden]')) this.opener.focus({ preventScroll: true });
      this.opener = null;
    });
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.applyCamera()).observe(this.stage);
    }
  }

  public open(options: LaboratoryPanelOptions): void {
    this.options = options;
    this.wallet = { nova: Math.max(0, Math.floor(options.wallet.nova)) };
    const ensured = ensureLaboratoryOffer(options.laboratory);
    this.laboratory = ensured.data;
    this.vitalityFeedback = null;
    if (ensured.changed) options.onPurchase(this.laboratory, this.wallet);
    this.render();
    this.resetCamera();
  }

  public close(): void {
    if (this.dialog.open) this.dialog.close();
    this.options = null;
    this.vitalityPending = false;
    this.vitalityRequestToken += 1;
    this.pointers.clear();
    this.dragPointerId = null;
    this.pinchSeed = null;
  }

  private render(): void {
    this.walletValue.textContent = formatNova(this.wallet.nova);
    this.renderTree();
    this.renderHistory();
    this.updateZoomControls();
  }

  private renderTree(): void {
    this.links.replaceChildren();
    this.nodes.replaceChildren();
    this.links.setAttribute('viewBox', `0 0 ${TREE_WIDTH} ${TREE_HEIGHT}`);
    this.links.setAttribute('width', String(TREE_WIDTH));
    this.links.setAttribute('height', String(TREE_HEIGHT));

    this.renderTreeScaffold();

    for (const definition of LABORATORY_UPGRADE_DEFINITIONS) {
      const level = this.laboratory.levels[definition.id] ?? 0;
      const lastVisibleRank = Math.min(definition.maxRank, level + 1);
      const root = upgradeRootPoint(definition);
      let previous = { x: ARSENAL_TRUNK_X, y: root.y };
      for (let rank = 1; rank <= lastVisibleRank; rank += 1) {
        const point = upgradeRankPoint(definition, rank);
        const acquired = rank <= level;
        const offered = rank === level + 1 && this.laboratory.currentOfferIds.includes(definition.id);
        this.addLink(previous, point, acquired, offered, 'permanent');
        const button = this.createUpgradeNode(definition, rank, point, level, offered);
        this.nodes.append(button);
        previous = point;
      }
    }

    const vitalityRank = this.laboratory.vitalityAdRank;
    const lastVitalityRank = Math.min(LABORATORY_VITALITY_AD_MAX_RANK, vitalityRank + 1);
    let previous = VITALITY_CORE;
    for (let rank = 1; rank <= lastVitalityRank; rank += 1) {
      const point = { x: VITALITY_FIRST_RANK_X + (rank - 1) * VITALITY_RANK_SPACING, y: VITALITY_CORE.y };
      const acquired = rank <= vitalityRank;
      this.addLink(previous, point, acquired, rank === vitalityRank + 1 && canClaimLaboratoryVitalityAd(this.laboratory), 'vitality');
      const node = this.createVitalityNode(rank, point, acquired);
      this.nodes.append(node);
      previous = point;
    }
    this.applyCamera();
  }

  private renderTreeScaffold(): void {
    const groups = [
      getUpgradeGroup(LABORATORY_UPGRADE_DEFINITIONS.find(definition => !isPilotUpgrade(definition))!),
      getUpgradeGroup(LABORATORY_UPGRADE_DEFINITIONS.find(isPilotUpgrade)!)
    ];
    for (const group of groups) {
      const first = upgradeRootPoint(group.definitions[0]!);
      const last = upgradeRootPoint(group.definitions[group.definitions.length - 1]!);
      const hub = group.hub;
      const centerY = (first.y + last.y) / 2;
      const trunkClass = `lab-tree-link lab-tree-link-scaffold${group.id === 'pilot' ? ' is-pilot' : ''}`;

      this.addPath(`M ${CORE.x} ${CORE.y} C ${CORE.x + 105} ${CORE.y}, ${hub.x - 110} ${hub.y}, ${hub.x} ${hub.y}`, trunkClass);
      this.addPath(`M ${hub.x} ${hub.y} H ${ARSENAL_TRUNK_X} V ${centerY}`, trunkClass);
      this.addPath(`M ${ARSENAL_TRUNK_X} ${first.y} V ${last.y}`, trunkClass);

      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      marker.setAttribute('cx', String(hub.x));
      marker.setAttribute('cy', String(hub.y));
      marker.setAttribute('r', '11');
      marker.setAttribute('class', `lab-tree-junction${group.id === 'pilot' ? ' is-pilot' : ''}`);
      this.links.append(marker);
    }
  }

  private addLink(from: TreePoint, to: TreePoint, acquired: boolean, offered: boolean, kind: 'permanent' | 'vitality'): void {
    this.addPath(
      `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`,
      `lab-tree-link${acquired ? ' is-acquired' : ''}${offered ? ' is-offered' : ''}${kind === 'vitality' ? ' is-vitality' : ''}`
    );
  }

  private addPath(d: string, className: string): void {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', className);
    this.links.append(path);
  }

  private createUpgradeNode(
    definition: LaboratoryUpgradeDefinition,
    rank: number,
    point: TreePoint,
    level: number,
    offered: boolean
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `lab-tree-node${rank <= level ? ' is-acquired' : ''}${offered ? ' is-offered' : ' is-reserved'}`;
    button.dataset.treeKind = 'permanent';
    button.dataset.upgrade = definition.id;
    button.dataset.rank = String(rank);
    button.dataset.offered = String(offered);
    button.dataset.acquired = String(rank <= level);
    button.dataset.worldX = String(point.x);
    button.dataset.worldY = String(point.y);
    button.style.left = `${point.x - 43}px`;
    button.style.top = `${point.y - 43}px`;
    const state = rank <= level ? 'adquirido' : offered ? 'en la oferta actual' : 'en reserva';
    button.setAttribute('aria-label', `${definition.name}, rango ${rank} de ${LABORATORY_MAX_RANK}, ${state}. Abrir detalles.`);
    button.append(this.createNodeFace(definition.icon), this.createRankMark(rank));
    button.addEventListener('click', () => this.openUpgradeDetails(definition.id, rank, button));
    return button;
  }

  private createVitalityNode(rank: number, point: TreePoint, acquired: boolean): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `lab-tree-node is-vitality${acquired ? ' is-acquired' : canClaimLaboratoryVitalityAd(this.laboratory) ? ' is-offered' : ' is-reserved'}`;
    button.dataset.treeKind = 'vitality';
    button.dataset.rank = String(rank);
    button.dataset.offered = String(rank === this.laboratory.vitalityAdRank + 1 && canClaimLaboratoryVitalityAd(this.laboratory));
    button.dataset.acquired = String(acquired);
    button.dataset.worldX = String(point.x);
    button.dataset.worldY = String(point.y);
    button.style.left = `${point.x - 43}px`;
    button.style.top = `${point.y - 43}px`;
    const state = acquired ? 'anuncio completado' : canClaimLaboratoryVitalityAd(this.laboratory) ? 'recompensa disponible' : `${this.laboratory.purchasesSinceVitalityAd} de 3 compras NOVA`;
    button.setAttribute('aria-label', `Pulso de vitalidad, rango ${rank} de ${LABORATORY_VITALITY_AD_MAX_RANK}, ${state}. Abrir detalles.`);
    button.append(this.createNodeFace('core'), this.createRankMark(rank));
    button.addEventListener('click', () => this.openVitalityDetails(rank, button));
    return button;
  }

  private createNodeFace(iconName: string): HTMLSpanElement {
    const face = document.createElement('span');
    face.className = 'lab-tree-node-face';
    face.append(createIcon(iconName));
    return face;
  }

  private createRankMark(rank: number): HTMLSpanElement {
    const marker = document.createElement('span');
    marker.className = 'lab-tree-node-rank';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = `R${rank}`;
    return marker;
  }

  private openUpgradeDetails(id: LaboratoryUpgradeId, rank: number, opener: HTMLButtonElement): void {
    this.selectedNode = { kind: 'upgrade', id, rank };
    this.opener = opener;
    this.updateUpgradeDialog();
    this.dialog.showModal();
    this.dialogClose.focus({ preventScroll: true });
  }

  private openVitalityDetails(rank: number, opener: HTMLButtonElement): void {
    this.selectedNode = { kind: 'vitality', rank };
    this.opener = opener;
    this.updateVitalityDialog();
    this.dialog.showModal();
    this.dialogClose.focus({ preventScroll: true });
  }

  private updateUpgradeDialog(): void {
    if (this.selectedNode?.kind !== 'upgrade') return;
    const { id, rank } = this.selectedNode;
    const definition = getLaboratoryUpgradeDefinition(id);
    const level = this.laboratory.levels[id] ?? 0;
    const cost = definition.costsNova[level];
    const acquired = rank <= level;
    const offered = !acquired && rank === level + 1 && this.laboratory.currentOfferIds.includes(id);
    const affordable = cost !== undefined && this.wallet.nova >= cost;
    this.dialogIcon.replaceChildren(createIcon(definition.icon));
    this.dialogIcon.dataset.tone = 'cyan';
    this.dialogEyebrow.textContent = offered ? 'CALIBRACIÓN DISPONIBLE' : acquired ? 'REGISTRO ADQUIRIDO' : 'RAMA EN RESERVA';
    this.dialogTitle.textContent = definition.name;
    this.dialogDescription.textContent = definition.description;
    this.dialogRank.textContent = `RANGO ${rank} · PROGRESO ${level}/${LABORATORY_MAX_RANK}`;
    this.renderProgress(this.dialogProgress, level, LABORATORY_MAX_RANK, rank);
    this.dialogDelta.textContent = rankDeltaLabel(definition);
    this.dialogTotal.textContent = level < definition.maxRank
      ? `Total actual: ${effectSummary(definition, level)} · siguiente: ${effectSummary(definition, level + 1)}`
      : `Total actual: ${effectSummary(definition, level)} · tope alcanzado`;
    this.dialogStatus.textContent = acquired
      ? `Este rango ya está integrado. ${rank === level ? 'Es tu rango actual.' : `Tu rama ya avanzó hasta R${level}.`}`
      : offered
        ? affordable
          ? `Oferta actual · costo ${formatNova(cost!)} NOVA.`
          : `Oferta actual, pero faltan ${formatNova(cost! - this.wallet.nova)} NOVA para adquirirla.`
        : 'Puedes inspeccionar la rama; solo se puede comprar cuando aparezca entre las tres calibraciones de la rotación.';
    this.dialogAction.disabled = acquired || !offered || !affordable || !this.options;
    this.dialogAction.textContent = acquired
      ? 'RANGO ADQUIRIDO'
      : !offered ? 'EN RESERVA'
        : !affordable ? `FALTAN ${formatNova((cost ?? 0) - this.wallet.nova)} NOVA`
          : `ADQUIRIR · ${formatNova(cost!)} NOVA`;
    appendNovaIcon(this.dialogAction);
  }

  private updateVitalityDialog(): void {
    if (this.selectedNode?.kind !== 'vitality') return;
    const { rank } = this.selectedNode;
    const currentRank = this.laboratory.vitalityAdRank;
    const eligible = canClaimLaboratoryVitalityAd(this.laboratory);
    const acquired = rank <= currentRank;
    this.dialogIcon.replaceChildren(createIcon('core'));
    this.dialogIcon.dataset.tone = 'gold';
    this.dialogEyebrow.textContent = 'BONIFICACIÓN OPCIONAL · REWARDED';
    this.dialogTitle.textContent = 'Pulso de vitalidad';
    this.dialogDescription.textContent = 'Completa un anuncio opcional para aumentar permanentemente 1% tu vida máxima. No consume NOVA.';
    this.dialogRank.textContent = `RANGO ${rank} DE ${LABORATORY_VITALITY_AD_MAX_RANK} · ACTUAL ${currentRank}/${LABORATORY_VITALITY_AD_MAX_RANK}`;
    this.renderProgress(this.dialogProgress, currentRank, LABORATORY_VITALITY_AD_MAX_RANK, rank);
    this.dialogDelta.textContent = `+${percent(LABORATORY_VITALITY_AD_PER_RANK * 100)} de vida máxima por anuncio completado`;
    this.dialogTotal.textContent = `Progreso de compras: ${this.laboratory.purchasesSinceVitalityAd}/3 NOVA · Vitalidad acumulada: +${percent(currentRank * LABORATORY_VITALITY_AD_PER_RANK * 100)}`;
    this.dialogStatus.textContent = this.vitalityFeedback ?? (acquired
      ? 'Este rango ya fue reclamado.'
      : eligible
        ? 'Recompensa disponible. Solo se aplica si el anuncio termina correctamente.'
        : `Compra ${3 - this.laboratory.purchasesSinceVitalityAd} mejora${3 - this.laboratory.purchasesSinceVitalityAd === 1 ? '' : 's'} con NOVA para habilitar el anuncio.`);
    this.dialogAction.disabled = acquired || !eligible || !this.options?.vitalityAdAvailable || this.vitalityPending;
    this.dialogAction.textContent = acquired
      ? 'RANGO RECLAMADO'
      : this.vitalityPending ? 'CARGANDO ANUNCIO…'
        : !eligible ? 'DISPONIBLE TRAS 3 COMPRAS'
          : !this.options?.vitalityAdAvailable ? 'ANUNCIO NO DISPONIBLE'
            : 'VER ANUNCIO · +1% VIDA';
  }

  private renderProgress(host: HTMLElement, level: number, maxRank: number, selectedRank: number): void {
    host.replaceChildren();
    for (let rank = 1; rank <= maxRank; rank += 1) {
      const pip = document.createElement('span');
      if (rank <= level) pip.classList.add('is-filled');
      if (rank === selectedRank) pip.classList.add('is-selected');
      host.append(pip);
    }
  }

  private activateSelectedNode(): void {
    if (this.selectedNode?.kind === 'upgrade') {
      const { id, rank } = this.selectedNode;
      if (rank <= (this.laboratory.levels[id] ?? 0)) return;
      this.purchase(id);
      return;
    }
    if (this.selectedNode?.kind === 'vitality') void this.requestVitalityAd();
  }

  private renderHistory(): void {
    this.historyList.replaceChildren();
    const entries = this.laboratory.history.slice(-LABORATORY_HISTORY_LIMIT).reverse();
    for (const entry of entries) {
      const definition = getLaboratoryUpgradeDefinition(entry.upgradeId);
      const row = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = definition.name;
      const rank = document.createElement('small');
      rank.textContent = `R${entry.rank}`;
      const cost = document.createElement('small');
      cost.textContent = `${formatNova(entry.costNova)} NOVA`;
      row.append(name, rank, cost);
      this.historyList.append(row);
    }
    if (entries.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'lab-empty-state';
      empty.textContent = 'Tus decisiones recientes aparecerán aquí.';
      this.historyList.append(empty);
    }
  }

  private purchase(id: LaboratoryUpgradeId): void {
    if (!this.options) return;
    const result = purchaseLaboratoryUpgrade(this.laboratory, this.wallet.nova, id);
    if (!result.purchased) {
      this.updateUpgradeDialog();
      return;
    }
    const wallet = { nova: result.nova };
    if (!this.options.onPurchase(result.laboratory, wallet)) return;
    const purchasedRank = result.laboratory.levels[id] ?? 1;
    this.laboratory = result.laboratory;
    this.wallet = wallet;
    this.vitalityFeedback = null;
    this.dialog.close();
    this.render();
    this.resetCamera();
    const purchasedNode = this.nodes.querySelector<HTMLButtonElement>(`.lab-tree-node[data-upgrade="${id}"][data-rank="${purchasedRank}"]`);
    if (purchasedNode) {
      purchasedNode.focus({ preventScroll: true });
      this.centerNodeIfClipped(purchasedNode);
    }
  }

  private async requestVitalityAd(): Promise<void> {
    const options = this.options;
    if (!options || !canClaimLaboratoryVitalityAd(this.laboratory) || !options.vitalityAdAvailable || this.vitalityPending) return;
    this.vitalityPending = true;
    this.vitalityFeedback = null;
    const requestToken = ++this.vitalityRequestToken;
    this.updateVitalityDialog();
    try {
      const response = await options.onVitalityAd();
      if (requestToken !== this.vitalityRequestToken) return;
      if (response.result === 'rewarded' && response.laboratory) {
        this.laboratory = response.laboratory;
        this.vitalityFeedback = 'Vitalidad calibrada: +1% de vida máxima permanente.';
        this.dialog.close();
        this.render();
      } else {
        this.vitalityFeedback = response.result === 'dismissed'
          ? 'El anuncio se cerró; no se aplicó ninguna mejora.'
          : response.result === 'unavailable'
            ? 'No hay anuncios disponibles ahora. Tu progreso de compras se conserva.'
            : 'No se pudo completar el anuncio. No se aplicó ninguna mejora.';
      }
    } finally {
      if (requestToken === this.vitalityRequestToken) {
        this.vitalityPending = false;
        if (this.selectedNode?.kind === 'vitality') this.updateVitalityDialog();
      }
    }
  }

  private resetCamera(): void {
    const mobile = this.stage.clientWidth < 520;
    this.cameraScale = mobile ? 0.54 : 0.78;
    this.cameraPanX = -((FIRST_RANK_X - CORE.x) * this.cameraScale) / 2;
    this.cameraPanY = 0;
    this.applyCamera();
  }

  private zoomBy(delta: number): void {
    const rect = this.stage.getBoundingClientRect();
    this.zoomAt(rect.width / 2, rect.height / 2, this.cameraScale + delta);
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = this.stage.getBoundingClientRect();
    const factor = event.deltaY < 0 ? 1.08 : 0.92;
    this.zoomAt(event.clientX - rect.left, event.clientY - rect.top, this.cameraScale * factor);
  }

  private zoomAt(screenX: number, screenY: number, requestedScale: number): void {
    const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, requestedScale));
    if (scale === this.cameraScale) return;
    const rect = this.stage.getBoundingClientRect();
    const worldX = (screenX - rect.width / 2 - this.cameraPanX) / this.cameraScale + CORE.x;
    const worldY = (screenY - rect.height / 2 - this.cameraPanY) / this.cameraScale + CORE.y;
    this.cameraScale = scale;
    this.placeWorldAtScreen({ x: worldX, y: worldY }, { x: screenX, y: screenY }, rect.width, rect.height);
    this.applyCamera();
  }

  private screenToWorld(point: PointerPoint): TreePoint {
    const rect = this.stage.getBoundingClientRect();
    return {
      x: (point.x - rect.width / 2 - this.cameraPanX) / this.cameraScale + CORE.x,
      y: (point.y - rect.height / 2 - this.cameraPanY) / this.cameraScale + CORE.y
    };
  }

  private placeWorldAtScreen(world: TreePoint, screen: PointerPoint, width: number, height: number): void {
    this.cameraPanX = screen.x - width / 2 - (world.x - CORE.x) * this.cameraScale;
    this.cameraPanY = screen.y - height / 2 - (world.y - CORE.y) * this.cameraScale;
  }

  private applyCamera(): void {
    const rect = this.stage.getBoundingClientRect();
    const translateX = rect.width / 2 - CORE.x * this.cameraScale + this.cameraPanX;
    const translateY = rect.height / 2 - CORE.y * this.cameraScale + this.cameraPanY;
    this.world.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${this.cameraScale})`;
    this.updateZoomControls();
  }

  private updateZoomControls(): void {
    this.zoomValue.value = `${Math.round(this.cameraScale * 100)}%`;
    this.zoomValue.textContent = this.zoomValue.value;
    this.zoomIn.disabled = this.cameraScale >= MAX_ZOOM - 0.001;
    this.zoomOut.disabled = this.cameraScale <= MIN_ZOOM + 0.001;
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.keyboardNavigationPending = false;
    if ((event.target as HTMLElement).closest('button')) return;
    const rect = this.stage.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.stage.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, point);
    if (this.pointers.size === 1) {
      this.dragPointerId = event.pointerId;
      this.lastPointer = point;
      this.pinchSeed = null;
      this.stage.classList.add('is-panning');
    } else if (this.pointers.size >= 2) {
      const entries = Array.from(this.pointers.entries()).slice(0, 2);
      const first = entries[0]![1];
      const second = entries[1]![1];
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      this.pinchSeed = {
        ids: [entries[0]![0], entries[1]![0]],
        distance: Math.max(1, distance(first, second)),
        scale: this.cameraScale,
        world: this.screenToWorld(midpoint)
      };
      this.dragPointerId = null;
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    const rect = this.stage.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.pointers.set(event.pointerId, point);
    if (this.pinchSeed) {
      const first = this.pointers.get(this.pinchSeed.ids[0]);
      const second = this.pointers.get(this.pinchSeed.ids[1]);
      if (!first || !second) return;
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      this.cameraScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.pinchSeed.scale * distance(first, second) / this.pinchSeed.distance));
      this.placeWorldAtScreen(this.pinchSeed.world, midpoint, rect.width, rect.height);
      this.applyCamera();
      return;
    }
    if (event.pointerId !== this.dragPointerId || !this.lastPointer) return;
    this.cameraPanX += point.x - this.lastPointer.x;
    this.cameraPanY += point.y - this.lastPointer.y;
    this.lastPointer = point;
    this.applyCamera();
  }

  private onPointerEnd(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.delete(event.pointerId);
    if (this.pointers.size >= 2) {
      const entries = Array.from(this.pointers.entries()).slice(0, 2);
      const first = entries[0]![1];
      const second = entries[1]![1];
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      this.pinchSeed = {
        ids: [entries[0]![0], entries[1]![0]],
        distance: Math.max(1, distance(first, second)),
        scale: this.cameraScale,
        world: this.screenToWorld(midpoint)
      };
      return;
    }
    this.pinchSeed = null;
    const remaining = Array.from(this.pointers.entries())[0];
    if (remaining) {
      this.dragPointerId = remaining[0];
      this.lastPointer = remaining[1];
    } else {
      this.dragPointerId = null;
      this.lastPointer = null;
      this.stage.classList.remove('is-panning');
    }
  }

  private centerNodeIfClipped(node: HTMLButtonElement): void {
    const rect = node.getBoundingClientRect();
    const stage = this.stage.getBoundingClientRect();
    if (rect.left >= stage.left && rect.right <= stage.right && rect.top >= stage.top && rect.bottom <= stage.bottom) return;
    const x = Number(node.dataset.worldX);
    const y = Number(node.dataset.worldY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    this.cameraPanX = 0;
    this.cameraPanY = 0;
    this.placeWorldAtScreen({ x, y }, { x: stage.width / 2, y: stage.height / 2 }, stage.width, stage.height);
    this.applyCamera();
  }
}
