import React, { useState, useEffect } from 'react';

interface VoiceNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function VoiceNotification({ isVisible, onClose }: VoiceNotificationProps) {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Verificar se o navegador suporta speech synthesis
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setIsSupported(supported);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 mx-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isSupported ? (
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isSupported ? 'Funcionalidade de Voz Ativada!' : 'Funcionalidade de Voz Não Suportada'}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {isSupported ? (
                <>
                  Agora você pode ativar a leitura automática das respostas do chatbot. 
                  As mensagens serão lidas em voz alta automaticamente quando você receber uma resposta.
                </>
              ) : (
                <>
                  Seu navegador não suporta a funcionalidade de síntese de fala. 
                  Para usar esta funcionalidade, atualize para um navegador mais recente.
                </>
              )}
            </p>
            
            {isSupported && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Como usar:
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Clique no botão 🔊 no header para ativar/desativar</li>
                  <li>• Use o botão de configurações para escolher a voz</li>
                  <li>• Clique no ícone 🔊 nas mensagens para reler</li>
                  <li>• A leitura é automática quando ativada</li>
                </ul>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors text-sm font-medium"
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
