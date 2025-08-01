import React from "react";
import { Dish } from "./data";

interface ChatDishCardProps {
  dish: Dish;
  onClick?: () => void;
}

export default function ChatDishCard({ dish, onClick }: ChatDishCardProps) {
  const [imgSrc, setImgSrc] = React.useState(dish.image);
  
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow duration-200 max-w-sm"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={imgSrc}
          alt={dish.name}
          className="w-full h-32 object-cover rounded-t-lg"
          onError={() => setImgSrc("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80")}
        />
        {dish.tags && dish.tags.length > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {dish.tags[0]}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
          {dish.name}
        </h4>
        <p className="text-gray-600 dark:text-gray-300 text-xs mb-2 overflow-hidden" style={{ 
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical' 
        }}>
          {dish.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">
            R$ {dish.price}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {dish.category}
          </span>
        </div>
      </div>
    </div>
  );
} 