"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dish, Restaurant } from "./data";
import DishModal from "./DishModal";
import ImageWithLoading from "./ImageWithLoading";

function CarouselCard({ dish, onClick, size, noMargin = false, showMostOrderedTitle = false }: { dish: Dish; onClick: () => void; size: 'main' | 'side'; noMargin?: boolean; showMostOrderedTitle?: boolean }) {
  if (!dish) return null;
  return (
    <div
      className={`carousel-card flex flex-col items-center cursor-pointer bg-transparent shadow-none p-0 ${noMargin ? '' : 'mx-2'} transition-all duration-300
        ${size === 'main'
          ? 'w-full max-w-full h-[60vw] md:h-[340px] scale-100 z-20'
          : 'w-[32px] h-[60vw] scale-90 opacity-60 z-10 md:w-full md:max-w-full md:h-[340px]'}
      `}
      onClick={onClick}
      style={{ pointerEvents: size === 'main' ? 'auto' : 'none' }}
    >
      <div className={`aspect-[4/3] overflow-hidden rounded-2xl relative w-full h-full`}>
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
          <div className="absolute bottom-0 left-0 w-full text-white text-center font-semibold text-lg py-2 px-2 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
            {dish.name || 'Item' }
          </div>
        </ImageWithLoading>
      </div>
    </div>
  );
}

export default function Carousel({ restaurant, showMostOrderedTitle = false, ...props }: { restaurant: Restaurant, showMostOrderedTitle?: boolean } & React.HTMLAttributes<HTMLElement>) {
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const featured: Dish[] = Array.isArray(restaurant.featured_dishes)
    ? (restaurant.featured_dishes.filter(Boolean) as Dish[])
    : [];

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

  const handleCardClick = (dish: Dish) => {
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
    if (featured.length === 1) return [featured[0]];
    if (featured.length === 2) return [featured[0], featured[1]];
    
    const prev = (current - 1 + featured.length) % featured.length;
    const next = (current + 1) % featured.length;
    
    return [featured[prev], featured[current], featured[next]];
  };

  if (featured.length === 0) {
    return (
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative z-10" {...props}>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>Nenhum prato em destaque disponível</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative" {...props}>
        <div className="relative max-w-6xl mx-auto px-4">
          {/* Carousel container */}
          <div 
            className="relative flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {getDisplayDishes().map((dish, index) => {
              const isMain = index === 1;
              const size = isMain ? 'main' : 'side';
              const showTitle = isMain && showMostOrderedTitle;
              
              return (
                <CarouselCard
                  key={`${dish.name || index}-${current}`}
                  dish={dish}
                  size={size}
                  onClick={() => handleCardClick(dish)}
                  noMargin={index === 1}
                  showMostOrderedTitle={showTitle}
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

          {/* Dots indicator */}
          {featured.length > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {featured.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    index === current 
                      ? 'bg-cyan-500 dark:bg-cyan-400' 
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`Ir para prato ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal - renderizado fora do carousel */}
      {modalOpen && selectedDish && (
        <DishModal
          dish={selectedDish}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
} 