"use client";

import React from "react";
import { useTranslation } from "./i18n";
import { Restaurant } from "./data";

interface HeaderProps {
  restaurant?: Restaurant;
  restaurants?: Restaurant[];
  selectedRestaurantId?: string;
  onSelectRestaurant?: (id: string) => void;
}

export default function Header({ restaurant, restaurants, selectedRestaurantId, onSelectRestaurant }: HeaderProps) {
  const { t } = useTranslation();
  if (restaurants && restaurants.length > 1) {
    return (
      <header className="header bg-white dark:bg-black shadow-sm py-1">
        <div className="container mx-auto flex items-center justify-center px-4 gap-4">
          <select
            className="text-xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none"
            value={selectedRestaurantId}
            onChange={e => onSelectRestaurant?.(e.target.value)}
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </header>
    );
  }
  // fallback: single restaurant
  return (
    <header className="header bg-white dark:bg-black shadow-sm py-1">
      <div className="container mx-auto flex items-center justify-center px-4">
        <h1 className="logo text-xl font-bold text-gray-900 dark:text-gray-100">{restaurant?.name}</h1>
      </div>
    </header>
  );
} 