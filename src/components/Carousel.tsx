"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dish, Restaurant } from "./data";
import DishModal from "./DishModal";
import ImageWithLoading from "./ImageWithLoading";

interface CarouselCardProps {
  dish: Dish;
  onClick: () => void;
  isActive: boolean;
  showMostOrderedTitle?: boolean;
}

function CarouselCard({ dish, onClick, isActive, showMostOrderedTitle }: CarouselCardProps) {
  if (!dish) return null;

  return (
    <div
      className={`carousel-card flex-shrink-0 w-full transition-all duration-500 ease-in-out ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-60'}`}
      onClick={onClick}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-2xl relative w-full h-full">
        <ImageWithLoading
          src={dish.image || '/window.svg'}
          alt={dish.name || 'Item do cardápio'}
          className="w-full h-full object-cover"
        >
          {showMostOrderedTitle && (
            <div className="absolute top-2 right-2 z-30 pointer-events-none">
              <span className="bg-primary dark:bg-cyan-700 text-white text-xs font-bold rounded-full px-2 py-1 select-none">
                mais pedido
              </span>
            </div>
          )}
          {isActive && (
            <div className="absolute bottom-0 left-0 w-full text-white text-center font-semibold text-lg py-2 px-2 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
              {dish.name || 'Item'}
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);

  const featured: Dish[] = Array.isArray(restaurant.featured_dishes)
    ? (restaurant.featured_dishes.filter(dish => dish && dish.name && dish.name.trim() !== '') as Dish[])
    : [];

  const handleNext = useCallback(() => {
    if (isTransitioning || featured.length <= 1) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev + 1) % featured.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, featured.length]);

  const handlePrev = useCallback(() => {
    if (isTransitioning || featured.length <= 1) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev - 1 + featured.length) % featured.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, featured.length]);

  const stopAutoplay = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (featured.length > 1) {
      timerRef.current = setTimeout(handleNext, 5000);
    }
  }, [handleNext, featured.length]);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [current, startAutoplay]);

  const handleCardClick = (dish: Dish) => {
    if (!dish || !dish.name) return;
    setSelectedDish(dish);
    setModalOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    stopAutoplay();
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    const swipeThreshold = 50; 

    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    startAutoplay();
  };

  if (featured.length === 0) {
    return (
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative z-10 w-full" {...props}>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>Nenhum prato em destaque disponível</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="carousel-section pt-0 pb-0 bg-white dark:bg-black relative w-full" {...props}>
        <div
          className="relative w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out items-center"
            style={{ transform: `translateX(calc(12.5% - ${current * 75}%))` }}
          >
            {featured.map((dish, index) => (
              <div key={index} className="w-9/12 flex-shrink-0 px-2">
                <CarouselCard
                  dish={dish}
                  isActive={index === current}
                  onClick={() => handleCardClick(dish)}
                  showMostOrderedTitle={showMostOrderedTitle}
                />
              </div>
            ))}
          </div>

          {featured.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={isTransitioning}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                aria-label="Prato anterior"
              >
                <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                disabled={isTransitioning}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
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