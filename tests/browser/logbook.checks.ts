import { expect, test, type Page } from '@playwright/test';

const readSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
const open = async (page: Page) => {
  await page.goto('/?quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-retention').click();
  await expect(page.locator('#start-retention-view')).toBeVisible();
};
const seed = (page: Page, language: 'es' | 'en' = 'es') => page.addInitScript(preference => {
  localStorage.setItem('geometry-survivor:language-preference', preference);
  if (localStorage.getItem('geometry-survivor:save')) return;
  localStorage.setItem('geometry-survivor:save', JSON.stringify({ schemaVersion: 13, wallet: { nova: 250 }, retention: {
    objectiveCycles: {
      'first-flight': { claimed: 0, value: 1 }, 'radial-clear': { claimed: 0, value: 1 }, 'core-hunter': { claimed: 0, value: 1 }
    }
  } }));
}, language);

export const registerLogbookChecks = (): void => {
  test('bitácora: abre reglas en modal sin mover el botón del reto en móvil y desktop', async ({ page }) => {
    const failures: string[] = [];
    page.on('pageerror', error => failures.push(error.message));
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(viewport);
      await open(page);
      const card = page.locator('.retention-weekly-card');
      const rulesButton = card.locator('.retention-rule-open');
      const dialog = page.locator('.retention-rules-dialog');
      const rules = card.locator('.retention-rules');
      const play = card.locator('.retention-play');
      await expect(dialog).toBeHidden();
      await expect(play).toBeVisible();
      await expect(play).toBeInViewport({ ratio: 0.8 });
      const cardBounds = await card.boundingBox();
      const playBounds = await play.boundingBox();
      expect(cardBounds).not.toBeNull();
      expect(playBounds).not.toBeNull();
      expect(playBounds!.y + playBounds!.height).toBeLessThanOrEqual(cardBounds!.y + cardBounds!.height + 1);
      await rulesButton.click();
      await expect(dialog).toBeVisible();
      await expect(rules).toBeVisible();
      await expect(play).toBeInViewport({ ratio: 0.8 });
      const openCardBounds = await card.boundingBox();
      expect(openCardBounds?.height).toBeCloseTo(cardBounds!.height, 1);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(rulesButton).toBeFocused();
      await rulesButton.click();
      await dialog.locator('.retention-rules-close').click();
      await expect(dialog).toBeHidden();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('.retention-weekly-card .retention-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#game-hud')).toBeVisible();
    expect(failures).toEqual([]);
  });

  test('bitácora: abre la recompensa semanal en la categoría correcta cuando aún está por ganar', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-07T12:00:00Z'));
    await page.addInitScript(() => {
      localStorage.setItem('geometry-survivor:language-preference', 'en');
      localStorage.setItem('geometry-survivor:save', JSON.stringify({ schemaVersion: 15, wallet: { nova: 900 } }));
    });
    await open(page);
    const weekly = page.locator('.retention-weekly-card');
    await expect(weekly).toHaveAttribute('data-reward-owned', 'false');
    await expect(weekly.locator('.retention-prize-status')).toHaveText('TO EARN');
    await expect(weekly.locator('.retention-reward-state')).toHaveText('THIS WEEK’S REWARD');

    await weekly.locator('.retention-prize-art').click();
    await expect(page.locator('#start-skins-view')).toBeVisible();
    await expect(page.locator('#start-player-skins-tab')).toHaveAttribute('aria-selected', 'true');
    const rewardCard = page.locator('.skin-card[data-skin="asterion"]');
    await expect(rewardCard).toBeInViewport({ ratio: 0.8 });
    await expect(rewardCard).not.toHaveClass(/is-challenge-reward-owned/);

    for (const edition of [
      { date: '2026-11-09T12:00:00Z', family: '#start-cannon-skins-tab', card: '.cannon-card[data-cannon="astral-fang"]' },
      { date: '2026-12-14T12:00:00Z', family: '#start-backgrounds-tab', card: '.background-card[data-background="ember-remnant"]' }
    ]) {
      await page.clock.setFixedTime(new Date(edition.date));
      await page.reload();
      await open(page);
      await page.locator('.retention-weekly-card .retention-prize-art').click();
      await expect(page.locator(edition.family)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator(edition.card)).toBeInViewport({ ratio: 0.8 });
    }
    expect(errors).toEqual([]);
  });

  test('bitácora: destaca la skin de reto adquirida y la enfoca en su catálogo', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-07T12:00:00Z'));
    await page.addInitScript(() => {
      localStorage.setItem('geometry-survivor:language-preference', 'en');
      localStorage.setItem('geometry-survivor:save', JSON.stringify({
        schemaVersion: 15,
        skins: { selected: 'spearhead', unlocked: ['cyan', 'spearhead', 'asterion'] },
        wallet: { nova: 900 },
        retention: { weeklyClaimIds: ['rf2-20261005-core-duel'] }
      }));
    });
    await open(page);
    const weekly = page.locator('.retention-weekly-card');
    await expect(weekly).toHaveAttribute('data-reward-owned', 'true');
    await expect(page.locator('.retention-prize-status')).toHaveText('ACQUIRED');
    await expect(page.locator('.retention-reward-state')).toHaveText('REWARD ACQUIRED');
    await weekly.locator('.retention-prize-art').click();
    await expect(page.locator('#start-skins-view')).toBeVisible();
    const acquiredCard = page.locator('.skin-card[data-skin="asterion"]');
    await expect(acquiredCard).toBeInViewport({ ratio: 0.8 });
    await expect(acquiredCard).toHaveClass(/is-challenge-reward-owned/);
    await expect(acquiredCard.locator('.skin-card-action')).toHaveText('CHALLENGE · ACQUIRED');
    expect(errors).toEqual([]);
  });

  test('bitácora: cobra manualmente, renueva generales y retira objetivos de campaña', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await seed(page);
    await open(page);
    const first = page.locator('[data-objective="first-flight"]');
    await expect(first).toContainText('COBRAR +50 NOVA');
    expect((await readSave(page)).wallet.nova).toBe(250); // Opening never pays.
    await first.click();
    await expect(first).toContainText('Rango 2');
    await expect(first).toContainText('0 / 2');
    await expect(first).toContainText('+63 NOVA');
    expect((await readSave(page)).wallet.nova).toBe(300);
    await first.click(); // Tracks an incomplete round, cannot pay again.
    expect((await readSave(page)).wallet.nova).toBe(300);
    await page.locator('[data-objective="radial-clear"]').click();
    await expect(page.locator('[data-objective="radial-clear"]')).toHaveCount(0);
    await page.locator('[data-objective="core-hunter"]').click();
    await expect(page.locator('[data-objective="core-hunter"]')).toHaveCount(0);
    expect((await readSave(page)).wallet.nova).toBe(475);
    await page.locator('#start-retention-back').click();
    await page.locator('#start-retention').click();
    await expect(first).toContainText('Rango 2');
    expect(await page.locator('#start-retention-body').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    if (!process.env.CI) await page.screenshot({ path: info.outputPath('logbook-rank-2.png') });
    await page.reload();
    await page.locator('#start-retention').click();
    await expect(first).toContainText('0 / 2');
    await expect(page.locator('[data-objective="radial-clear"]')).toHaveCount(0);
    expect((await readSave(page)).wallet.nova).toBe(475);
    expect(errors).toEqual([]);
  });

  test('bitácora: traduce nombres repetibles junto con su rango', async ({ page }) => {
    await seed(page, 'en');
    await open(page);
    const first = page.locator('[data-objective="first-flight"]');
    await first.click();
    await expect(first.locator('.retention-objective-copy strong')).toHaveText('First Flight · Rank 2');
    await expect(first).toContainText('Finish 2 normal runs since your last claim.');
    await expect(first).toContainText('TRACK GOAL');
    await expect(page.locator('[data-objective="ten-flights"] .retention-objective-copy strong'))
      .toHaveText('Steady Pilot · Rank 1');
    await expect(page.locator('[data-objective="hundred-kills"] .retention-objective-copy strong'))
      .toHaveText('First Hundred · Rank 1');
    await expect(page.locator('[data-objective="five-hundred-kills"] .retention-objective-copy strong'))
      .toHaveText('Fleet Control · Rank 1');
    await expect(page.locator('[data-objective="fleet-breaker"] .retention-objective-copy strong'))
      .toHaveText('Linebreaker · Rank 1');
    await expect(page.locator('[data-objective="five-minutes"] .retention-objective-copy strong'))
      .toHaveText('Steady Nerves · Rank 1');
    await expect(page.locator('[data-objective="warden-hunter"] .retention-objective-copy strong'))
      .toHaveText('Formation Broken');

    await page.locator('#start-retention-back').click();
    await page.locator('#start-settings-toggle').click();
    await page.locator('#start-language').selectOption('es');
    await page.keyboard.press('Escape');
    await expect(page.locator('#start-settings')).toBeHidden();
    await page.locator('#start-retention').click();
    await expect(first.locator('.retention-objective-copy strong')).toHaveText('Primera travesía · Rango 2');
    await expect(first).toContainText('Termina 2 partidas normales desde el último cobro.');
    await expect(first).toContainText('SEGUIR OBJETIVO');
  });

  test('bitácora: conserva el cobro pendiente tras error de almacenamiento y excluye otra pestaña', async ({ page, context }) => {
    await seed(page);
    await open(page);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if ((window as unknown as { failClaim: boolean }).failClaim && key === 'geometry-survivor:save') throw new Error('quota');
        return original.call(this, key, value);
      };
      (window as unknown as { failClaim: boolean }).failClaim = true;
    });
    await page.locator('[data-objective="first-flight"]').click();
    await expect(page.locator('.retention-claim-message')).toContainText('sigue pendiente');
    expect((await readSave(page)).wallet.nova).toBe(250);
    await expect(page.locator('[data-objective="first-flight"]')).toContainText('COBRAR');
    await page.evaluate(() => { (window as unknown as { failClaim: boolean }).failClaim = false; });
    const other = await context.newPage();
    await open(other);
    await other.locator('[data-objective="first-flight"]').click();
    await expect(other.locator('[data-objective="first-flight"]')).toContainText('Rango 2');
    await page.locator('[data-objective="first-flight"]').click(); // Stale ready button rechecks durable save.
    await expect(page.locator('[data-objective="first-flight"]')).toContainText('Rango 2');
    expect((await readSave(page)).wallet.nova).toBe(300);
    await other.close();
  });
};
