'use client';

import React, { useState } from 'react';

export default function CacheCleaner() {
  const [isCleaning, setIsCleaning] = useState(false);
  const [isCleaned, setIsCleaned] = useState(false);

  const clearAllCaches = async () => {
    setIsCleaning(true);
    
    try {
      console.log('🧹 Iniciando limpeza completa de caches...');

      // 1. Desregistrar todos os service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`📱 Encontrados ${registrations.length} service workers`);
        
        for (const registration of registrations) {
          console.log('🗑️ Desregistrando service worker:', registration.scope);
          await registration.unregister();
        }
      }

      // 2. Limpar todos os caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`💾 Encontrados ${cacheNames.length} caches`);
        
        for (const cacheName of cacheNames) {
          console.log('🗑️ Deletando cache:', cacheName);
          await caches.delete(cacheName);
        }
      }

      // 3. Limpar localStorage e sessionStorage
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
            console.log('🗑️ Deletando IndexedDB:', db.name);
            await new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              deleteReq.onsuccess = () => resolve(true);
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }
        } catch (e) {
          console.log('❌ Erro ao limpar IndexedDB:', e);
        }
      }

      console.log('✨ Limpeza completa finalizada!');
      setIsCleaned(true);
      
      // Recarregar após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Erro durante limpeza:', error);
      setIsCleaning(false);
    }
  };

  if (isCleaned) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cache Limpo com Sucesso!
          </h2>
          <p className="text-gray-600 mb-4">
            Recarregando a página...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Problema de Cache Detectado
        </h1>
        <p className="text-gray-600 mb-6">
          Parece que há um problema com o cache do aplicativo. 
          Vamos limpar tudo e recarregar para resolver.
        </p>
        
        <button
          onClick={clearAllCaches}
          disabled={isCleaning}
          className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCleaning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto mb-2"></div>
              Limpando Cache...
            </>
          ) : (
            '🧹 Limpar Cache e Recarregar'
          )}
        </button>

        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium mt-3"
        >
          🏠 Ir para Página Inicial
        </button>
      </div>
    </div>
  );
}
