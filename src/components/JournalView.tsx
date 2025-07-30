import React, { useState, useRef, useEffect } from "react";
import { Restaurant, Dish } from "./data";
import CardJornal from "./CardJornal";
import DishModal from "./DishModal";
import { AnimatePresence, motion } from "framer-motion";

interface JournalViewProps {
  open: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

export default function JournalView({ open, onClose, restaurant }: JournalViewProps) {
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(6); // Inicial com 6, será calculado dinamicamente
  const itemsPerPage = 3;
  const categories = Array.from(new Set(restaurant.menu_items.map(item => item.category)));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Calcular quantos cards cabem na tela
  useEffect(() => {
    const calculateCardsPerPage = () => {
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      
      // Altura disponível para os cards (subtraindo header, padding, etc.)
      const availableHeight = screenHeight - 80; // Reduzido para mobile para aproveitar mais espaço
      
      // Tamanho estimado de cada card (incluindo gap) - mais compacto para mobile
      let cardHeight;
      if (screenWidth < 768) {
        cardHeight = 160; // Mobile - mais compacto para caber mais cards
      } else if (screenWidth < 1024) {
        cardHeight = 180; // Tablet
      } else {
        cardHeight = 160; // Desktop - mantém o tamanho atual
      }
      
      // Calcular quantas linhas e colunas cabem com breakpoints mais específicos
      const rows = Math.floor(availableHeight / cardHeight);
      
      // Breakpoints mais específicos para diferentes tamanhos de tela
      let cols;
      if (screenWidth < 640) { // Mobile
        cols = 2;
      } else if (screenWidth < 768) { // Tablet pequeno
        cols = 2;
      } else if (screenWidth < 1024) { // Tablet
        cols = 3;
      } else if (screenWidth < 1280) { // Desktop pequeno
        cols = 2;
      } else if (screenWidth < 1536) { // Desktop médio
        cols = 3;
      } else { // Desktop grande
        cols = 4;
      }
      
      const calculatedCards = rows * cols;
      setCardsPerPage(calculatedCards); // Remove o limite mínimo, mostra quantos couberem
    };
    
    calculateCardsPerPage();
    window.addEventListener('resize', calculateCardsPerPage);
    
    return () => window.removeEventListener('resize', calculateCardsPerPage);
  }, []);

  // Agrupa pratos por categoria para navegação
  let grouped: { category: string; items: Dish[] }[] = [];
  if (selectedCategory === 'all') {
    // Agrupar todos por categoria
    const catMap: { [cat: string]: Dish[] } = {};
    restaurant.menu_items.forEach(item => {
      if (!catMap[item.category]) catMap[item.category] = [];
      catMap[item.category].push(item);
    });
    grouped = Object.entries(catMap).map(([category, items]) => ({ category, items }));
  } else {
    grouped = [
      {
        category: selectedCategory,
        items: restaurant.menu_items.filter(item => item.category === selectedCategory),
      },
    ];
  }
  // Lógica: cada página contém até cardsPerPage pratos de uma categoria
  let pages: Array<Array<{ dish: Dish; category: string }>> = [];
  if (selectedCategory === 'all') {
    grouped.forEach(group => {
      // Dividir os pratos da categoria em páginas de cardsPerPage
      for (let i = 0; i < group.items.length; i += cardsPerPage) {
        pages.push(group.items.slice(i, i + cardsPerPage).map(dish => ({ dish, category: group.category })));
      }
    });
  } else {
    // Dividir os pratos da categoria selecionada em páginas de cardsPerPage
    for (let i = 0; i < grouped[0].items.length; i += cardsPerPage) {
      pages.push(grouped[0].items.slice(i, i + cardsPerPage).map(dish => ({ dish, category: grouped[0].category })));
    }
  }
  const totalPages = pages.length;

  // Remover este efeito:
  // useEffect(() => {
  //   if (grouped.length > 0) {
  //     const firstDish = grouped[page * itemsPerPage];
  //     if (firstDish && firstDish.category !== selectedCategory) {
  //       setSelectedCategory(firstDish.category);
  //     }
  //   }
  // }, [page]);

  // Atualiza página ao trocar categoria
  useEffect(() => {
    setPage(0);
  }, [selectedCategory, open]);

  // Swipe handlers
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 50) {
      let newDirection: 'next' | 'prev' | null = null;
      if (distance > 0 && page < totalPages - 1) {
        newDirection = 'next';
        setFlipDirection('next');
        setPage(prev => prev + 1);
      } else if (distance < 0 && page > 0) {
        newDirection = 'prev';
        setFlipDirection('prev');
        setPage(prev => prev - 1);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Travar scroll do body ao abrir o modal
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Entrar em fullscreen automaticamente
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen().catch(() => {});
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen().catch(() => {});
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Sair do fullscreen automaticamente
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen().catch(() => {});
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen().catch(() => {});
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Garantir que saia do fullscreen ao desmontar o componente
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen().catch(() => {});
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen().catch(() => {});
      }
    };
  }, [open]);

  // --- NOVA LÓGICA DE INDICADOR DE CATEGORIA ---
  // Lista de categorias únicas na ordem de exibição
  const categoryList = grouped.map(g => g.category);

  // Para cada página, descobrir a qual categoria ela pertence
  let pageToCategoryIdx: number[] = [];
  if (selectedCategory === 'all') {
    let catIdx = 0;
    grouped.forEach(group => {
      const nPages = Math.ceil(group.items.length / cardsPerPage);
      for (let i = 0; i < nPages; i++) {
        pageToCategoryIdx.push(catIdx);
      }
      catIdx++;
    });
  } else {
    const nPages = Math.ceil(grouped[0].items.length / cardsPerPage);
    for (let i = 0; i < nPages; i++) {
      pageToCategoryIdx.push(0);
    }
  }
  // Índice da categoria atual
  const currentCategoryIdx = pageToCategoryIdx[page] || 0;
  const currentCategory = categoryList[currentCategoryIdx];

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white dark:bg-gray-900 animate-fade-in-fast select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Áreas clicáveis para avançar/retroceder página */}
      <button
        className="fixed left-0 top-0 h-full w-1/8 z-10 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Retroceder"
        onClick={() => {
          if (page > 0) {
            setFlipDirection('prev');
            setPage(prev => prev - 1);
          }
        }}
        tabIndex={-1}
      />
      <button
        className="fixed right-0 top-0 h-full w-1/8 z-10 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Avançar"
        onClick={() => {
          if (page < totalPages - 1) {
            setFlipDirection('next');
            setPage(prev => prev + 1);
          }
        }}
        tabIndex={-1}
      />
      {/* Indicador de categoria no topo + botão de fechar alinhados */}
      <div className="flex flex-row items-center w-full justify-between z-30 gap-0 mt-1 mb-1 px-4" style={{maxWidth: 600, margin: '0 auto'}}>
        <div className="flex gap-2 flex-1 justify-center min-w-0 overflow-x-auto items-center" style={{maxWidth: 'calc(100vw - 64px)'}}>
          {categoryList.map((cat, idx) => (
            idx === currentCategoryIdx ? (
              <span
                key={cat}
                className="text-sm font-semibold text-primary dark:text-cyan-400 text-center leading-tight flex items-center justify-center bg-primary/10 border border-primary/30 dark:border-cyan-700 px-3 h-7 rounded-full shadow-sm truncate overflow-hidden whitespace-nowrap"
                style={{
                  maxWidth: 120,
                  wordBreak: 'break-word',
                  display: 'inline-flex',
                  minHeight: 8
                }}
              >
                {cat}
              </span>
            ) : (
              <button
                key={cat}
                className="h-7 px-3 rounded-full bg-gray-200 dark:bg-gray-700 scale-100 transition-all duration-200 flex-shrink-0 border border-gray-300 dark:border-gray-600"
                style={{minWidth: 32, maxWidth: 64, display: 'inline-block'}}
                onClick={() => {
                  // Navegar para a primeira página da categoria clicada
                  const catIdx = categoryList.indexOf(cat);
                  const targetPage = pageToCategoryIdx.findIndex(idx => idx === catIdx);
                  if (targetPage !== -1) setPage(targetPage);
                }}
                aria-label={`Ir para categoria ${cat}`}
              />
            )
          ))}
        </div>
        {/* Botão de fechar */}
        <div className="flex flex-row items-center gap-0">
          <button
            className="w-10 h-10 flex items-center justify-center z-40 bg-transparent border-none shadow-none p-0 m-0 flex-shrink-0"
            onClick={onClose}
            aria-label="Fechar jornal"
            style={{ background: 'none', border: 'none', boxShadow: 'none' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>
      {/* Cards de pratos em grid */}
      <div className="flex flex-col items-center w-full flex-1 relative px-4 md:px-8 max-w-screen-md mx-auto" style={{perspective: 1200}}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page + '-' + selectedCategory}
            initial={{
              x: flipDirection === 'next' ? 300 : -300,
              opacity: 0.7,
            }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.08, ease: [0.77,0,0.175,1] }
            }}
            exit={{
              x: flipDirection === 'next' ? -300 : 300,
              opacity: 0.7,
              transition: { duration: 0.08, ease: [0.77,0,0.175,1] }
            }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'flex',
              flexDirection: 'row', // Always row for grid
              alignItems: 'flex-start',
              justifyContent: 'center',
              willChange: 'transform',
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 w-full max-w-7xl mx-auto px-2 md:px-4">
              {pages[page]?.map((item, idx) => (
                <div key={item.dish.name + '-' + item.category} className="flex justify-center items-center">
                  <div className="w-full max-w-xs">
                    <CardJornal dish={item.dish} size="small" onClick={() => { setSelectedDish(item.dish); setModalOpen(true); }} fallbackImage={restaurant.image} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Modal de detalhes do prato */}
      <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
    </div>
  );
} 