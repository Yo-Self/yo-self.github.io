"use client";

import React, { useEffect } from "react";
import { Dish } from "./data";

type DishModalProps = {
  open: boolean;
  dish: Dish | null;
  onClose: () => void;
};

export default function DishModal({ open, dish, onClose }: DishModalProps) {
  // Interceptar o botão voltar do navegador quando o modal estiver aberto
  useEffect(() => {
    if (!open) return;

    const handlePopState = (event: PopStateEvent) => {
      // Prevenir a navegação padrão e fechar o modal
      event.preventDefault();
      onClose();
      
      // Adicionar uma entrada no histórico para compensar a que foi removida
      window.history.pushState(null, '', window.location.href);
    };

    // Adicionar uma entrada no histórico quando o modal abrir
    window.history.pushState(null, '', window.location.href);

    // Adicionar o listener para o evento popstate
    window.addEventListener('popstate', handlePopState);

    // Cleanup: remover o listener quando o modal fechar
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open, onClose]);

  if (!open || !dish) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full overflow-hidden relative mx-4 my-8" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <img src={dish.image} alt={dish.name} className="w-full h-48 object-cover" />
          <button
            className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center bg-transparent p-0 m-0 focus:outline-none z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 w-full px-4 py-2">
            <h2 className="text-2xl font-bold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">{dish.name}</h2>
          </div>
        </div>
        <div className="p-6">
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
          <div className="text-xl font-bold text-primary dark:text-cyan-300 mb-2">R${dish.price}</div>
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
    </div>
  );
} 