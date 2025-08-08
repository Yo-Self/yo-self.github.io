import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";
import { Suspense } from "react";
import { fetchFullRestaurants, fetchRestaurantIds } from "@/services/restaurants";

export async function generateStaticParams() {
  const ids = await fetchRestaurantIds();
  return ids.map(id => ({ id }));
}

export default async function RestaurantMenuPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const restaurants = await fetchFullRestaurants();
  const initialRestaurant = restaurants.find(r => r.id === id) ?? null;
  if (!initialRestaurant) return notFound();
  return (
    <Suspense fallback={null}>
      <RestaurantClientPage
        initialRestaurant={initialRestaurant}
        restaurants={restaurants}
      />
    </Suspense>
  );
}