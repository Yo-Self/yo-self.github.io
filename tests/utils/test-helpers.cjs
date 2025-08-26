const { Page, Locator } = require('@playwright/test');

class TestHelpers {
  static async waitForPageLoad(page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Aguardar animações
  }

  static async clearLocalStorage(page) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  static async mockRestaurantData(page) {
    // Mock de dados de restaurante para testes
    await page.addInitScript(() => {
      // Mock do localStorage para simular dados
      const mockData = {
        'restaurant-data': JSON.stringify({
          id: 'test-restaurant',
          name: 'Restaurante Teste',
          slug: 'restaurante-teste',
          image: '/test-image.jpg',
          menu_categories: ['Entradas', 'Pratos Principais', 'Sobremesas'],
          featured_dishes: [
            {
              id: 'dish-1',
              name: 'Prato Teste 1',
              description: 'Descrição do prato teste 1',
              price: '25,00',
              image: '/dish-1.jpg',
              category: 'Pratos Principais',
              categories: ['Pratos Principais'],
              ingredients: 'Ingredientes do prato 1',
              allergens: 'Sem alérgenos',
              portion: 'Serve 1 pessoa'
            }
          ],
          menu_items: [
            {
              id: 'dish-1',
              name: 'Prato Teste 1',
              description: 'Descrição do prato teste 1',
              price: '25,00',
              image: '/dish-1.jpg',
              category: 'Pratos Principais',
              categories: ['Pratos Principais'],
              ingredients: 'Ingredientes do prato 1',
              allergens: 'Sem alérgenos',
              portion: 'Serve 1 pessoa'
            },
            {
              id: 'dish-2',
              name: 'Prato Teste 2',
              description: 'Descrição do prato teste 2',
              price: '30,00',
              image: '/dish-2.jpg',
              category: 'Pratos Principais',
              categories: ['Pratos Principais'],
              ingredients: 'Ingredientes do prato 2',
              allergens: 'Sem alérgenos',
              portion: 'Serve 1 pessoa'
            }
          ]
        })
      };

      Object.entries(mockData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    });
  }

  static async waitForElement(page, selector, timeout = 10000) {
    await page.waitForSelector(selector, { timeout });
  }

  static async waitForElementVisible(page, selector, timeout = 10000) {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  static async waitForElementHidden(page, selector, timeout = 10000) {
    await page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  static async getElementText(page, selector) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible' });
    return await element.textContent() || '';
  }

  static async clickElement(page, selector) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible' });
    await element.click();
  }

  static async fillInput(page, selector, value) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible' });
    await element.fill(value);
  }

  static async selectOption(page, selector, value) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible' });
    await element.selectOption(value);
  }

  static async expectElementVisible(page, selector) {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
  }

  static async expectElementHidden(page, selector) {
    const element = page.locator(selector);
    await expect(element).not.toBeVisible();
  }

  static async expectElementText(page, selector, expectedText) {
    const element = page.locator(selector);
    await expect(element).toContainText(expectedText);
  }

  static async expectElementCount(page, selector, expectedCount) {
    const elements = page.locator(selector);
    await expect(elements).toHaveCount(expectedCount);
  }
}

// Função helper para aguardar carregamento de imagens
async function waitForImages(page) {
  await page.waitForFunction(() => {
    const images = document.querySelectorAll('img');
    return Array.from(images).every(img => img.complete);
  });
}

// Função helper para aguardar animações
async function waitForAnimations(page) {
  await page.waitForTimeout(500);
}

// Função helper para verificar se elemento está no viewport
async function isElementInViewport(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

module.exports = {
  TestHelpers,
  waitForImages,
  waitForAnimations,
  isElementInViewport
};
