import { useEffect, useRef, useState } from 'react';

export function useCardVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkVisibility = () => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const cardTop = rect.top;
      const cardBottom = rect.bottom;
      const viewportHeight = window.innerHeight;
      
      // Card deve estar completamente visível na viewport
      // Margem de segurança de 20px para evitar cards cortados
      const threshold = 20;
      const isFullyVisible = cardTop >= 0 && cardBottom <= (viewportHeight - threshold);
      
      setIsVisible(isFullyVisible);
    };

    // Verificação inicial
    checkVisibility();
    
    // Verificar na mudança de tamanho da janela
    const handleResize = () => {
      checkVisibility();
    };
    
    // Verificar no scroll
    const handleScroll = () => {
      checkVisibility();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { cardRef, isVisible };
}
