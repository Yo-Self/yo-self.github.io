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
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000, // Reduced from 120s to 60s
    stderr: 'pipe',
    stdout: 'pipe',
    env: {
      CI: 'true',
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL_FALLBACK || 'https://demo.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_FALLBACK || 'demo-key', // Fixed the variable name
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || 'demo-key'
    }
  },
});
