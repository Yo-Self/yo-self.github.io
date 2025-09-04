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
    // Inclui detecção para Android/Desktop (display-mode: standalone) e iOS (navigator.standalone)
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isWebAppMode = isStandalone || isIOSStandalone;
    
    // Verificar se já mostrou o prompt antes (usando localStorage)
    const hasShownBefore = typeof window !== 'undefined' ? localStorage.getItem('safari-install-prompt-shown') === 'true' : false;
    
    // Verificar se o tutorial dos destaques foi concluído
    const journalTutorialDone = typeof window !== 'undefined' ? localStorage.getItem('journalTutorialDone') === '1' : false;
    
    // Debug: verificar detecção
    console.log('useSafariInstall - Debug:', {
      isSafariBrowser,
      isIOSDevice,
      isStandalone,
      isIOSStandalone,
      isWebAppMode,
      hasShownBefore,
      journalTutorialDone
    });

    // Mostrar prompt no Safari iOS se:
    // 1. É Safari iOS
    // 2. NÃO está em modo webapp/standalone (já instalado)
    // 3. Não mostrou o prompt antes
    // 4. Tutorial dos destaques foi concluído
    if (isSafariBrowser && isIOSDevice && !isWebAppMode && !hasShownBefore && journalTutorialDone) {
      console.log('useSafariInstall - Mostrando prompt em 2 segundos (após tutorial dos destaques)');
      // Aguardar um pouco para garantir que a página carregou
      const timer = setTimeout(() => {
        setShowSafariInstallPrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Adicionar listener para mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const journalTutorialDone = typeof window !== 'undefined' ? localStorage.getItem('journalTutorialDone') === '1' : false;
      const hasShownBefore = typeof window !== 'undefined' ? localStorage.getItem('safari-install-prompt-shown') === 'true' : false;
      
      console.log('useSafariInstall - Storage change detected:', {
        journalTutorialDone,
        hasShownBefore
      });

      // Se o tutorial dos destaques foi concluído e ainda não mostrou o prompt de instalação
      if (journalTutorialDone && !hasShownBefore && !showSafariInstallPrompt) {
        const userAgent = navigator.userAgent;
        const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
        const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (window.navigator as any).standalone === true;
        const isWebAppMode = isStandalone || isIOSStandalone;

        if (isSafariBrowser && isIOSDevice && !isWebAppMode) {
          console.log('useSafariInstall - Tutorial dos destaques concluído, mostrando prompt de instalação em 2 segundos');
          const timer = setTimeout(() => {
            setShowSafariInstallPrompt(true);
          }, 2000);
          
          return () => clearTimeout(timer);
        }
      }
    };

    // Escutar mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Também verificar periodicamente (fallback para mudanças no mesmo tab)
    const interval = setInterval(() => {
      const journalTutorialDone = typeof window !== 'undefined' ? localStorage.getItem('journalTutorialDone') === '1' : false;
      const hasShownBefore = typeof window !== 'undefined' ? localStorage.getItem('safari-install-prompt-shown') === 'true' : false;
      
      if (journalTutorialDone && !hasShownBefore && !showSafariInstallPrompt) {
        const userAgent = navigator.userAgent;
        const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
        const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (window.navigator as any).standalone === true;
        const isWebAppMode = isStandalone || isIOSStandalone;

        if (isSafariBrowser && isIOSDevice && !isWebAppMode) {
          console.log('useSafariInstall - Tutorial dos destaques concluído (polling), mostrando prompt de instalação');
          setShowSafariInstallPrompt(true);
        }
      }
    }, 1000); // Verificar a cada segundo

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [showSafariInstallPrompt]);

  const handleInstallClick = () => {
    // Marcar que o prompt foi mostrado
    if (typeof window !== 'undefined') {
      localStorage.setItem('safari-install-prompt-shown', 'true');
    }
    setHasShownPrompt(true);
    setShowSafariInstallPrompt(false);
  };

  const dismissPrompt = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('safari-install-prompt-shown', 'true');
    }
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
