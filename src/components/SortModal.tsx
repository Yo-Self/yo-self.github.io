"use client";

import React, { useState, useEffect } from "react";
import { useModalScroll } from '../hooks/useModalScroll';

export type SortOption = {
  field: "name" | "price" | "default";
  direction: "asc" | "desc";
};

interface SortModalProps {
  open: boolean;
  onClose: () => void;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function SortModal({ open, onClose, currentSort, onSortChange }: SortModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  // Efeito para gerenciar o fechamento animado
  useEffect(() => {
    if (open) {
      setIsClosing(false);
    }
  }, [open]);

  // Controlar o scroll do body quando o modal abrir/fechar
  useModalScroll(open);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  };

  if (!open) return null;

  const handleSortChange = (field: "name" | "price" | "default", direction: "asc" | "desc") => {
    console.log('🔄 SortModal: Mudando ordenação para:', { field, direction });
    onSortChange({ field, direction });
    handleClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isClosing 
          ? 'animate-menu-backdrop-close' 
          : 'animate-menu-backdrop-open'
      }`}
      style={{
        background: isClosing 
          ? 'rgba(0, 0, 0, 0.3)' 
          : 'rgba(0, 0, 0, 0.5)',
        backdropFilter: isClosing ? 'blur(1.5px)' : 'blur(3px)'
      }}
    >
      <div 
        className={`bg-white dark:bg-gray-900 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl menu-transition ${
          isClosing 
            ? 'animate-sort-modal-close' 
            : 'animate-sort-modal-open'
        }`}
      >
        <div 
          className="flex items-center justify-between mb-6 transform transition-all duration-300 delay-25"
          style={{
            animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
          }}
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Ordenar por
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:scale-110 active:scale-95 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Ordenação Padrão */}
          <div 
            className="space-y-2 transform transition-all duration-300 delay-75"
            style={{
              animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
            }}
          >
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Ordenação</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange("default", "asc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  currentSort.field === "default"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Padrão
              </button>
            </div>
          </div>

          {/* Ordenação por Nome */}
          <div 
            className="space-y-2 transform transition-all duration-300 delay-150"
            style={{
              animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
            }}
          >
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Nome</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange("name", "asc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  currentSort.field === "name" && currentSort.direction === "asc"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                A → Z
              </button>
              <button
                onClick={() => handleSortChange("name", "desc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  currentSort.field === "name" && currentSort.direction === "desc"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Z → A
              </button>
            </div>
          </div>

          {/* Ordenação por Preço */}
          <div 
            className="space-y-2 transform transition-all duration-300 delay-200"
            style={{
              animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
            }}
          >
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Preço</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange("price", "asc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  currentSort.field === "price" && currentSort.direction === "asc"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Menor → Maior
              </button>
              <button
                onClick={() => handleSortChange("price", "desc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  currentSort.field === "price" && currentSort.direction === "desc"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Maior → Menor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 