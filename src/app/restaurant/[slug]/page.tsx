import { notFound } from "next/navigation";
import RestaurantClientPage from "./RestaurantClientPage";
import { Suspense } from "react";
import { fetchFullRestaurants, fetchRestaurantBySlugWithData } from "@/services/restaurants";
import type { Restaurant } from "@/components/data";

export const revalidate = 60;
export const dynamicParams = true; // permitir params dinâmicos

export async function generateStaticParams() {
  if (process.env.DISABLE_API_CALLS === 'true') return [];
  // Buscar todos os restaurantes para gerar slugs
  const restaurants = await fetchFullRestaurants();
  return restaurants.map(restaurant => ({ 
    slug: restaurant.slug 
  })).filter(param => param.slug); // Filtrar apenas restaurantes com slug válido
}

// Dados de fallback para testes
const getFallbackRestaurant = (slug: string): Restaurant => ({
  id: "fallback-test",
  slug: slug,
  name: "Auri Monteiro",
  welcome_message: "Bem-vindo ao Auri Monteiro!",
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
  waiter_call_enabled: true,
  whatsapp_enabled: true,
  whatsapp_phone: "5511999999999",
  menu_categories: ["Tortas", "Doces", "Bebidas", "Salgados"],
  featured_dishes: [
    {
      name: "Torta de Morango",
      description: "Deliciosa torta de morango com chantilly",
      price: "25,90",
      image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
      tags: ["Destaque", "Doce"],
      ingredients: "Morangos frescos, massa, chantilly",
      allergens: "Glúten, Lactose, Ovos",
      portion: "Fatia individual",
      category: "Tortas",
      categories: ["Tortas", "Doces"]
    },
    {
      name: "Café Especial",
      description: "Café especialmente selecionado",
      price: "8,50",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
      tags: ["Bebida", "Café"],
      ingredients: "Grãos especiais de café",
      allergens: "Nenhum",
      portion: "Xícara 150ml",
      category: "Bebidas",
      categories: ["Bebidas"]
    }
  ],
  menu_items: [
    {
      name: "Torta de Morango",
      description: "Deliciosa torta de morango com chantilly",
      price: "25,90",
      image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
      tags: ["Destaque", "Doce"],
      ingredients: "Morangos frescos, massa, chantilly",
      allergens: "Glúten, Lactose, Ovos",
      portion: "Fatia individual",
      category: "Tortas",
      categories: ["Tortas", "Doces"]
    },
    {
      name: "Café Especial",
      description: "Café especialmente selecionado",
      price: "8,50",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
      tags: ["Bebida", "Café"],
      ingredients: "Grãos especiais de café",
      allergens: "Nenhum",
      portion: "Xícara 150ml",
      category: "Bebidas",
      categories: ["Bebidas"]
    },
    {
      name: "Croassaint Doce",
      description: "Croassaint recheado com doce de leite",
      price: "12,90",
      image: "https://images.unsplash.com/photo-1555507036-ab794f4ec5d4?w=400&h=300&fit=crop",
      tags: ["Doce", "Pão"],
      ingredients: "Massa folhada, doce de leite",
      allergens: "Glúten, Lactose, Ovos",
      portion: "Unidade",
      category: "Doces",
      categories: ["Doces", "Salgados"],
      complement_groups: [
        {
          title: "Bebidas",
          description: "Escolha uma bebida",
          required: true,
          max_selections: 1,
          complements: [
            {
              name: "Café",
              description: "Café tradicional",
              price: "5,00",
              image: "",
              ingredients: "Café"
            },
            {
              name: "Suco",
              description: "Suco natural",
              price: "8,00",
              image: "",
              ingredients: "Frutas"
            }
          ]
        }
      ]
    }
  ]
});

export default async function RestaurantMenuPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Protege contra chamada acidental com literal "[slug]" durante o export estático
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  if (decoded === '[slug]') {
    return notFound();
  }
  
  // Usar dados de fallback quando API calls estão desabilitadas (modo teste)
  if (process.env.DISABLE_API_CALLS === 'true') {
    const fallbackRestaurant = getFallbackRestaurant(decoded);
    return (
      <Suspense fallback={null}>
        <RestaurantClientPage
          initialRestaurant={fallbackRestaurant}
          restaurants={[fallbackRestaurant]}
        />
      </Suspense>
    );
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
