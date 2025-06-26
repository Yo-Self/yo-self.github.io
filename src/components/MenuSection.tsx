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

  // Filtra categorias para mostrar apenas as que possuem produtos
  const availableCategories = categories.filter(category =>
    menuItems.some(item => item.category === category)
  );

  useEffect(() => {
    if (isSearching) {
      setPreviousCategory(activeCategory);
      setActiveCategory("search");
    }
    if (!isSearching && activeCategory === "search") {
      setActiveCategory(previousCategory);
      userSelectedCategory.current = false;
    }
    if (!isSearching && !userSelectedCategory.current) {
      setActiveCategory("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    // Quando a categoria 'search' for ativada, rolar para ela
    if (isSearching && activeCategory === 'search' && searchCategoryRef.current) {
      searchCategoryRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [isSearching, activeCategory]);

  useEffect(() => {
    // Sempre que a categoria ativa mudar, rolar para ela
    if (!isSearching && activeCategory !== 'search' && categoryRefs.current[activeCategory]) {
      categoryRefs.current[activeCategory]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeCategory, isSearching]);

  const handleCategoryClick = (category: string) => {
    if (isSearching) {
      userSelectedCategory.current = true;
      setPreviousCategory(category);
    }
    setActiveCategory(category);
  };

  let filteredItems: MenuItem[] = [];
  const term = searchTerm.trim().toLowerCase();
  if (isSearching) {
    if (activeCategory === "search") {
      filteredItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    } else {
      filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === "all" || item.category === activeCategory;
        const matchesSearch =
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)));
        return matchesCategory && matchesSearch;
      });
    }
  } else {
    filteredItems = activeCategory === "all"
      ? menuItems
      : menuItems.filter(item => item.category === activeCategory);
  }

  const handleCardClick = (item: MenuItem) => {
    setSelectedDish(item);
    setModalOpen(true);
  };

  const renderCategories = () => {
    const allCategories = isSearching ? ["all", ...availableCategories, "search"] : ["all", ...availableCategories];
    return allCategories.map((category) => {
      if (category === "search") {
        return (
          <button
            key="search"
            ref={searchCategoryRef}
            className={`category-btn px-4 py-2 rounded-lg ${activeCategory === "search" ? "bg-primary text-white dark:bg-cyan-700" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
            onClick={() => handleCategoryClick("search")}
            disabled={activeCategory === "search"}
          >
            {t("searchCategory")}
          </button>
        );
      }
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

  return (
    <section className="menu-section py- bg-white dark:bg-black">
      <div className="container mx-auto px-4 pb-20">
        <div className="sticky top-0 bg-white dark:bg-black z-30 px-0 py-3">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100 block mb-2">Categorias</span>
          <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-1 w-full pb-2 bg-white dark:bg-black">
            {renderCategories()}
          </div>
        </div>
        <div className="menu-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <DishCard key={item.name} dish={item} onClick={() => handleCardClick(item)} size="large" />
          ))}
        </div>
      </div>
      <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
    </section>
  );
} 