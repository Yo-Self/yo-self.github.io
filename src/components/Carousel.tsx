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

  return (
    <section className="carousel-section py-8 bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-center">
          <button
            className="carousel-btn carousel-btn--prev absolute left-0 z-10 p-2 bg-white dark:bg-gray-900 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setCurrent((current - 1 + featured.length) % featured.length)}
            aria-label="Anterior"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
          <div className="overflow-hidden w-full max-w-xl">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {featured.map((dish) => (
                <div key={dish.name} className="min-w-full flex justify-center">
                  <CarouselCard dish={dish} onClick={() => handleCardClick(dish)} />
                </div>
              ))}
            </div>
          </div>
          <button
            className="carousel-btn carousel-btn--next absolute right-0 z-10 p-2 bg-white dark:bg-gray-900 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setCurrent((current + 1) % featured.length)}
            aria-label="Próximo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
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