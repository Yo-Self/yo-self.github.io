"use client";

import React, { useState } from "react";
import { appData, MenuItem } from "./data";
import DishModal from "./DishModal";

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const menuItems = appData.menu_items;
  const categories = ["all", ...appData.menu_categories];

  const filteredItems = activeCategory === "all" ? menuItems : menuItems.filter(item => item.category === activeCategory);

  const handleCardClick = (item: MenuItem) => {
    setSelectedDish(item);
    setModalOpen(true);
  };

  return (
    <section className="menu-section py-8 bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="category-buttons flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn px-4 py-2 rounded-full ${activeCategory === category ? "bg-primary text-white dark:bg-cyan-700" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
              onClick={() => setActiveCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        <div className="menu-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item.name} className="menu-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-4 cursor-pointer" onClick={() => handleCardClick(item)}>
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded mb-4" />
              <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{item.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary dark:text-cyan-300">${item.price}</span>
                <div className="flex gap-1">
                  {item.tags?.map((tag) => (
                    <span key={tag} className="bg-primary dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
    </section>
  );
} 