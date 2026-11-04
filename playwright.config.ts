import { defineConfig, devices } from '@playwright/test';

const externalBase = process.env.BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: externalBase || 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: externalBase ? undefined : {
    command: 'npm start',
    url: 'http://localhost:3100/api/health',
    reuseExistingServer: false,
    env: { PORT: '3100', PUBLIC_ORIGIN: 'http://localhost:3100', PRODUCT_SOURCE: 'fixture' },
  },
});