import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  // CI shards individual tests across separate runners. Each runner still uses
  // one worker so WebGL scenarios never compete for the same CPU budget.
  fullyParallel: Boolean(process.env.CI),
  // The resize matrix and WebGL boot can be slower on a shared GitHub runner
  // than on a local workstation. Keep the assertions strict while allowing
  // one complete smoke scenario to finish before Playwright aborts it.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Two workers on one GitHub runner previously starved Chromium.
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    // Recording every SVG-rich DOM snapshot penalizes the shared CI runner.
    // Keep full diagnostics on retry, including retries that eventually pass.
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'desktop',
      testMatch: '**/game.smoke.spec.ts',
      use: { viewport: { width: 1280, height: 720 } }
    },
    {
      name: 'mobile',
      testMatch: '**/mobile.smoke.spec.ts',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'node scripts/qa-preview.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
