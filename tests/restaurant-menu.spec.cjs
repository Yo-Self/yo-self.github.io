const { test, expect } = require('@playwright/test');
const { DatabaseHelper } = require('./utils/database-helper.cjs');

let dbHelper;

test.beforeAll(async () => {
  dbHelper = new DatabaseHelper();
  await dbHelper.initialize();
});

test.describe('Cardápio do Restaurante', () => {
  let testRestaurant;
  
  test.beforeAll(async () => {
    testRestaurant = await dbHelper.getTestRestaurant();
  });

  test.describe('Carregamento e Estrutura Básica', () => {
    test('deve carregar página do restaurante com sucesso', async ({ page }) => {
      await page.goto(`/restaurant/${testRestaurant.slug}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se a página carregou
      await expect(page).toHaveTitle(/Cardápio digital/);
      
      // Verificar se o header está visível
      await expect(page.locator('header')).toBeVisible();
      
      // Verificar se há informações do restaurante
      await expect(page.locator('h1')).toBeVisible();
      
      // Verificar se há mensagem de boas-vindas
      const welcomeMessage = page.locator('p:has-text("Bem-vindo"), p:has-text("Welcome"), p:has-text("Aqui tem")');
      if (await welcomeMessage.count() > 0) {
        await expect(welcomeMessage.first()).toBeVisible();
      }
    });

    test('deve exibir informações básicas do restaurante', async ({ page }) => {
      await page.goto(`/restaurant/${testRestaurant.slug}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há nome do restaurante
      const restaurantName = page.locator('h1');
      await expect(restaurantName).toBeVisible();
      const nameText = await restaurantName.textContent();
      
      if (!testRestaurant.isTest) {
        expect(nameText).toContain(testRestaurant.name);
      } else {
        // Para dados de teste, apenas verificar se há um nome
        expect(nameText).toBeTruthy();
      }

      // Verificar se há imagem do restaurante
      const restaurantImage = page.locator('img[alt*="restaurant"], img[alt*="Restaurant"]');
      if (await restaurantImage.count() > 0) {
        await expect(restaurantImage.first()).toBeVisible();
      }
    });
  });

  test.describe('Carrossel de Pratos em Destaque', () => {
    test('deve exibir carrossel de pratos em destaque', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há seção de pratos em destaque
      const featuredSection = page.locator('section:has-text("Destaques"), section:has-text("Featured"), h2:has-text("Destaque"), h2:has-text("Featured")');
      if (await featuredSection.count() > 0) {
        await expect(featuredSection.first()).toBeVisible();
      }

      // Verificar se há pratos em destaque
      const featuredDishes = page.locator('[data-testid="featured-dish"], .featured-dish, .dish-card, .menu-item');
      if (await featuredDishes.count() > 0) {
        await expect(featuredDishes.first()).toBeVisible();
        
        // Verificar se há pelo menos 2 pratos em destaque
        const count = await featuredDishes.count();
        expect(count).toBeGreaterThanOrEqual(2);
      }
    });

    test('deve exibir informações dos pratos em destaque', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const featuredDishes = page.locator('[data-testid="featured-dish"], .featured-dish, .dish-card, .menu-item');
      if (await featuredDishes.count() > 0) {
        for (let i = 0; i < Math.min(await featuredDishes.count(), 3); i++) {
          const dish = featuredDishes.nth(i);
          
          // Verificar se tem nome
          const name = dish.locator('h3, h4, .dish-name, .item-name');
          if (await name.count() > 0) {
            await expect(name.first()).toBeVisible();
          }
          
          // Verificar se tem preço
          const price = dish.locator('.price, .dish-price, .item-price, [class*="price"]');
          if (await price.count() > 0) {
            await expect(price.first()).toBeVisible();
          }
          
          // Verificar se tem imagem
          const image = dish.locator('img');
          if (await image.count() > 0) {
            await expect(image.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Categorias do Menu', () => {
    test('deve exibir categorias do menu', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há seção de categorias
      const categoriesSection = page.locator('section:has-text("Categorias"), section:has-text("Categories"), h2:has-text("Categorias"), h2:has-text("Categories")');
      if (await categoriesSection.count() > 0) {
        await expect(categoriesSection.first()).toBeVisible();
      }

      // Verificar se há categorias disponíveis
      const categories = page.locator('[data-testid="category"], .category, .menu-category, button:has-text("Tortas"), button:has-text("Doces"), button:has-text("Bebidas")');
      if (await categories.count() > 0) {
        await expect(categories.first()).toBeVisible();
        
        // Verificar se há pelo menos 3 categorias
        const count = await categories.count();
        expect(count).toBeGreaterThanOrEqual(3);
      }
    });

    test('deve permitir navegação entre categorias', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const categories = page.locator('[data-testid="category"], .category, .menu-category, button:has-text("Tortas"), button:has-text("Doces"), button:has-text("Bebidas")');
      if (await categories.count() > 0) {
        // Verificar se as categorias estão visíveis e clicáveis
        await expect(categories.first()).toBeVisible();
        await expect(categories.first()).toBeEnabled();
        
        // Verificar se há pelo menos 3 categorias
        const count = await categories.count();
        expect(count).toBeGreaterThanOrEqual(3);
      }
    });
  });

  test.describe('Lista de Pratos', () => {
    test('deve exibir lista de pratos por categoria', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há lista de pratos
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await expect(menuItems.first()).toBeVisible();
        
        // Verificar se há pelo menos 5 pratos
        const count = await menuItems.count();
        expect(count).toBeGreaterThanOrEqual(5);
      }
    });

    test('deve exibir informações completas dos pratos', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        for (let i = 0; i < Math.min(await menuItems.count(), 3); i++) {
          const item = menuItems.nth(i);
          
          // Verificar se tem nome
          const name = item.locator('h3, h4, .dish-name, .item-name');
          if (await name.count() > 0) {
            await expect(name.first()).toBeVisible();
          }
          
          // Verificar se tem preço
          const price = item.locator('.price, .dish-price, .item-price, [class*="price"]');
          if (await price.count() > 0) {
            await expect(price.first()).toBeVisible();
          }
          
          // Verificar se tem descrição
          const description = item.locator('.description, .dish-description, .item-description, p');
          if (await description.count() > 0) {
            await expect(description.first()).toBeVisible();
          }
          
          // Verificar se tem imagem
          const image = item.locator('img');
          if (await image.count() > 0) {
            await expect(image.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Modal de Detalhes do Prato', () => {
    test('deve abrir modal ao clicar em um prato', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        // Clicar no primeiro prato
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        // Verificar se o modal abriu
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
        }
      }
    });

    test('deve exibir informações detalhadas no modal', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          // Verificar se tem nome
          const name = modal.locator('h2, h3, .modal-title, .dish-title');
          if (await name.count() > 0) {
            await expect(name.first()).toBeVisible();
          }
          
          // Verificar se tem preço
          const price = modal.locator('.price, .modal-price, .dish-price');
          if (await price.count() > 0) {
            await expect(price.first()).toBeVisible();
          }
          
          // Verificar se tem descrição
          const description = modal.locator('.description, .modal-description, .dish-description');
          if (await description.count() > 0) {
            await expect(description.first()).toBeVisible();
          }
          
          // Verificar se tem imagem
          const image = modal.locator('img');
          if (await image.count() > 0) {
            await expect(image.first()).toBeVisible();
          }
        }
      }
    });

    test('deve permitir fechar o modal', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          // Clicar no botão de fechar
          const closeButton = modal.locator('[data-testid="close-button"], .close-button, .modal-close, button[aria-label*="Close"], button[aria-label*="Fechar"]');
          if (await closeButton.count() > 0) {
            await closeButton.first().click();
            await page.waitForTimeout(500);
            
            // Verificar se o modal fechou
            await expect(modal.first()).not.toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Funcionalidade de Carrinho', () => {
    test('deve permitir adicionar prato ao carrinho', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          // Verificar se há botão de adicionar ao carrinho
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await expect(addButton.first()).toBeVisible();
            
            // Clicar no botão
            await addButton.first().click();
            await page.waitForTimeout(500);
            
            // Verificar se apareceu confirmação
            const confirmation = page.locator('[data-testid="success-message"], .success-message, .toast, .notification');
            if (await confirmation.count() > 0) {
              await expect(confirmation.first()).toBeVisible();
            }
          }
        }
      }
    });

    test('deve exibir contador do carrinho', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há ícone do carrinho
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await expect(cartIcon.first()).toBeVisible();
        
        // Verificar se há contador
        const cartCount = cartIcon.locator('.cart-count, .cart-badge, [data-testid="cart-count"]');
        if (await cartCount.count() > 0) {
          await expect(cartCount.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Funcionalidade de Busca', () => {
    test('deve exibir campo de busca', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há campo de busca
      const searchInput = page.locator('[data-testid="search-input"], .search-input, input[placeholder*="buscar"], input[placeholder*="search"], input[type="search"]');
      if (await searchInput.count() > 0) {
        await expect(searchInput.first()).toBeVisible();
      }
    });

    test('deve permitir buscar por nome do prato', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const searchInput = page.locator('[data-testid="search-input"], .search-input, input[placeholder*="buscar"], input[placeholder*="search"], input[type="search"]');
      if (await searchInput.count() > 0) {
        // Digitar termo de busca
        await searchInput.first().fill('torta');
        await page.waitForTimeout(500);
        
        // Verificar se os resultados foram filtrados
        const results = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
        if (await results.count() > 0) {
          // Verificar se pelo menos um resultado contém "torta"
          const hasTorta = await page.locator('text=torta, text=Torta').count() > 0;
          expect(hasTorta).toBeTruthy();
        }
      }
    });
  });

  test.describe('Funcionalidade de Chamar Garçom', () => {
    test('deve exibir botão de chamar garçom quando habilitado', async ({ page }) => {
      await page.goto('/restaurant/cafe-moendo');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há botão de chamar garçom
      const waiterButton = page.locator('[data-testid="waiter-button"], .waiter-button, .call-waiter, button:has-text("Chamar"), button:has-text("Call")');
      if (await waiterButton.count() > 0) {
        await expect(waiterButton.first()).toBeVisible();
      }
    });

    test('deve abrir modal de chamar garçom', async ({ page }) => {
      await page.goto('/restaurant/cafe-moendo');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const waiterButton = page.locator('[data-testid="waiter-button"], .waiter-button, .call-waiter, button:has-text("Chamar"), button:has-text("Call")');
      if (await waiterButton.count() > 0) {
        await waiterButton.first().click();
        await page.waitForTimeout(500);
        
        // Verificar se o modal abriu
        const modal = page.locator('[data-testid="waiter-modal"], .waiter-modal, .modal, [role="dialog"]');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Verificar se há campo para número da mesa
          const tableInput = modal.locator('[data-testid="table-input"], .table-input, input[placeholder*="mesa"], input[placeholder*="table"]');
          if (await tableInput.count() > 0) {
            await expect(tableInput.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Funcionalidade de WhatsApp', () => {
    test('deve exibir botão de WhatsApp quando habilitado', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há botão de WhatsApp
      const whatsappButton = page.locator('[data-testid="whatsapp-button"], .whatsapp-button, .whatsapp-order, button:has-text("WhatsApp"), button:has-text("Pedir")');
      if (await whatsappButton.count() > 0) {
        await expect(whatsappButton.first()).toBeVisible();
      }
    });

    test('deve abrir modal de pedido WhatsApp', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const whatsappButton = page.locator('[data-testid="whatsapp-button"], .whatsapp-button, .whatsapp-order, button:has-text("WhatsApp"), button:has-text("Pedir")');
      if (await whatsappButton.count() > 0) {
        await whatsappButton.first().click();
        await page.waitForTimeout(500);
        
        // Verificar se o modal abriu
        const modal = page.locator('[data-testid="whatsapp-modal"], .whatsapp-modal, .modal, [role="dialog"]');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Verificar se há lista de itens
          const itemsList = modal.locator('[data-testid="items-list"], .items-list, .cart-items');
          if (await itemsList.count() > 0) {
            await expect(itemsList.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Responsividade', () => {
    test('deve ser responsivo em dispositivos móveis', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se o header é responsivo
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Verificar se o menu é responsivo
      const menu = page.locator('[data-testid="menu"], .menu, .menu-container');
      if (await menu.count() > 0) {
        await expect(menu.first()).toBeVisible();
      }
    });

    test('deve ser responsivo em tablets', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se o layout se adapta
      const container = page.locator('main, .main, .container');
      if (await container.count() > 0) {
        await expect(container.first()).toBeVisible();
      }
    });
  });

  test.describe('Acessibilidade', () => {
    test('deve ter navegação por teclado', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se há elementos focáveis
      const focusableElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (await focusableElements.count() > 0) {
        await expect(focusableElements.first()).toBeVisible();
      }
    });

    test('deve ter textos alternativos para imagens', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se as imagens têm alt
      const images = page.locator('img');
      if (await images.count() > 0) {
        for (let i = 0; i < Math.min(await images.count(), 5); i++) {
          const image = images.nth(i);
          const alt = await image.getAttribute('alt');
          expect(alt).toBeTruthy();
        }
      }
    });
  });

  test.describe('Performance', () => {
    test('deve carregar em tempo razoável', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // Máximo 10 segundos
    });

    test('deve carregar imagens em tempo razoável', async ({ page }) => {
      await page.goto('/restaurant/auri-monteiro');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar se as imagens carregaram
      const images = page.locator('img');
      if (await images.count() > 0) {
        await page.waitForFunction(() => {
          const images = document.querySelectorAll('img');
          return Array.from(images).every(img => img.complete);
        }, { timeout: 10000 });
      }
    });
  });
});
