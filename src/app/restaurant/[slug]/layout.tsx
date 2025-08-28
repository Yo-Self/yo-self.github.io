import { fetchRestaurantBySlugWithData } from "@/services/restaurants";
import { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  
  // Protege contra chamada acidental com literal "[slug]" durante o export estático
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  if (decoded === '[slug]') {
    return {
      title: "Cardápio digital",
      description: "Cardápio digital para restaurantes",
    };
  }
  
  // Buscar restaurante por slug
  const restaurant = await fetchRestaurantBySlugWithData(decoded);
  
  if (!restaurant) {
    return {
      title: "Cardápio digital",
      description: "Cardápio digital para restaurantes",
    };
  }
  
  // Canonical absoluto e manifest dinâmico com start_url correto
  const origin = process.env.NEXT_PUBLIC_SITE_URL || '';
  const path = `/restaurant/${decoded}`;
  const absolute = origin ? `${origin}${path}` : path;
  
  return {
    title: `Cardápio digital ${restaurant.name}`,
    description: `Cardápio digital do ${restaurant.name}`,
    alternates: {
      canonical: absolute,
    },
    manifest: `/api/manifest?start_url=${encodeURIComponent(path)}&name=${encodeURIComponent(restaurant.name + ' - Cardápio')}&short_name=${encodeURIComponent(restaurant.name)}`,
    openGraph: {
      title: `Cardápio digital ${restaurant.name}`,
      description: `Cardápio digital do ${restaurant.name}`,
      url: absolute,
    },
    twitter: {
      title: `Cardápio digital ${restaurant.name}`,
      description: `Cardápio digital do ${restaurant.name}`,
    },
  };
}

export default function RestaurantLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
