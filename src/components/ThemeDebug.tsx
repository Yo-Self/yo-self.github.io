"use client";

import React, { useEffect, useState } from 'react';

export default function ThemeDebug() {
  const [currentTheme, setCurrentTheme] = useState<string>('unknown');
  const [htmlClasses, setHtmlClasses] = useState<string>('');
  const [bodyClasses, setBodyClasses] = useState<string>('');
  const [localStorageTheme, setLocalStorageTheme] = useState<string>('unknown');
  const [prefersDark, setPrefersDark] = useState<boolean>(false);

  useEffect(() => {
    const updateThemeInfo = () => {
      const html = document.documentElement;
      const body = document.body;
      
      setHtmlClasses(html.className);
      setBodyClasses(body.className);
      
      if (html.classList.contains('dark')) {
        setCurrentTheme('dark');
      } else {
        setCurrentTheme('light');
      }

      // Verificar localStorage de forma segura
      try {
        const theme = localStorage.getItem('theme');
        setLocalStorageTheme(theme || 'null');
      } catch (error) {
        setLocalStorageTheme('error');
      }

      // Verificar preferência do sistema
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setPrefersDark(mediaQuery.matches);
      } catch (error) {
        setPrefersDark(false);
      }
    };

    // Atualiza imediatamente
    updateThemeInfo();

    // Observa mudanças nas classes
    const observer = new MutationObserver(updateThemeInfo);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Atualiza a cada segundo para debug
    const interval = setInterval(updateThemeInfo, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Só mostra em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg z-50 max-w-xs">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Debug do Tema</h3>
      <div className="text-xs space-y-1">
        <div className="text-gray-700 dark:text-gray-300">
          <strong>Tema atual:</strong> {currentTheme}
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          <strong>HTML classes:</strong> {htmlClasses}
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          <strong>Body classes:</strong> {bodyClasses}
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          <strong>localStorage theme:</strong> {localStorageTheme}
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          <strong>Prefers dark:</strong> {prefersDark ? 'true' : 'false'}
        </div>
      </div>
    </div>
  );
}
