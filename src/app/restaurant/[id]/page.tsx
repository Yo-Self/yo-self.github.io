import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";
import { Suspense } from "react";
import { fetchFullRestaurants, fetchRestaurantIds, fetchRestaurantByIdWithData } from "@/services/restaurants";

export const revalidate = 60;
export const dynamicParams = true; // permitir fallback (GH Pages pode acessar direto via URL)

export async function generateStaticParams() {
  const ids = await fetchRestaurantIds();
  // Garantir que apenas UUIDs válidos sejam retornados (evita "[id]")
  const onlyUuids = ids.filter(id => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id));
  return onlyUuids.map(id => ({ id }));
}

export default async function RestaurantMenuPage({ params }: { params: { id: string } }) {
  const { id } = params;
  // Normaliza e valida o ID antes de qualquer fetch (evita tentar consultar "%5Bid%5D")
  const decodedId = (() => {
    try { return decodeURIComponent(id); } catch { return id; }
  })();
  if (!decodedId || decodedId.includes('[') || decodedId.includes(']')) {
    return notFound();
  }
  const [initialRestaurant, restaurants] = await Promise.all([
    fetchRestaurantByIdWithData(decodedId),
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