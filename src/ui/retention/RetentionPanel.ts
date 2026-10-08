import coreSentinelUrl from '../../assets/images/enemies/core-sentinel.webp?no-inline';
import chargerUrl from '../../assets/images/enemies/charger.webp?no-inline';
import orbitalWardenUrl from '../../assets/images/enemies/orbital-warden.webp?no-inline';
import fractureEngineUrl from '../../assets/images/enemies/fracture-engine.webp?no-inline';
import { REWARD_COSMETIC_IMAGES } from '../../assets/skins/RewardCosmeticAssets';
import {
  RETENTION_OBJECTIVES,
  RETENTION_WEEKLY_NOVA_AFTER_COLLECTION,
  getRetentionObjectiveProgress,
  getRetentionWeeklyEdition,
  type RetentionChallengeId,
  type RetentionClaimResult,
  type RetentionObjectiveId,
  type RetentionSaveData,
  type RetentionWeeklyEdition
} from '../../content/retention/RetentionDefinitions';
import { MAX_NOVA } from '../../platform/save/SaveStore';
import { observeVisibleImages } from '../ImageReadiness';
import { logbookCopy } from './LogbookCopy';
import { getFormattingLocale } from '../../i18n';

const ART: Readonly<Record<string, string>> = {
  'core-sentinel': coreSentinelUrl,
  charger: chargerUrl,
  'orbital-warden': orbitalWardenUrl,
  'fracture-engine': fractureEngineUrl
};

export interface RetentionPanelOptions {
  readonly progress: RetentionSaveData;
  readonly edition: RetentionWeeklyEdition;
  readonly skinOwned: boolean;
  readonly readRewardOwned?: (id: RetentionWeeklyEdition['reward']['id']) => boolean;
  readonly walletNova: number;
  readonly onSelectObjective: (id: RetentionObjectiveId) => void;
  readonly onClaimObjective: (id: RetentionObjectiveId) => Promise<RetentionClaimResult>;
  readonly readProgress: () => { readonly progress: RetentionSaveData; readonly walletNova: number };
  readonly onStartChallenge: (id: RetentionChallengeId) => void;
  readonly onViewReward: (family: RetentionWeeklyEdition['reward']['family'], id: RetentionWeeklyEdition['reward']['id']) => void;
}

const image = (src: string, alt: string, className: string): HTMLImageElement => {
  const node = new Image();
  node.src = src;
  node.alt = alt;
  node.className = className;
  node.loading = 'lazy';
  node.decoding = 'async';
  node.draggable = false;
  return node;
};

const countdownText = (milliseconds: number, locale: 'es-MX' | 'en-US'): string => {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor(totalMinutes % 1440 / 60);
  const minutes = totalMinutes % 60;
  const units = locale === 'es-MX' ? { days: 'd', hours: 'h', minutes: 'min' } : { days: 'd', hours: 'hr', minutes: 'min' };
  return days > 0 ? `${days} ${units.days} ${hours} ${units.hours}`
    : hours > 0 ? `${hours} ${units.hours} ${minutes} ${units.minutes}`
      : `${minutes} ${units.minutes}`;
};

export class RetentionPanel {
  private readonly root: HTMLElement;
  private options: RetentionPanelOptions | null = null;
  private countdown: HTMLElement | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private generation = 0;
  private claiming = false;

  public constructor(root: HTMLElement) {
    this.root = root;
  }

  public render(options: RetentionPanelOptions): void {
    this.generation++;
    this.options = options;
    this.clearTimer();
    this.root.replaceChildren();
    this.countdown = null;
    this.root.append(this.createWeeklyCard(options), this.createObjectives(options));
    observeVisibleImages(this.root);
    this.updateCountdown();
  }

  public setVisible(visible: boolean): void {
    this.clearTimer();
    if (!visible) { this.generation++; return; }
    if (!this.options) return;
    this.render({ ...this.options, ...this.options.readProgress() });
    this.updateCountdown();
    this.countdownTimer = setInterval(() => this.updateCountdown(), 60_000);
  }

  public close(): void {
    this.generation++;
    this.clearTimer();
    this.options = null;
  }

  private createWeeklyCard(options: RetentionPanelOptions): HTMLElement {
    const { edition, progress } = options;
    const challenge = edition.challenge;
    const card = document.createElement('article');
    card.className = 'retention-weekly-card';
    card.dataset.challenge = challenge.id;
    const artwork = document.createElement('div');
    artwork.className = 'retention-weekly-art';
    artwork.append(image(ART[challenge.artId], challenge.title, 'retention-boss-art'));
    const prize = document.createElement('button');
    prize.type = 'button';
    prize.className = 'retention-prize-art';
    prize.setAttribute('aria-label', 'Ver recompensa en Skins');
    prize.append(image(REWARD_COSMETIC_IMAGES[edition.reward.id], '', 'retention-prize-ship'));
    const prizeStatus = document.createElement('span');
    prizeStatus.className = 'retention-prize-status';
    prizeStatus.textContent = options.skinOwned ? 'ADQUIRIDA' : 'POR GANAR';
    prize.dataset.owned = String(options.skinOwned);
    prize.append(prizeStatus);
    prize.addEventListener('click', () => options.onViewReward(edition.reward.family, edition.reward.id));
    const copy = document.createElement('div');
    copy.className = 'retention-weekly-copy';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'retention-eyebrow';
    eyebrow.textContent = challenge.eyebrow;
    const title = document.createElement('h3');
    title.textContent = challenge.title;
    const briefing = document.createElement('p');
    briefing.textContent = challenge.briefing;
    const meta = document.createElement('div');
    meta.className = 'retention-weekly-meta';
    const timer = document.createElement('span');
    timer.className = 'retention-countdown';
    timer.setAttribute('aria-live', 'polite');
    this.countdown = timer;
    const reward = document.createElement('span');
    reward.className = 'retention-reward';
    const claimed = progress.weeklyClaimIds.includes(edition.editionId);
    reward.dataset.owned = String(options.skinOwned);
    const novaReward = Math.min(
      RETENTION_WEEKLY_NOVA_AFTER_COLLECTION,
      Math.max(0, MAX_NOVA - Math.floor(options.walletNova))
    );
    const rewardState = document.createElement('strong');
    rewardState.className = 'retention-reward-state';
    rewardState.textContent = options.skinOwned && !claimed ? 'NOVA DE EVENTO'
      : options.skinOwned ? 'RECOMPENSA ADQUIRIDA'
        : claimed ? 'PREMIO SEMANAL COBRADO' : 'RECOMPENSA DE ESTA SEMANA';
    const rewardName = document.createElement('span');
    rewardName.className = 'retention-reward-name';
    rewardName.textContent = options.skinOwned && !claimed
      ? novaReward > 0 ? `+${novaReward} NOVA` : 'BILLETERA LLENA'
      : edition.reward.name;
    reward.append(rewardState, rewardName);
    meta.append(timer, reward);
    const rulesButton = document.createElement('button');
    rulesButton.type = 'button';
    rulesButton.className = 'retention-rule-open';
    rulesButton.textContent = 'Ver reglas del reto';
    rulesButton.setAttribute('aria-haspopup', 'dialog');
    const rulesDialog = document.createElement('dialog');
    rulesDialog.className = 'retention-rules-dialog';
    rulesDialog.setAttribute('aria-labelledby', 'retention-rules-title');
    const rulesHeader = document.createElement('div');
    rulesHeader.className = 'retention-rules-header';
    const rulesTitle = document.createElement('h4');
    rulesTitle.id = 'retention-rules-title';
    rulesTitle.textContent = 'Reglas del reto';
    const rulesClose = document.createElement('button');
    rulesClose.type = 'button';
    rulesClose.className = 'retention-rules-close';
    rulesClose.textContent = '×';
    rulesClose.autofocus = true;
    rulesClose.setAttribute('aria-label', 'Cerrar reglas');
    rulesHeader.append(rulesTitle, rulesClose);
    const rules = document.createElement('ul');
    rules.className = 'retention-rules';
    for (const rule of challenge.rules) {
      const item = document.createElement('li');
      item.textContent = rule;
      rules.append(item);
    }
    rulesDialog.append(rulesHeader, rules);
    const closeRules = (): void => {
      if (rulesDialog.open) rulesDialog.close();
    };
    rulesButton.addEventListener('click', () => {
      if (!rulesDialog.open) rulesDialog.showModal();
    });
    rulesClose.addEventListener('click', closeRules);
    rulesDialog.addEventListener('click', event => {
      if (event.target === rulesDialog) closeRules();
    });
    rulesDialog.addEventListener('close', () => rulesButton.focus({ preventScroll: true }));
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'start-primary retention-play';
    play.textContent = !edition.scheduleStarted
      ? 'Practicar · sin premio'
      : claimed ? 'Reintentar gratis' : 'Jugar reto · gratis';
    play.addEventListener('click', () => options.onStartChallenge(challenge.id));
    copy.append(eyebrow, title, briefing, meta, rulesButton, play);
    card.append(artwork, prize, copy);
    card.append(rulesDialog);
    card.dataset.rewardOwned = String(options.skinOwned);
    return card;
  }

  private createObjectives(options: RetentionPanelOptions): HTMLElement {
    const t = logbookCopy(document.documentElement.lang);
    const section = document.createElement('section');
    section.className = 'retention-logbook';
    const heading = document.createElement('div');
    heading.className = 'retention-logbook-heading';
    const copy = document.createElement('div');
    const eyebrow = document.createElement('span');
    eyebrow.className = 'retention-eyebrow';
    eyebrow.textContent = 'PROGRESO LOCAL · SIN FECHAS LÍMITE';
    const title = document.createElement('h3');
    title.textContent = 'Bitácora de vuelo';
    const description = document.createElement('p');
    description.textContent = t.description;
    copy.append(eyebrow, title, description);
    const wallet = document.createElement('span');
    wallet.className = 'retention-wallet';
    const locale = getFormattingLocale();
    wallet.textContent = `${Math.max(0, Math.floor(options.walletNova)).toLocaleString(locale)} NOVA`;
    heading.append(copy, wallet);
    const grid = document.createElement('div');
    grid.className = 'retention-objective-grid';
    const objectives = RETENTION_OBJECTIVES.map(objective => getRetentionObjectiveProgress(options.progress, objective.id))
      .filter(state => !state.retired).sort((a, b) => Number(b.completed) - Number(a.completed));
    for (const state of objectives) {
      const objective = state.definition;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'retention-objective-card';
      card.dataset.complete = String(state.completed);
      card.dataset.selected = String(options.progress.selectedObjectiveId === objective.id);
      card.dataset.objective = objective.id;
      card.setAttribute('aria-pressed', String(options.progress.selectedObjectiveId === objective.id));
      const art = document.createElement('span');
      art.className = 'retention-objective-art';
      art.append(image(ART[objective.artId], '', 'retention-objective-image'));
      art.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.className = 'retention-objective-copy';
      const name = document.createElement('strong');
      name.append(document.createTextNode(objective.title));
      if (state.repeatable) {
        name.append(document.createTextNode(' · '));
        const rank = document.createElement('span');
        rank.className = 'retention-objective-rank';
        rank.textContent = t.rank;
        name.append(rank, document.createTextNode(` ${state.rank}`));
      }
      const detail = document.createElement('span');
      detail.textContent = state.rank === 1 ? objective.description
        : (objective.metric === 'runsCompleted' ? t.runs : objective.metric === 'totalKills' ? t.kills
          : objective.metric === 'bestSurvivalSeconds' ? t.survival : t.stages)
          .replace('{target}', (objective.metric === 'bestSurvivalSeconds' ? Math.floor(objective.target / 60) : objective.target).toLocaleString(locale));
      const progress = document.createElement('span');
      progress.className = 'retention-objective-progress';
      progress.textContent = state.completed ? t.ready : `${state.value.toLocaleString(locale)} / ${objective.target.toLocaleString(locale)}`;
      const reward = document.createElement('span');
      reward.className = 'retention-objective-reward';
      reward.textContent = state.completed ? `${t.claim} +${objective.rewardNova.toLocaleString(locale)} NOVA ↗` : `+${objective.rewardNova.toLocaleString(locale)} NOVA · ${t.follow}`;
      text.append(name, detail, progress, reward);
      card.append(art, text);
      card.addEventListener('click', () => {
        if (state.completed) { void this.claimObjective(objective.id, card, options); return; }
        this.options = this.options ? {
          ...this.options,
          progress: { ...this.options.progress, selectedObjectiveId: objective.id }
        } : this.options;
        for (const entry of this.root.querySelectorAll<HTMLButtonElement>('.retention-objective-card')) {
          const selected = entry.dataset.objective === objective.id;
          entry.dataset.selected = String(selected);
          entry.setAttribute('aria-pressed', String(selected));
        }
        options.onSelectObjective(objective.id);
      });
      grid.append(card);
    }
    section.append(heading, grid);
    return section;
  }

  private async claimObjective(id: RetentionObjectiveId, card: HTMLButtonElement, options: RetentionPanelOptions): Promise<void> {
    if (this.claiming) return;
    this.claiming = true;
    const generation = this.generation;
    card.disabled = true;
    try {
      const result = await options.onClaimObjective(id);
      if (generation !== this.generation || !this.options) return;
      this.render({ ...this.options, progress: result.progress, walletNova: result.walletNova });
      this.setVisible(true);
      const message = document.createElement('p');
      message.className = 'retention-claim-message';
      message.setAttribute('role', 'status');
      message.textContent = logbookCopy(document.documentElement.lang)[result.status];
      this.root.querySelector('.retention-logbook-heading')?.after(message);
      const next = this.root.querySelector<HTMLButtonElement>(`[data-objective="${id}"]`);
      (next ?? this.root.querySelector<HTMLButtonElement>('.retention-objective-card'))?.focus({ preventScroll: true });
    } catch {
      if (generation === this.generation) card.disabled = false;
    } finally { this.claiming = false; }
  }

  private updateCountdown(): void {
    if (!this.options || !this.countdown) return;
    const { edition } = this.options;
    const currentEdition = getRetentionWeeklyEdition();
    if (currentEdition.editionId !== edition.editionId
      || currentEdition.scheduleStarted !== edition.scheduleStarted) {
      this.render({ ...this.options, ...this.options.readProgress(), edition: currentEdition,
        skinOwned: this.options.readRewardOwned?.(currentEdition.reward.id) ?? this.options.skinOwned });
      this.setVisible(true);
      return;
    }
    this.countdown.textContent = edition.scheduleStarted
      ? `SIGUIENTE ROTACIÓN · ${countdownText(edition.nextChangeMs - Date.now(), getFormattingLocale())}`
      : `LA ROTACIÓN COMIENZA · ${new Date(edition.startsAtMs).toLocaleDateString(getFormattingLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' })} UTC`;
  }

  private clearTimer(): void {
    if (this.countdownTimer !== null) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }
}
