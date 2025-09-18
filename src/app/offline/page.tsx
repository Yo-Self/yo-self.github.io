'use client';

import { useEffect, useState } from 'react';
import { useOfflineState } from '@/hooks/useOfflineState';

export default function OfflinePage() {
  const { lastRestaurantUrl, lastRestaurantName, clearOfflineState } = useOfflineState();
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Auto-reload when connection is restored
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada, redirecionando...');
      setIsReconnecting(true);
      
      // Limpar estado offline
      clearOfflineState();
      
      // Redirecionar para o restaurante salvo ou home
      setTimeout(() => {
        if (lastRestaurantUrl) {
          console.log('🏪 Redirecionando para restaurante:', lastRestaurantName);
          window.location.href = lastRestaurantUrl;
        } else {
          console.log('🏠 Redirecionando para home');
          window.location.href = '/';
        }
      }, 1000);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [lastRestaurantUrl, lastRestaurantName, clearOfflineState]);

  const handleReload = () => {
    setIsReconnecting(true);
    
    // Tentar recarregar a página atual primeiro
    if (lastRestaurantUrl) {
      window.location.href = lastRestaurantUrl;
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    clearOfflineState();
    window.location.href = '/';
  };

  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reconectando...
          </h1>
          <p className="text-gray-600 mb-6">
            {lastRestaurantName 
              ? `Redirecionando para ${lastRestaurantName}...`
              : 'Restaurando conexão...'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Sem conexão com a internet
        </h1>
        
        <p className="text-gray-600 mb-6">
          Verifique sua conexão e tente novamente.
        </p>

        {lastRestaurantName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Restaurante salvo:</strong> {lastRestaurantName}
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Você será redirecionado automaticamente quando a conexão voltar.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleReload}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {lastRestaurantName ? `🔄 Voltar para ${lastRestaurantName}` : '🔄 Tentar novamente'}
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            🏠 Ir para Página Inicial
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>💡 Dica: Mantenha esta página aberta para reconexão automática</p>
        </div>
      </div>
    </div>
  );
}
