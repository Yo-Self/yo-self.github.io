# Testes Automatizados - Cardápio Digital

Este diretório contém a suíte completa de testes automatizados para o cardápio digital, implementados com Playwright.

## 📁 Estrutura dos Testes

```
tests/
├── README.md                    # Este arquivo
├── global-setup.ts             # Configuração global dos testes
├── utils/
│   └── test-helpers.ts         # Utilitários e helpers para os testes
├── homepage.spec.ts            # Testes da página inicial
├── restaurant-selection.spec.ts # Testes de seleção de restaurante
├── carousel.spec.ts            # Testes do carrossel de pratos
├── categories.spec.ts          # Testes de navegação por categorias
├── dish-modal.spec.ts          # Testes do modal de detalhes do prato
├── cart.spec.ts                # Testes básicos do carrinho
├── cart-management.spec.ts     # Testes de gerenciamento do carrinho
├── search.spec.ts              # Testes de busca e IA
├── accessibility.spec.ts       # Testes de acessibilidade
└── responsiveness.spec.ts      # Testes de responsividade
```

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Node.js**: Versão 18 ou superior
2. **Servidor rodando**: O projeto deve estar rodando em `http://localhost:3000`

### Instalação

```bash
# Instalar dependências (se ainda não instalou)
npm install

# Instalar navegadores do Playwright
npx playwright install
```

### Execução dos Testes

#### Executar Todos os Testes
```bash
npx playwright test
```

#### Executar Testes Específicos
```bash
# Executar apenas testes de carrinho
npx playwright test cart.spec.ts

# Executar testes que contenham "carrinho" no nome
npx playwright test --grep "carrinho"

# Executar testes de uma funcionalidade específica
npx playwright test --grep "Sistema de Carrinho"
```

#### Executar em Modo UI (Recomendado para Desenvolvimento)
```bash
npx playwright test --ui
```

#### Executar em Navegadores Específicos
```bash
# Apenas Chrome
npx playwright test --project=chromium

# Apenas Firefox
npx playwright test --project=firefox

# Apenas Safari
npx playwright test --project=webkit

# Apenas Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

#### Executar em Modo Debug
```bash
npx playwright test --debug
```

### Gerar Relatórios

```bash
# Gerar relatório HTML
npx playwright test --reporter=html

# Abrir relatório no navegador
npx playwright show-report
```

## 🔧 Configuração

### playwright.config.ts

O arquivo de configuração está configurado para:

- **Base URL**: `http://localhost:3000`
- **Servidor**: Inicia automaticamente com `npm run dev`
- **Navegadores**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Screenshots**: Capturados automaticamente em caso de falha
- **Vídeos**: Gravados em caso de falha
- **Traces**: Gerados em caso de retry

### Variáveis de Ambiente

```bash
# Para CI/CD
CI=true npx playwright test

# Para executar sem servidor local (apenas testes que não dependem do servidor)
npx playwright test --project=chromium
```

## 📱 Testes de Responsividade

Os testes de responsividade são executados automaticamente em diferentes tamanhos de tela:

- **Desktop**: 1920x1080
- **Tablet**: 768x1024  
- **Mobile**: 375x667
- **Mobile Landscape**: 667x375

## ♿ Testes de Acessibilidade

Os testes de acessibilidade verificam:

- Navegação por teclado
- Atributos ARIA
- Textos alternativos
- Contraste e legibilidade
- Suporte a leitores de tela

## 🧪 Estrutura dos Testes

Cada arquivo de teste segue o padrão:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Nome da Funcionalidade', () => {
  test.beforeEach(async ({ page }) => {
    // Setup antes de cada teste
    await TestHelpers.clearLocalStorage(page);
    await page.goto('/restaurant/auri-monteiro');
    await TestHelpers.waitForPageLoad(page);
  });

  test('descrição do teste', async ({ page }) => {
    // Passos do teste
    // Verificações
  });
});
```

## 🛠️ Utilitários Disponíveis

### TestHelpers

```typescript
// Aguardar carregamento da página
await TestHelpers.waitForPageLoad(page);

// Limpar localStorage
await TestHelpers.clearLocalStorage(page);

// Aguardar elemento
await TestHelpers.waitForElement(page, 'selector');

// Verificar visibilidade
await TestHelpers.expectElementVisible(page, 'selector');

// Verificar texto
await TestHelpers.expectElementText(page, 'selector', 'texto esperado');
```

## 🐛 Solução de Problemas

### Testes Falhando

1. **Verificar se o servidor está rodando**:
   ```bash
   npm run dev
   ```

2. **Verificar se a URL está correta**:
   - Os testes usam `/restaurant/auri-monteiro` como exemplo
   - Ajuste para um restaurante que existe no seu sistema

3. **Verificar seletores**:
   - Os testes usam múltiplos seletores para maior compatibilidade
   - Se um teste falhar, verifique se os elementos estão presentes

### Seletores Não Encontrados

Os testes usam seletores flexíveis:

```typescript
// Exemplo de seletor flexível
const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .CartIconHeader');
```

Se um elemento não for encontrado, adicione o seletor correto ao array.

### Timeouts

Se os testes estiverem lentos:

1. **Aumentar timeouts** no `playwright.config.ts`
2. **Verificar performance** do servidor
3. **Usar `--project=chromium`** para testes mais rápidos

## 📊 CI/CD

### GitHub Actions

O arquivo `.github/workflows/playwright.yml` está configurado para:

- Executar testes em cada PR
- Gerar relatórios HTML
- Fazer upload dos artefatos

### Execução Local

```bash
# Simular ambiente CI
CI=true npx playwright test

# Executar com retry (como no CI)
npx playwright test --retries=2
```

## 🎯 Próximos Passos

1. **Adicionar data-testid** aos componentes principais
2. **Criar testes para funcionalidades específicas** do seu sistema
3. **Configurar testes de integração** com APIs
4. **Adicionar testes de performance** com Lighthouse
5. **Configurar testes de regressão visual** com screenshots

## 📚 Recursos

- [Documentação do Playwright](https://playwright.dev/)
- [Guia de Testes E2E](https://playwright.dev/docs/intro)
- [Melhores Práticas](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## 🤝 Contribuição

Para adicionar novos testes:

1. Crie um novo arquivo `.spec.ts`
2. Use a estrutura padrão com `test.describe` e `test.beforeEach`
3. Use os utilitários do `TestHelpers`
4. Adicione seletores flexíveis para maior compatibilidade
5. Documente casos especiais ou dependências

---

**Nota**: Estes testes são um ponto de partida. Ajuste os seletores e URLs conforme necessário para o seu sistema específico.
