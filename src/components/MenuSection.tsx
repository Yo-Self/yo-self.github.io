"use client";

import React, { useState, useEffect, useRef } from "react";
import { appData, MenuItem } from "./data";
import DishModal from "./DishModal";
import { useTranslation } from "./i18n";
import DishCard from "./DishCard";

interface MenuSectionProps {
  searchTerm?: string;
}

export default function MenuSection({ searchTerm = "" }: MenuSectionProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [previousCategory, setPreviousCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const menuItems = appData.menu_items;
  const categories = ["all", ...appData.menu_categories];
  const isSearching = !!searchTerm.trim();
  const userSelectedCategory = useRef(false);

  // Sempre que searchTerm mudar, se não for o usuário que mudou a categoria, seleciona 'Busca'
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

  // Quando o usuário clicar em uma categoria durante a busca, atualize previousCategory
  const handleCategoryClick = (category: string) => {
    if (isSearching) {
      userSelectedCategory.current = true;
      setPreviousCategory(category);
    }
    setActiveCategory(category);
  };

  // Filter logic
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

  // Render categories: show all categories plus 'Busca' as the last one when searching
  const renderCategories = () => {
    const allCategories = isSearching ? [...categories, "search"] : categories;
    return allCategories.map((category) => {
      if (category === "search") {
        return (
          <button
            key="search"
            className={`category-btn px-4 py-2 rounded-full ${activeCategory === "search" ? "bg-primary text-white dark:bg-cyan-700" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
            onClick={() => handleCategoryClick("search")}
            disabled={activeCategory === "search"}
          >
            {t("searchCategory")}
          </button>
        );
      }
      let label = t(category);
      return (
        <button
          key={category}
          className={`category-btn px-4 py-2 rounded-full ${activeCategory === category ? "bg-primary text-white dark:bg-cyan-700" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
          onClick={() => handleCategoryClick(category)}
        >
          {label}
        </button>
      );
    });
  };

  return (
    <section className="menu-section py-8 bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="category-buttons flex flex-wrap gap-2 mb-6">
          {renderCategories()}
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