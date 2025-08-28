'use client';

import { useState } from 'react';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';

export default function InstallInstructions() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const { isRestaurantPage, restaurantName } = useCurrentRoute();

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    }
    return 'desktop';
  };

  const showInstructions = () => {
    setPlatform(detectPlatform());
    setIsVisible(true);
  };

  const getInstructions = () => {
    const appName = isRestaurantPage && restaurantName ? restaurantName : 'Restaurant App';
    
    switch (platform) {
      case 'ios':
        return {
          title: `Instalar ${appName} no iPhone/iPad`,
          steps: [
            'Toque no botão de compartilhar (quadrado com seta para cima)',
            'Role para baixo e toque em "Adicionar à Tela Inicial"',
            'Toque em "Adicionar" para confirmar'
          ]
        };
      case 'android':
        return {
          title: `Instalar ${appName} no Android`,
          steps: [
            'Toque no menu (três pontos) no canto superior direito',
            'Selecione "Adicionar à tela inicial" ou "Instalar app"',
            'Toque em "Adicionar" para confirmar'
          ]
        };
      default:
        return {
          title: `Instalar ${appName} no Computador`,
          steps: [
            'No Chrome, clique no ícone de instalação na barra de endereços',
            'Ou use Ctrl+Shift+I (Cmd+Shift+I no Mac) e clique em "Install"',
            'Clique em "Install" para confirmar'
          ]
        };
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={showInstructions}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title={isRestaurantPage ? `Como instalar ${restaurantName}` : 'Como instalar o app'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {instructions.title}
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3">
          {instructions.steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {step}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsVisible(false)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
