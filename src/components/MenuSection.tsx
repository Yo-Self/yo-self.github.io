"use client";

import React, { useState, useEffect, useRef } from "react";
import CategoriesBar from "./CategoriesBar";
import useSwipeCategory from "./useSwipeCategory";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const isSearching = !!searchTerm.trim();
  const userSelectedCategory = useRef(false);
  const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [showFloatingCategories, setShowFloatingCategories] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Filtra categorias para mostrar apenas as que possuem produtos
  const availableCategories = categories.filter(category =>
    menuItems.some(item => item.category === category)
  );

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeCategory(activeCategory, setActiveCategory, availableCategories);

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
          <CategoriesBar
            allCategories={["all", ...availableCategories]}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categoryRefs={categoryRefs}
            t={t}
          />
        </div>
      )}
      <div className="container mx-auto px-0 pb-20 overflow-x-hidden">
        {/* Barra normal de categorias (sticky para UX melhor) */}
        <div
          ref={categoriesRef}
          className="sticky top-0 z-40 bg-white dark:bg-black px-0 pb-2 pl-4"
        >
          <CategoriesBar
            allCategories={["all", ...availableCategories]}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categoryRefs={categoryRefs}
            t={t}
          />
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