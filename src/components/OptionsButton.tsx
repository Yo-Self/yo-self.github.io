"use client";

import React, { useState } from "react";
import OptionsModal, { SortOption } from "./OptionsModal";
import { Restaurant } from "./data";

interface OptionsButtonProps {
  currentSort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  restaurant?: Restaurant;
}

export default function OptionsButton({ currentSort, onSortChange, restaurant }: OptionsButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const dummySort: SortOption = { field: "default", direction: "asc" };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-655 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 shadow-lg text-white hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="Opções e ordenação do cardápio"
        title="Opções do cardápio"
        data-tutorial="options-button"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>
      
      <OptionsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentSort={currentSort || dummySort}
        onSortChange={onSortChange || (() => {})}
        restaurant={restaurant}
        showSort={!!onSortChange}
      />
    </>
  );
}
