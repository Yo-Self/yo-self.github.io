import { useState, useEffect } from 'react';
import { useCurrentRoute } from './useCurrentRoute';

export function useSafariInstall() {
  const [isSafari, setIsSafari] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showSafariInstallPrompt, setShowSafariInstallPrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const { isRestaurantPage, restaurantName } = useCurrentRoute();

  useEffect(() => {
    // Detectar Safari
    const userAgent = navigator.userAgent;
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    
    setIsSafari(isSafariBrowser);
    setIsIOS(isIOSDevice);

    // Verificar se já está em modo standalone (já instalado)
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    
    // Verificar se já mostrou o prompt antes (usando localStorage)
    const hasShownBefore = localStorage.getItem('safari-install-prompt-shown') === 'true';
    
    // Mostrar prompt no Safari iOS se:
    // 1. É Safari iOS
    // 2. Não está em modo standalone
    // 3. Não mostrou o prompt antes
    // 4. Está em uma página de restaurante (opcional)
    if (isSafariBrowser && isIOSDevice && !isStandalone && !hasShownBefore) {
      // Aguardar um pouco para garantir que a página carregou
      const timer = setTimeout(() => {
        setShowSafariInstallPrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstallClick = () => {
    // Marcar que o prompt foi mostrado
    localStorage.setItem('safari-install-prompt-shown', 'true');
    setHasShownPrompt(true);
    setShowSafariInstallPrompt(false);
  };

  const dismissPrompt = () => {
    localStorage.setItem('safari-install-prompt-shown', 'true');
    setHasShownPrompt(true);
    setShowSafariInstallPrompt(false);
  };

  return {
    isSafari,
    isIOS,
    showSafariInstallPrompt: showSafariInstallPrompt && !hasShownPrompt,
    handleInstallClick,
    dismissPrompt,
    isRestaurantPage,
    restaurantName
  };
}
