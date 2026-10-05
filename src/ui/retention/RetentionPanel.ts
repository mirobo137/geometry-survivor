import coreSentinelUrl from '../../assets/images/enemies/core-sentinel.webp?no-inline';
import chargerUrl from '../../assets/images/enemies/charger.webp?no-inline';
import orbitalWardenUrl from '../../assets/images/enemies/orbital-warden.webp?no-inline';
import fractureEngineUrl from '../../assets/images/enemies/fracture-engine.webp?no-inline';
import asterionUrl from '../../assets/skins/ships/asterion/asterion.webp?no-inline';
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
  readonly walletNova: number;
  readonly onSelectObjective: (id: RetentionObjectiveId) => void;
  readonly onClaimObjective: (id: RetentionObjectiveId) => Promise<RetentionClaimResult>;
  readonly readProgress: () => { readonly progress: RetentionSaveData; readonly walletNova: number };
  readonly onStartChallenge: (id: RetentionChallengeId) => void;
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

const countdownText = (milliseconds: number): string => {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor(totalMinutes % 1440 / 60);
  const minutes = totalMinutes % 60;
  return days > 0 ? `${days} d ${hours} h` : hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
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
    const prize = document.createElement('div');
    prize.className = 'retention-prize-art';
    prize.append(image(asterionUrl, '', 'retention-prize-ship'));
    prize.setAttribute('aria-hidden', 'true');
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
    const novaReward = Math.min(
      RETENTION_WEEKLY_NOVA_AFTER_COLLECTION,
      Math.max(0, MAX_NOVA - Math.floor(options.walletNova))
    );
    reward.textContent = claimed
      ? 'PREMIO SEMANAL RECLAMADO'
      : options.skinOwned ? novaReward > 0 ? `NOVA DE EVENTO · ${novaReward}` : 'NOVA DE EVENTO · BILLETERA LLENA'
        : 'NAVE EXCLUSIVA · ASTERION COURIER';
    meta.append(timer, reward);
    const rules = document.createElement('ul');
    rules.className = 'retention-rules';
    for (const rule of challenge.rules) {
      const item = document.createElement('li');
      item.textContent = rule;
      rules.append(item);
    }
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'start-primary retention-play';
    play.textContent = !edition.scheduleStarted
      ? 'Practicar ahora · sin premio'
      : claimed ? 'Repetir gratis · premio reclamado' : 'Entrar al reto semanal · gratis';
    play.addEventListener('click', () => options.onStartChallenge(challenge.id));
    copy.append(eyebrow, title, briefing, meta, rules, play);
    card.append(artwork, prize, copy);
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
    wallet.textContent = `${Math.max(0, Math.floor(options.walletNova)).toLocaleString('es-MX')} NOVA`;
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
      name.textContent = `${objective.title}${state.repeatable ? ` · ${t.rank} ${state.rank}` : ''}`;
      const detail = document.createElement('span');
      detail.textContent = state.rank === 1 ? objective.description
        : (objective.metric === 'runsCompleted' ? t.runs : objective.metric === 'totalKills' ? t.kills
          : objective.metric === 'bestSurvivalSeconds' ? t.survival : t.stages)
          .replace('{target}', (objective.metric === 'bestSurvivalSeconds' ? Math.floor(objective.target / 60) : objective.target).toLocaleString());
      const progress = document.createElement('span');
      progress.className = 'retention-objective-progress';
      progress.textContent = state.completed ? t.ready : `${state.value.toLocaleString('es-MX')} / ${objective.target.toLocaleString('es-MX')}`;
      const reward = document.createElement('span');
      reward.className = 'retention-objective-reward';
      reward.textContent = state.completed ? `${t.claim} +${objective.rewardNova.toLocaleString('es-MX')} NOVA ↗` : `+${objective.rewardNova.toLocaleString('es-MX')} NOVA · ${t.follow}`;
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
      this.render({ ...this.options, edition: currentEdition });
      this.setVisible(true);
      return;
    }
    this.countdown.textContent = edition.scheduleStarted
      ? `SIGUIENTE ROTACIÓN · ${countdownText(edition.nextChangeMs - Date.now())}`
      : `LA ROTACIÓN COMIENZA · ${new Date(edition.startsAtMs).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' })} UTC`;
  }

  private clearTimer(): void {
    if (this.countdownTimer !== null) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }
}
