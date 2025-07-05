"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "./i18n";
import { Restaurant } from "./data";
import { useRouter } from "next/navigation";

interface HeaderProps {
  restaurant?: Restaurant;
  restaurants?: Restaurant[];
  selectedRestaurantId?: string;
  onSelectRestaurant?: (id: string) => void;
}

function RestaurantDropdown({ restaurants, selectedRestaurantId, onSelect, current }: { restaurants: Restaurant[], selectedRestaurantId?: string, onSelect: (id: string) => void, current?: Restaurant }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        className="relative w-full h-8 rounded-none border-none shadow-none bg-transparent flex items-center justify-center overflow-hidden"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ padding: 0 }}
      >
        <span data-tutorial="restaurant-switch" className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
          {current?.name}
          <svg className={`w-6 h-6 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1.5px 4px rgba(0,0,0,0.7))' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 max-w-xs bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-3 flex flex-col gap-3 animate-fade-in">
          {restaurants.map(r => (
            <button
              key={r.id}
              className={`relative w-full h-20 rounded-2xl overflow-hidden transition ring-offset-2 focus:outline-none ${r.id === selectedRestaurantId ? 'ring-2 ring-cyan-500' : ''}`}
              onClick={() => { onSelect(r.id); setOpen(false); router.push(`/restaurant/${r.id}`); }}
            >
              <img src={r.image} alt={r.name} className="object-cover w-full h-full rounded-2xl" />
              <span className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold drop-shadow-lg text-center px-2 bg-black/30">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ restaurant, restaurants, selectedRestaurantId, onSelectRestaurant }: HeaderProps) {
  const { t } = useTranslation();
  if (restaurants && restaurants.length > 1 && restaurant) {
    return (
      <header className="header bg-white dark:bg-black shadow-sm p-0 m-0">
        <div className="container mx-auto flex flex-col items-center justify-center px-0 m-0 pt-3">
          <RestaurantDropdown
            restaurants={restaurants}
            selectedRestaurantId={selectedRestaurantId}
            onSelect={onSelectRestaurant!}
            current={restaurant}
          />
        </div>
      </header>
    );
  }
  // fallback: single restaurant
  return (
    <header className="header bg-white dark:bg-black shadow-sm p-0 m-0">
      <div className="container mx-auto flex items-center justify-center px-4 m-0 pt-6">
        <h1 className="logo text-xl font-bold text-gray-900 dark:text-gray-100">{restaurant?.name}</h1>
      </div>
    </header>
  );
} 