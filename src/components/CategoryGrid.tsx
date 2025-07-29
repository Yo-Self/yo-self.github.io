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
  const allCard = (
    <CategoryCard
      key="all"
      category="Todos"
      images={[fallbackImage]}
      onClick={() => onSelectCategory('all')}
      fallbackImage={fallbackImage}
    />
  );
  return (
    <div className="grid grid-cols-2 gap-4 px-4 pt-4 pb-8">
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
      {allCard}
    </div>
  );
}

function CategoryCard({ category, images, onClick, fallbackImage }: { category: string; images: string[]; onClick: () => void; fallbackImage: string }) {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState<number|null>(null);
  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      const nextIdx = (current + 1) % images.length;
      setNext(nextIdx);
      setShowNext(true);
      setTimeout(() => {
        setCurrent(nextIdx);
        setShowNext(false);
        setNext(null);
      }, 2000); // duração do fade-in aumentada para 1000ms
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length, current]);

  const currentImg = images[current] || fallbackImage;
  const nextImg = next !== null ? (images[next] || fallbackImage) : null;

  return (
    <button
      className="relative aspect-square rounded-2xl overflow-hidden shadow-lg group focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-100 dark:bg-gray-800"
      onClick={onClick}
    >
      {/* Imagem base (sempre visível) */}
      <img
        src={currentImg}
        alt={category}
        className="object-cover w-full h-full absolute inset-0 z-0"
        draggable={false}
        onError={e => (e.currentTarget.src = fallbackImage)}
      />
      {/* Próxima imagem faz fade-in por cima */}
      {showNext && nextImg && (
        <img
          src={nextImg}
          alt={category}
          className="object-cover w-full h-full absolute inset-0 z-10 transition-opacity duration-1000 opacity-0 animate-fadein"
          style={{animation: 'fadein 1s forwards'}}
          draggable={false}
          onError={e => (e.currentTarget.src = fallbackImage)}
        />
      )}
      {/* Overlay para escurecer e destacar o nome */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
        <span className="text-white text-xl md:text-2xl font-bold drop-shadow-lg text-center px-2">
          {category}
        </span>
      </div>
      <style jsx>{`
        @keyframes fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </button>
  );
} 