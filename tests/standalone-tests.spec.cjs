const { test, expect } = require('@playwright/test');

test.describe('Testes Standalone (Sem Servidor)', () => {
  test('deve verificar se o Playwright está funcionando', async ({ page }) => {
    // Teste simples para verificar se o Playwright está funcionando
    await page.setContent(`
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Teste do Playwright</h1>
          <p>Esta é uma página de teste</p>
          <button id="test-button">Clique aqui</button>
        </body>
      </html>
    `);
    
    // Verificar se a página foi carregada
    await expect(page).toHaveTitle('Test Page');
    
    // Verificar se o título está visível
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Teste do Playwright');
    
    // Verificar se o botão está visível
    await expect(page.locator('#test-button')).toBeVisible();
    
    // Verificar se o texto está correto
    await expect(page.locator('p')).toHaveText('Esta é uma página de teste');
  });

  test('deve testar interações básicas', async ({ page }) => {
    await page.setContent(`
      <html>
        <head><title>Interactions Test</title></head>
        <body>
          <input type="text" id="name-input" placeholder="Digite seu nome">
          <button id="submit-btn">Enviar</button>
          <div id="result"></div>
        </body>
      </html>
    `);
    
    // Verificar se os elementos estão presentes
    await expect(page.locator('#name-input')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeVisible();
    
    // Testar digitação
    await page.locator('#name-input').fill('João Silva');
    await expect(page.locator('#name-input')).toHaveValue('João Silva');
    
    // Testar clique
    await page.locator('#submit-btn').click();
    
    // Verificar se o botão foi clicado
    await expect(page.locator('#submit-btn')).toBeVisible();
  });

  test('deve testar validações básicas', async ({ page }) => {
    await page.setContent(`
      <html>
        <head><title>Validation Test</title></head>
        <body>
          <form id="test-form">
            <input type="email" id="email-input" required>
            <input type="password" id="password-input" minlength="6" required>
            <button type="submit">Enviar</button>
          </form>
        </body>
      </html>
    `);
    
    // Verificar se o formulário está presente
    await expect(page.locator('#test-form')).toBeVisible();
    
    // Verificar se os campos obrigatórios estão marcados
    const emailInput = page.locator('#email-input');
    const passwordInput = page.locator('#password-input');
    
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('minlength', '6');
    
    // Verificar se os campos estão vazios inicialmente
    await expect(emailInput).toHaveValue('');
    await expect(passwordInput).toHaveValue('');
  });

  test('deve testar responsividade básica', async ({ page }) => {
    await page.setContent(`
      <html>
        <head>
          <title>Responsiveness Test</title>
          <style>
            .responsive-box {
              width: 100%;
              max-width: 300px;
              height: 100px;
              background-color: #007bff;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
            }
            @media (max-width: 768px) {
              .responsive-box {
                font-size: 14px;
                height: 80px;
              }
            }
          </style>
        </head>
        <body>
          <div class="responsive-box">Caixa Responsiva</div>
        </body>
      </html>
    `);
    
    // Verificar se a caixa está visível
    const responsiveBox = page.locator('.responsive-box');
    await expect(responsiveBox).toBeVisible();
    
    // Verificar se o texto está correto
    await expect(responsiveBox).toHaveText('Caixa Responsiva');
    
    // Verificar se a caixa tem a cor de fundo correta
    await expect(responsiveBox).toHaveCSS('background-color', 'rgb(0, 123, 255)');
    
    // Verificar se a caixa tem a cor do texto correta
    await expect(responsiveBox).toHaveCSS('color', 'rgb(255, 255, 255)');
  });

  test('deve testar acessibilidade básica', async ({ page }) => {
    await page.setContent(`
      <html>
        <head><title>Accessibility Test</title></head>
        <body>
          <main>
            <h1>Página de Teste</h1>
            <nav aria-label="Navegação principal">
              <ul>
                <li><a href="#home">Início</a></li>
                <li><a href="#about">Sobre</a></li>
                <li><a href="#contact">Contato</a></li>
              </ul>
            </nav>
            <button aria-label="Menu" aria-expanded="false">☰</button>
          </main>
        </body>
      </html>
    `);
    
    // Verificar se há um elemento main
    await expect(page.locator('main')).toBeVisible();
    
    // Verificar se há um h1 (heading principal)
    await expect(page.locator('h1')).toBeVisible();
    
    // Verificar se a navegação tem aria-label
    const nav = page.locator('nav');
    await expect(nav).toHaveAttribute('aria-label', 'Navegação principal');
    
    // Verificar se o botão tem aria-label e aria-expanded
    const button = page.locator('button');
    await expect(button).toHaveAttribute('aria-label', 'Menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    
    // Verificar se há links de navegação
    const navLinks = page.locator('nav a');
    expect(await navLinks.count()).toBe(3);
    
    // Verificar se os links têm href
    for (let i = 0; i < 3; i++) {
      const link = navLinks.nth(i);
      await expect(link).toHaveAttribute('href');
    }
  });

  test('deve testar seletores CSS complexos', async ({ page }) => {
    await page.setContent(`
      <html>
        <head><title>CSS Selectors Test</title></head>
        <body>
          <div class="container">
            <header class="header">
              <h1 class="title">Título Principal</h1>
              <nav class="navigation">
                <ul class="nav-list">
                  <li class="nav-item"><a href="#" class="nav-link">Link 1</a></li>
                  <li class="nav-item"><a href="#" class="nav-link">Link 2</a></li>
                  <li class="nav-item"><a href="#" class="nav-link">Link 3</a></li>
                </ul>
              </nav>
            </header>
            <main class="main-content">
              <section class="content-section">
                <h2 class="section-title">Seção de Conteúdo</h2>
                <p class="section-text">Texto da seção</p>
              </section>
            </main>
          </div>
        </body>
      </html>
    `);
    
    // Testar seletores CSS complexos
    await expect(page.locator('.container .header .title')).toBeVisible();
    await expect(page.locator('.container .main-content .content-section')).toBeVisible();
    await expect(page.locator('.nav-list .nav-item .nav-link').first()).toBeVisible();
    
    // Verificar contagem de elementos
    const navItems = page.locator('.nav-item');
    expect(await navItems.count()).toBe(3);
    
    const navLinks = page.locator('.nav-link');
    expect(await navLinks.count()).toBe(3);
  });
});
