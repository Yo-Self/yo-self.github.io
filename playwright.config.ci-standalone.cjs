const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0, // No retries in CI to prevent loops
  workers: process.env.CI ? 1 : undefined, // Single worker to reduce load
  timeout: process.env.CI ? 20000 : 15000, // Shorter timeout

  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  outputDir: 'test-results/',

  expect: {
    timeout: process.env.CI ? 8000 : 5000, // Shorter expect timeout
  },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: process.env.CI ? 8000 : 5000, // Shorter action timeout
    navigationTimeout: process.env.CI ? 10000 : 10000, // Shorter navigation timeout
    headless: true,
    contextOptions: {
      serviceWorkers: 'block'
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  // EXPLICITLY NO webServer - server must be started externally
  // webServer: undefined
});
