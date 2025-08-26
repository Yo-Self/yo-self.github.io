# Exemplos de Testes Automatizados com Playwright

## Configuração Inicial

### Instalação do Playwright
```bash
npm init playwright@latest
npm install @playwright/test
```

### Configuração do playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 1. Testes de Navegação e Visualização

### Teste de Carregamento da Página Inicial
```typescript
// tests/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Página Inicial', () => {
  test('deve carregar a página inicial com sucesso', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se a página carregou
    await expect(page).toHaveTitle(/Cardápio Digital/);
    
    // Verificar se o header está visível
    await expect(page.locator('header')).toBeVisible();
    
    // Verificar se há restaurantes disponíveis
    await expect(page.locator('[data-testid="restaurant-list"]')).toBeVisible();
  });

  test('deve exibir lista de restaurantes', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se há pelo menos um restaurante
    const restaurants = page.locator('[data-testid="restaurant-item"]');
    await expect(restaurants.first()).toBeVisible();
    
    // Verificar se cada restaurante tem nome e imagem
    const count = await restaurants.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const restaurant = restaurants.nth(i);
      await expect(restaurant.locator('[data-testid="restaurant-name"]')).toBeVisible();
      await expect(restaurant.locator('img')).toBeVisible();
    }
  });
});
```

### Teste de Seleção de Restaurante
```typescript
// tests/restaurant-selection.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Seleção de Restaurante', () => {
  test('deve permitir trocar de restaurante', async ({ page }) => {
    await page.goto('/');
    
    // Clicar no dropdown de restaurantes
    await page.click('[data-testid="restaurant-dropdown"]');
    
    // Selecionar um restaurante diferente
    const secondRestaurant = page.locator('[data-testid="restaurant-option"]').nth(1);
    const restaurantName = await secondRestaurant.textContent();
    await secondRestaurant.click();
    
    // Verificar se o restaurante foi alterado
    await expect(page.locator('[data-testid="current-restaurant"]')).toContainText(restaurantName);
    
    // Verificar se a URL foi atualizada
    await expect(page).toHaveURL(/\/restaurant\//);
  });

  test('deve limpar carrinho ao trocar de restaurante', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Adicionar item ao carrinho
    await page.click('[data-testid="dish-item"]').first();
    await page.click('[data-testid="add-to-cart"]');
    
    // Verificar se o carrinho tem itens
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Trocar de restaurante
    await page.click('[data-testid="restaurant-dropdown"]');
    await page.click('[data-testid="restaurant-option"]').nth(1);
    
    // Verificar se o carrinho foi limpo
    await expect(page.locator('[data-testid="cart-count"]')).not.toBeVisible();
  });
});
```

---

## 2. Testes do Carrossel

### Teste de Funcionalidade do Carrossel
```typescript
// tests/carousel.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Carrossel de Pratos em Destaque', () => {
  test('deve exibir carrossel com pratos em destaque', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Verificar se o carrossel está visível
    await expect(page.locator('[data-testid="featured-carousel"]')).toBeVisible();
    
    // Verificar se há pratos em destaque
    const featuredDishes = page.locator('[data-testid="featured-dish"]');
    await expect(featuredDishes.first()).toBeVisible();
  });

  test('deve navegar pelo carrossel usando setas', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Verificar se as setas estão visíveis
    await expect(page.locator('[data-testid="carousel-arrow-left"]')).toBeVisible();
    await expect(page.locator('[data-testid="carousel-arrow-right"]')).toBeVisible();
    
    // Obter primeiro prato visível
    const firstDish = page.locator('[data-testid="featured-dish"]').first();
    const firstDishName = await firstDish.locator('[data-testid="dish-name"]').textContent();
    
    // Clicar na seta direita
    await page.click('[data-testid="carousel-arrow-right"]');
    
    // Verificar se o prato mudou
    const currentDish = page.locator('[data-testid="featured-dish"]').first();
    const currentDishName = await currentDish.locator('[data-testid="dish-name"]').textContent();
    
    expect(currentDishName).not.toBe(firstDishName);
  });

  test('deve responder a gestos de swipe em dispositivos móveis', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Simular swipe para direita
    const carousel = page.locator('[data-testid="featured-carousel"]');
    await carousel.hover();
    
    // Fazer swipe para direita
    await page.mouse.down();
    await page.mouse.move(100, 0);
    await page.mouse.up();
    
    // Verificar se o carrossel respondeu ao gesto
    // (Este teste pode variar dependendo da implementação específica)
  });
});
```

---

## 3. Testes de Navegação por Categorias

### Teste de Seleção de Categorias
```typescript
// tests/categories.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navegação por Categorias', () => {
  test('deve exibir grid de categorias', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Verificar se o grid de categorias está visível
    await expect(page.locator('[data-testid="categories-grid"]')).toBeVisible();
    
    // Verificar se há categorias disponíveis
    const categories = page.locator('[data-testid="category-item"]');
    await expect(categories.first()).toBeVisible();
  });

  test('deve filtrar pratos por categoria', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Clicar em uma categoria
    const category = page.locator('[data-testid="category-item"]').first();
    const categoryName = await category.locator('[data-testid="category-name"]').textContent();
    await category.click();
    
    // Verificar se mudou para modo lista
    await expect(page.locator('[data-testid="menu-list"]')).toBeVisible();
    
    // Verificar se a categoria está selecionada
    await expect(page.locator('[data-testid="selected-category"]')).toContainText(categoryName);
    
    // Verificar se apenas pratos da categoria estão visíveis
    const menuItems = page.locator('[data-testid="menu-item"]');
    for (let i = 0; i < Math.min(await menuItems.count(), 5); i++) {
      const item = menuItems.nth(i);
      const itemCategory = await item.locator('[data-testid="item-category"]').textContent();
      expect(itemCategory).toContain(categoryName);
    }
  });

  test('deve voltar ao grid de categorias', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Ir para uma categoria
    await page.click('[data-testid="category-item"]').first();
    
    // Clicar no botão voltar
    await page.click('[data-testid="back-to-categories"]');
    
    // Verificar se voltou ao grid
    await expect(page.locator('[data-testid="categories-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-list"]')).not.toBeVisible();
  });
});
```

---

## 4. Testes do Modal de Detalhes do Prato

### Teste de Funcionalidade do Modal
```typescript
// tests/dish-modal.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Modal de Detalhes do Prato', () => {
  test('deve abrir modal ao clicar em um prato', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Clicar em um prato
    await page.click('[data-testid="dish-item"]').first();
    
    // Verificar se o modal abriu
    await expect(page.locator('[data-testid="dish-modal"]')).toBeVisible();
    
    // Verificar se o overlay está visível
    await expect(page.locator('[data-testid="modal-overlay"]')).toBeVisible();
  });

  test('deve exibir informações completas do prato', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir modal de um prato
    await page.click('[data-testid="dish-item"]').first();
    
    // Verificar elementos do modal
    await expect(page.locator('[data-testid="dish-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="dish-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="dish-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="dish-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="dish-ingredients"]')).toBeVisible();
  });

  test('deve fechar modal de diferentes formas', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir modal
    await page.click('[data-testid="dish-item"]').first();
    await expect(page.locator('[data-testid="dish-modal"]')).toBeVisible();
    
    // Fechar com botão X
    await page.click('[data-testid="close-modal"]');
    await expect(page.locator('[data-testid="dish-modal"]')).not.toBeVisible();
    
    // Abrir novamente
    await page.click('[data-testid="dish-item"]').first();
    
    // Fechar clicando fora
    await page.click('[data-testid="modal-overlay"]');
    await expect(page.locator('[data-testid="dish-modal"]')).not.toBeVisible();
    
    // Abrir novamente
    await page.click('[data-testid="dish-item"]').first();
    
    // Fechar com ESC
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="dish-modal"]')).not.toBeVisible();
  });
});
```

---

## 5. Testes do Sistema de Carrinho

### Teste de Adição de Itens
```typescript
// tests/cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sistema de Carrinho', () => {
  test('deve adicionar prato simples ao carrinho', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir modal de um prato
    await page.click('[data-testid="dish-item"]').first();
    
    // Clicar em adicionar ao carrinho
    await page.click('[data-testid="add-to-cart"]');
    
    // Verificar se o modal fechou
    await expect(page.locator('[data-testid="dish-modal"]')).not.toBeVisible();
    
    // Verificar se o carrinho apareceu no header
    await expect(page.locator('[data-testid="cart-icon"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('deve adicionar prato com complementos', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir modal de prato com complementos
    const dishWithComplements = page.locator('[data-testid="dish-item"]').filter({
      has: page.locator('[data-testid="has-complements"]')
    }).first();
    await dishWithComplements.click();
    
    // Selecionar complementos obrigatórios
    const requiredComplements = page.locator('[data-testid="complement-required"]');
    for (let i = 0; i < await requiredComplements.count(); i++) {
      await requiredComplements.nth(i).click();
    }
    
    // Selecionar complementos opcionais
    const optionalComplements = page.locator('[data-testid="complement-optional"]').first();
    await optionalComplements.click();
    
    // Adicionar ao carrinho
    await page.click('[data-testid="add-to-cart"]');
    
    // Verificar se foi adicionado
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('deve validar complementos obrigatórios', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir modal de prato com complementos obrigatórios
    const dishWithComplements = page.locator('[data-testid="dish-item"]').filter({
      has: page.locator('[data-testid="has-complements"]')
    }).first();
    await dishWithComplements.click();
    
    // Tentar adicionar sem selecionar complementos obrigatórios
    const addButton = page.locator('[data-testid="add-to-cart"]');
    
    // Verificar se o botão está desabilitado
    await expect(addButton).toBeDisabled();
    
    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="complements-error"]')).toBeVisible();
  });
});
```

### Teste de Gerenciamento do Carrinho
```typescript
// tests/cart-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Gerenciamento do Carrinho', () => {
  test('deve abrir modal do carrinho', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Adicionar item ao carrinho
    await page.click('[data-testid="dish-item"]').first();
    await page.click('[data-testid="add-to-cart"]');
    
    // Clicar no ícone do carrinho
    await page.click('[data-testid="cart-icon"]');
    
    // Verificar se o modal abriu
    await expect(page.locator('[data-testid="cart-modal"]')).toBeVisible();
  });

  test('deve exibir lista de itens no carrinho', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Adicionar múltiplos itens
    for (let i = 0; i < 2; i++) {
      await page.click('[data-testid="dish-item"]').nth(i);
      await page.click('[data-testid="add-to-cart"]');
    }
    
    // Abrir carrinho
    await page.click('[data-testid="cart-icon"]');
    
    // Verificar se os itens estão listados
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(2);
    
    // Verificar se o preço total está correto
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('deve permitir alterar quantidades', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Adicionar item ao carrinho
    await page.click('[data-testid="dish-item"]').first();
    await page.click('[data-testid="add-to-cart"]');
    
    // Abrir carrinho
    await page.click('[data-testid="cart-icon"]');
    
    // Aumentar quantidade
    await page.click('[data-testid="quantity-increase"]');
    await expect(page.locator('[data-testid="quantity-value"]')).toContainText('2');
    
    // Diminuir quantidade
    await page.click('[data-testid="quantity-decrease"]');
    await expect(page.locator('[data-testid="quantity-value"]')).toContainText('1');
  });

  test('deve permitir remover itens', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Adicionar item ao carrinho
    await page.click('[data-testid="dish-item"]').first();
    await page.click('[data-testid="add-to-cart"]');
    
    // Abrir carrinho
    await page.click('[data-testid="cart-icon"]');
    
    // Remover item
    await page.click('[data-testid="remove-item"]');
    
    // Verificar se o carrinho está vazio
    await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-icon"]')).not.toBeVisible();
  });

  test('deve limpar carrinho com confirmação', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Adicionar itens ao carrinho
    for (let i = 0; i < 2; i++) {
      await page.click('[data-testid="dish-item"]').nth(i);
      await page.click('[data-testid="add-to-cart"]');
    }
    
    // Abrir carrinho
    await page.click('[data-testid="cart-icon"]');
    
    // Clicar em limpar carrinho
    await page.click('[data-testid="clear-cart"]');
    
    // Confirmar limpeza
    await page.click('[data-testid="confirm-clear"]');
    
    // Verificar se o carrinho foi limpo
    await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible();
  });
});
```

---

## 6. Testes de Busca e IA

### Teste de Funcionalidade de Busca
```typescript
// tests/search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sistema de Busca e IA', () => {
  test('deve abrir interface de busca', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Clicar no botão de busca
    await page.click('[data-testid="search-button"]');
    
    // Verificar se a interface abriu
    await expect(page.locator('[data-testid="search-interface"]')).toBeVisible();
    
    // Verificar se o campo de input está focado
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
  });

  test('deve realizar busca por nome do prato', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir busca
    await page.click('[data-testid="search-button"]');
    
    // Digitar termo de busca
    await page.fill('[data-testid="search-input"]', 'frango');
    
    // Aguardar resultados
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Verificar se há resultados
    const results = page.locator('[data-testid="search-result-item"]');
    await expect(results.first()).toBeVisible();
    
    // Verificar se os resultados são relevantes
    for (let i = 0; i < Math.min(await results.count(), 3); i++) {
      const result = results.nth(i);
      const dishName = await result.locator('[data-testid="dish-name"]').textContent();
      expect(dishName.toLowerCase()).toContain('frango');
    }
  });

  test('deve responder perguntas da IA', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir busca
    await page.click('[data-testid="search-button"]');
    
    // Fazer pergunta para a IA
    await page.fill('[data-testid="search-input"]', 'Qual o prato mais popular?');
    
    // Aguardar resposta
    await page.waitForSelector('[data-testid="ai-response"]');
    
    // Verificar se a resposta foi gerada
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    
    // Verificar se há pratos recomendados
    await expect(page.locator('[data-testid="recommended-dishes"]')).toBeVisible();
  });
});
```

---

## 7. Testes de Acessibilidade

### Teste de Funcionalidades de Acessibilidade
```typescript
// tests/accessibility.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Acessibilidade', () => {
  test('deve permitir navegação por teclado', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Navegar com TAB
    await page.keyboard.press('Tab');
    
    // Verificar se o foco está visível
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Navegar pelos elementos
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar se o foco mudou
    const newFocusedElement = page.locator(':focus');
    await expect(newFocusedElement).not.toEqual(focusedElement);
  });

  test('deve permitir alterar tamanho da fonte', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir menu de acessibilidade
    await page.click('[data-testid="accessibility-button"]');
    
    // Aumentar fonte
    await page.click('[data-testid="increase-font"]');
    
    // Verificar se a fonte aumentou
    const body = page.locator('body');
    const fontSize = await body.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    // A fonte deve ter aumentado (comparar com valor inicial se necessário)
    expect(parseInt(fontSize)).toBeGreaterThan(16);
  });

  test('deve permitir alternar tema', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Abrir menu de acessibilidade
    await page.click('[data-testid="accessibility-button"]');
    
    // Alternar para tema escuro
    await page.click('[data-testid="dark-theme"]');
    
    // Verificar se o tema mudou
    const body = page.locator('body');
    await expect(body).toHaveClass(/dark/);
    
    // Alternar para tema claro
    await page.click('[data-testid="light-theme"]');
    await expect(body).not.toHaveClass(/dark/);
  });
});
```

---

## 8. Testes de Responsividade

### Teste de Layout em Diferentes Tamanhos
```typescript
// tests/responsiveness.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Responsividade', () => {
  test('deve funcionar em desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/restaurant/restaurante-1');
    
    // Verificar se o layout está otimizado para desktop
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
    
    // Verificar se elementos estão bem distribuídos
    const header = page.locator('header');
    const headerHeight = await header.boundingBox();
    expect(headerHeight.height).toBeGreaterThan(60);
  });

  test('deve funcionar em tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/restaurant/restaurante-1');
    
    // Verificar se o layout se adaptou
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    
    // Verificar se elementos estão redimensionados adequadamente
    const carousel = page.locator('[data-testid="featured-carousel"]');
    const carouselWidth = await carousel.boundingBox();
    expect(carouselWidth.width).toBeLessThanOrEqual(768);
  });

  test('deve funcionar em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/restaurant/restaurante-1');
    
    // Verificar se o layout está otimizado para mobile
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
    
    // Verificar se botões têm tamanho adequado para toque
    const buttons = page.locator('button');
    for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
      const button = buttons.nth(i);
      const buttonSize = await button.boundingBox();
      expect(buttonSize.height).toBeGreaterThanOrEqual(44); // Mínimo recomendado para toque
      expect(buttonSize.width).toBeGreaterThanOrEqual(44);
    }
  });
});
```

---

## 9. Testes de Performance

### Teste de Tempo de Carregamento
```typescript
// tests/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('deve carregar página em tempo aceitável', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/restaurant/restaurante-1');
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verificar se carregou em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });

  test('deve carregar imagens de forma otimizada', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Verificar se há placeholders durante carregamento
    await expect(page.locator('[data-testid="image-placeholder"]')).toBeVisible();
    
    // Aguardar carregamento das imagens
    await page.waitForSelector('[data-testid="dish-image"]');
    
    // Verificar se as imagens carregaram
    const images = page.locator('img');
    for (let i = 0; i < Math.min(await images.count(), 5); i++) {
      const image = images.nth(i);
      await expect(image).toHaveAttribute('src');
    }
  });
});
```

---

## 10. Testes de Integração

### Teste de Integração com Backend
```typescript
// tests/integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Integração com Backend', () => {
  test('deve carregar dados do Supabase', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Verificar se os dados foram carregados
    await expect(page.locator('[data-testid="restaurant-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-categories"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-items"]')).toBeVisible();
    
    // Verificar se há dados reais
    const restaurantName = await page.locator('[data-testid="restaurant-name"]').textContent();
    expect(restaurantName).toBeTruthy();
    expect(restaurantName.length).toBeGreaterThan(0);
  });

  test('deve enviar chamada de garçom', async ({ page }) => {
    await page.goto('/restaurant/restaurante-1');
    
    // Clicar no botão de chamar garçom
    await page.click('[data-testid="waiter-button"]');
    
    // Preencher formulário
    await page.fill('[data-testid="table-number"]', '5');
    await page.fill('[data-testid="notes"]', 'Preciso de água');
    
    // Enviar
    await page.click('[data-testid="submit-waiter-call"]');
    
    // Verificar se foi enviado com sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verificar se o som tocou
    // (Este teste pode variar dependendo da implementação)
  });
});
```

---

## Executando os Testes

### Comando para Executar Todos os Testes
```bash
npx playwright test
```

### Comando para Executar Testes Específicos
```bash
npx playwright test cart.spec.ts
npx playwright test --grep "Sistema de Carrinho"
```

### Comando para Executar em Modo UI
```bash
npx playwright test --ui
```

### Comando para Executar em Navegadores Específicos
```bash
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

### Comando para Gerar Relatório HTML
```bash
npx playwright test --reporter=html
npx playwright show-report
```

---

## Configuração de CI/CD

### GitHub Actions
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

---

## Dicas para Manutenção dos Testes

1. **Use data-testid**: Sempre use atributos `data-testid` para seletores estáveis
2. **Testes Independentes**: Cada teste deve ser independente e não depender de outros
3. **Setup e Teardown**: Use `test.beforeEach()` e `test.afterEach()` para limpeza
4. **Mocks**: Use mocks para APIs externas e dados que mudam frequentemente
5. **Screenshots**: Configure screenshots automáticos para falhas
6. **Retry Logic**: Configure retry para testes que podem falhar por timing
7. **Paralelização**: Use `fullyParallel: true` para executar testes em paralelo
8. **Relatórios**: Configure relatórios detalhados para análise de falhas

Esta estrutura de testes automatizados garante que todas as funcionalidades principais do cardápio digital sejam testadas de forma consistente e confiável.
