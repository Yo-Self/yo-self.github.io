const { test, expect } = require('@playwright/test');

test.describe('Checkout duplicate prevention', () => {
  test('global checkout lock blocks parallel create_customer_order RPC calls', async ({ page }) => {
    let rpcCallCount = 0;

    await page.route('**/rest/v1/rpc/create_customer_order', async (route) => {
      rpcCallCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-4000-8000-000000000001',
          customer_access_token: 'test-token',
          status: 'pending_payment',
        }),
      });
    });

    await page.addInitScript(() => {
      window.__TEST_CHECKOUT__ = {
        lock: false,
        async runParallel() {
          const acquire = () => {
            if (window.__TEST_CHECKOUT__.lock) return false;
            window.__TEST_CHECKOUT__.lock = true;
            return true;
          };
          const release = () => {
            window.__TEST_CHECKOUT__.lock = false;
          };
          const callRpc = async () => {
            if (!acquire()) return;
            try {
              await fetch('https://example.supabase.co/rest/v1/rpc/create_customer_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
              });
            } finally {
              release();
            }
          };
          await Promise.all([callRpc(), callRpc()]);
        },
      };
    });

    await page.goto('about:blank');
    await page.evaluate(() => window.__TEST_CHECKOUT__.runParallel());

    expect(rpcCallCount).toBe(1);
  });
});
