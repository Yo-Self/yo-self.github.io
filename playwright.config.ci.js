const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Configurações específicas para CI
    actionTimeout: 10000,
    navigationTimeout: 15000,
    // Headless para CI
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Para CI, focamos apenas no Chromium para velocidade
    // Outros navegadores podem ser testados em workflows separados
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120 * 1000,
    // Configurações específicas para CI
    env: {
      CI: 'true',
      NODE_ENV: 'production'
    }
  },
  // Configurações específicas para CI
  globalSetup: undefined, // Desabilitado para CI
  globalTeardown: undefined, // Desabilitado para CI
  
  // Timeouts mais rigorosos para CI
  expect: {
    timeout: 10000,
  },
  
  // Configurações de output
  outputDir: 'test-results/',
  
  // Configurações de retry para CI
  retries: process.env.CI ? 2 : 0,
  
  // Configurações de workers para CI
  workers: process.env.CI ? 2 : undefined,
  
  // Configurações de timeout para CI
  timeout: process.env.CI ? 60000 : 30000,
  
  // Configurações de expect para CI
  expect: {
    timeout: process.env.CI ? 10000 : 5000,
  },
  
  // Configurações de use para CI
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: process.env.CI ? 10000 : 5000,
    navigationTimeout: process.env.CI ? 15000 : 10000,
    headless: true,
  },
});
