import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  // The resize matrix and WebGL boot can be slower on a shared GitHub runner
  // than on a local workstation. Keep the assertions strict while allowing
  // one complete smoke scenario to finish before Playwright aborts it.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
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
    command: 'npx vite preview --mode development --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
