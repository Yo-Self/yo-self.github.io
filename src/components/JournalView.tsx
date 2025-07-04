import React, { useState, useRef, useEffect } from "react";
import { Restaurant, Dish } from "./data";
import CardJornal from "./CardJornal";

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
  // Flatten para paginação: cada página pode conter até 3 pratos, mas mantém cabeçalho de categoria
  const flat: Array<{ type: 'category'; category: string } | { type: 'dish'; dish: Dish }> = [];
  grouped.forEach(group => {
    flat.push({ type: 'category', category: group.category });
    group.items.forEach(dish => flat.push({ type: 'dish', dish }));
  });
  // Nova lógica: cada página contém ou só o nome da categoria (transição), ou até 3 cards de uma mesma categoria
  let pages: Array<Array<{ type: 'category'; category: string } | { type: 'dish'; dish: Dish }>> = [];
  if (selectedCategory === 'all') {
    grouped.forEach(group => {
      // Página só com o nome da categoria
      pages.push([{ type: 'category', category: group.category }]);
      // Páginas com até 3 pratos dessa categoria
      for (let i = 0; i < group.items.length; i += 3) {
        pages.push(group.items.slice(i, i + 3).map(dish => ({ type: 'dish', dish })));
      }
    });
  } else {
    // Categoria única
    pages.push([{ type: 'category', category: grouped[0].category }]);
    for (let i = 0; i < grouped[0].items.length; i += 3) {
      pages.push(grouped[0].items.slice(i, i + 3).map(dish => ({ type: 'dish', dish })));
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
        setAnimating(true);
        setTimeout(() => {
          setPage(page + 1);
          setAnimating(false);
        }, 300);
      } else if (distance < 0 && page > 0) {
        setAnimating(true);
        setTimeout(() => {
          setPage(page - 1);
          setAnimating(false);
        }, 300);
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

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white dark:bg-gray-900 animate-fade-in-fast select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Áreas clicáveis para avançar/retroceder página */}
      <button
        className="fixed left-0 top-0 h-full w-1/4 z-30 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Retroceder"
        onClick={() => page > 0 && setPage(page - 1)}
        tabIndex={-1}
      />
      <button
        className="fixed right-0 top-0 h-full w-1/4 z-30 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Avançar"
        onClick={() => page < totalPages - 1 && setPage(page + 1)}
        tabIndex={-1}
      />
      {/* Indicador de página no topo, estilo stories */}
      <div className="flex gap-2 mt-6 mb-4 w-full justify-center z-20">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <span key={idx} className={`flex-1 h-1 rounded-full ${idx === page ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`} style={{ minWidth: 24, maxWidth: 64 }}></span>
        ))}
      </div>
      {/* Cards de pratos, todos do mesmo tamanho, centralizados, sem scroll */}
      <div className="flex flex-col items-center justify-center w-full flex-1 gap-4">
        {pages[page]?.map((item, idx) => (
          item.type === 'category' ? (
            <div key={item.category + '-header'} className="w-full max-w-md text-2xl font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center h-40">
              {item.category}
            </div>
          ) : (
            <div key={item.dish.name + item.dish.category} className="flex justify-center items-center w-full" style={{minHeight: 180}}>
              <div className="max-w-md min-w-[320px] mx-auto">
                <CardJornal dish={item.dish} size="small" />
              </div>
            </div>
          )
        ))}
      </div>
      {/* Botão de fechar */}
      <button
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-700 z-40"
        onClick={onClose}
        aria-label="Fechar jornal"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
} 