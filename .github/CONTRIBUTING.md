# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o Cardápio Digital! Este documento fornece diretrizes para contribuições.

## 🚀 Como Contribuir

### 1. **Fork e Clone**
```bash
# Fork o repositório no GitHub
# Clone seu fork localmente
git clone https://github.com/seu-usuario/web-version.git
cd web-version

# Adicione o repositório original como upstream
git remote add upstream https://github.com/original-owner/web-version.git
```

### 2. **Crie uma Branch**
```bash
# Crie uma branch para sua feature/fix
git checkout -b feature/nova-funcionalidade
# ou
git checkout -b bugfix/correcao-bug
```

### 3. **Desenvolva e Teste**
```bash
# Instale dependências
npm install

# Execute os testes
npx playwright test

# Certifique-se de que todos os 46 testes passem
```

### 4. **Commit e Push**
```bash
# Adicione suas mudanças
git add .

# Faça commit com mensagem descritiva
git commit -m "feat: adiciona nova funcionalidade de busca"

# Push para sua branch
git push origin feature/nova-funcionalidade
```

### 5. **Crie um Pull Request**
- Vá para seu fork no GitHub
- Clique em "New Pull Request"
- Selecione a branch com suas mudanças
- Preencha o template do PR
- Aguarde a validação automática dos testes

## 📋 Padrões de Código

### **Convenções de Commit**
Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: adiciona nova funcionalidade
fix: corrige bug na busca
docs: atualiza documentação
style: formatação de código
refactor: refatora funcionalidade existente
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

### **Estrutura de Arquivos**
```
src/
├── app/           # Páginas Next.js
├── components/    # Componentes React
├── hooks/         # Custom hooks
├── types/         # Definições TypeScript
└── utils/         # Utilitários

tests/
├── *.spec.cjs     # Testes Playwright
├── utils/         # Utilitários de teste
└── README.md      # Documentação dos testes
```

## 🧪 Testes

### **Executando Testes Localmente**
```bash
# Todos os testes
npx playwright test

# Apenas Chromium (mais rápido)
npx playwright test --project=chromium

# Com interface visual
npx playwright test --ui

# Testes específicos
npx playwright test --grep "nome do teste"
```

### **Adicionando Novos Testes**
1. **Crie** arquivo `.spec.cjs` na pasta `tests/`
2. **Siga** o padrão dos testes existentes
3. **Use** seletores robustos e assertions claras
4. **Teste** diferentes cenários e edge cases
5. **Execute** localmente antes do PR

### **Padrão de Teste**
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Nova Funcionalidade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve funcionar corretamente', async ({ page }) => {
    // Arrange
    const element = page.locator('[data-testid="element"]');
    
    // Act
    await element.click();
    
    // Assert
    await expect(element).toBeVisible();
  });
});
```

## 🔧 Desenvolvimento

### **Scripts Disponíveis**
```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia servidor de produção

# Testes
npm run test         # Executa testes Playwright
npm run test:ui      # Executa testes com interface visual
npm run test:debug   # Executa testes em modo debug
```

### **Variáveis de Ambiente**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
```

## 📚 Documentação

### **Arquivos de Documentação**
- `README.md` - Visão geral do projeto
- `CI_CD_README.md` - Documentação de CI/CD
- `tests/README.md` - Guia dos testes
- `IMPLEMENTACAO_TESTES.md` - Status da implementação

### **Atualizando Documentação**
- Mantenha a documentação sincronizada com o código
- Use exemplos claros e práticos
- Inclua screenshots quando relevante
- Mantenha o formato Markdown consistente

## 🚨 Reportando Bugs

### **Antes de Reportar**
1. **Verifique** se o bug já foi reportado
2. **Teste** localmente com a versão mais recente
3. **Execute** os testes para verificar se não é um problema de teste
4. **Documente** os passos para reproduzir

### **Template de Bug Report**
Use o template `🐛 Bug Report` ao criar uma issue:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs. atual
- Informações do sistema
- Screenshots se aplicável

## 💡 Sugerindo Funcionalidades

### **Antes de Sugerir**
1. **Verifique** se a funcionalidade já foi solicitada
2. **Pense** no impacto nos testes existentes
3. **Considere** alternativas e trade-offs
4. **Pesquise** se é uma funcionalidade comum

### **Template de Feature Request**
Use o template `🚀 Feature Request`:
- Descrição clara da funcionalidade
- Problema que resolve
- Solução proposta
- Impacto nos testes

## 🔄 Processo de Review

### **Critérios de Aprovação**
- ✅ **Todos os testes passam** (46/46)
- ✅ **Código segue padrões** do projeto
- ✅ **Documentação atualizada**
- ✅ **Testes adequados** para mudanças
- ✅ **Sem regressões** introduzidas

### **Feedback e Iteração**
- Responda a comentários de review
- Faça mudanças solicitadas
- Mantenha o PR atualizado
- Teste localmente após mudanças

## 🎯 Áreas de Contribuição

### **Prioridades Atuais**
1. **Testes de Acessibilidade** - WCAG compliance
2. **Testes de Performance** - Métricas de velocidade
3. **Testes Mobile** - Dispositivos móveis
4. **Testes de Regressão Visual** - UI automático
5. **Integração com Slack/Discord** - Notificações

### **Sempre Bem-vindos**
- Correções de bugs
- Melhorias de performance
- Refatoração de código
- Documentação
- Testes adicionais

## 🆘 Precisando de Ajuda?

### **Recursos Disponíveis**
- **Issues** - Para bugs e funcionalidades
- **Discussions** - Para perguntas e ideias
- **Wiki** - Para documentação detalhada
- **Actions** - Para ver status dos testes

### **Contato**
- Abra uma issue para perguntas
- Use discussions para ideias
- Mencione @jesse para questões urgentes

## 🎉 Reconhecimento

### **Contribuidores**
- Seu nome será adicionado ao README
- Contribuições significativas ganham acesso de write
- Agradecimentos especiais para contribuições importantes

### **Badges**
- Contribuidor ativo
- Mantenedor
- Especialista em testes
- Especialista em acessibilidade

---

## 🚀 **Pronto para Contribuir?**

1. **Fork** o repositório
2. **Clone** localmente
3. **Execute** os testes
4. **Crie** sua feature
5. **Teste** tudo
6. **Abra** um PR
7. **Aguarde** validação automática

**Os testes rodarão automaticamente e você receberá feedback imediato!** 🎉

---

*Este guia está em constante evolução. Sugestões são bem-vindas!*
