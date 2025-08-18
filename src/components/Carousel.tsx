"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dish, Restaurant } from "./data";
import DishModal from "./DishModal";
import ImageWithLoading from "./ImageWithLoading";

function CarouselCard({ dish, onClick, size, noMargin = false, showMostOrderedTitle = false, position = 'center' }: { dish: Dish; onClick: () => void; size: 'main' | 'side'; noMargin?: boolean; showMostOrderedTitle?: boolean; position?: 'left' | 'center' | 'right' }) {
  if (!dish) return null;
  
  // Definir as bordas arredondadas baseado na posição e tamanho da tela
  const getBorderRadius = () => {
    if (size === 'main') return 'rounded-2xl'; // Card central sempre com bordas completas
    
    if (size === 'side') {
      if (position === 'left') {
        // No mobile (portrait): borda só na direita, no desktop (landscape): bordas completas
        return 'rounded-r-2xl md:rounded-2xl';
      }
      if (position === 'right') {
        // No mobile (portrait): borda só na esquerda, no desktop (landscape): bordas completas
        return 'rounded-l-2xl md:rounded-2xl';
      }
    }
    
    return 'rounded-2xl'; // Fallback
  };
  
  return (
    <div
      className={`carousel-card flex flex-col items-center cursor-pointer bg-transparent shadow-none p-0 transition-all duration-300
        ${size === 'main'
          ? 'w-[85vw] md:w-[600px] h-[50vw] md:h-[340px] scale-100 z-20'
          : 'w-[72vw] md:w-[510px] lg:w-[510px] xl:w-[510px] h-[42vw] md:h-[289px] lg:h-[289px] xl:h-[289px] scale-90 md:scale-95 lg:scale-100 opacity-60 md:opacity-80 lg:opacity-100 z-10'}
      `}
      onClick={onClick}
      style={{ pointerEvents: size === 'main' ? 'auto' : 'none' }}
    >
      <div className={`aspect-[4/3] overflow-hidden ${getBorderRadius()} relative w-full h-full`}>
        <ImageWithLoading
          src={dish.image || '/window.svg'}
          alt={dish.name || 'Item do cardápio'}
          className="w-full h-full object-cover animate-kenburns"
        >
          {/* Badge "mais pedido" no canto superior direito de cada card */}
          {showMostOrderedTitle && (
            <div className="absolute top-2 right-2 z-30 pointer-events-none">
              <span className="bg-primary dark:bg-cyan-700 text-white text-xs font-bold rounded-full px-2 py-1 select-none">
                mais pedido
              </span>
            </div>
          )}
          {/* Título do prato - só exibir no card central */}
          {size === 'main' && (
            <div className="absolute bottom-0 left-0 w-full text-white text-center font-semibold text-lg py-2 px-2 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
              {dish.name || 'Item' }
            </div>
          )}
        </ImageWithLoading>
      </div>
    </div>
  );
}

export default function Carousel({ restaurant, showMostOrderedTitle = false, ...props }: { restaurant: Restaurant, showMostOrderedTitle?: boolean } & React.HTMLAttributes<HTMLElement>) {
  // Verificação inicial de segurança
  if (!restaurant || !restaurant.id || !restaurant.name || !restaurant.featured_dishes || !Array.isArray(restaurant.featured_dishes)) {
    return (
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative z-10 w-full" {...props}>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>Dados do restaurante não disponíveis</p>
        </div>
      </section>
    );
  }

  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const featured: Dish[] = Array.isArray(restaurant.featured_dishes)
    ? (restaurant.featured_dishes.filter(dish => dish && dish.name && dish.name.trim() !== '') as Dish[])
    : [];

  // Verificação adicional para garantir que há pelo menos um item válido
  if (featured.length === 0) {
    return (
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative z-10 w-full" {...props}>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>Nenhum prato em destaque disponível</p>
        </div>
      </section>
    );
  }

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-rotate
  useEffect(() => {
    if (featured.length > 1) {
      timeoutRef.current = setTimeout(() => {
        setCurrent((prev) => (prev + 1) % featured.length);
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, featured.length]);

  // Garantir que current não exceda o tamanho do array
  useEffect(() => {
    if (featured.length > 0 && current >= featured.length) {
      setCurrent(0);
    }
    // Se featured mudou e current não é válido, resetar para 0
    if (featured.length > 0 && (current < 0 || current >= featured.length)) {
      setCurrent(0);
    }
  }, [featured.length, current]);

  // Inicializar current quando o componente montar
  useEffect(() => {
    if (featured.length > 0 && current === 0) {
      setCurrent(0);
    }
  }, [featured.length]);

  const handleCardClick = (dish: Dish) => {
    if (!dish || !dish.name) return;
    setSelectedDish(dish);
    setModalOpen(true);
  };

  // Swipe handlers
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
      if (distance > 0) {
        // Swipe left -> next
        setCurrent((prev) => (prev + 1) % featured.length);
      } else {
        // Swipe right -> prev
        setCurrent((prev) => (prev - 1 + featured.length) % featured.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Carousel logic for showing side/main/side
  const getDisplayDishes = () => {
    if (featured.length === 0) return [];
    if (featured.length === 1) {
      const dish = featured[0];
      if (!dish || !dish.name) return [];
      return [{ dish, size: 'main' as const, index: 0, position: 'center' as const }];
    }
    if (featured.length === 2) {
      const dish1 = featured[0];
      const dish2 = featured[1];
      if (!dish1 || !dish1.name || !dish2 || !dish2.name) return [];
      return [
        { dish: dish1, size: 'side' as const, index: 0, position: 'left' as const },
        { dish: dish2, size: 'main' as const, index: 1, position: 'center' as const }
      ];
    }
    
    // Garantir que current seja válido
    const validCurrent = Math.min(Math.max(0, current), featured.length - 1);
    const prev = (validCurrent - 1 + featured.length) % featured.length;
    const next = (validCurrent + 1) % featured.length;
    
    // Filtrar apenas itens válidos
    const items = [
      { dish: featured[prev], size: 'side' as const, index: prev, position: 'left' as const },
      { dish: featured[validCurrent], size: 'main' as const, index: validCurrent, position: 'center' as const },
      { dish: featured[next], size: 'side' as const, index: next, position: 'right' as const }
    ].filter(item => item.dish && item.dish.name && item.dish.name.trim() !== ''); // Remove itens com dish undefined ou nome inválido
    
    return items;
  };

  // Garantir que sempre haja pelo menos um item principal
  if (featured.length === 1) {
    const dish = featured[0];
    if (!dish || !dish.name) {
      return (
        <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative z-10 w-full" {...props}>
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <p>Dados do prato em destaque não disponíveis</p>
          </div>
        </section>
      );
    }
    
    return (
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative w-full" {...props}>
        <div className="relative w-full overflow-hidden">
          <div className="relative flex items-center justify-center min-h-[60vw] md:min-h-[340px] w-full">
            <CarouselCard
              key={`${dish.name || 'single'}-0`}
              dish={dish}
              size="main"
              onClick={() => handleCardClick(dish)}
              noMargin={true}
              showMostOrderedTitle={showMostOrderedTitle}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative w-full" {...props}>
        <div className="relative w-full overflow-hidden">
          {/* Carousel container */}
          <div 
            className="relative flex items-center justify-center min-h-[60vw] md:min-h-[340px] w-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {getDisplayDishes().map((item, index) => {
              // Verificar se item.dish existe antes de renderizar
              if (!item.dish) return null;
              
              const isMain = item.size === 'main';
              const showTitle = isMain && showMostOrderedTitle;
              
              return (
                <CarouselCard
                  key={`${item.dish.name || item.index}-${current}`}
                  dish={item.dish}
                  size={item.size}
                  onClick={() => handleCardClick(item.dish)}
                  noMargin={isMain}
                  showMostOrderedTitle={showTitle}
                  position={item.position}
                />
              );
            })}
          </div>

          {/* Navigation arrows */}
          {featured.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((prev) => (prev - 1 + featured.length) % featured.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-black/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-black transition-colors duration-200"
                aria-label="Prato anterior"
              >
                <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrent((prev) => (prev + 1) % featured.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-black/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-black transition-colors duration-200"
                aria-label="Próximo prato"
              >
                <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}


        </div>
      </section>

      {/* Modal - renderizado fora do carousel */}
      {modalOpen && selectedDish && restaurant.id && (
        <DishModal
          dish={selectedDish}
          restaurantId={restaurant.id}
          restaurant={restaurant}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
} 