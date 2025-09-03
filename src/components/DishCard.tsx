import React from "react";
import { Dish, MenuItem } from "./data";
import ImageWithLoading from "./ImageWithLoading";
import { CartUtils } from "../types/cart";

interface DishCardProps {
  dish: Dish | MenuItem;
  onClick?: () => void;
  size?: "large" | "small";
}

export default function DishCard({ dish, onClick, size = "large", fallbackImage }: DishCardProps & { fallbackImage: string }) {
  // Verificar se tem complementos obrigatórios com preço > 0
  const hasRequiredComplementsWithPrice = CartUtils.hasRequiredComplementsWithPrice(dish);
  
  return (
    <div
      className={`menu-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow cursor-pointer flex flex-col items-center ${size === "small" ? "max-w-xs" : ""}`}
      onClick={onClick}
    >
      <div className="relative w-full">
        <ImageWithLoading
          src={dish.image}
          alt={dish.name}
          fallbackSrc={fallbackImage}
          clickable={false}
          className={`w-full ${size === "small" ? "h-32" : "h-48"} object-cover rounded-t-lg`}
        >
          <div 
            className="absolute bottom-0 left-0 w-full px-4 py-2"
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              zIndex: 10
            }}
          >
            <h3 className="text-lg font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">{dish.name}</h3>
          </div>
        </ImageWithLoading>
      </div>
      <div className="w-full p-3">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{dish.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {hasRequiredComplementsWithPrice && (
              <span className="text-xs text-gray-500 dark:text-gray-400">a partir</span>
            )}
            <span className="font-bold text-primary dark:text-cyan-300">R${dish.price}</span>
          </div>
          <div className="flex gap-1">
            {dish.tags?.map((tag) => (
              <span key={tag} className="bg-primary dark:text-cyan-700 text-xs px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 