"use client";

import React, { useState } from "react";
import { useAccessibility } from "./AccessibilityContext";

export default function AccessibilityButton() {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize, theme, setTheme } = useAccessibility();
  const [showMenu, setShowMenu] = useState(false);

  const getIcon = () => {
    // Ícone "aA" para acessibilidade de fonte
    return (
      <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">
        <span className="text-xs">a</span>
        <span className="text-sm">A</span>
      </div>
    );
  };

  const getButtonColor = () => {
    switch (fontSize) {
      case 'large':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'extra-large':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'light':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center justify-center w-8 h-8 rounded-full ${getButtonColor()} transition-colors duration-200 shadow-lg text-white`}
        aria-label="Configurações de acessibilidade"
        title="Configurações de acessibilidade"
      >
        {getIcon()}
      </button>

      {showMenu && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50 min-w-[200px]">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Tamanho da fonte
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  decreaseFontSize();
                  setShowMenu(false);
                }}
                disabled={fontSize === 'normal'}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  fontSize === 'normal'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Diminuir fonte
              </button>
              
              <button
                onClick={() => {
                  increaseFontSize();
                  setShowMenu(false);
                }}
                disabled={fontSize === 'extra-large'}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  fontSize === 'extra-large'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Aumentar fonte
              </button>
              
              <button
                onClick={() => {
                  resetFontSize();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Tamanho padrão
              </button>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tamanho atual: {fontSize === 'normal' ? 'Normal' : fontSize === 'large' ? 'Grande' : 'Extra Grande'}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Tema
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setTheme('light');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    theme === 'light'
                      ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Claro
                </button>
                
                <button
                  onClick={() => {
                    setTheme('dark');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Escuro
                </button>
                
                <button
                  onClick={() => {
                    setTheme('system');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    theme === 'system'
                      ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Sistema
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar o menu ao clicar fora */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
} 