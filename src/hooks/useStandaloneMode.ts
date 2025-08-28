import { useState, useEffect } from 'react';

export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detectar se está em modo standalone
    const checkStandalone = () => {
      // Verificar se está em modo standalone
      const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      
      // Verificar se está em modo fullscreen (iOS)
      const fullscreen = (window.navigator as any).standalone === true;
      
      setIsStandalone(standalone || fullscreen);
    };

    // Detectar plataforma
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
      setIsAndroid(/android/.test(userAgent));
    };

    checkStandalone();
    detectPlatform();

    // Adicionar listener para mudanças no modo de exibição
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      checkStandalone();
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    isStandalone,
    isIOS,
    isAndroid,
    platform: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
  };
}
