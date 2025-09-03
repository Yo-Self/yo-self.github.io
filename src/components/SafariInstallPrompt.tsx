'use client';

import { useSafariInstall } from '@/hooks/useSafariInstall';

export default function SafariInstallPrompt() {
  const { 
    showSafariInstallPrompt, 
    handleInstallClick, 
    dismissPrompt, 
    isRestaurantPage, 
    restaurantName 
  } = useSafariInstall();

  if (!showSafariInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-[200] relative" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom) + 1rem)' }}>
      {/* Botão de fechar no canto superior direito */}
      <button
        onClick={dismissPrompt}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex items-start space-x-3 pr-8">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {isRestaurantPage ? `Instalar ${restaurantName}` : 'Instalar App'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {isRestaurantPage 
              ? `Adicione ${restaurantName} à sua tela inicial`
              : 'Adicione este app à sua tela inicial'
            }
          </p>
          
          {/* Instruções específicas para Safari iOS */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-2">
              Como instalar:
            </p>
            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>1. Toque no botão <span className="font-semibold">Compartilhar</span> <span className="inline-block w-4 h-4 bg-gray-400 rounded ml-1"></span></li>
              <li>2. Role para baixo e toque em <span className="font-semibold">&quot;Adicionar à Tela Inicial&quot;</span></li>
              <li>3. Toque em <span className="font-semibold">&quot;Adicionar&quot;</span></li>
            </ol>
          </div>
          
          <div className="flex items-center justify-start mt-3">
            <button
              onClick={handleInstallClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
