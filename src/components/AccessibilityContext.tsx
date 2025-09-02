"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: 'normal' | 'large' | 'extra-large';
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Carrega as preferências salvas no localStorage
  useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem('accessibility-font-size') as 'normal' | 'large' | 'extra-large';
      if (savedFontSize && ['normal', 'large', 'extra-large'].includes(savedFontSize)) {
        setFontSize(savedFontSize);
      }

      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.warn('Erro ao carregar preferências de acessibilidade:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Aplica as classes CSS baseado no tamanho da fonte
  useEffect(() => {
    if (!isInitialized) return;
    
    const root = document.documentElement;
    
    // Remove classes anteriores
    root.classList.remove('font-normal', 'font-large', 'font-extra-large');
    
    // Adiciona a classe atual
    root.classList.add(`font-${fontSize}`);
    
    // Salva no localStorage
    try {
      localStorage.setItem('accessibility-font-size', fontSize);
    } catch (error) {
      console.warn('Erro ao salvar tamanho da fonte:', error);
    }
  }, [fontSize, isInitialized]);

  // Aplica o tema - agora sincronizado com o ThemeScript
  useEffect(() => {
    if (!isInitialized) return;
    
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      updateMetaTagsForTheme(true);
      try {
        localStorage.setItem('theme', 'dark');
        // Dispara evento para sincronizar outras abas
        window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }));
      } catch (error) {
        console.warn('Erro ao salvar tema:', error);
      }
    } else if (theme === 'light') {
      root.classList.remove('dark');
      body.classList.remove('dark');
      updateMetaTagsForTheme(false);
      try {
        localStorage.setItem('theme', 'light');
        // Dispara evento para sincronizar outras abas
        window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'light' }));
      } catch (error) {
        console.warn('Erro ao salvar tema:', error);
      }
    } else {
      // system - remove a preferência salva e deixa o script no layout detectar
      try {
        localStorage.removeItem('theme');
        // Dispara evento para sincronizar outras abas
        window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: null }));
      } catch (error) {
        console.warn('Erro ao remover tema:', error);
      }
      
      // Aplica a preferência do sistema imediatamente
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        body.classList.add('dark');
        updateMetaTagsForTheme(true);
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        updateMetaTagsForTheme(false);
      }
    }
  }, [theme, isInitialized]);

  // Sincroniza com mudanças externas no tema
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        if (e.newValue === 'dark') {
          setThemeState('dark');
        } else if (e.newValue === 'light') {
          setThemeState('light');
        } else {
          setThemeState('system');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const increaseFontSize = () => {
    setFontSize(current => {
      if (current === 'normal') return 'large';
      if (current === 'large') return 'extra-large';
      return 'extra-large';
    });
  };

  const decreaseFontSize = () => {
    setFontSize(current => {
      if (current === 'extra-large') return 'large';
      if (current === 'large') return 'normal';
      return 'normal';
    });
  };

  const resetFontSize = () => {
    setFontSize('normal');
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <AccessibilityContext.Provider value={{
      fontSize,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
      theme,
      setTheme,
      toggleTheme,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
} 