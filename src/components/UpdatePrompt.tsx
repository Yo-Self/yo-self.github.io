'use client';

import React from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

export default function UpdatePrompt() {
  const { showUpdatePrompt, updateApp, dismissUpdate } = useServiceWorker();

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 md:left-auto md:right-4 md:w-80">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">
            Nova versão disponível
          </h3>
          <p className="text-sm text-gray-500">
            Uma nova versão do app está disponível. Atualize para a versão mais recente.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={updateApp}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Atualizar
            </button>
            <button
              onClick={dismissUpdate}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Mais tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}