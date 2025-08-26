# 🔧 GitHub Actions Troubleshooting - Cardápio Digital

## 🚨 **Problemas Identificados e Soluções**

Este documento lista os problemas encontrados nos workflows do GitHub Actions e as soluções implementadas.

## ❌ **Problemas Identificados**

### **1. Problema de Servidor de Produção**
- **Descrição**: O comando `npm run start` pode não funcionar corretamente no CI
- **Causa**: Dependências de produção podem não estar disponíveis
- **Solução**: Usar `npm run dev` ou verificar se o servidor está rodando

### **2. Timeouts Insuficientes**
- **Descrição**: Tempo de espera de 30-40 segundos pode ser insuficiente
- **Causa**: Aplicação pode demorar mais para inicializar no CI
- **Solução**: Aumentar para 60 segundos e adicionar verificação com curl

### **3. Configuração de Ambiente**
- **Descrição**: Variáveis de ambiente podem não estar sendo definidas corretamente
- **Causa**: Configuração inconsistente entre workflows
- **Solução**: Padronizar variáveis de ambiente em todos os workflows

### **4. Verificação de Servidor**
- **Descrição**: Falta verificação se o servidor está realmente rodando
- **Causa**: Apenas sleep sem verificação de conectividade
- **Solução**: Adicionar `curl -f http://localhost:3000 || exit 1`

## ✅ **Soluções Implementadas**

### **1. Workflow Principal Corrigido** (`.github/workflows/playwright.yml`)
```yaml
- name: Start the application
  run: |
    npm run start &
    echo "Waiting for app to start..."
    sleep 60
    echo "App should be ready now"
    curl -f http://localhost:3000 || exit 1
  env:
    CI: true
```

### **2. Workflow Simples Corrigido** (`.github/workflows/playwright-simple.yml`)
```yaml
- name: Start application
  run: |
    npm run start &
    echo "Waiting for app to start..."
    sleep 60
    echo "App should be ready now"
    curl -f http://localhost:3000 || exit 1
  env:
    CI: true
```

### **3. Workflow de PR Corrigido** (`.github/workflows/playwright-pr.yml`)
```yaml
- name: Start application
  run: |
    npm run start &
    echo "Waiting for app to start..."
    sleep 60
    echo "App should be ready now"
    curl -f http://localhost:3000 || exit 1
  env:
    CI: true
```

### **4. Workflow de Regressão Corrigido** (`.github/workflows/playwright-regression.yml`)
```yaml
- name: Start application
  run: |
    npm run start &
    echo "Waiting for app to start..."
    sleep 60
    echo "App should be ready now"
    curl -f http://localhost:3000 || exit 1
  env:
    CI: true
```

## 🆕 **Workflows Alternativos Criados**

### **1. Workflow com Servidor de Desenvolvimento** (`.github/workflows/playwright-dev.yml`)
- **Vantagem**: Mais confiável, não depende de build de produção
- **Uso**: `npm run dev` em vez de `npm run start`
- **Tempo**: 30 segundos de espera

### **2. Workflow com Configuração CI** (`.github/workflows/playwright-ci.yml`)
- **Vantagem**: Usa configuração específica para CI
- **Uso**: `--config=playwright.config.ci.js`
- **Configuração**: Timeouts otimizados para CI

### **3. Workflow de Diagnóstico** (`.github/workflows/playwright-diagnostic.yml`)
- **Objetivo**: Identificar problemas específicos
- **Trigger**: Manual apenas (`workflow_dispatch`)
- **Verificações**: Estrutura do projeto, dependências, Playwright

### **4. Workflow Funcional Simples** (`.github/workflows/playwright-working.yml`)
- **Objetivo**: Versão mais simples e robusta
- **Características**: Sem servidor web, apenas execução de testes
- **Uso**: Para validação rápida de testes

## 🔍 **Como Diagnosticar Problemas**

### **1. Verificar Logs do GitHub Actions**
- Acesse a aba "Actions" no repositório
- Clique no workflow que falhou
- Analise os logs de cada step

### **2. Executar Workflow de Diagnóstico**
```bash
# No GitHub, vá para Actions > Playwright Tests - Diagnostic
# Clique em "Run workflow" > "Run workflow"
```

### **3. Verificar Localmente**
```bash
# Clone o repositório
git clone <repo-url>
cd <repo-name>

# Instale dependências
npm install

# Execute testes
npx playwright test --project=chromium

# Verifique se o servidor inicia
npm run start
# ou
npm run dev
```

## 🛠️ **Soluções para Problemas Específicos**

### **Problema: "npm run start" falha**
```yaml
# Solução 1: Usar servidor de desenvolvimento
- name: Start application
  run: npm run dev &

# Solução 2: Verificar se o comando existe
- name: Check available scripts
  run: npm run

# Solução 3: Usar npx diretamente
- name: Start application
  run: npx next start &
```

### **Problema: Timeout nos testes**
```yaml
# Solução: Aumentar timeouts
- name: Run Playwright tests
  run: npx playwright test --timeout=60000
```

### **Problema: Servidor não inicia**
```yaml
# Solução: Adicionar verificação
- name: Start and verify application
  run: |
    npm run start &
    sleep 60
    curl -f http://localhost:3000 || exit 1
```

## 📋 **Checklist de Verificação**

### **Antes de Fazer Push**
- [ ] Testes passam localmente
- [ ] Servidor inicia localmente
- [ ] Dependências estão instaladas
- [ ] Playwright está configurado

### **Após Falha no CI**
- [ ] Verificar logs do GitHub Actions
- [ ] Identificar step que falhou
- [ ] Reproduzir problema localmente
- [ ] Aplicar correção
- [ ] Testar localmente
- [ ] Fazer push da correção

## 🎯 **Próximos Passos**

### **Imediato**
1. **Testar** workflows corrigidos
2. **Monitorar** execuções no GitHub Actions
3. **Identificar** problemas restantes

### **Curto Prazo**
1. **Padronizar** todos os workflows
2. **Implementar** verificações de saúde
3. **Adicionar** retry automático

### **Longo Prazo**
1. **Implementar** cache de dependências
2. **Adicionar** testes paralelos
3. **Implementar** notificações de falha

## 🚀 **Workflows Recomendados**

### **Para Desenvolvimento Diário**
- **Workflow**: `playwright-working.yml`
- **Vantagem**: Simples, rápido, confiável
- **Uso**: Push para feature branches

### **Para Pull Requests**
- **Workflow**: `playwright-pr.yml`
- **Vantagem**: Comentários automáticos, validação completa
- **Uso**: Criação de PRs

### **Para Regressão**
- **Workflow**: `playwright-regression.yml`
- **Vantagem**: Testes completos, execução diária
- **Uso**: Monitoramento de qualidade

### **Para Diagnóstico**
- **Workflow**: `playwright-diagnostic.yml`
- **Vantagem**: Identificação de problemas
- **Uso**: Quando workflows falham

---

## 🎉 **Status Atual**

✅ **Problemas identificados** e soluções implementadas  
✅ **Workflows corrigidos** com verificações robustas  
✅ **Workflows alternativos** criados para diferentes cenários  
✅ **Guia de troubleshooting** completo  
✅ **Checklist de verificação** para prevenção  

**Os workflows agora devem funcionar corretamente no GitHub Actions!** 🚀
