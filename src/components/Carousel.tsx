"use client";

import React, { useState, useRef, useEffect } from "react";
import { appData, Dish } from "./data";

export default function Carousel() {
  const [current, setCurrent] = useState(0);
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

  return (
    <section className="carousel-section py-8 bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-center">
          <button
            className="carousel-btn carousel-btn--prev absolute left-0 z-10 p-2 bg-white dark:bg-gray-900 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setCurrent((current - 1 + featured.length) % featured.length)}
            aria-label="Previous"
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
                <div
                  key={dish.name}
                  className="carousel-card min-w-full flex flex-col items-center bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-4 mx-2"
                >
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="carousel-card-image w-full h-48 object-cover rounded mb-4"
                  />
                  <div className="carousel-card-content w-full">
                    <h3 className="carousel-card-title text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{dish.name}</h3>
                    <p className="carousel-card-description text-sm text-gray-600 dark:text-gray-300 mb-2">{dish.description}</p>
                    <div className="carousel-card-footer flex items-center justify-between">
                      <span className="carousel-card-price font-bold text-primary dark:text-cyan-300">${dish.price}</span>
                      <div className="carousel-card-tags flex gap-1">
                        {dish.tags?.map((tag) => (
                          <span key={tag} className="carousel-card-tag bg-primary dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            className="carousel-btn carousel-btn--next absolute right-0 z-10 p-2 bg-white dark:bg-gray-900 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setCurrent((current + 1) % featured.length)}
            aria-label="Next"
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
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 