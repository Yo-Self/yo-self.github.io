"use client";

import React, { Suspense } from "react";
import RestaurantClientPage from "./RestaurantClientPage";
import { useRestaurantBySlug, useRestaurantList } from "@/hooks/useRestaurantBySlug";
import SetCurrentRestaurant from "@/components/SetCurrentRestaurant";

// Loading component for better UX
function RestaurantLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando restaurante...</p>
      </div>
    </div>
  );
}

// Error component
function RestaurantError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao carregar restaurante</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

// Restaurant not found component
function RestaurantNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-gray-400 text-6xl mb-4">🍽️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Restaurante não encontrado</h2>
        <p className="text-gray-600">O restaurante que você está procurando não existe ou foi removido.</p>
      </div>
    </div>
  );
}

// Main restaurant client component
export default function RestaurantClient({ slug }: { slug: string }) {
  const { restaurant, isLoading, error, refetch } = useRestaurantBySlug(slug);
  const { restaurants } = useRestaurantList();

  if (isLoading) {
    return <RestaurantLoading />;
  }

  if (error) {
    return <RestaurantError error={error} onRetry={refetch} />;
  }

  if (!restaurant) {
    return <RestaurantNotFound />;
  }

  return (
    <>
      <SetCurrentRestaurant />
      <Suspense fallback={<RestaurantLoading />}>
        <RestaurantClientPage
          initialRestaurant={restaurant}
          restaurants={restaurants}
        />
      </Suspense>
    </>
  );
}