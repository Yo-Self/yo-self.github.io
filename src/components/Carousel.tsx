"use client";

import React, { useState, useRef, useEffect } from "react";
import { appData, Dish } from "./data";
import DishModal from "./DishModal";
import DishCard from "./DishCard";

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
              {featured.map((dish, idx) => (
                <div key={dish.name} className="min-w-full flex justify-center">
                  <DishCard dish={dish} onClick={() => handleCardClick(dish)} size="small" />
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