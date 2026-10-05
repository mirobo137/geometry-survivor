import rimUrl from '../../assets/images/ui/retention/wheel-rim.webp?no-inline';
import { REWARD_COSMETIC_IMAGES } from '../../assets/skins/RewardCosmeticAssets';
import { getRewardCosmetic, getSeasonalReward, type RewardCosmeticId } from '../../content/retention/RewardCosmeticDefinitions';
import novaUrl from '../../assets/svg/ui/nova.svg?no-inline';
import { DAILY_WHEEL_NOVA, DAILY_WHEEL_SLOT_COUNT, dailyWheelAvailability,
  type DailyWheelKind, type DailyWheelReceipt, type DailyWheelResult, type DailyWheelSnapshot } from '../../content/retention/DailyWheelDefinitions';
import { dailyWheelCopy } from './DailyWheelCopy';

export interface DailyWheelDialogOptions {
  readonly read: () => DailyWheelSnapshot;
  readonly spin: (kind: DailyWheelKind) => Promise<DailyWheelResult>;
  readonly equip: (id?: DailyWheelReceipt['skin']) => boolean;
  readonly videoAvailable: boolean;
  readonly videoSimulation?: boolean;
  readonly onClose: () => void;
}

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const image = (url: string, className: string) => {
  const node = element('img', className);
  node.src = url;
  node.alt = '';
  node.decoding = 'async';
  node.draggable = false;
  return node;
};

/** A single transform animates the pre-saved result; this view never draws a prize. */
export class DailyWheelDialog {
  private readonly dialog = element('dialog', 'daily-wheel-dialog');
  private readonly copy = dailyWheelCopy(document.documentElement.lang || 'en');
  private options: DailyWheelDialogOptions | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private animation: Animation | null = null;
  private opener: HTMLElement | null = null;
  private generation = 0;
  private busy = false;
  private awaiting = false;
  private angle = 0;
  private mode: DailyWheelKind = 'free';
  private showWonSkin = false;
  private spinRewardId: RewardCosmeticId | undefined;
  private disk = element('div', 'daily-wheel-disk');
  private freeButton = element('button', 'daily-wheel-free');
  private videoButton = element('button', 'daily-wheel-video');
  private skipButton = element('button', 'daily-wheel-skip');
  private closeButton = element('button', 'daily-wheel-close', '×');
  private message = element('p', 'daily-wheel-message');
  private timer = element('p', 'daily-wheel-countdown');
  private wallet = element('span', 'daily-wheel-wallet');
  private prizeNote = element('p', 'daily-wheel-prize-note');
  private result = element('section', 'daily-wheel-result');
  private modeLabel = element('span', 'daily-wheel-mode');
  private oddsNote = element('p', 'daily-wheel-odds-note');
  private oddsList = element('ul', 'daily-wheel-odds-list');
  private prizeArt = image('', 'daily-wheel-ship');
  private prizeTitle = element('h3', '');
  private prizeSubtitle = element('p', '');
  private get reward() { return getRewardCosmetic(this.spinRewardId ?? this.options?.read().rewardId) ?? getSeasonalReward('daily-wheel'); }

  public constructor() {
    this.dialog.id = 'daily-wheel-dialog';
    this.dialog.setAttribute('aria-labelledby', 'daily-wheel-title');
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); if (!this.awaiting) this.close(); });
    this.dialog.addEventListener('click', event => {
      if (event.target !== this.dialog || this.awaiting) return;
      const box = this.dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) this.close();
    });
    this.dialog.addEventListener('close', () => { if (!this.dialog.open) this.cleanup(); });
  }

  public open(options: DailyWheelDialogOptions, opener: HTMLElement): void {
    if (this.dialog.open) return;
    this.options = options;
    this.opener = opener;
    this.generation += 1;
    this.busy = false;
    this.awaiting = false;
    this.mode = 'free';
    this.showWonSkin = false;
    this.spinRewardId = undefined;
    this.angle = 0;
    this.build();
    document.body.append(this.dialog);
    this.dialog.showModal();
    this.refresh();
    const receipt = options.read().progress.lastReceipt;
    if (receipt) this.showResult(receipt, true);
    this.interval = setInterval(() => this.refresh(), 1000);
    window.addEventListener('storage', this.onStorage);
    this.closeButton.focus();
  }

  public close(): void {
    if (this.dialog.open) this.dialog.close();
    this.cleanup();
  }

  private readonly onStorage = (): void => { if (!this.busy) this.refresh(); };

  private cleanup(): void {
    if (!this.options) return;
    this.generation += 1;
    if (this.interval !== null) clearInterval(this.interval);
    this.interval = null;
    window.removeEventListener('storage', this.onStorage);
    this.animation?.cancel();
    this.animation = null;
    const options = this.options;
    this.options = null;
    this.dialog.remove();
    options.onClose();
    this.opener?.focus({ preventScroll: true });
  }

  private build(): void {
    const t = this.copy;
    const header = element('header', 'daily-wheel-header');
    const heading = element('div', 'daily-wheel-heading');
    heading.append(element('p', 'daily-wheel-eyebrow', t.eyebrow));
    const title = element('h2', '', t.title); title.id = 'daily-wheel-title';
    heading.append(title, element('p', 'daily-wheel-intro', t.intro));
    this.wallet = element('span', 'daily-wheel-wallet');
    this.closeButton = element('button', 'daily-wheel-close', '×');
    this.closeButton.type = 'button'; this.closeButton.setAttribute('aria-label', t.close);
    this.closeButton.addEventListener('click', () => this.close());
    header.append(heading, this.wallet, this.closeButton);
    const body = element('div', 'daily-wheel-body');
    const orbit = element('section', 'daily-wheel-orbit');
    this.modeLabel = element('span', 'daily-wheel-mode', t.freeMode);
    const wheel = element('div', 'daily-wheel');
    wheel.setAttribute('aria-hidden', 'true');
    this.disk = element('div', 'daily-wheel-disk');
    const rim = image(rimUrl, 'daily-wheel-rim');
    const hub = element('div', 'daily-wheel-hub');
    hub.append(image(novaUrl, ''), element('span', '', 'NOVA'));
    wheel.append(this.disk, rim, hub, element('div', 'daily-wheel-pointer'));
    this.skipButton = element('button', 'daily-wheel-skip', t.skip);
    this.skipButton.type = 'button'; this.skipButton.hidden = true;
    this.skipButton.addEventListener('click', () => this.animation?.finish());
    this.oddsNote = element('p', 'daily-wheel-odds-note');
    orbit.append(this.modeLabel, wheel, this.oddsNote, this.skipButton);
    const side = element('section', 'daily-wheel-side');
    const prize = element('div', 'daily-wheel-prize');
    this.prizeArt = image(REWARD_COSMETIC_IMAGES[this.reward.id], 'daily-wheel-ship');
    this.prizeTitle = element('h3', '', this.reward.name);
    this.prizeSubtitle = element('p', '', this.reward.description);
    const text = element('div', 'daily-wheel-prize-copy');
    text.append(element('span', 'daily-wheel-eyebrow', t.exclusive), this.prizeTitle, this.prizeSubtitle);
    this.prizeNote = element('p', 'daily-wheel-prize-note');
    prize.append(this.prizeArt, text, this.prizeNote);
    this.freeButton = element('button', 'daily-wheel-free', t.free);
    this.freeButton.id = 'daily-wheel-free'; this.freeButton.type = 'button';
    this.freeButton.addEventListener('click', () => void this.spin('free'));
    this.timer = element('p', 'daily-wheel-countdown');
    this.videoButton = element('button', 'daily-wheel-video', t.video);
    this.videoButton.id = 'daily-wheel-video'; this.videoButton.type = 'button';
    this.videoButton.addEventListener('click', () => void this.spin('video'));
    this.message = element('p', 'daily-wheel-message');
    this.message.setAttribute('role', 'status'); this.message.setAttribute('aria-live', 'polite');
    this.result = element('section', 'daily-wheel-result');
    this.result.hidden = true; this.result.setAttribute('aria-live', 'polite');
    side.append(prize, this.freeButton, this.timer, this.videoButton, element('p', 'daily-wheel-extra-note', t.extraNote), this.message, this.result);
    if (this.options?.videoSimulation) side.append(element('p', 'daily-wheel-extra-note', t.simulation));
    const details = element('details', 'daily-wheel-odds');
    details.append(element('summary', '', t.odds));
    this.oddsList = element('ul', 'daily-wheel-odds-list');
    details.append(this.oddsList, element('p', '', t.videoOdds), element('p', '', t.noPity));
    side.append(details);
    body.append(orbit, side);
    this.dialog.replaceChildren(header, body);
  }

  private renderSlots(owned: boolean): void {
    const chance = this.options!.read().progress.chancePercent;
    const tag = `${this.reward.id}-${owned}-${chance}`;
    if (this.disk.dataset.slots === tag) return;
    this.disk.dataset.slots = tag;
    this.disk.replaceChildren();
    const step = 360 / DAILY_WHEEL_SLOT_COUNT;
    const colors = DAILY_WHEEL_NOVA.map((_, i) => `${i % 2 ? '#183c52' : '#0a253c'} ${i * step}deg ${(i + 1) * step}deg`);
    colors.push(`#765126 ${10 * step}deg 360deg`);
    this.disk.style.backgroundImage = `conic-gradient(from ${-step / 2}deg, ${colors.join(',')})`;
    for (let index = 0; index < DAILY_WHEEL_SLOT_COUNT; index += 1) {
      const label = element('div', `daily-wheel-slot${index === 10 ? ' is-rare' : ''}`);
      label.dataset.slot = String(index);
      const angle = index * step * Math.PI / 180;
      label.style.left = `${50 + Math.sin(angle) * 36}%`;
      label.style.top = `${50 - Math.cos(angle) * 36}%`;
      if (index === 10 && !owned) {
        label.append(image(REWARD_COSMETIC_IMAGES[this.reward.id], 'daily-wheel-slot-ship'), element('small', '', `${chance}%`));
      } else label.append(image(novaUrl, 'daily-wheel-slot-coin'), element('strong', '', String(DAILY_WHEEL_NOVA[index] ?? 500)));
      this.disk.append(label);
    }
  }

  private refresh(): void {
    if (!this.options || this.busy) return;
    const snapshot = this.options.read();
    const reward = this.reward;
    const url = REWARD_COSMETIC_IMAGES[reward.id];
    if (this.prizeArt.getAttribute('src') !== url) this.prizeArt.src = url;
    this.prizeTitle.textContent = reward.name;
    this.prizeSubtitle.textContent = reward.description;
    const status = dailyWheelAvailability(snapshot.progress, Date.now());
    const t = this.copy;
    this.wallet.textContent = `${snapshot.walletNova.toLocaleString()} NOVA`;
    this.freeButton.disabled = !snapshot.supported || (!snapshot.pendingReward && !status.free && !status.clockAhead);
    this.freeButton.textContent = snapshot.pendingReward ? t.pending : status.clockAhead ? t.recoverClock : t.free;
    this.videoButton.disabled = !this.options.videoAvailable || !snapshot.supported || !status.video || snapshot.pendingReward;
    this.videoButton.textContent = !this.options.videoAvailable ? t.videoUnavailable : snapshot.progress.videoClaimed ? t.used : t.video;
    const chance = snapshot.progress.chancePercent;
    const novaChance = ((100 - chance) / 10).toFixed(1);
    this.prizeNote.textContent = snapshot.skinOwned ? t.collected : t.chance.replace('{chance}', String(chance));
    this.oddsNote.textContent = t.oddsNote.replace('{chance}', String(chance)).replace('{nova}', novaChance);
    this.oddsList.replaceChildren(...DAILY_WHEEL_NOVA.map(nova => element('li', '', `${nova} NOVA · ${novaChance}%`)),
      element('li', '', `${snapshot.skinOwned ? '500 NOVA' : reward.name} · ${chance}%`));
    if (!snapshot.supported) this.message.textContent = t.unsupported;
    else if (status.clockAhead) this.message.textContent = t['clock-error'];
    const seconds = Math.max(0, Math.ceil((status.nextFreeAtMs - Date.now()) / 1000));
    const time = `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor(seconds / 60 % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    this.timer.textContent = status.free ? t.ready : status.clockAhead ? t['clock-error'] : `${t.next} ${time}`;
    this.renderSlots(snapshot.skinOwned && !this.showWonSkin);
  }

  private async spin(kind: DailyWheelKind): Promise<void> {
    if (!this.options || this.busy) return;
    const options = this.options;
    const generation = this.generation;
    this.mode = kind;
    this.spinRewardId = options.read().rewardId;
    this.showWonSkin = false;
    this.renderSlots(options.read().skinOwned);
    this.modeLabel.textContent = kind === 'video' ? this.copy.videoMode : this.copy.freeMode;
    this.busy = true; this.awaiting = true;
    this.freeButton.disabled = this.videoButton.disabled = this.closeButton.disabled = true;
    this.result.hidden = true;
    this.message.textContent = kind === 'video' && !options.read().pendingReward ? this.copy.watching : this.copy.saving;
    let outcome: DailyWheelResult;
    try { outcome = await options.spin(kind); } catch { outcome = { status: 'error' }; }
    if (generation !== this.generation || !this.dialog.open) return;
    this.awaiting = false; this.closeButton.disabled = false;
    if (outcome.status === 'rewarded') {
      this.spinRewardId = outcome.receipt.rewardId ?? outcome.receipt.skin ?? this.spinRewardId;
      this.mode = outcome.receipt.kind;
      this.showWonSkin = outcome.receipt.skin !== null;
      this.modeLabel.textContent = this.mode === 'video' ? this.copy.videoMode : this.copy.freeMode;
      this.renderSlots(options.read().skinOwned && !this.showWonSkin);
      this.message.textContent = this.copy.spinning;
      this.skipButton.hidden = false;
      const target = (360 - outcome.receipt.slot * 360 / DAILY_WHEEL_SLOT_COUNT) % 360;
      const end = this.angle + 360 * 5 + (target - this.angle % 360 + 360) % 360;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.animation = this.disk.animate([{ transform: `rotate(${this.angle}deg)` }, { transform: `rotate(${end}deg)` }],
          { duration: 4200, easing: 'cubic-bezier(.12,.76,.15,1)', fill: 'forwards' });
        await this.animation.finished.catch(() => {});
      }
      if (generation !== this.generation || !this.dialog.open) return;
      this.angle = end;
      this.disk.style.transform = `rotate(${end}deg)`;
      this.animation?.cancel(); this.animation = null;
      this.skipButton.hidden = true;
      this.showResult(outcome.receipt);
      this.message.textContent = '';
    } else this.message.textContent = this.copy[outcome.status];
    this.busy = false;
    this.spinRewardId = undefined;
    this.refresh();
  }

  private showResult(receipt: DailyWheelReceipt, previous = false): void {
    this.result.replaceChildren();
    this.result.dataset.kind = receipt.skin ? 'skin' : 'nova';
    this.result.dataset.receipt = receipt.id;
    this.result.append(element('span', 'daily-wheel-eyebrow', previous ? this.copy.previous : this.copy.saved),
      element('strong', '', receipt.skin ? this.copy.unlocked.replace('{name}', getRewardCosmetic(receipt.skin)!.name) : `+${receipt.nova.toLocaleString()} NOVA`),
      element('p', '', receipt.skin ? getRewardCosmetic(receipt.skin)!.description : receipt.nova === 0 ? this.copy.full : this.copy.awarded));
    if (receipt.skin) {
      const equip = element('button', 'daily-wheel-equip', this.copy.equip);
      equip.type = 'button';
      equip.addEventListener('click', () => {
        if (this.options?.equip(receipt.skin)) { equip.textContent = this.copy.equipped; equip.disabled = true; }
      });
      this.result.append(equip);
    }
    this.result.hidden = false;
  }
}
