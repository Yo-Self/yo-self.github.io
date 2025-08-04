"use client";

import React, { useState } from "react";
import SortModal, { SortOption } from "./SortModal";

interface SortButtonProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function SortButton({ currentSort, onSortChange }: SortButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const getSortIcon = () => {
    // Ícone base de ordenação
    const baseIcon = (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    );

    // Se há ordenação ativa, mostra ícone específico
    if (currentSort.field === "default") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    } else if (currentSort.field === "name") {
      return currentSort.direction === "asc" ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      );
    } else if (currentSort.field === "price") {
      return currentSort.direction === "asc" ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      );
    }

    return baseIcon;
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-600 transition-colors duration-200 shadow-lg text-white"
        aria-label="Ordenar pratos"
        title="Ordenar pratos"
      >
        {getSortIcon()}
      </button>
      
      <SortModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentSort={currentSort}
        onSortChange={onSortChange}
      />
    </>
  );
} 