import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";
import { Suspense } from "react";
import { fetchFullRestaurants, fetchRestaurantIds, fetchRestaurantByIdWithData } from "@/services/restaurants";

export const revalidate = 60;
export const dynamicParams = false; // gerar apenas params estáticos

export async function generateStaticParams() {
  const ids = await fetchRestaurantIds();
  return ids.map(id => ({ id }));
}

export default async function RestaurantMenuPage({ params }: { params: { id: string } }) {
  const { id } = params;
  // Protege contra chamada acidental com literal "[id]" durante o export estático
  // (evita consulta inválida no Supabase que causa 22P02)
  const decoded = (() => { try { return decodeURIComponent(id); } catch { return id; } })();
  if (decoded === '[id]') {
    return notFound();
  }
  const [initialRestaurant, restaurants] = await Promise.all([
    fetchRestaurantByIdWithData(decoded),
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