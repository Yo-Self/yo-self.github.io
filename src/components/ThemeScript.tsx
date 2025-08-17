"use client";

import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    try {
      // Verifica se há uma preferência salva no localStorage
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme === 'dark') {
        // Aplica o tema escuro
        document.documentElement.classList.add('dark');
      } else if (savedTheme === 'light') {
        // Aplica o tema claro
        document.documentElement.classList.remove('dark');
      } else {
        // Se não há preferência salva, detecta a preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      // Escuta mudanças na preferência do sistema apenas quando não há tema salvo
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
      // Fallback: detecta preferência do sistema
      try {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        }
      } catch (fallbackError) {
        console.error('Erro no fallback de tema:', fallbackError);
      }
    }
  }, []);

  return null;
}
