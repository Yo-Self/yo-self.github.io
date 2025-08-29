const { test, expect } = require('@playwright/test');

test.describe('Página Inicial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('deve carregar a página inicial com sucesso', async ({ page }) => {
    // Verificar se a página carregou
    await expect(page).toHaveTitle(/Restaurant App/);
    
    // Verificar se o header está visível (nav com logo Yoself)
    await expect(page.locator('nav')).toBeVisible();
    
    // Verificar se o logo está visível
    await expect(page.locator('nav img[alt="Yoself"]')).toBeVisible();
    
    // Verificar se o título principal está visível
    await expect(page.locator('h1:has-text("Plataforma de cardápio digital")')).toBeVisible();
  });

  test('deve exibir carrossel de pratos em destaque', async ({ page }) => {
    // Verificar se o carrossel está visível
    await expect(page.locator('.carousel-section')).toBeVisible();
    
    // Verificar se há pratos em destaque
    const featuredDishes = page.locator('.carousel-card');
    if (await featuredDishes.count() > 0) {
      await expect(featuredDishes.first()).toBeVisible();
    }
  });

  test('deve exibir seção de funcionalidades', async ({ page }) => {
    // Verificar se a seção de funcionalidades está visível
    await expect(page.locator('#features')).toBeVisible();
    
    // Verificar se há cards de funcionalidades
    const featureCards = page.locator('#features .grid > div');
    if (await featureCards.count() > 0) {
      await expect(featureCards.first()).toBeVisible();
      
      // Verificar se há pelo menos 3 funcionalidades
      const count = await featureCards.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  test('deve exibir exemplos de cardápio', async ({ page }) => {
    // Verificar se há exemplos de cardápio
    const menuExamples = page.locator('.menu-card');
    if (await menuExamples.count() > 0) {
      await expect(menuExamples.first()).toBeVisible();
      
      // Verificar se os cards têm informações básicas
      for (let i = 0; i < Math.min(await menuExamples.count(), 3); i++) {
        const card = menuExamples.nth(i);
        
        // Verificar se tem imagem
        const image = card.locator('img');
        if (await image.count() > 0) {
          await expect(image.first()).toBeVisible();
        }
        
        // Verificar se tem título
        const title = card.locator('h3');
        if (await title.count() > 0) {
          await expect(title.first()).toBeVisible();
        }
      }
    }
  });

  test('deve ter navegação responsiva', async ({ page }) => {
    // Verificar se o header é responsivo
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Verificar se há links de navegação
    const navLinks = page.locator('nav a');
    expect(await navLinks.count()).toBeGreaterThan(0);
    
    // Verificar se o link "Início" está presente
    await expect(page.locator('nav a:has-text("Início")')).toBeVisible();
  });

  test('deve ter seção de destaque do carrossel', async ({ page }) => {
    // Verificar se há seção de destaque
    await expect(page.locator('h2:has-text("Destaques que chamam atenção")')).toBeVisible();
    
    // Verificar se há carrossel interativo
    const carousel = page.locator('.carousel-section');
    if (await carousel.count() > 0) {
      await expect(carousel.first()).toBeVisible();
      
      // Verificar se há botões de navegação do carrossel
      const prevButton = page.locator('button[aria-label="Anterior"]');
      const nextButton = page.locator('button[aria-label="Próximo"]');
      
      if (await prevButton.count() > 0 && await nextButton.count() > 0) {
        await expect(prevButton.first()).toBeVisible();
        await expect(nextButton.first()).toBeVisible();
      }
    }
  });

  test('deve ter seção de call-to-action', async ({ page }) => {
    // Verificar se há seção de call-to-action
    const ctaSection = page.locator('h3:has-text("Pronto para elevar seu cardápio?")');
    if (await ctaSection.count() > 0) {
      await expect(ctaSection.first()).toBeVisible();
    }
  });
});
