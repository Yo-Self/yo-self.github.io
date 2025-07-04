import React, { useState, useRef, useEffect } from "react";
import { Restaurant, Dish } from "./data";
import DishCard from "./DishCard";

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
  const grouped = selectedCategory === 'all'
    ? restaurant.menu_items
    : restaurant.menu_items.filter(item => item.category === selectedCategory);
  const totalPages = Math.ceil(grouped.length / itemsPerPage);

  // Atualiza categoria do header ao navegar por swipe
  useEffect(() => {
    if (grouped.length > 0) {
      const firstDish = grouped[page * itemsPerPage];
      if (firstDish && firstDish.category !== selectedCategory) {
        setSelectedCategory(firstDish.category);
      }
    }
  }, [page]);

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
        {grouped.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map(item => (
          <div key={item.name + item.category} className="flex justify-center w-full max-w-md" style={{maxWidth: '100vw', minHeight: 220}}>
            <DishCard dish={item} size="small" />
          </div>
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