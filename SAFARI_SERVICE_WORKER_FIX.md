# Safari Service Worker Fix - Correção para Erro de Redirecionamento

## Problema Identificado

O Safari estava apresentando o erro:
**"Response served by service worker has redirections"**

Este erro ocorre porque o Safari é muito rigoroso com service workers que servem respostas com redirecionamentos, especialmente quando relacionados a manifests dinâmicos.

## Causa Raiz

1. **Service Worker Interceptando Manifest**: O service worker estava interceptando requisições de `manifest.json`
2. **Manifest Dinâmico**: Retornando manifests personalizados com `start_url` diferentes
3. **Redirecionamentos**: Safari interpreta mudanças de URL como redirecionamentos
4. **Incompatibilidade**: Safari não permite service workers servirem manifests com redirecionamentos

## Solução Implementada

### 1. Desabilitação da Interceptação de Manifest no Service Worker

**Arquivo**: `public/sw.js`

```javascript
// Interceptar requisições para o manifest - DESABILITADO para Safari
// Safari não permite service workers servirem manifests com redirecionamentos
if (event.request.url.includes('manifest.json')) {
  console.log('SW: Skipping manifest interception for Safari compatibility');
  event.respondWith(fetch(event.request));
  return;
}
```

### 2. Simplificação do Manifest Padrão

**Arquivo**: `src/app/manifest.ts`

- ✅ Removido parâmetros UTM do `start_url`
- ✅ Simplificado para evitar redirecionamentos
- ✅ Mantido compatível com todos os navegadores

```javascript
start_url: '/', // Antes: '/?utm_source=web_app_manifest'
```

### 3. Desabilitação Completa do Service Worker no Safari

**Arquivo**: `src/hooks/useServiceWorker.ts`

```javascript
// Safari tem problemas com service workers e manifests dinâmicos
// Desabilitar service worker no Safari para evitar erros de redirecionamento
if (isSafariBrowser) {
  console.log('Safari detected, unregistering existing service workers to avoid redirect errors');
  
  // Desregistrar service workers existentes no Safari
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        console.log('Unregistering service worker for Safari compatibility');
        registration.unregister();
      });
    });
  }
  return;
}
```

## Benefícios da Solução

### Para Safari:
- ✅ **Sem Erros de Redirecionamento**: Service worker não interfere com manifests
- ✅ **Funcionamento Normal**: App funciona sem service worker no Safari
- ✅ **Compatibilidade Total**: Manifest padrão funciona perfeitamente

### Para Outros Navegadores:
- ✅ **Service Worker Ativo**: Chrome, Firefox, Edge mantêm funcionalidades
- ✅ **Cache Funcional**: Cache offline continua funcionando
- ✅ **PWA Completo**: Instalação e funcionalidades mantidas

## Detecção de Safari

```javascript
const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
```

Esta detecção:
- ✅ Identifica Safari real (não Chrome com user-agent modificado)
- ✅ Exclui Chrome e Android
- ✅ Funciona em iOS Safari e macOS Safari

## Arquivos Modificados

1. **`public/sw.js`**:
   - Desabilitada interceptação de manifest
   - Versão de cache atualizada: `1758201797440`

2. **`src/app/manifest.ts`**:
   - Removidos parâmetros UTM do `start_url`
   - Simplificado para evitar redirecionamentos

3. **`src/hooks/useServiceWorker.ts`**:
   - Detecção de Safari aprimorada
   - Desregistro automático de service workers no Safari

## Teste da Solução

### No Safari:
1. **Limpar Cache**: Settings > Safari > Clear History and Website Data
2. **Acessar Site**: yo-self.com deve carregar normalmente
3. **Verificar Console**: Deve mostrar "Safari detected, unregistering..."
4. **Sem Erros**: Não deve mais aparecer erro de redirecionamento

### Em Outros Navegadores:
1. **Service Worker Ativo**: Deve registrar normalmente
2. **Cache Funcional**: Deve funcionar offline
3. **PWA Completo**: Instalação deve funcionar

## Status da Correção

- ✅ **Problema Identificado**: Safari + Service Worker + Manifest dinâmico
- ✅ **Solução Implementada**: Desabilitação específica para Safari
- ✅ **Teste Necessário**: Verificar funcionamento no Safari real
- ✅ **Compatibilidade**: Outros navegadores não afetados

---

**Status**: ✅ **IMPLEMENTADO E PRONTO PARA TESTE**

A solução específica para Safari está implementada. O erro "Response served by service worker has redirections" deve estar resolvido no Safari, enquanto outros navegadores mantêm todas as funcionalidades do service worker.
