"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dish, Restaurant } from "./data";
import DishModal from "./DishModal";
import Image from "next/image";

function CarouselCard({ dish, onClick, size }: { dish: Dish; onClick: () => void; size: 'main' | 'side' }) {
  return (
    <div
      className={`carousel-card flex flex-col items-center cursor-pointer bg-transparent shadow-none p-0 mx-2 transition-all duration-300 
        ${size === 'main' ? 'w-[96vw] md:w-[640px] h-[60vw] md:h-[384px] scale-100 z-20' : 'w-[48px] md:w-[72px] h-[60vw] md:h-[384px] scale-90 opacity-60 z-10'}`}
      onClick={onClick}
      style={{ pointerEvents: size === 'main' ? 'auto' : 'none' }}
    >
      <div className={`aspect-[4/3] overflow-hidden rounded-2xl relative w-full h-full`}>
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          className="w-full h-full object-cover animate-kenburns"
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 96vw, 640px"
          priority
        />
        <div className="absolute bottom-0 left-0 w-full text-white text-center font-semibold text-lg py-2 px-2 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
          {dish.name}
        </div>
      </div>
    </div>
  );
}

export default function Carousel({ restaurant }: { restaurant: Restaurant }) {
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const featured = restaurant.featured_dishes;

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-rotate
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 5000);
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
    const prev = (current - 1 + featured.length) % featured.length;
    const next = (current + 1) % featured.length;
    return [
      { dish: featured[prev], size: 'side' as const, idx: prev },
      { dish: featured[current], size: 'main' as const, idx: current },
      { dish: featured[next], size: 'side' as const, idx: next },
    ];
  };

  return (
    <section className="carousel-section py-2 bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-center min-h-[260px] md:min-h-[384px]">
          {featured.length === 1 ? (
            <CarouselCard
              key={restaurant.id + '-0'}
              dish={featured[0]}
              onClick={() => handleCardClick(featured[0])}
              size="main"
            />
          ) : (
            <>
              {/* Área clicável esquerda */}
              <button
                className="absolute left-0 top-0 h-full w-[18vw] md:w-[120px] z-20 bg-transparent p-0 cursor-pointer"
                style={{ outline: 'none', border: 'none' }}
                aria-label="Retroceder"
                onClick={() => setCurrent((current - 1 + featured.length) % featured.length)}
                tabIndex={-1}
              />
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-0 transition"
                onClick={() => setCurrent((current - 1 + featured.length) % featured.length)}
                aria-label="Anterior"
                style={{ display: current === 0 && featured.length <= 2 ? 'none' : undefined }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] pointer-events-none">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <div className="flex items-center justify-center w-full gap-2 md:gap-6 select-none">
                {getDisplayDishes().map(({ dish, size }) => {
                  const uniqueIdx = featured.findIndex(
                    d => d.name === dish.name && d.image === dish.image
                  );
                  return (
                    <CarouselCard
                      key={restaurant.id + '-' + uniqueIdx}
                      dish={dish}
                      onClick={() => size === 'main' && handleCardClick(dish)}
                      size={size}
                    />
                  );
                })}
              </div>
              {/* Área clicável direita */}
              <button
                className="absolute right-0 top-0 h-full w-[18vw] md:w-[120px] z-20 bg-transparent p-0 cursor-pointer"
                style={{ outline: 'none', border: 'none' }}
                aria-label="Avançar"
                onClick={() => setCurrent((current + 1) % featured.length)}
                tabIndex={-1}
              />
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-0 transition"
                onClick={() => setCurrent((current + 1) % featured.length)}
                aria-label="Próximo"
                style={{ display: current === featured.length - 1 && featured.length <= 2 ? 'none' : undefined }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] pointer-events-none">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
    </section>
  );
} 