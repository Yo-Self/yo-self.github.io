"use client";

import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    // Aguarda um pouco para garantir que o DOM esteja pronto
    const applyTheme = () => {
      try {
        // Verifica se há uma preferência salva no localStorage
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark') {
          // Aplica o tema escuro
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else if (savedTheme === 'light') {
          // Aplica o tema claro
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        } else {
          // Se não há preferência salva, detecta a preferência do sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
          }
        }
      } catch (e) {
        console.error('Erro ao aplicar tema:', e);
        // Fallback: detecta preferência do sistema
        try {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
          }
        } catch (fallbackError) {
          console.error('Erro no fallback de tema:', fallbackError);
        }
      }
    };

    // Aplica o tema imediatamente
    applyTheme();

    // Escuta mudanças na preferência do sistema apenas quando não há tema salvo
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }
      }
    };
    
    // Escuta mudanças no localStorage para sincronizar entre abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        if (e.newValue === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else if (e.newValue === 'light') {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        } else {
          // system - aplica preferência do sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
          }
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null;
}
