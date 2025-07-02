"use client";
import React, { useState } from "react";
import { Restaurant } from "@/components/data";
import Header from "@/components/Header";
import Carousel from "@/components/Carousel";
import MenuSection from "@/components/MenuSection";
import SearchBar from "@/components/SearchBar";

interface RestaurantClientPageProps {
  initialRestaurant: Restaurant;
  restaurants: Restaurant[];
}

export default function RestaurantClientPage({ initialRestaurant, restaurants }: RestaurantClientPageProps) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(initialRestaurant.id);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId) ?? initialRestaurant;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <Header
        restaurant={selectedRestaurant}
        restaurants={restaurants}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={setSelectedRestaurantId}
      />
      <Carousel restaurant={selectedRestaurant} />
      <MenuSection
        menuItems={selectedRestaurant.menu_items}
        categories={selectedRestaurant.menu_categories}
        searchTerm={searchTerm}
      />
      <SearchBar
        restaurant={selectedRestaurant}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />
    </div>
  );
} 