import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";
import { Suspense } from "react";
import { fetchFullRestaurants, fetchRestaurantBySlugWithData } from "@/services/restaurants";

export const revalidate = 60;
export const dynamicParams = true; // permitir params dinâmicos

export async function generateStaticParams() {
  // Buscar todos os restaurantes para gerar slugs
  const restaurants = await fetchFullRestaurants();
  return restaurants.map(restaurant => ({ 
    slug: restaurant.slug 
  })).filter(param => param.slug); // Filtrar apenas restaurantes com slug válido
}

export default async function RestaurantMenuPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Protege contra chamada acidental com literal "[slug]" durante o export estático
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  if (decoded === '[slug]') {
    return notFound();
  }
  
  // Buscar restaurante por slug
  const initialRestaurant = await fetchRestaurantBySlugWithData(decoded);
  
  if (!initialRestaurant) {
    return notFound();
  }
  
  const restaurants = await fetchFullRestaurants().catch(() => []);
  
  return (
    <Suspense fallback={null}>
      <RestaurantClientPage
        initialRestaurant={initialRestaurant}
        restaurants={restaurants}
      />
    </Suspense>
  );
}
