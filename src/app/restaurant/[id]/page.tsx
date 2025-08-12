import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";
import { Suspense } from "react";
import { fetchFullRestaurants, fetchRestaurantIds, fetchRestaurantByIdWithData } from "@/services/restaurants";

export const revalidate = 60;
export const dynamicParams = false; // não gerar fallback para [id]

export async function generateStaticParams() {
  const ids = await fetchRestaurantIds();
  return ids.map(id => ({ id }));
}

export default async function RestaurantMenuPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [initialRestaurant, restaurants] = await Promise.all([
    fetchRestaurantByIdWithData(id),
    fetchFullRestaurants().catch(() => []),
  ]);
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