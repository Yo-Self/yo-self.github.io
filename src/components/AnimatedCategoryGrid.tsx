import React, { useState, useEffect } from "react";
import { MenuItem } from "./data";
import ImageWithLoading from "./ImageWithLoading";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface AnimatedCategoryGridProps {
  categories: string[];
  menuItems: MenuItem[];
  onSelectCategory: (category: string) => void;
  fallbackImage: string;
}

export default function AnimatedCategoryGrid({ categories, menuItems, onSelectCategory, fallbackImage }: AnimatedCategoryGridProps) {
  // Filtra categorias que possuem pelo menos um prato
  const filteredCategories = categories.filter(category => 
    menuItems.some(item => item.categories && item.categories.includes(category))
  );
  
  const allCard = (
    <AnimatedCategoryCard
      key="all"
      category="Todos"
      images={[fallbackImage]}
      onClick={() => onSelectCategory('all')}
      fallbackImage={fallbackImage}
      index={filteredCategories.length}
    />
  );
  
  return (
    <div className="grid grid-cols-2 gap-4 px-4 pt-4 pb-8 relative z-1">
      {filteredCategories.map((category, index) => {
        const items = menuItems.filter(item => 
          item.categories && item.categories.includes(category)
        );
        const images = items.map(item => item.image || fallbackImage);
        const imagesToUse = images.length > 0 ? images : [fallbackImage];
        return (
          <AnimatedCategoryCard
            key={category}
            category={category}
            images={imagesToUse}
            onClick={() => onSelectCategory(category)}
            fallbackImage={fallbackImage}
            index={index}
          />
        );
      })}
      {allCard}
    </div>
  );
}

function AnimatedCategoryCard({ 
  category, 
  images, 
  onClick, 
  fallbackImage, 
  index = 0 
}: { 
  category: string; 
  images: string[]; 
  onClick: () => void; 
  fallbackImage: string;
  index: number;
}) {
  const [current, setCurrent] = React.useState(0);
  const [next, setNext] = React.useState<number|null>(null);
  const [showNext, setShowNext] = React.useState(false);
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    triggerOnce: true
  });

  React.useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      const nextIdx = (current + 1) % images.length;
      setNext(nextIdx);
      setShowNext(true);
      setTimeout(() => {
        setCurrent(nextIdx);
        setShowNext(false);
        setNext(null);
      }, 1000); // duração do fade-in
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length, current]);

  const currentImg = images[current] || fallbackImage;
  const nextImg = next !== null ? (images[next] || fallbackImage) : null;

  return (
    <button
      ref={elementRef}
      className={`relative aspect-square rounded-2xl overflow-hidden shadow-lg group focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-100 dark:bg-gray-800 transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
      }`}
      style={{
        /* Delay removido para sincronizar animações */
      }}
      onClick={onClick}
    >
      {/* Imagem base (sempre visível) */}
      <ImageWithLoading
        src={currentImg}
        alt={category}
        className="object-cover w-full h-full absolute inset-0 z-0"
        fallbackSrc={fallbackImage}
      />
      {/* Próxima imagem faz fade-in por cima */}
      {showNext && nextImg && (
        <ImageWithLoading
          src={nextImg}
          alt={category}
          className="object-cover w-full h-full absolute inset-0 z-10 transition-opacity duration-1000 opacity-0 animate-fadein"
          fallbackSrc={fallbackImage}
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
