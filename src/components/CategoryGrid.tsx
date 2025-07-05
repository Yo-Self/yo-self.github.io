import React, { useState, useEffect } from "react";
import { MenuItem } from "./data";

interface CategoryGridProps {
  categories: string[];
  menuItems: MenuItem[];
  onSelectCategory: (category: string) => void;
  fallbackImage: string;
}

export default function CategoryGrid({ categories, menuItems, onSelectCategory, fallbackImage }: CategoryGridProps) {
  // Filtra categorias que possuem pelo menos um prato
  const filteredCategories = categories.filter(category => menuItems.some(item => item.category === category));
  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-8">
      {/* Card 'Todos' */}
      <CategoryCard
        key="all"
        category="Todos"
        images={[fallbackImage]}
        onClick={() => onSelectCategory('all')}
        fallbackImage={fallbackImage}
      />
      {filteredCategories.map((category) => {
        const items = menuItems.filter(item => item.category === category);
        const images = items.map(item => item.image || fallbackImage);
        const imagesToUse = images.length > 0 ? images : [fallbackImage];
        return (
          <CategoryCard
            key={category}
            category={category}
            images={imagesToUse}
            onClick={() => onSelectCategory(category)}
            fallbackImage={fallbackImage}
          />
        );
      })}
    </div>
  );
}

function CategoryCard({ category, images, onClick, fallbackImage }: { category: string; images: string[]; onClick: () => void; fallbackImage: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images.length]);

  const imgSrc = images[current] || fallbackImage;

  return (
    <button
      className="relative aspect-square rounded-2xl overflow-hidden shadow-lg group focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-100 dark:bg-gray-800"
      onClick={onClick}
    >
      <img
        src={imgSrc}
        alt={category}
        className="object-cover w-full h-full"
        onError={e => (e.currentTarget.src = fallbackImage)}
      />
      {/* Overlay para escurecer e destacar o nome */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <span className="text-white text-xl md:text-2xl font-bold drop-shadow-lg text-center px-2">
          {category}
        </span>
      </div>
    </button>
  );
} 