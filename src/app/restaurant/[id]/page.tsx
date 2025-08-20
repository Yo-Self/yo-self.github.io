import { redirect } from "next/navigation";
import { fetchRestaurantByIdWithData } from "../../../services/restaurants";

export const revalidate = 60;
export const dynamicParams = true;

export default async function RestaurantMenuPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Protege contra chamada acidental com literal "[id]" durante o export estático
  const decoded = (() => { try { return decodeURIComponent(id); } catch { return id; } })();
  if (decoded === '[id]') {
    return null;
  }
  
  // Buscar restaurante por ID para obter o slug
  const restaurant = await fetchRestaurantByIdWithData(decoded);
  
  if (!restaurant) {
    return null;
  }
  
  // Redirecionar para a nova rota com slug
  redirect(`/restaurant/${restaurant.slug}`);
}