"use client";

import React from "react";

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
  if (!open) return null;

  const handleSortChange = (field: "name" | "price" | "default", direction: "asc" | "desc") => {
    onSortChange({ field, direction });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Ordenar por
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Ordenação Padrão */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Ordenação</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange("default", "asc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
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
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Nome</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange("name", "asc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                  currentSort.field === "name" && currentSort.direction === "asc"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                A → Z
              </button>
              <button
                onClick={() => handleSortChange("name", "desc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
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
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Preço</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange("price", "asc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                  currentSort.field === "price" && currentSort.direction === "asc"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Menor → Maior
              </button>
              <button
                onClick={() => handleSortChange("price", "desc")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
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

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
} 