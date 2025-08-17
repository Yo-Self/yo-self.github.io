"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAccessibility } from "./AccessibilityContext";

export default function AccessibilityButton() {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize, theme, setTheme } = useAccessibility();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleDecreaseFont = () => {
    decreaseFontSize();
    // Não fecha o menu automaticamente para melhor UX
  };

  const handleIncreaseFont = () => {
    increaseFontSize();
    // Não fecha o menu automaticamente para melhor UX
  };

  const handleResetFont = () => {
    resetFontSize();
    // Não fecha o menu automaticamente para melhor UX
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // Não fecha o menu automaticamente para melhor UX
  };

  const getCurrentFontSizeLabel = () => {
    switch (fontSize) {
      case 'normal': return 'Normal';
      case 'large': return 'Grande';
      case 'extra-large': return 'Extra Grande';
      default: return 'Normal';
    }
  };

  const getCurrentThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      case 'system': return 'Sistema';
      default: return 'Sistema';
    }
  };

  return (
    <div className="relative">
      {/* Botão principal */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleMenuToggle}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 shadow-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
        aria-label="Configurações de acessibilidade"
        title="Configurações de acessibilidade"
        aria-expanded={showMenu}
      >
        <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">
          <span className="text-xs">a</span>
          <span className="text-sm">A</span>
        </div>
      </button>

      {/* Menu dropdown */}
      {showMenu && (
        <div 
          ref={menuRef}
          className="accessibility-menu fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 min-w-[280px] max-w-[320px] transform transition-all duration-200 ease-out animate-fade-in-0 animate-zoom-in-95"
          style={{
            zIndex: 999999999,
            position: 'fixed',
            top: '80px',
            left: '16px',
            right: '16px',
            maxWidth: 'calc(100vw - 32px)'
          }}
        >
          {/* Cabeçalho do menu */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Acessibilidade
            </h3>
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label="Fechar menu"
              style={{
                visibility: 'visible',
                opacity: 1,
                display: 'block',
                pointerEvents: 'auto',
                zIndex: 999999999,
                background: 'transparent',
                border: 'none',
                padding: '0',
                margin: '0',
                width: '24px',
                height: '24px'
              }}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{
                  visibility: 'visible',
                  opacity: 1,
                  display: 'block',
                  width: '24px',
                  height: '24px',
                  color: '#9ca3af'
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Seção de tamanho da fonte */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Tamanho da fonte
            </h4>
            
            {/* Botões em linha horizontal */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={handleDecreaseFont}
                disabled={fontSize === 'normal'}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${
                  fontSize === 'normal'
                    ? 'bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md active:bg-gray-200 dark:active:bg-gray-500'
                }`}
                aria-label="Diminuir tamanho da fonte"
              >
                <span className="text-xs">Diminuir</span>
              </button>
              
              <button
                type="button"
                onClick={handleIncreaseFont}
                disabled={fontSize === 'extra-large'}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${
                  fontSize === 'extra-large'
                    ? 'bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md active:bg-gray-200 dark:active:bg-gray-500'
                }`}
                aria-label="Aumentar tamanho da fonte"
              >
                <span className="text-xs">Aumentar</span>
              </button>
              
              <button
                type="button"
                onClick={handleResetFont}
                className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 hover:shadow-md active:bg-gray-200 dark:active:bg-gray-500"
                aria-label="Restaurar tamanho padrão da fonte"
              >
                <span className="text-xs">Padrão</span>
              </button>
            </div>

            {/* Indicador de tamanho atual */}
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="text-xs text-blue-700 dark:text-blue-300 font-medium text-center">
                Tamanho atual: <span className="font-semibold">{getCurrentFontSizeLabel()}</span>
              </div>
            </div>
          </div>

          {/* Seção de tema */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Tema
            </h4>
            
            {/* Botões em linha horizontal */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${
                  theme === 'light'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md active:bg-gray-200 dark:active:bg-gray-500'
                }`}
                aria-label="Aplicar tema claro"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500"></div>
                  <span className="text-xs">Claro</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${
                  theme === 'dark'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md active:bg-gray-200 dark:active:bg-gray-500'
                }`}
                aria-label="Aplicar tema escuro"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600"></div>
                  <span className="text-xs">Escuro</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${
                  theme === 'system'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md active:bg-gray-200 dark:active:bg-gray-500'
                }`}
                aria-label="Usar preferência do sistema"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-gray-700 border border-gray-400"></div>
                  <span className="text-xs">Sistema</span>
                </div>
              </button>
            </div>

            {/* Indicador de tema atual */}
            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium text-center">
                Tema atual: <span className="font-semibold">{getCurrentThemeLabel()}</span>
              </div>
            </div>
          </div>


        </div>
      )}
    </div>
  );
} 