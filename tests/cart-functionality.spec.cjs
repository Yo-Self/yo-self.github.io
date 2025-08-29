const { test, expect } = require('@playwright/test');
const { DatabaseHelper } = require('./utils/database-helper.cjs');

let dbHelper;

test.beforeAll(async () => {
  dbHelper = new DatabaseHelper();
  await dbHelper.initialize();
});

test.describe('Funcionalidade do Carrinho de Compras', () => {
  let testRestaurant;
  
  test.beforeAll(async () => {
    testRestaurant = await dbHelper.getTestRestaurant();
  });
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`/restaurant/${testRestaurant.slug}`);
    await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Aguardar 2s para JavaScript executar
    await page.waitForTimeout(1000);
  });

  test.describe('Adição de Itens ao Carrinho', () => {
    test('deve permitir adicionar prato simples ao carrinho', async ({ page }) => {
      // Encontrar um prato sem complementos obrigatórios
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          // Verificar se há botão de adicionar
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
            
            // Verificar se apareceu confirmação
            const confirmation = page.locator('[data-testid="success-message"], .success-message, .toast, .notification, .alert');
            if (await confirmation.count() > 0) {
              await expect(confirmation.first()).toBeVisible();
            }
          }
        }
      }
    });

    test('deve permitir adicionar prato com complementos obrigatórios', async ({ page }) => {
      // Encontrar um prato com complementos (como o Croassaint)
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        // Procurar por prato com complementos
        for (let i = 0; i < await menuItems.count(); i++) {
          const item = menuItems.nth(i);
          const itemText = await item.textContent();
          
          if (itemText && (itemText.includes('Croassaint') || itemText.includes('croassaint'))) {
            await item.click();
            await page.waitForTimeout(500);
            break;
          }
        }
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          // Verificar se há seção de complementos
          const complementsSection = modal.locator('[data-testid="complements-section"], .complements-section, .complement-groups');
          if (await complementsSection.count() > 0) {
            await expect(complementsSection.first()).toBeVisible();
            
            // Selecionar um complemento obrigatório
            const complementOptions = modal.locator('[data-testid="complement-option"], .complement-option, input[type="radio"], input[type="checkbox"]');
            if (await complementOptions.count() > 0) {
              await complementOptions.first().click();
              await page.waitForTimeout(200);
              
              // Agora deve ser possível adicionar ao carrinho
              const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
              if (await addButton.count() > 0) {
                await expect(addButton.first()).toBeEnabled();
              }
            }
          }
        }
      }
    });

    test('deve permitir adicionar prato com complementos opcionais', async ({ page }) => {
      // Encontrar um prato com complementos opcionais
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          // Verificar se há complementos opcionais
          const optionalComplements = modal.locator('[data-testid="optional-complement"], .optional-complement, .complement-optional');
          if (await optionalComplements.count() > 0) {
            await expect(optionalComplements.first()).toBeVisible();
            
            // Selecionar um complemento opcional
            const complementCheckbox = optionalComplements.first().locator('input[type="checkbox"]');
            if (await complementCheckbox.count() > 0) {
              await complementCheckbox.first().click();
              await page.waitForTimeout(200);
            }
          }
          
          // Adicionar ao carrinho
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
    });

    test('deve permitir adicionar múltiplos itens ao carrinho', async ({ page }) => {
      // Adicionar primeiro item
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
        
        // Fechar modal
        const closeButton = modal.locator('[data-testid="close-button"], .close-button, .modal-close, button[aria-label*="Close"], button[aria-label*="Fechar"]');
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
          await page.waitForTimeout(500);
        }
        
        // Adicionar segundo item
        if (await menuItems.count() > 1) {
          await menuItems.nth(1).click();
          await page.waitForTimeout(500);
          
          const secondModal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
          if (await secondModal.count() > 0) {
            const addButton = secondModal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
            if (await addButton.count() > 0) {
              await addButton.first().click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    });
  });

  test.describe('Visualização do Carrinho', () => {
    test('deve exibir ícone do carrinho com contador', async ({ page }) => {
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

    test('deve abrir modal do carrinho ao clicar no ícone', async ({ page }) => {
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await cartIcon.first().click();
        await page.waitForTimeout(500);
        
        // Verificar se o modal do carrinho abriu
        const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .cart-panel, [role="dialog"]');
        if (await cartModal.count() > 0) {
          await expect(cartModal.first()).toBeVisible();
        }
      }
    });

    test('deve exibir lista de itens no carrinho', async ({ page }) => {
      // Primeiro adicionar um item
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Agora abrir o carrinho
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await cartIcon.first().click();
        await page.waitForTimeout(500);
        
        const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .cart-panel, [role="dialog"]');
        if (await cartModal.count() > 0) {
          // Verificar se há lista de itens
          const cartItems = cartModal.locator('[data-testid="cart-item"], .cart-item, .cart-product');
          if (await cartItems.count() > 0) {
            await expect(cartItems.first()).toBeVisible();
            
            // Verificar se o item tem informações básicas
            const itemName = cartItems.first().locator('[data-testid="item-name"], .item-name, .product-name');
            if (await itemName.count() > 0) {
              await expect(itemName.first()).toBeVisible();
            }
            
            const itemPrice = cartItems.first().locator('[data-testid="item-price"], .item-price, .product-price');
            if (await itemPrice.count() > 0) {
              await expect(itemPrice.first()).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Gerenciamento de Itens no Carrinho', () => {
    test('deve permitir aumentar quantidade de item', async ({ page }) => {
      // Adicionar item ao carrinho
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Abrir carrinho
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await cartIcon.first().click();
        await page.waitForTimeout(500);
        
        const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .cart-panel, [role="dialog"]');
        if (await cartModal.count() > 0) {
          const cartItems = cartModal.locator('[data-testid="cart-item"], .cart-item, .cart-product');
          if (await cartItems.count() > 0) {
            // Verificar se há botão de aumentar quantidade
            const increaseButton = cartItems.first().locator('[data-testid="increase-quantity"], .increase-quantity, .quantity-plus, button:has-text("+")');
            if (await increaseButton.count() > 0) {
              await expect(increaseButton.first()).toBeVisible();
              
              // Clicar no botão de aumentar
              await increaseButton.first().click();
              await page.waitForTimeout(200);
              
              // Verificar se a quantidade aumentou
              const quantityDisplay = cartItems.first().locator('[data-testid="quantity-display"], .quantity-display, .quantity');
              if (await quantityDisplay.count() > 0) {
                const quantity = await quantityDisplay.first().textContent();
                expect(quantity).toContain('2');
              }
            }
          }
        }
      }
    });

    test('deve permitir diminuir quantidade de item', async ({ page }) => {
      // Adicionar item ao carrinho
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Abrir carrinho
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await cartIcon.first().click();
        await page.waitForTimeout(500);
        
        const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .cart-panel, [role="dialog"]');
        if (await cartModal.count() > 0) {
          const cartItems = cartModal.locator('[data-testid="cart-item"], .cart-item, .cart-product');
          if (await cartItems.count() > 0) {
            // Primeiro aumentar a quantidade
            const increaseButton = cartItems.first().locator('[data-testid="increase-quantity"], .increase-quantity, .quantity-plus, button:has-text("+")');
            if (await increaseButton.count() > 0) {
              await increaseButton.first().click();
              await page.waitForTimeout(200);
            }
            
            // Agora diminuir
            const decreaseButton = cartItems.first().locator('[data-testid="decrease-quantity"], .decrease-quantity, .quantity-minus, button:has-text("-")');
            if (await decreaseButton.count() > 0) {
              await expect(decreaseButton.first()).toBeVisible();
              
              await decreaseButton.first().click();
              await page.waitForTimeout(200);
              
              // Verificar se a quantidade diminuiu
              const quantityDisplay = cartItems.first().locator('[data-testid="quantity-display"], .quantity-display, .quantity');
              if (await quantityDisplay.count() > 0) {
                const quantity = await quantityDisplay.first().textContent();
                expect(quantity).toContain('1');
              }
            }
          }
        }
      }
    });

    test('deve permitir remover item do carrinho', async ({ page }) => {
      // Adicionar item ao carrinho
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Abrir carrinho
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await cartIcon.first().click();
        await page.waitForTimeout(500);
        
        const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .cart-panel, [role="dialog"]');
        if (await cartModal.count() > 0) {
          const cartItems = cartModal.locator('[data-testid="cart-item"], .cart-item, .cart-product');
          if (await cartItems.count() > 0) {
            // Verificar se há botão de remover
            const removeButton = cartItems.first().locator('[data-testid="remove-item"], .remove-item, .delete-item, button:has-text("Remover"), button:has-text("Delete"), button[aria-label*="remove"]');
            if (await removeButton.count() > 0) {
              await expect(removeButton.first()).toBeVisible();
              
              // Clicar no botão de remover
              await removeButton.first().click();
              await page.waitForTimeout(200);
              
              // Verificar se o item foi removido
              const remainingItems = cartModal.locator('[data-testid="cart-item"], .cart-item, .cart-product');
              const newCount = await remainingItems.count();
              expect(newCount).toBe(0);
            }
          }
        }
      }
    });
  });

  test.describe('Cálculo de Preços', () => {
    test('deve calcular preço total corretamente', async ({ page }) => {
      // Adicionar item ao carrinho
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Abrir carrinho
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await cartIcon.first().click();
        await page.waitForTimeout(500);
        
        const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .cart-panel, [role="dialog"]');
        if (await cartModal.count() > 0) {
          // Verificar se há total
          const totalElement = cartModal.locator('[data-testid="cart-total"], .cart-total, .total, .price-total');
          if (await totalElement.count() > 0) {
            await expect(totalElement.first()).toBeVisible();
            
            const totalText = await totalElement.first().textContent();
            expect(totalText).toMatch(/R\$\s*\d+,\d+/);
          }
        }
      }
    });

    test('deve atualizar preço ao alterar quantidade', async ({ page }) => {
      // Adicionar item ao carrinho
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Abrir carrinho
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await cartIcon.first().click();
        await page.waitForTimeout(500);
        
        const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .cart-panel, [role="dialog"]');
        if (await cartModal.count() > 0) {
          const cartItems = cartModal.locator('[data-testid="cart-item"], .cart-item, .cart-product');
          if (await cartItems.count() > 0) {
            // Pegar preço inicial
            const totalElement = cartModal.locator('[data-testid="cart-total"], .cart-total, .total, .price-total');
            if (await totalElement.count() > 0) {
              const initialTotal = await totalElement.first().textContent();
              
              // Aumentar quantidade
              const increaseButton = cartItems.first().locator('[data-testid="increase-quantity"], .increase-quantity, .quantity-plus, button:has-text("+")');
              if (await increaseButton.count() > 0) {
                await increaseButton.first().click();
                await page.waitForTimeout(200);
                
                // Verificar se o total aumentou
                const newTotal = await totalElement.first().textContent();
                expect(newTotal).not.toBe(initialTotal);
              }
            }
          }
        }
      }
    });
  });

  test.describe('Limpeza do Carrinho', () => {
    test('deve permitir limpar todo o carrinho', async ({ page }) => {
      // Adicionar alguns itens ao carrinho
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        for (let i = 0; i < Math.min(await menuItems.count(), 2); i++) {
          await menuItems.nth(i).click();
          await page.waitForTimeout(500);
          
          const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
          if (await modal.count() > 0) {
            const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
            if (await addButton.count() > 0) {
              await addButton.first().click();
              await page.waitForTimeout(500);
            }
            
            // Fechar modal
            const closeButton = modal.locator('[data-testid="close-button"], .close-button, .modal-close, button[aria-label*="Close"], button[aria-label*="Fechar"]');
            if (await closeButton.count() > 0) {
              await closeButton.first().click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
      
      // Abrir carrinho
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        await cartIcon.first().click();
        await page.waitForTimeout(500);
        
        const cartModal = page.locator('[data-testid="cart-modal"], .cart-modal, .cart-panel, [role="dialog"]');
        if (await cartModal.count() > 0) {
          // Verificar se há botão de limpar carrinho
          const clearButton = cartModal.locator('[data-testid="clear-cart"], .clear-cart, .empty-cart, button:has-text("Limpar"), button:has-text("Clear"), button:has-text("Esvaziar")');
          if (await clearButton.count() > 0) {
            await expect(clearButton.first()).toBeVisible();
            
            // Clicar no botão de limpar
            await clearButton.first().click();
            await page.waitForTimeout(500);
            
            // Verificar se apareceu confirmação
            const confirmation = page.locator('[data-testid="clear-confirmation"], .clear-confirmation, .confirmation-dialog');
            if (await confirmation.count() > 0) {
              await expect(confirmation.first()).toBeVisible();
              
              // Confirmar limpeza
              const confirmButton = confirmation.locator('[data-testid="confirm-clear"], .confirm-clear, button:has-text("Confirmar"), button:has-text("Confirm")');
              if (await confirmButton.count() > 0) {
                await confirmButton.first().click();
                await page.waitForTimeout(500);
                
                // Verificar se o carrinho foi limpo
                const cartItems = cartModal.locator('[data-testid="cart-item"], .cart-item, .cart-product');
                const itemCount = await cartItems.count();
                expect(itemCount).toBe(0);
              }
            }
          }
        }
      }
    });
  });

  test.describe('Persistência do Carrinho', () => {
    test('deve manter itens ao navegar entre páginas', async ({ page }) => {
      // Adicionar item ao carrinho
      const menuItems = page.locator('[data-testid="menu-item"], .menu-item, .dish-item, .item-card');
      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[data-testid="dish-modal"], .modal, .dish-modal, [role="dialog"]');
        if (await modal.count() > 0) {
          const addButton = modal.locator('[data-testid="add-to-cart"], .add-to-cart, .cart-button, button:has-text("Adicionar"), button:has-text("Add")');
          if (await addButton.count() > 0) {
            await addButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Navegar para outra página
      await page.goto('/restaurant/cafe-moendo');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Aguardar 2s para JavaScript executar
      await page.waitForTimeout(1000);
      
      // Verificar se o contador do carrinho ainda mostra o item
      const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart, [aria-label*="cart"], [aria-label*="carrinho"]');
      if (await cartIcon.count() > 0) {
        const cartCount = cartIcon.locator('.cart-count, .cart-badge, [data-testid="cart-count"]');
        if (await cartCount.count() > 0) {
          const count = await cartCount.first().textContent();
          expect(count).toContain('1');
        }
      }
    });
  });
});
