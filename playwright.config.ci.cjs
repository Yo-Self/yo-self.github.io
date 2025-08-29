const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced from 2 to 1 to prevent infinite loops
  workers: process.env.CI ? 2 : undefined,
  timeout: process.env.CI ? 30000 : 15000, // Reduced from 60s to 30s
  
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  outputDir: 'test-results/',
  
  expect: {
    timeout: process.env.CI ? 10000 : 5000, // Reduced from 15s to 10s
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: process.env.CI ? 10000 : 5000, // Reduced from 15s to 10s
    navigationTimeout: process.env.CI ? 15000 : 10000, // Reduced from 20s to 15s
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
  
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'NODE_ENV=test npm run dev:test',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000, // Reduced from 120s to 60s
    stderr: 'pipe',
    stdout: 'pipe',
    env: {
      CI: 'true',
      NODE_ENV: 'test', // Force test environment
      NEXT_PUBLIC_DISABLE_SW: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:9999', // Invalid URL to prevent API calls
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'invalid-key', // Invalid key to prevent API calls
      GOOGLE_AI_API_KEY: 'demo-key',
      DISABLE_API_CALLS: 'true' // Flag to disable API calls in tests
    }
  },
});
