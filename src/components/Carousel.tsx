"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dish, Restaurant } from "./data";
import DishModal from "./DishModal";
import ImageWithLoading from "./ImageWithLoading";

function CarouselCard({ 
  dish, 
  onClick, 
  size, 
  position, 
  isAnimating = false,
  animationDirection = 'none',
  showMostOrderedTitle = false 
}: { 
  dish: Dish; 
  onClick: () => void; 
  size: 'main' | 'side'; 
  position: 'left' | 'center' | 'right';
  isAnimating?: boolean;
  animationDirection?: 'left' | 'right' | 'none';
  showMostOrderedTitle?: boolean;
}) {
  if (!dish) return null;
  
  const getBorderRadius = () => {
    if (size === 'main') return 'rounded-2xl';
    
    if (size === 'side') {
      if (position === 'left') {
        return 'rounded-r-2xl md:rounded-2xl';
      }
      if (position === 'right') {
        return 'rounded-l-2xl md:rounded-2xl';
      }
    }
    
    return 'rounded-2xl';
  };

  const getAnimationClasses = () => {
    if (!isAnimating) return '';
    
    // Aplicar animação de roda gigante nos cards laterais
    if (size === 'side') {
      if (animationDirection === 'left' && position === 'left') {
        return 'animate-ferris-left';
      }
      if (animationDirection === 'right' && position === 'right') {
        return 'animate-ferris-right';
      }
    }
    
    // Aplicar fade-in no card central quando ele aparece
    if (size === 'main' && isAnimating) {
      return 'animate-ferris-center';
    }
    
    return '';
  };
  
  return (
    <div
      className={`carousel-card flex flex-col items-center cursor-pointer bg-transparent shadow-none p-0 transition-transform duration-200 ease-out
        ${size === 'main'
          ? 'w-[85vw] md:w-[600px] h-[50vw] md:h-[340px] scale-100 z-20'
          : 'w-[72vw] md:w-[510px] lg:w-[510px] xl:w-[510px] h-[42vw] md:h-[289px] lg:h-[289px] xl:h-[289px] scale-90 md:scale-95 lg:scale-100 z-10'}
        ${getAnimationClasses()}
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
          {showMostOrderedTitle && (
            <div className="absolute top-2 right-2 z-30 pointer-events-none">
              <span className="bg-primary dark:bg-cyan-700 text-white text-xs font-bold rounded-full px-2 py-1 select-none">
                mais pedido
              </span>
            </div>
          )}
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
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | 'none'>('none');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const featured: Dish[] = Array.isArray(restaurant.featured_dishes)
    ? (restaurant.featured_dishes.filter(dish => dish && dish.name && dish.name.trim() !== '') as Dish[])
    : [];

  // Auto-rotation with animation
  useEffect(() => {
    if (featured.length > 1 && !isAnimating) {
      timeoutRef.current = setTimeout(() => {
        handleNext();
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, featured.length, isAnimating]);

  useEffect(() => {
    if (featured.length > 0 && current >= featured.length) {
      setCurrent(0);
    }
    if (featured.length > 0 && (current < 0 || current >= featured.length)) {
      setCurrent(0);
    }
  }, [featured.length, current]);

  const handleNext = useCallback(() => {
    if (isAnimating || featured.length <= 1) return;
    
    setIsAnimating(true);
    setAnimationDirection('left');
    
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
      setIsAnimating(false);
      setAnimationDirection('none');
    }, 600);
  }, [isAnimating, featured.length]);

  const handlePrev = useCallback(() => {
    if (isAnimating || featured.length <= 1) return;
    
    setIsAnimating(true);
    setAnimationDirection('right');
    
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + featured.length) % featured.length);
      setIsAnimating(false);
      setAnimationDirection('none');
    }, 200);
  }, [isAnimating, featured.length]);

  if (!restaurant || !restaurant.id || !restaurant.name || !restaurant.featured_dishes || !Array.isArray(restaurant.featured_dishes)) {
    return (
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative z-10 w-full" {...props}>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>Dados do restaurante não disponíveis</p>
        </div>
      </section>
    );
  }

  if (featured.length === 0) {
    return (
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative z-10 w-full" {...props}>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>Nenhum prato em destaque disponível</p>
        </div>
      </section>
    );
  }

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
    if (touchStartX.current === null || touchEndX.current === null || isAnimating) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
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
    
    const validCurrent = Math.min(Math.max(0, current), featured.length - 1);
    const prev = (validCurrent - 1 + featured.length) % featured.length;
    const next = (validCurrent + 1) % featured.length;
    
    const items = [
      { dish: featured[prev], size: 'side' as const, index: prev, position: 'left' as const },
      { dish: featured[validCurrent], size: 'main' as const, index: validCurrent, position: 'center' as const },
      { dish: featured[next], size: 'side' as const, index: next, position: 'right' as const }
    ].filter(item => item.dish && item.dish.name && item.dish.name.trim() !== '');
    
    return items;
  };

  // Single dish display
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
              position="center"
              onClick={() => handleCardClick(dish)}
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
            className="relative flex items-center justify-center min-h-[60vw] md:min-h-[340px] w-full carousel-3d-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {getDisplayDishes().map((item, index) => {
              if (!item.dish) return null;
              
              const isMain = item.size === 'main';
              const showTitle = isMain && showMostOrderedTitle;
              
              return (
                <CarouselCard
                  key={`${item.index}`}
                  dish={item.dish}
                  size={item.size}
                  position={item.position}
                  onClick={() => handleCardClick(item.dish)}
                  isAnimating={isAnimating}
                  animationDirection={animationDirection}
                  showMostOrderedTitle={showTitle}
                />
              );
            })}
          </div>

          {/* Navigation arrows */}
          {featured.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={isAnimating}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                  ${isAnimating 
                    ? 'cursor-not-allowed' 
                    : 'hover:scale-110'
                  }`}
                aria-label="Prato anterior"
              >
                <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                disabled={isAnimating}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                  ${isAnimating 
                    ? 'cursor-not-allowed' 
                    : 'hover:scale-110'
                  }`}
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

      {/* Modal */}
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