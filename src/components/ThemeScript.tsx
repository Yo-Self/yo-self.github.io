"use client";

import { useEffect } from 'react';

export default function ThemeScript() {
  // Função para atualizar meta tags baseado no tema
  const updateMetaTagsForTheme = (isDark: boolean) => {
    const themeColor = isDark ? '#000000' : '#ffffff';
    const statusBarStyle = isDark ? 'black-translucent' : 'default';
    
    // Atualizar theme-color
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (themeColorMeta) {
      themeColorMeta.content = themeColor;
    } else {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      themeColorMeta.content = themeColor;
      document.head.appendChild(themeColorMeta);
    }
    
    // Atualizar apple-mobile-web-app-status-bar-style
    let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (statusBarMeta) {
      statusBarMeta.content = statusBarStyle;
    } else {
      statusBarMeta = document.createElement('meta');
      statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
      statusBarMeta.content = statusBarStyle;
      document.head.appendChild(statusBarMeta);
    }
    
    // Atualizar msapplication-TileColor
    let tileColorMeta = document.querySelector('meta[name="msapplication-TileColor"]') as HTMLMetaElement;
    if (tileColorMeta) {
      tileColorMeta.content = themeColor;
    } else {
      tileColorMeta = document.createElement('meta');
      tileColorMeta.name = 'msapplication-TileColor';
      tileColorMeta.content = themeColor;
      document.head.appendChild(tileColorMeta);
    }
  };

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
          updateMetaTagsForTheme(true);
        } else if (savedTheme === 'light') {
          // Aplica o tema claro
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          updateMetaTagsForTheme(false);
        } else {
          // Se não há preferência salva, detecta a preferência do sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            updateMetaTagsForTheme(true);
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            updateMetaTagsForTheme(false);
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
            updateMetaTagsForTheme(true);
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            updateMetaTagsForTheme(false);
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
          updateMetaTagsForTheme(true);
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          updateMetaTagsForTheme(false);
        }
      }
    };
    
    // Escuta mudanças no localStorage para sincronizar entre abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        if (e.newValue === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          updateMetaTagsForTheme(true);
        } else if (e.newValue === 'light') {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          updateMetaTagsForTheme(false);
        } else {
          // system - aplica preferência do sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            updateMetaTagsForTheme(true);
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            updateMetaTagsForTheme(false);
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
