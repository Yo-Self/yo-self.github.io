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
  const itemsPerPage = 3;
  const categories = Array.from(new Set(restaurant.menu_items.map(item => item.category)));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
  // Nova lógica: cada página contém até 3 cards de uma mesma categoria, sem tela cheia de header
  let pages: Array<Array<{ dish: Dish; category: string }>> = [];
  if (selectedCategory === 'all') {
    grouped.forEach(group => {
      for (let i = 0; i < group.items.length; i += 3) {
        pages.push(group.items.slice(i, i + 3).map(dish => ({ dish, category: group.category })));
      }
    });
  } else {
    for (let i = 0; i < grouped[0].items.length; i += 3) {
      pages.push(grouped[0].items.slice(i, i + 3).map(dish => ({ dish, category: grouped[0].category })));
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
      if (distance > 0 && page < totalPages - 1) {
        setFlipDirection('next');
        setAnimating(true);
        setTimeout(() => {
          setPage(page + 1);
          setAnimating(false);
        }, 600);
      } else if (distance < 0 && page > 0) {
        setFlipDirection('prev');
        setAnimating(true);
        setTimeout(() => {
          setPage(page - 1);
          setAnimating(false);
        }, 600);
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
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  // --- NOVA LÓGICA DE INDICADOR DE CATEGORIA ---
  // Lista de categorias únicas na ordem de exibição
  const categoryList = grouped.map(g => g.category);

  // Para cada página, descobrir a qual categoria ela pertence (agora só há páginas de pratos)
  let pageToCategoryIdx: number[] = [];
  if (selectedCategory === 'all') {
    let catIdx = 0;
    grouped.forEach(group => {
      const nPages = Math.ceil(group.items.length / 3);
      for (let i = 0; i < nPages; i++) {
        pageToCategoryIdx.push(catIdx);
      }
      catIdx++;
    });
  } else {
    for (let i = 0; i < pages.length; i++) {
      pageToCategoryIdx.push(0);
    }
  }
  // Índice da categoria atual
  const currentCategoryIdx = pageToCategoryIdx[page] || 0;
  const currentCategory = categoryList[currentCategoryIdx];

  // Estado para modal de detalhes do prato
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  // Estado para direção da animação
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white dark:bg-gray-900 animate-fade-in-fast select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Áreas clicáveis para avançar/retroceder página */}
      <button
        className="fixed left-0 top-0 h-full w-1/4 z-10 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Retroceder"
        onClick={() => page > 0 && setPage(page - 1)}
        tabIndex={-1}
      />
      <button
        className="fixed right-0 top-0 h-full w-1/4 z-10 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Avançar"
        onClick={() => page < totalPages - 1 && setPage(page + 1)}
        tabIndex={-1}
      />
      {/* Indicador de categoria no topo + botão de fechar alinhados */}
      <div className="flex flex-row items-center w-full justify-between z-30 gap-0 mt-4 mb-0 px-4" style={{maxWidth: 600, margin: '0 auto'}}>
        <div className="flex gap-2 flex-1 justify-center min-w-0 overflow-x-auto items-center" style={{maxWidth: 'calc(100vw - 64px)'}}>
          {categoryList.map((cat, idx) => (
            idx === currentCategoryIdx ? (
              <span key={cat} className="text-sm font-semibold text-primary dark:text-cyan-400 text-center leading-tight flex items-center" style={{maxWidth: 96, overflow: 'hidden', wordBreak: 'break-word', whiteSpace: 'normal', lineClamp: 2, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box', minHeight: 8}}>{cat}</span>
            ) : (
              <span key={cat} className="h-2 w-8 rounded-full bg-gray-300 dark:bg-gray-700 scale-100 transition-all duration-200 flex-shrink-0" style={{minWidth: 32, maxWidth: 64, display: 'inline-block'}}></span>
            )
          ))}
        </div>
        <button
          className="w-12 h-12 flex items-center justify-center z-40 bg-transparent border-none shadow-none p-0 m-0 flex-shrink-0"
          onClick={onClose}
          aria-label="Fechar jornal"
          style={{ background: 'none', border: 'none', boxShadow: 'none' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      {/* Cards de pratos, todos do mesmo tamanho, centralizados, sem header de categoria em tela cheia */}
      <div className="flex flex-col items-center justify-center w-full flex-1 gap-4 relative" style={{perspective: 1200, minHeight: 320}}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            initial={{
              x: flipDirection === 'next' ? 300 : -300,
              opacity: 0.7,
            }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.15, ease: [0.77,0,0.175,1] }
            }}
            exit={{
              x: flipDirection === 'next' ? -300 : 300,
              opacity: 0.7,
              transition: { duration: 0.15, ease: [0.77,0,0.175,1] }
            }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              willChange: 'transform',
            }}
          >
            <div className="flex flex-col gap-4 w-full">
              {pages[page]?.map((item, idx) => (
                <div key={item.dish.name + '-' + item.category} className="flex justify-center items-center w-full" style={{minHeight: 180}}>
                  <div className="max-w-md min-w-[320px] mx-auto">
                    <CardJornal dish={item.dish} size="small" onClick={() => { setSelectedDish(item.dish); setModalOpen(true); }} />
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