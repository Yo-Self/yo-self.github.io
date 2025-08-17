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
          console.log('Tema escuro aplicado via localStorage');
        } else if (savedTheme === 'light') {
          // Aplica o tema claro
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          console.log('Tema claro aplicado via localStorage');
        } else {
          // Se não há preferência salva, detecta a preferência do sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            console.log('Tema escuro aplicado via preferência do sistema');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            console.log('Tema claro aplicado via preferência do sistema');
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
            console.log('Tema escuro aplicado via fallback');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            console.log('Tema claro aplicado via fallback');
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
          console.log('Tema escuro aplicado via mudança de preferência do sistema');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          console.log('Tema claro aplicado via mudança de preferência do sistema');
        }
      }
    };
    
    // Escuta mudanças no localStorage para sincronizar entre abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        if (e.newValue === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          console.log('Tema escuro aplicado via mudança no localStorage');
        } else if (e.newValue === 'light') {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          console.log('Tema claro aplicado via mudança no localStorage');
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
          console.log('Tema do sistema aplicado via mudança no localStorage');
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
