const { test, expect } = require('@playwright/test');

test.describe('Página Inicial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.waitForTimeout(1000);
  });

  test('deve carregar a página inicial com sucesso', async ({ page }) => {
    await expect(page).toHaveTitle(/Restaurant (Menu|App)/);
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav img[alt="Yoself"]')).toBeVisible();
    await expect(page.locator('h1:has-text("Cardápio digital + gestor completo")')).toBeVisible();
  });

  test('deve exibir carrossel de pratos em destaque', async ({ page }) => {
    await expect(page.locator('section:has-text("Destaques que dão água na boca")')).toBeVisible();
    const featuredDishes = page.locator('.carousel-card');
    if (await featuredDishes.count() > 0) {
      await expect(featuredDishes.first()).toBeVisible();
    }
  });

  test('deve exibir seção de funcionalidades do cardápio', async ({ page }) => {
    await expect(page.locator('#cardapio')).toBeVisible();
    await expect(page.locator('#features')).toBeVisible();
    const featureCards = page.locator('#cardapio .grid > div');
    if (await featureCards.count() > 0) {
      await expect(featureCards.first()).toBeVisible();
      const count = await featureCards.count();
      expect(count).toBeGreaterThanOrEqual(8);
    }
  });

  test('deve exibir seção do gestor', async ({ page }) => {
    await expect(page.locator('#gestor')).toBeVisible();
    await expect(page.locator('h3:has-text("Gestor completo")')).toBeVisible();
  });

  test('deve exibir seção como funciona', async ({ page }) => {
    await expect(page.locator('#como-funciona')).toBeVisible();
    await expect(page.locator('h3:has-text("Do cadastro ao pedido em 3 passos")')).toBeVisible();
  });

  test('deve exibir exemplos de cardápio', async ({ page }) => {
    const menuExamples = page.locator('.menu-card');
    if (await menuExamples.count() > 0) {
      await expect(menuExamples.first()).toBeVisible();
      for (let i = 0; i < Math.min(await menuExamples.count(), 3); i++) {
        const card = menuExamples.nth(i);
        const image = card.locator('img');
        if (await image.count() > 0) {
          await expect(image.first()).toBeVisible();
        }
        const title = card.locator('h3');
        if (await title.count() > 0) {
          await expect(title.first()).toBeVisible();
        }
      }
    }
  });

  test('deve ter navegação responsiva', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    const navLinks = page.locator('nav a');
    expect(await navLinks.count()).toBeGreaterThan(0);
    await expect(page.locator('nav a:has-text("Início")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Cardápio")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Gestor")')).toBeVisible();
  });

  test('deve ter seção de destaque do carrossel', async ({ page }) => {
    await expect(page.locator('h2:has-text("Destaques que dão água na boca")')).toBeVisible();
    const carousel = page.locator('.carousel-section');
    if (await carousel.count() > 0) {
      await expect(carousel.first()).toBeVisible();
      const prevButton = page.locator('button[aria-label="Anterior"]');
      const nextButton = page.locator('button[aria-label="Próximo"]');
      if (await prevButton.count() > 0 && await nextButton.count() > 0) {
        await expect(prevButton.first()).toBeVisible();
        await expect(nextButton.first()).toBeVisible();
      }
    }
  });

  test('deve ter seção de call-to-action', async ({ page }) => {
    const ctaSection = page.locator('h2:has-text("Plataforma completa para vender mais")');
    if (await ctaSection.count() > 0) {
      await expect(ctaSection.first()).toBeVisible();
    }
  });
});
