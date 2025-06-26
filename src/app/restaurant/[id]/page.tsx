import { restaurantMap, restaurants } from "@/components/data";
import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";

export function generateStaticParams() {
  return restaurants.map(r => ({ id: r.id }));
}

export default async function RestaurantMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialRestaurant = restaurantMap[id];
  if (!initialRestaurant) return notFound();
  return (
    <RestaurantClientPage
      initialRestaurant={initialRestaurant}
      restaurants={restaurants}
    />
  );
} 