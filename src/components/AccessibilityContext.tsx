"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: 'normal' | 'large' | 'extra-large';
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');

  // Carrega a preferência salva no localStorage
  useEffect(() => {
    const savedFontSize = localStorage.getItem('accessibility-font-size') as 'normal' | 'large' | 'extra-large';
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
  }, []);

  // Aplica as classes CSS baseado no tamanho da fonte
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove classes anteriores
    root.classList.remove('font-normal', 'font-large', 'font-extra-large');
    
    // Adiciona a classe atual
    root.classList.add(`font-${fontSize}`);
    
    // Salva no localStorage
    localStorage.setItem('accessibility-font-size', fontSize);
  }, [fontSize]);

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

  return (
    <AccessibilityContext.Provider value={{
      fontSize,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
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