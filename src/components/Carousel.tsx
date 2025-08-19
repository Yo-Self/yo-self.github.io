"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dish, Restaurant } from "./data";
import DishModal from "./DishModal";
import ImageWithLoading from "./ImageWithLoading";

interface CarouselCardProps {
  dish: Dish;
  onClick: () => void;
  size: 'main' | 'side';
  position: 'left' | 'center' | 'right';
  showMostOrderedTitle?: boolean;
}

function CarouselCard({ dish, onClick, size, position, showMostOrderedTitle }: CarouselCardProps) {
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
  
  return (
    <div
      className={`carousel-card flex flex-col items-center cursor-pointer bg-transparent shadow-none p-0
        ${size === 'main'
          ? 'w-[85vw] md:w-[600px] h-[50vw] md:h-[340px] scale-100 z-20'
          : 'w-[72vw] md:w-[510px] lg:w-[510px] xl:w-[510px] h-[42vw] md:h-[289px] lg:h-[289px] xl:h-[289px] scale-90 md:scale-95 lg:scale-100 z-10'}
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const featured: Dish[] = Array.isArray(restaurant.featured_dishes)
    ? (restaurant.featured_dishes.filter(dish => dish && dish.name && dish.name.trim() !== '') as Dish[])
    : [];

  // Auto-rotation
  useEffect(() => {
    if (featured.length > 1 && !isTransitioning && !isDragging) {
      timeoutRef.current = setTimeout(() => {
        handleNext();
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, featured.length, isTransitioning, isDragging]);

  // Reset current if out of bounds
  useEffect(() => {
    if (featured.length > 0 && current >= featured.length) {
      setCurrent(0);
    }
    if (featured.length > 0 && (current < 0 || current >= featured.length)) {
      setCurrent(0);
    }
  }, [featured.length, current]);

  const handleNext = useCallback(() => {
    if (isTransitioning || featured.length <= 1) return;
    
    setIsTransitioning(true);
    setDragOffset(0);
    
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, featured.length]);

  const handlePrev = useCallback(() => {
    if (isTransitioning || featured.length <= 1) return;
    
    setIsTransitioning(true);
    setDragOffset(0);
    
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + featured.length) % featured.length);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, featured.length]);

  // Touch and mouse drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setDragStart(clientX);
    setDragOffset(0);
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    
    const delta = clientX - dragStart;
    const maxOffset = containerRef.current?.offsetWidth || 0;
    const clampedOffset = Math.max(-maxOffset * 0.3, Math.min(maxOffset * 0.3, delta));
    
    setDragOffset(clampedOffset);
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(dragOffset) > 100) {
      if (dragOffset > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    } else {
      setDragOffset(0);
    }
  }, [isDragging, dragOffset, handleNext, handlePrev]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleDragMove(e.clientX);
  }, [isDragging, handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

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

  // Get display dishes with proper positioning
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

  const displayDishes = getDisplayDishes();

  return (
    <>
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative w-full" {...props}>
        <div className="relative w-full overflow-hidden">
          {/* Carousel container */}
          <div 
            ref={containerRef}
            className="relative flex items-center justify-center min-h-[60vw] md:min-h-[340px] w-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="flex items-center justify-center transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(${dragOffset}px)`,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
            >
              {displayDishes.map((item, index) => {
                if (!item.dish) return null;
                
                const isMain = item.size === 'main';
                const showTitle = isMain && showMostOrderedTitle;
                
                return (
                  <CarouselCard
                    key={`${item.index}-${current}`}
                    dish={item.dish}
                    size={item.size}
                    position={item.position}
                    onClick={() => handleCardClick(item.dish)}
                    showMostOrderedTitle={showTitle}
                  />
                );
              })}
            </div>
          </div>

          {/* Navigation arrows */}
          {featured.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={isTransitioning || isDragging}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                  ${isTransitioning || isDragging
                    ? 'cursor-not-allowed opacity-50' 
                    : 'hover:scale-110 hover:bg-white/20'
                  }`}
                aria-label="Prato anterior"
              >
                <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                disabled={isTransitioning || isDragging}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                  ${isTransitioning || isDragging
                    ? 'cursor-not-allowed opacity-50' 
                    : 'hover:scale-110 hover:bg-white/20'
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