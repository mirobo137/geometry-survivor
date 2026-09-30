import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Against Vite dev or preview; screenshots are ignored development artifacts.
const base = process.argv[2] ?? 'http://127.0.0.1:4173';
const output = 'test-results/evolution-art';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  await mkdir(output, { recursive: true });

  const openOffer = async (suffix = '') => {
    await page.goto(`${base}/?evolution=rail-lance&debug=1&quality=low${suffix}`);
    await expect(page.locator('#boot-status')).toBeHidden({ timeout: 15_000 });
    await expect(page.locator('#level-up')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#level-up')).toHaveAttribute('data-offer-kind', 'evolution');
    await expect(page.locator('#level-up-options button')).toHaveCount(2);
    await page.locator('#debug-panel').evaluate(element => { element.style.visibility = 'hidden'; });
  };

  for (const [name, width, height] of [
    ['desktop', 1280, 720], ['mobile', 390, 844],
    ['mobile-small', 320, 568], ['landscape', 640, 360],
    ['desktop-short', 1280, 360]
  ]) {
    await page.setViewportSize({ width, height });
    await openOffer();
    await expect(page.locator('#level-up-title')).toBeInViewport();
    const art = page.locator('.upgrade-card-art img');
    await expect(art).toHaveCount(2);
    await art.evaluateAll(images => Promise.all(images.map(image => image.decode())));
    assert.deepEqual(await art.evaluateAll(images => images.map(image => [image.naturalWidth, image.naturalHeight])), [[768, 384], [768, 384]]);
    const bounds = await page.locator('#level-up-options button').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: innerWidth };
    }));
    assert.ok(bounds.every(rect => rect.left >= -1 && rect.right <= rect.width + 1), `${name}: horizontal card overflow`);
    const clearLayout = await page.locator('#level-up-options button').evaluateAll(buttons => buttons.every(button => {
      const card = button.getBoundingClientRect();
      const parts = [...button.querySelectorAll('.upgrade-card-art, .upgrade-card-title, .upgrade-card-description, .upgrade-card-art-action')]
        .map(element => element.getBoundingClientRect());
      return parts.every((part, index) => part.height > 0 && part.bottom <= card.bottom + 1
        && (index === 0 || parts[index - 1].bottom <= part.top + 1));
    }));
    assert.ok(clearLayout, `${name}: illustrated card overlaps or clips text`);
    await page.screenshot({ path: `${output}/${name}-illustrated.png` });
    const secondChoice = page.locator('[data-upgrade-id="pulse_volley"]');
    await secondChoice.scrollIntoViewIfNeeded();
    if (name === 'mobile-small') {
      await page.screenshot({ path: `${output}/${name}-second-choice.png` });
    }
    await secondChoice.click();
    await expect(page.locator('#level-up')).toBeHidden();
  }

  for (const [name, width, height] of [
    ['standard-desktop', 1280, 720],
    ['standard-mobile', 390, 844],
    ['standard-mobile-small', 320, 568]
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/?debug=1&campaign=evolved&quality=low`);
    await expect(page.locator('#boot-status')).toBeHidden({ timeout: 15_000 });
    await expect(page.locator('#level-up')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#level-up-options button')).toHaveCount(3);
    await page.locator('#debug-panel').evaluate(element => { element.style.visibility = 'hidden'; });
    const art = page.locator('.upgrade-card-art img');
    await expect(art).toHaveCount(3);
    await art.evaluateAll(images => Promise.all(images.map(image => image.decode())));
    assert.deepEqual(await art.evaluateAll(images => images.map(image => [image.naturalWidth, image.naturalHeight])),
      [[768, 384], [768, 384], [768, 384]]);
    const bounds = await page.locator('#level-up-options button').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: innerWidth };
    }));
    assert.ok(bounds.every(rect => rect.left >= -1 && rect.right <= rect.width + 1), `${name}: horizontal card overflow`);
    const contentFits = await page.locator('#level-up-options button').evaluateAll(buttons => buttons.every(button => {
      const card = button.getBoundingClientRect();
      const parts = [...button.querySelectorAll('.upgrade-card-art, .upgrade-card-title, .upgrade-card-description, .upgrade-card-art-action')]
        .map(element => element.getBoundingClientRect());
      return parts.every((part, index) => part.height > 0 && part.bottom <= card.bottom + 1
        && (index === 0 || parts[index - 1].bottom <= part.top + 1));
    }));
    assert.ok(contentFits, `${name}: illustrated upgrade card content overlaps or clips`);
    await page.screenshot({ path: `${output}/${name}.png` });
    if (name === 'standard-mobile-small') {
      const scrollable = await page.locator('#level-up-options button').last().evaluate(button => {
        for (let element = button; element && element !== document.body; element = element.parentElement) {
          const style = getComputedStyle(element);
          if (element.scrollHeight > element.clientHeight + 1 && /(auto|scroll)/.test(style.overflowY)) return true;
        }
        return false;
      });
      assert.ok(scrollable, 'small mobile: no scroll path to later illustrated choices');
      const lastChoice = page.locator('#level-up-options button').last();
      await lastChoice.scrollIntoViewIfNeeded();
      await expect(lastChoice).toBeInViewport();
      await page.screenshot({ path: `${output}/${name}-last-choice.png` });
    }
  }

  await page.setViewportSize({ width: 1280, height: 720 });
  const rasterRequests = [];
  const trackRaster = request => {
    // Vite dev serves ?url imports as JavaScript; count actual image requests.
    if (request.resourceType() === 'image' && /\/(rail-lance|pulse-volley)[^/]*\.webp/.test(request.url())) rasterRequests.push(request.url());
  };
  page.on('request', trackRaster);
  await openOffer('&card-art=svg');
  await expect(page.locator('.upgrade-card-art')).toHaveCount(0);
  await page.screenshot({ path: `${output}/desktop-svg.png` });
  page.off('request', trackRaster);
  assert.equal(rasterRequests.length, 0, 'SVG comparison must not download illustrated art');

  await page.route(/rail-lance[^/]*\.webp/, route => (
    route.request().resourceType() === 'image' ? route.abort() : route.continue()
  ));
  await openOffer();
  await expect(page.locator('[data-upgrade-id="rail_lance"] .upgrade-card-art')).toHaveCount(0);
  await expect(page.locator('[data-upgrade-id="rail_lance"] .upgrade-card-icon')).toBeVisible();
  await page.locator('[data-upgrade-id="rail_lance"]').click();
  await expect(page.locator('#level-up')).toBeHidden();
  assert.deepEqual(failures, []);
  console.log('Illustrated catalog: evolution cards in 5 viewports; three-card offers in desktop/mobile; decoded assets, no horizontal overflow, reachable small-mobile choices, SVG comparison without raster requests and failed-image fallback passed. No runtime/HTTP errors.');
} finally {
  await browser.close();
}
