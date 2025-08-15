import React from 'react';
import { Dish, MenuItem } from './data';
import CardJornal from './CardJornal';

interface ChatDishCardsProps {
  dishes: (Dish | MenuItem)[];
  onDishClick: (dish: Dish | MenuItem) => void;
}

export default function ChatDishCards({ dishes, onDishClick }: ChatDishCardsProps) {
  if (!dishes || dishes.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        🍽️ Pratos recomendados:
      </p>
      <div className="grid grid-cols-1 gap-2">
        {dishes.map((dish, index) => (
          <div 
            key={`${dish.name}-${index}`} 
            className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
            onClick={() => onDishClick(dish)}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex">
                <div className="w-20 h-20 flex-shrink-0">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {dish.name}
                    </h4>
                    <span className="text-sm font-bold text-primary dark:text-cyan-500 ml-2">
                      R$ {dish.price}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {dish.description}
                  </p>
                  {dish.tags && dish.tags.length > 0 && (
                    <span className="inline-block mt-1 text-xs bg-primary/10 dark:bg-cyan-500/10 text-primary dark:text-cyan-500 px-2 py-0.5 rounded-full">
                      {dish.tags[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
