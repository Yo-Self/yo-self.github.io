"use client";

import React, { useState, useEffect, useRef } from "react";
import { MenuItem } from "./data";
import DishModal from "./DishModal";
import { useTranslation } from "./i18n";
import DishCard from "./DishCard";

interface MenuSectionProps {
  searchTerm?: string;
  menuItems: MenuItem[];
  categories: string[];
}

export default function MenuSection({ searchTerm = "", menuItems, categories }: MenuSectionProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [previousCategory, setPreviousCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const isSearching = !!searchTerm.trim();
  const userSelectedCategory = useRef(false);
  const searchCategoryRef = useRef<HTMLButtonElement | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [showFloatingCategories, setShowFloatingCategories] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Swipe state para pratos
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Função para mudar categoria por swipe
  const handleSwipeCategory = (direction: 'left' | 'right') => {
    const allCategories = ["all", ...availableCategories];
    const currentIdx = allCategories.indexOf(activeCategory);
    if (direction === 'left' && currentIdx < allCategories.length - 1) {
      setActiveCategory(allCategories[currentIdx + 1]);
    } else if (direction === 'right' && currentIdx > 0) {
      setActiveCategory(allCategories[currentIdx - 1]);
    }
  };

  // Handlers de touch para swipe
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 40) {
      if (distance > 0) {
        handleSwipeCategory('left');
      } else {
        handleSwipeCategory('right');
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Filtra categorias para mostrar apenas as que possuem produtos
  const availableCategories = categories.filter(category =>
    menuItems.some(item => item.category === category)
  );

  // Remove lógica de categoria 'search' ao buscar
  useEffect(() => {
    if (!isSearching && !userSelectedCategory.current) {
      setActiveCategory("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    // Sempre que a categoria ativa mudar, rolar para ela
    if (categoryRefs.current[activeCategory]) {
      categoryRefs.current[activeCategory]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      // Corrigir scroll lateral: garantir que o scroll do container pai não seja afetado
      if (categoryRefs.current[activeCategory]) {
        const el = categoryRefs.current[activeCategory];
        const parent = el?.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          if (elRect.right > parentRect.right) {
            parent.scrollLeft += elRect.right - parentRect.right;
          } else if (elRect.left < parentRect.left) {
            parent.scrollLeft -= parentRect.left - elRect.left;
          }
        }
      }
    }
  }, [activeCategory, isSearching]);

  useEffect(() => {
    const handleScroll = () => {
      if (!categoriesRef.current) return;
      const rect = categoriesRef.current.getBoundingClientRect();
      setShowFloatingCategories(rect.top < 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  let filteredItems: MenuItem[] = [];
  const term = searchTerm.trim().toLowerCase();
  if (activeCategory === "all") {
    filteredItems = menuItems;
  } else {
    filteredItems = menuItems.filter(item => item.category === activeCategory);
  }

  const handleCardClick = (item: MenuItem) => {
    setSelectedDish(item);
    setModalOpen(true);
  };

  const renderCategories = () => {
    const allCategories = ["all", ...availableCategories];
    return allCategories.map((category) => {
      const label = t(category);
      return (
        <button
          key={category}
          ref={el => { categoryRefs.current[category] = el; }}
          className={`category-btn px-4 py-2 rounded-lg ${activeCategory === category ? "bg-primary text-white dark:bg-cyan-700" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
          onClick={() => handleCategoryClick(category)}
        >
          {label}
        </button>
      );
    });
  };

  React.useEffect(() => {
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    return () => {
      document.documentElement.style.overflowX = '';
      document.body.style.overflowX = '';
    };
  }, []);

  return (
    <section className="menu-section py- bg-white dark:bg-black">
      {/* Floating header de categorias */}
      {showFloatingCategories && (
        <div className="fixed top-0 left-0 w-screen z-50 bg-white dark:bg-black px-4 py-1" style={{ minWidth: '100vw' }}>
          <div
            className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-1 pb-1 no-scrollbar max-w-full overflow-x-auto"
            style={{ WebkitOverflowScrolling: 'touch', overflowY: 'hidden', maxWidth: '100vw', minWidth: 0 }}
          >
            {renderCategories()}
          </div>
        </div>
      )}
      <div className="container mx-auto px-0 pb-20 overflow-x-hidden">
        {/* Barra normal de categorias (sticky para UX melhor) */}
        <div
          ref={categoriesRef}
          className="sticky top-0 z-40 bg-white dark:bg-black px-0 pb-2 pl-4"
        >
          <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-1 pb-1 bg-white dark:bg-black no-scrollbar max-w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', overflowY: 'hidden', maxWidth: '100vw', minWidth: 0 }}>
            {renderCategories()}
          </div>
        </div>
        <div
          className="menu-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {filteredItems.map((item) => (
            <DishCard key={item.name} dish={item} onClick={() => handleCardClick(item)} size="large" />
          ))}
        </div>
      </div>
      <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
    </section>
  );
} 