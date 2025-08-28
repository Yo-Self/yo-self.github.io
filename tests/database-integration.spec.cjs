const { test, expect } = require('@playwright/test');
const { DatabaseHelper } = require('./utils/database-helper.cjs');

let dbHelper;
let testRestaurant;

test.beforeAll(async () => {
  dbHelper = new DatabaseHelper();
  await dbHelper.initialize();
  testRestaurant = await dbHelper.getTestRestaurant();
});

test.describe('Integração com Banco de Dados', () => {
  test('deve conectar com o banco de dados quando disponível', async () => {
    if (!dbHelper.isAvailable()) {
      test.skip();
      console.log('⏭️  Skipping: Database not available');
      return;
    }

    expect(dbHelper.isAvailable()).toBe(true);
    expect(testRestaurant).toBeTruthy();
    expect(testRestaurant.slug).toBeTruthy();
  });

  test('deve verificar se restaurante de teste existe', async () => {
    if (!dbHelper.isAvailable()) {
      test.skip();
      console.log('⏭️  Skipping: Database not available');
      return;
    }

    const exists = await dbHelper.checkRestaurantExists(testRestaurant.slug);
    expect(exists).toBeTruthy();
  });

  test('deve carregar página com dados reais do banco', async ({ page }) => {
    if (!dbHelper.isAvailable()) {
      test.skip();
      console.log('⏭️  Skipping: Database not available');
      return;
    }

    await page.goto(`/restaurant/${testRestaurant.slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verificar se a página carregou com dados reais
    await expect(page).toHaveTitle(/Cardápio digital/);
    
    const restaurantName = page.locator('h1');
    await expect(restaurantName).toBeVisible();
    
    const nameText = await restaurantName.textContent();
    if (!testRestaurant.isTest) {
      expect(nameText).toContain(testRestaurant.name);
    }
  });

  test('deve funcionar com dados de fallback quando database não disponível', async ({ page }) => {
    if (dbHelper.isAvailable()) {
      test.skip();
      console.log('⏭️  Skipping: Database is available, testing fallback not needed');
      return;
    }

    // Testar que a aplicação ainda funciona sem database
    await page.goto(`/restaurant/${testRestaurant.slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // A página deve carregar mesmo sem database
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Pelo menos deve ter algum conteúdo
    const hasContent = await page.locator('h1, h2, h3').count() > 0;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Testes Resilientes', () => {
  test('deve skip tests que dependem do database quando não disponível', async () => {
    const isAvailable = dbHelper.isAvailable();
    
    if (!isAvailable) {
      test.skip();
      console.log('✅ Database-dependent test correctly skipped');
      return;
    }
    
    // Este teste só roda se database estiver disponível
    expect(isAvailable).toBe(true);
  });

  test('deve sempre rodar testes básicos independente do database', async ({ page }) => {
    // Este teste deve sempre rodar, com ou sem database
    await page.goto(`/restaurant/${testRestaurant.slug}`);
    await page.waitForLoadState('networkidle');
    
    // Verificações básicas que não dependem do database
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('head')).toBeAttached();
  });
});
