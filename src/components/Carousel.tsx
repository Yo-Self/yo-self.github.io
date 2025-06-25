"use client";

import React, { useState, useRef, useEffect } from "react";
import { appData, Dish } from "./data";
import DishModal from "./DishModal";
import Image from "next/image";

function CarouselCard({ dish, onClick }: { dish: Dish; onClick: () => void }) {
  return (
    <div
      className="carousel-card min-w-full flex flex-col items-center cursor-pointer bg-transparent shadow-none p-0 mx-2"
      onClick={onClick}
    >
      <div className="w-full aspect-[4/3] overflow-hidden rounded-lg relative">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          className="w-full h-full object-cover"
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 400px"
          priority
        />
        <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-center font-semibold text-lg py-2 px-2" style={{backdropFilter: 'blur(2px)'}}>
          {dish.name}
        </div>
      </div>
    </div>
  );
}

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const featured = appData.featured_dishes;

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

  return (
    <section className="carousel-section py-8 bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-center">
          {/* Área clicável esquerda */}
          <div
            className="absolute left-0 top-0 h-full w-1/4 z-10 cursor-pointer flex items-center"
            onClick={() => setCurrent((current - 1 + featured.length) % featured.length)}
            aria-label="Anterior"
            style={{background: 'transparent'}}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-2 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] pointer-events-none">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </div>
          <div className="overflow-hidden w-full max-w-xl">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${current * 100}%)` }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {featured.map((dish) => (
                <div key={dish.name} className="min-w-full flex justify-center">
                  <CarouselCard dish={dish} onClick={() => handleCardClick(dish)} />
                </div>
              ))}
            </div>
          </div>
          {/* Área clicável direita */}
          <div
            className="absolute right-0 top-0 h-full w-1/4 z-10 cursor-pointer flex items-center justify-end"
            onClick={() => setCurrent((current + 1) % featured.length)}
            aria-label="Próximo"
            style={{background: 'transparent'}}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] pointer-events-none">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </div>
        </div>
        <div className="carousel-indicators flex justify-center mt-4 gap-2">
          {featured.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-indicator w-3 h-3 rounded-full ${idx === current ? "bg-primary dark:bg-cyan-400" : "bg-gray-300 dark:bg-gray-700"}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Ir para o slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
    </section>
  );
} 