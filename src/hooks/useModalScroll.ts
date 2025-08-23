import { useEffect } from 'react';

/**
 * Hook para controlar o scroll do body quando um modal está aberto
 * @param isOpen - Estado do modal (aberto/fechado)
 */
export function useModalScroll(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    // Salvar posição atual do scroll
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Adicionar classes para bloquear scroll apenas do body principal
    // Não bloquear completamente para permitir scroll interno nos modais
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    
    // Aplicar posição fixa para manter a posição do scroll
    // Mas permitir scroll interno nos modais
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;

    // Cleanup: restaurar scroll quando o modal fechar
    return () => {
      // Remover classes
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      
      // Limpar estilos inline
      document.body.style.top = '';
      document.body.style.left = '';
      
      // Restaurar posição do scroll
      window.scrollTo(scrollX, scrollY);
    };
  }, [isOpen]);
}
