"use client";

import React from "react";
import { Dish } from "./data";

type DishModalProps = {
  open: boolean;
  dish: Dish | null;
  onClose: () => void;
};

export default function DishModal({ open, dish, onClose }: DishModalProps) {
  if (!open || !dish) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <img src={dish.image} alt={dish.name} className="w-full h-48 object-cover rounded mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{dish.name}</h2>
        <p className="mb-2 text-gray-700 dark:text-gray-300">{dish.description}</p>
        <div className="mb-2">
          <span className="font-semibold text-gray-800 dark:text-gray-200">Ingredientes:</span>
          <span className="ml-1 text-gray-700 dark:text-gray-300">{dish.ingredients}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-gray-800 dark:text-gray-200">Alérgenos:</span>
          <span className="ml-1 text-gray-700 dark:text-gray-300">{dish.allergens}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-gray-800 dark:text-gray-200">Porção:</span>
          <span className="ml-1 text-gray-700 dark:text-gray-300">{dish.portion}</span>
        </div>
        <div className="text-xl font-bold text-primary dark:text-cyan-300 mb-2">${dish.price}</div>
        {dish.tags && (
          <div className="flex gap-2 mt-2">
            {dish.tags.map(tag => (
              <span key={tag} className="bg-primary dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 