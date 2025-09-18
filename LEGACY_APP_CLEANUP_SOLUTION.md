# Script de Limpeza para Web Apps Instalados

## Problema Identificado

Web apps que foram instalados antes das correções estão apresentando:
- ❌ Interface quebrada (só carregando imagens)
- ❌ Erro "response served by service worker has redirections"
- ❌ Service workers antigos causando conflitos

## Solução Automática

O sistema agora detecta automaticamente web apps antigos e executa limpeza completa.

## Solução Manual (Para Casos Extremos)

Se o sistema automático não funcionar, execute este código no console do navegador:

```javascript
// Script de limpeza completa para web apps instalados
console.log('🧹 Iniciando limpeza completa para web app instalado...');

async function cleanupInstalledApp() {
  try {
    // 1. Desregistrar TODOS os service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📱 Encontrados ${registrations.length} service workers`);
      
      for (const registration of registrations) {
        console.log('🗑️ Desregistrando:', registration.scope);
        await registration.unregister();
      }
    }

    // 2. Limpar TODOS os caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`💾 Encontrados ${cacheNames.length} caches`);
      
      for (const cacheName of cacheNames) {
        console.log('🗑️ Deletando cache:', cacheName);
        await caches.delete(cacheName);
      }
    }

    // 3. Limpar storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Storage limpo');

    // 4. Limpar IndexedDB
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          console.log('🗑️ Deletando IndexedDB:', db.name);
          await new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(db.name);
            deleteReq.onsuccess = () => resolve(true);
            deleteReq.onerror = () => reject(deleteReq.error);
          });
        }
      }
    }

    console.log('✨ Limpeza completa! Recarregando em 3 segundos...');
    setTimeout(() => {
      window.location.reload();
    }, 3000);

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  }
}

// Executar limpeza
cleanupInstalledApp();
```

## Instruções para Web Apps Instalados

### Método 1: Automático
1. **Abra o web app instalado**
2. **Aguarde** - sistema detecta automaticamente versão antiga
3. **Limpeza automática** - cache é limpo automaticamente
4. **Recarregamento** - app recarrega com versão nova

### Método 2: Manual via Console
1. **Abra o web app instalado**
2. **Abra Console** (se disponível no navegador)
3. **Cole o script** acima e pressione Enter
4. **Aguarde** - limpeza completa será executada
5. **Recarregamento** - app recarrega automaticamente

### Método 3: Desinstalar e Reinstalar
1. **Desinstale o web app** do dispositivo
2. **Acesse o site** no navegador
3. **Reinstale o web app** com a versão nova
4. **Teste** - deve funcionar normalmente

## Detecção Automática

O sistema detecta web apps antigos através de:

- ✅ **Service Workers Ativos**: Verifica se há SW antigos registrados
- ✅ **Caches Antigos**: Procura por caches com versões antigas
- ✅ **Dados Legacy**: Verifica localStorage/sessionStorage antigos
- ✅ **Modo Standalone**: Detecta se é web app instalado

## Benefícios da Solução

### ✅ **Detecção Automática**:
- Identifica web apps antigos automaticamente
- Executa limpeza sem intervenção do usuário
- Funciona em todos os dispositivos

### ✅ **Limpeza Completa**:
- Remove todos os service workers antigos
- Limpa todos os caches corrompidos
- Remove dados antigos do storage

### ✅ **Experiência do Usuário**:
- Interface clara durante limpeza
- Recarregamento automático
- Não requer conhecimento técnico

---

**Status**: ✅ **IMPLEMENTADO E ATIVO**

O sistema de detecção e limpeza automática está ativo. Web apps antigos serão detectados e limpos automaticamente na próxima abertura.
