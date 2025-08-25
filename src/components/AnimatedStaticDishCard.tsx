import React from "react";
import ImageWithLoading from "./ImageWithLoading";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface AnimatedStaticDishCardProps {
  dish: {
    name: string;
    description: string;
    price: string;
    image: string;
    tags?: string[];
  };
  size?: "large" | "small";
  index?: number;
}

export default function AnimatedStaticDishCard({ 
  dish, 
  size = "large", 
  index = 0 
}: AnimatedStaticDishCardProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
    triggerOnce: true
  });

  return (
    <div 
      ref={elementRef}
      className={`menu-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow flex flex-col items-center overflow-hidden w-full transition-all duration-700 ease-out ${
        size === "small" ? "max-w-full" : ""
      } ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
      }`}
      style={{
        /* Delay removido para sincronizar animações */
      }}
    >
      <div className="relative w-full">
        <ImageWithLoading
          src={dish.image}
          alt={dish.name}
          clickable={false}
          className={`w-full ${size === "small" ? "h-32" : "h-48"} object-cover rounded-t-lg`}
          fallbackSrc="/window.svg"
        >
          {/* Tag no canto superior direito - apenas para cards pequenos */}
          {size === "small" && dish.tags && dish.tags.length > 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-cyan-600 dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                {dish.tags[0]}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 w-full px-4 py-2">
            <h3 className="text-lg font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] truncate">{dish.name}</h3>
          </div>
        </ImageWithLoading>
      </div>
      <div className="w-full p-4 min-w-0 bg-white/50 dark:bg-transparent">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]">{dish.description}</p>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-bold text-cyan-600 dark:text-cyan-300 text-sm truncate drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]">{dish.price}</span>
          {/* Tags na parte inferior - apenas para cards grandes */}
          {size === "large" && (
            <div className="flex gap-1 flex-wrap flex-shrink-0">
              {dish.tags?.map((tag) => (
                <span key={tag} className="bg-cyan-600 dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
