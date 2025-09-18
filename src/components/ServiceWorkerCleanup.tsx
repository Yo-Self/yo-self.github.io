'use client';

import { useEffect } from 'react';

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    // Script agressivo para limpar service workers antigos
    const aggressiveCleanup = async () => {
      console.log('🧹 Iniciando limpeza agressiva de service workers...');

      try {
        // 1. Desregistrar TODOS os service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log(`📱 Encontrados ${registrations.length} service workers para limpar`);
          
          for (const registration of registrations) {
            console.log('🗑️ Desregistrando service worker:', registration.scope);
            await registration.unregister();
          }
        }

        // 2. Limpar TODOS os caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log(`💾 Encontrados ${cacheNames.length} caches para limpar`);
          
          for (const cacheName of cacheNames) {
            console.log('🗑️ Deletando cache:', cacheName);
            await caches.delete(cacheName);
          }
        }

        // 3. Limpar storage
        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log('✅ Storage limpo');
        } catch (e) {
          console.log('❌ Erro ao limpar storage:', e);
        }

        // 4. Limpar IndexedDB
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            for (const db of databases) {
              if (db.name) {
                console.log('🗑️ Deletando IndexedDB:', db.name);
                await new Promise((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve(true);
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            }
          } catch (e) {
            console.log('❌ Erro ao limpar IndexedDB:', e);
          }
        }

        // 5. Forçar reload após limpeza
        console.log('✨ Limpeza completa! Recarregando em 2 segundos...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error) {
        console.error('❌ Erro durante limpeza agressiva:', error);
        // Mesmo com erro, tentar reload
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    };

    // Executar limpeza imediatamente
    aggressiveCleanup();
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Limpando Cache Antigo
        </h1>
        <p className="text-gray-600 mb-6">
          Detectamos uma versão antiga do web app. Estamos limpando o cache para resolver problemas de compatibilidade.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ Não feche esta página!</strong>
          </p>
          <p className="text-yellow-600 text-xs mt-1">
            A página será recarregada automaticamente em alguns segundos.
          </p>
        </div>
      </div>
    </div>
  );
}
