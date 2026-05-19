// Script para limpar completamente caches e service workers
// Execute este script no console do navegador para limpar tudo

console.log('🧹 Iniciando limpeza completa de caches e service workers...');

// 1. Desregistrar todos os service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`📱 Encontrados ${registrations.length} service workers`);
    
    registrations.forEach(registration => {
      console.log('🗑️ Desregistrando service worker:', registration.scope);
      registration.unregister().then(success => {
        console.log(success ? '✅ Desregistrado com sucesso' : '❌ Falha ao desregistrar');
      });
    });
  });
}

// 2. Limpar todos os caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log(`💾 Encontrados ${cacheNames.length} caches`);
    
    cacheNames.forEach(cacheName => {
      console.log('🗑️ Deletando cache:', cacheName);
      caches.delete(cacheName).then(success => {
        console.log(success ? '✅ Cache deletado com sucesso' : '❌ Falha ao deletar cache');
      });
    });
  });
}

// 3. Limpar localStorage e sessionStorage
try {
  localStorage.clear();
  console.log('✅ localStorage limpo');
} catch (e) {
  console.log('❌ Erro ao limpar localStorage:', e);
}

try {
  sessionStorage.clear();
  console.log('✅ sessionStorage limpo');
} catch (e) {
  console.log('❌ Erro ao limpar sessionStorage:', e);
}

// 4. Limpar IndexedDB (se existir)
if ('indexedDB' in window) {
  try {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        console.log('🗑️ Deletando IndexedDB:', db.name);
        indexedDB.deleteDatabase(db.name);
      });
    });
  } catch (e) {
    console.log('❌ Erro ao limpar IndexedDB:', e);
  }
}

// 5. Recarregar a página após 2 segundos
setTimeout(() => {
  console.log('🔄 Recarregando página...');
  window.location.reload();
}, 2000);

console.log('✨ Limpeza completa iniciada! A página será recarregada em 2 segundos.');
