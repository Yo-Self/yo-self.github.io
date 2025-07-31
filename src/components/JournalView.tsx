import React, { useState, useRef, useEffect } from "react";
import { Restaurant, Dish } from "./data";
import CardJornal from "./CardJornal";
import DishModal from "./DishModal";
import { AnimatePresence, motion } from "framer-motion";

interface JournalViewProps {
  open: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  selectedCategory?: string;
}

export default function JournalView({ open, onClose, restaurant, selectedCategory: propSelectedCategory }: JournalViewProps) {
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(6); // Inicial com 6, será calculado dinamicamente
  const [pinnedDishes, setPinnedDishes] = useState<Set<string>>(new Set()); // Set de IDs dos pratos pinados
  const itemsPerPage = 3;
  const categories = Array.from(new Set(restaurant.menu_items.map(item => item.category)));
  
  // O JournalView deve funcionar independentemente da prop selectedCategory
  // A prop é apenas para referência, mas o JournalView mantém sua própria lógica
  
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
  
  // O JournalView sempre deve mostrar todas as categorias, independentemente da prop
  // Agrupar todos por categoria
  const catMap: { [cat: string]: Dish[] } = {};
  restaurant.menu_items.forEach(item => {
    if (!catMap[item.category]) catMap[item.category] = [];
    catMap[item.category].push(item);
  });
  grouped = Object.entries(catMap).map(([category, items]) => ({ category, items }));
  
  // Função para alternar o pin de um prato
  const togglePin = (dishId: string) => {
    // Salvar a categoria atual antes da mudança
    const currentCategoryBefore = categoryList[pageToCategoryIdx[page] || 0];
    
    setPinnedDishes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dishId)) {
        newSet.delete(dishId);
      } else {
        newSet.add(dishId);
      }
      
      // Usar o novo estado para calcular a nova página
      const newPinnedDishes = newSet;
      
      // Recalcular páginas com o novo estado
      const newAllPinnedDishes = restaurant.menu_items.filter(dish => newPinnedDishes.has(dish.name));
      const newAllPinnedDishesUnique = newAllPinnedDishes.filter((dish, index, self) => 
        index === self.findIndex(d => d.name === dish.name)
      );
      
      // Recalcular pageToCategoryIdx para as novas páginas
      const newPageToCategoryIdx: number[] = [];
      let newPageIndex = 0;
      
      grouped.forEach((group, categoryIndex) => {
        const seen = new Set<string>();
        const categoryDishes = group.items.filter(dish => {
          if (seen.has(dish.name) || newPinnedDishes.has(dish.name)) {
            return false; // Remover duplicatas e pratos já fixados
          }
          seen.add(dish.name);
          return true;
        });
        
        const dishesInCategory = categoryDishes;
        const availableSlotsPerPage = Math.max(0, cardsPerPage - newAllPinnedDishesUnique.length);
        
        if (availableSlotsPerPage <= 0) {
          const pagesForCategory = Math.ceil(newAllPinnedDishesUnique.length / cardsPerPage);
          for (let i = 0; i < pagesForCategory; i++) {
            newPageToCategoryIdx[newPageIndex] = categoryIndex;
            newPageIndex++;
          }
        } else {
          const pagesForCategory = Math.max(1, Math.ceil(dishesInCategory.length / availableSlotsPerPage));
          for (let i = 0; i < pagesForCategory; i++) {
            newPageToCategoryIdx[newPageIndex] = categoryIndex;
            newPageIndex++;
          }
        }
      });
      
      // Encontrar a nova página que corresponde à categoria anterior
      const targetCategoryIndex = categoryList.indexOf(currentCategoryBefore);
      const newTargetPage = newPageToCategoryIdx.findIndex(idx => idx === targetCategoryIndex);
      
      // Usar setTimeout para garantir que o estado foi atualizado antes de navegar
      setTimeout(() => {
        // Se encontrou uma página válida, navegar para ela
        if (newTargetPage !== -1 && newTargetPage < newPageIndex) {
          setPage(newTargetPage);
        } else {
          // Se não encontrou, ir para a primeira página da categoria ou página 0
          const firstPageOfCategory = newPageToCategoryIdx.findIndex(idx => idx === targetCategoryIndex);
          if (firstPageOfCategory !== -1) {
            setPage(firstPageOfCategory);
          } else {
            setPage(0);
          }
        }
      }, 0);
      
      return newSet;
    });
  };

  // Função para criar páginas com pratos pinados sempre nas primeiras posições
  const createPagesWithPinnedFirst = () => {
    let pages: Array<Array<{ dish: Dish; category: string }>> = [];
    
    // Coletar TODOS os pratos pinados (independente da categoria) - REMOVENDO DUPLICATAS
    const pinnedDishesArray = restaurant.menu_items.filter(dish => pinnedDishes.has(dish.name));
    const allPinnedDishes = pinnedDishesArray.filter((dish, index, self) => 
      index === self.findIndex(d => d.name === dish.name)
    );

    // O JournalView sempre mostra todas as categorias
    grouped.forEach(group => {
      // Coletar pratos da categoria (removendo duplicatas e pratos já fixados)
      const seen = new Set<string>();
      const categoryDishes = group.items.filter(dish => {
        if (seen.has(dish.name) || pinnedDishes.has(dish.name)) {
          return false; // Remover duplicatas e pratos já fixados
        }
        seen.add(dish.name);
        return true;
      });
      
      // Pratos da categoria (excluindo os pinados que já aparecem no topo)
      const dishesInCategory = categoryDishes;
      
      // Calcular quantos pratos cabem por página (reservando espaço para TODOS os pinados)
      const availableSlotsPerPage = Math.max(0, cardsPerPage - allPinnedDishes.length);
      
      if (availableSlotsPerPage <= 0) {
        // Se não há espaço para pratos não pinados, criar páginas apenas com pinados
        for (let i = 0; i < allPinnedDishes.length; i += cardsPerPage) {
          const pageDishes = allPinnedDishes.slice(i, i + cardsPerPage);
          pages.push(pageDishes.map(dish => ({ 
            dish, 
            category: group.category
          })));
        }
      } else {
        // Dividir pratos da categoria em páginas
        for (let i = 0; i < dishesInCategory.length; i += availableSlotsPerPage) {
          const pageCategoryDishes = dishesInCategory.slice(i, i + availableSlotsPerPage);
          // Cada página terá: TODOS os pinados + pratos da categoria da página (sem duplicação)
          const pageDishes = [...allPinnedDishes, ...pageCategoryDishes];
          pages.push(pageDishes.map(dish => ({ 
            dish, 
            category: group.category
          })));
        }
      }
    });
    
    return pages;
  };

  // Usar a nova lógica para criar páginas
  const pages = createPagesWithPinnedFirst();
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
  }, [open]);

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

  // Coletar TODOS os pratos pinados (independente da categoria) - REMOVENDO DUPLICATAS
  const pinnedDishesArray = restaurant.menu_items.filter(dish => pinnedDishes.has(dish.name));
  const allPinnedDishes = pinnedDishesArray.filter((dish, index, self) => 
    index === self.findIndex(d => d.name === dish.name)
  );

  // Para cada página, descobrir a qual categoria ela pertence baseado na estrutura de criação
  let pageToCategoryIdx: number[] = [];
  
  // Replicar a mesma lógica de criação de páginas para determinar a categoria de cada página
  let pageIndex = 0;
  
  grouped.forEach((group, categoryIndex) => {
    // Coletar pratos da categoria (removendo duplicatas e pratos já fixados)
    const seen = new Set<string>();
    const categoryDishes = group.items.filter(dish => {
      if (seen.has(dish.name) || pinnedDishes.has(dish.name)) {
        return false; // Remover duplicatas e pratos já fixados
      }
      seen.add(dish.name);
      return true;
    });
    
    const dishesInCategory = categoryDishes;
    const availableSlotsPerPage = Math.max(0, cardsPerPage - allPinnedDishes.length);
    
    if (availableSlotsPerPage <= 0) {
      // Se não há espaço para pratos não pinados, criar páginas apenas com pinados
      const pagesForCategory = Math.ceil(allPinnedDishes.length / cardsPerPage);
      for (let i = 0; i < pagesForCategory; i++) {
        pageToCategoryIdx[pageIndex] = categoryIndex;
        pageIndex++;
      }
    } else {
      // Dividir pratos da categoria em páginas
      const pagesForCategory = Math.max(1, Math.ceil(dishesInCategory.length / availableSlotsPerPage));
      for (let i = 0; i < pagesForCategory; i++) {
        pageToCategoryIdx[pageIndex] = categoryIndex;
        pageIndex++;
      }
    }
  });
  
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
      {/* Áreas clicáveis para avançar/retroceder página - apenas nas bordas laterais */}
      <button
        className="fixed left-0 top-0 h-full w-1/8 z-10 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Retroceder"
        onClick={(e) => {
          // Verificar se o clique foi muito próximo da borda
          if (e.clientX < 32) {
            if (page > 0) {
              setFlipDirection('prev');
              setPage(prev => prev - 1);
            }
          }
        }}
        tabIndex={-1}
      />
      <button
        className="fixed right-0 top-0 h-full w-1/8 z-10 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Avançar"
        onClick={(e) => {
          // Verificar se o clique foi muito próximo da borda
          if (e.clientX > window.innerWidth - 32) {
            if (page < totalPages - 1) {
              setFlipDirection('next');
              setPage(prev => prev + 1);
            }
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
      <div 
        className="flex flex-col items-center w-full flex-1 relative px-4 md:px-8 max-w-screen-md mx-auto z-10" 
        style={{perspective: 1200}}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page + '-' + currentCategory}
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
                              {pages[page]?.map((item, idx) => {
                  return (
                  <div key={`${item.dish.name}-${item.category}-${page}-${idx}`} className="flex justify-center items-center">
                    <div className="w-full max-w-xs">
                      <CardJornal 
                        dish={item.dish} 
                        size="small" 
                        onClick={() => { setSelectedDish(item.dish); setModalOpen(true); }} 
                        fallbackImage={restaurant.image}
                        isPinned={pinnedDishes.has(item.dish.name)}
                        onPinToggle={() => togglePin(item.dish.name)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Modal de detalhes do prato */}
      <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
    </div>
  );
} 