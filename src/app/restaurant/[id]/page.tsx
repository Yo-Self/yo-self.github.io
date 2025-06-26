import { restaurantMap, restaurants } from "@/components/data";
import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";

export function generateStaticParams() {
  return restaurants.map(r => ({ id: r.id }));
}

export default function RestaurantMenuPage({ params }: { params: { id: string } }) {
  const initialRestaurant = restaurantMap[params.id];
  if (!initialRestaurant) return notFound();
  return (
    <RestaurantClientPage
      initialRestaurant={initialRestaurant}
      restaurants={restaurants}
    />
  );
} 