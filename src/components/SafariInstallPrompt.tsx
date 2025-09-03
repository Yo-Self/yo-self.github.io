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
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4">
      {/* Overlay de fundo */}
      <div className="absolute inset-0 bg-black bg-opacity-20" onClick={dismissPrompt} />
      
      {/* Modal do tutorial */}
      <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-full max-w-sm max-h-[60vh] overflow-y-auto mb-8">
        {/* Botão de fechar no canto superior direito */}
        <button
          onClick={dismissPrompt}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-start space-x-3 pr-10">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
            <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
              {isRestaurantPage ? `Instalar ${restaurantName}` : 'Instalar App'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {isRestaurantPage 
                ? `Adicione ${restaurantName} à sua tela inicial`
                : 'Tenha uma melhor experiência com o nosso app'
              }
            </p>
            
            {/* Instruções específicas para Safari iOS */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-2">
                📱 Como instalar:
              </p>
              <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li className="flex items-start">
                  <span className="font-bold mr-1">1.</span>
                  <span>Toque no botão <span className="font-semibold">Compartilhar</span> 
                    <svg className="inline-block w-3 h-3 ml-1 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 50 50">
                      <path d="M30.3 13.7L25 8.4l-5.3 5.3-1.4-1.4L25 5.6l6.7 6.7z"/>
                      <path d="M24 7h2v21h-2z"/>
                      <path d="M35 40H15c-1.7 0-3-1.3-3-3V19c0-1.7 1.3-3 3-3h7v2h-7c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1h20c.6 0 1-.4 1-1V19c0-.6-.4-1-1-1h-7v-2h7c1.7 0 3 1.3 3 3v18c0 1.7-1.3 3-3 3z"/>
                    </svg>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-1">2.</span>
                  <span>Role e toque em <span className="font-semibold">&quot;Adicionar à Tela Inicial&quot;</span></span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-1">3.</span>
                  <span>Toque em <span className="font-semibold">&quot;Adicionar&quot;</span></span>
                </li>
              </ol>
            </div>
            
            <div className="flex items-center justify-center">
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors w-full"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
