import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173';
const outputDir = 'test-results/pause-reference';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

try {
  await mkdir(outputDir, { recursive: true });
  await page.goto(`${baseUrl}/?stress=1`, { waitUntil: 'networkidle' });
  await page.locator('#start-play').click();
  await page.locator('#pause-toggle').waitFor({ state: 'visible' });
  await page.locator('#pause-toggle').click();
  await page.locator('#pause-overlay').waitFor({ state: 'visible' });
  await page.screenshot({ path: `${outputDir}/1200-dark.png`, fullPage: true });

  await page.locator('#pause-settings-toggle').click();
  await page.screenshot({ path: `${outputDir}/1200-settings.png`, fullPage: true });

  await page.locator('#pause-resume').focus();
  await page.screenshot({ path: `${outputDir}/1200-focus.png`, fullPage: true });

  const overflowReports = [];
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 720 }]) {
    await page.setViewportSize(viewport);
    await page.screenshot({ path: `${outputDir}/${viewport.width}-settings.png`, fullPage: true });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      panelWidth: document.querySelector('#pause-overlay .pause-panel')?.getBoundingClientRect().width ?? 0
    }));
    overflowReports.push({ viewport, ...overflow });
    if (overflow.scrollWidth > overflow.clientWidth + 1) {
      throw new Error(`La pausa desborda horizontalmente: ${JSON.stringify(overflow)}`);
    }
  }
  console.log(`Pause: screenshots desktop/mobile/focus, ${JSON.stringify(overflowReports)}`);
} finally {
  await browser.close();
}
