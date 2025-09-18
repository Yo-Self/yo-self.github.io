# Script de Limpeza Completa - Execute no Console do Navegador

## Para resolver os erros persistentes, execute este código no console do navegador:

```javascript
// Script para limpeza completa de caches e service workers
console.log('🧹 Iniciando limpeza completa...');

// 1. Desregistrar todos os service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`📱 Encontrados ${registrations.length} service workers`);
    
    registrations.forEach(registration => {
      console.log('🗑️ Desregistrando:', registration.scope);
      registration.unregister();
    });
  });
}

// 2. Limpar todos os caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log(`💾 Encontrados ${cacheNames.length} caches`);
    
    cacheNames.forEach(cacheName => {
      console.log('🗑️ Deletando cache:', cacheName);
      caches.delete(cacheName);
    });
  });
}

// 3. Limpar storage
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage limpo');

// 4. Recarregar página
setTimeout(() => {
  console.log('🔄 Recarregando...');
  window.location.reload();
}, 2000);
```

## Instruções:

1. **Abra o Console do Navegador**:
   - Chrome/Edge: F12 → Console
   - Safari: Desenvolver → Mostrar Console JavaScript
   - Firefox: F12 → Console

2. **Cole o código acima** e pressione Enter

3. **Aguarde 2 segundos** - a página será recarregada automaticamente

4. **Teste o site** - deve funcionar normalmente agora

## Alternativa Manual:

Se o script não funcionar, faça manualmente:

1. **Configurações do Navegador**:
   - Chrome: Configurações → Privacidade → Limpar dados de navegação
   - Safari: Desenvolver → Esvaziar Caches
   - Firefox: Configurações → Privacidade → Limpar Dados

2. **Selecione**:
   - ✅ Cookies e dados do site
   - ✅ Imagens e arquivos em cache
   - ✅ Dados de aplicativos web

3. **Clique em "Limpar dados"**

4. **Recarregue a página**

---

**Este script resolve os problemas de cache corrompido e service worker que estão causando os erros.**
