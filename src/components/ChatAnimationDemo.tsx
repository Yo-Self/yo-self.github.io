"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function ChatAnimationDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Efeito de entrada animada
  useEffect(() => {
    if (isOpen) {
      // Iniciar animação
      setAnimationStarted(true);
      setIsEntering(true);
      
      // Aplicar animação de entrada após um pequeno delay
      setTimeout(() => {
        setIsEntering(false);
      }, 800);
    } else {
      // Resetar estados quando fechar
      setAnimationStarted(false);
      setIsEntering(false);
    }
  }, [isOpen]);

  const getButtonPosition = () => {
    if (!buttonRef?.current) return { x: 0, y: 0 };
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    return { x: centerX, y: centerY };
  };

  const buttonPos = getButtonPosition();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          🎭 Teste das Animações do Chat
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
          Clique no botão abaixo para ver o chat abrir com uma animação suave que parte do botão.
        </p>

        {/* Botão de demonstração */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen ? 'ring-4 ring-cyan-300 ring-opacity-50' : ''
          }`}
        >
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          {isOpen ? 'Clique para fechar' : 'Clique para abrir'}
        </p>

        {/* Chat de demonstração */}
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center backdrop-blur-sm transition-all duration-800 chat-backdrop bg-black/50">
            <div 
              ref={chatRef}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl flex flex-col h-[80vh] max-h-[600px] transform-gpu chat-transition animate-chat-open"
              style={{
                transformOrigin: `${buttonPos.x}px ${buttonPos.y}px`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Chat Demo
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Animações suaves
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Fechar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    ✨ Animações Funcionando!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Observe como o chat aparece suavemente a partir do botão.
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
