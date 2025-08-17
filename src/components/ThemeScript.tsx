"use client";

import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    try {
      // Verifica se há uma preferência salva no localStorage
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme) {
        // Aplica o tema salvo
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // Detecta a preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        }
      }
      
      // Escuta mudanças na preferência do sistema
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch (e) {
      console.error('Erro ao aplicar tema:', e);
    }
  }, []);

  return null;
}
