import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";
import { Suspense } from "react";
import { fetchFullRestaurants, fetchRestaurantIds, fetchRestaurantByIdWithData } from "@/services/restaurants";

export const revalidate = 0; // TEMPORÁRIO: Forçar regeneração imediata
export const dynamicParams = true; // permitir params dinâmicos

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
  
  // Tenta buscar por ID primeiro (UUID), se falhar, tenta por slug
  let initialRestaurant = null;
  try {
    initialRestaurant = await fetchRestaurantByIdWithData(decoded);
  } catch (error) {
    // Se falhou ao buscar por ID (provavelmente não é um UUID válido), tenta por slug
    console.log('Falhou ao buscar por ID, tentando por slug:', decoded);
  }
  
  if (!initialRestaurant) {
    // Se não encontrou por ID, não tenta por slug (campo não existe na tabela)
    console.log('Restaurante não encontrado por ID:', decoded);
  }
  
  const restaurants = await fetchFullRestaurants().catch(() => []);
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