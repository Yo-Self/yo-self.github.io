'use client';

import { useState } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useStandaloneMode } from '@/hooks/useStandaloneMode';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';

export default function InstallPrompt() {
  const { showInstallPrompt, installApp, isInstalled, currentRoute } = useServiceWorker();
  const { isStandalone } = useStandaloneMode();
  const { currentRoute: route, isRestaurantPage, restaurantName, pageTitle } = useCurrentRoute();
  const [isVisible, setIsVisible] = useState(true);

  if (isInstalled || isStandalone || !showInstallPrompt || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
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
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isRestaurantPage ? `Instalar ${restaurantName}` : 'Instalar App'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRestaurantPage 
                ? `Adicione ${restaurantName} ao seu dispositivo`
                : 'Adicione ao seu dispositivo para uma melhor experiência'
              }
            </p>
            {isRestaurantPage && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Salvará: {restaurantName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={installApp}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Instalar
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
