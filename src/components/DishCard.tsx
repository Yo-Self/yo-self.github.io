import React from "react";
import { Dish } from "./data";

interface DishCardProps {
  dish: Dish;
  onClick?: () => void;
  size?: "large" | "small";
}

export default function DishCard({ dish, onClick, size = "large" }: DishCardProps) {
  return (
    <div
      className={`menu-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-4 cursor-pointer flex flex-col items-center ${size === "small" ? "max-w-xs" : ""}`}
      onClick={onClick}
    >
      <img
        src={dish.image}
        alt={dish.name}
        className={`w-full ${size === "small" ? "h-32" : "h-48"} object-cover rounded mb-4`}
      />
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{dish.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{dish.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary dark:text-cyan-300">R${dish.price}</span>
          <div className="flex gap-1">
            {dish.tags?.map((tag) => (
              <span key={tag} className="bg-primary dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 