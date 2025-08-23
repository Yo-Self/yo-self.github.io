"use client";

import Link from "next/link";
import DynamicCarousel from "../components/DynamicCarousel";
import ImageWithLoading from "@/components/ImageWithLoading";
import Image from "next/image";
import AnimatedStaticDishCard from "@/components/AnimatedStaticDishCard";
import { useState } from "react";
import { Restaurant } from "@/components/data";

// Dados reais do Café Moendo para demonstração
const moendoDishes = [
  {
    name: "Espresso Especial",
    description: "Café espresso premium",
    price: "8,90",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Destaque", "Cafés"]
  },
  {
    name: "Hambúrguer Artesanal",
    description: "Hambúrguer gourmet com batatas",
    price: "42,90",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Destaque", "Lanches"]
  },
  {
    name: "Cappuccino Cremoso",
    description: "Cappuccino com espuma cremosa e chocolate",
    price: "12,50",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Cafés"]
  },
  {
    name: "Sanduíche Natural",
    description: "Sanduíche com frango e vegetais frescos",
    price: "18,90",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Lanches"]
  },
  {
    name: "Latte Macchiato",
    description: "Leite vaporizado com shot de espresso",
    price: "14,90",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Cafés"]
  },
  {
    name: "X-Burger Clássico",
    description: "Hambúrguer com queijo, alface e tomate",
    price: "28,50",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Lanches"]
  },
  {
    name: "Mocha Especial",
    description: "Café com chocolate e chantilly",
    price: "16,90",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Cafés"]
  },
  {
    name: "X-Salada Premium",
    description: "Hambúrguer com salada completa e molho especial",
    price: "35,90",
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Lanches"]
  }
];

// Dados de exemplo para demonstração
const sampleDishes = [
  {
    name: "Sushi Salmão Premium",
    description: "Salmão fresco com arroz temperado e nori, acompanhado de wasabi e gengibre",
    price: "R$ 28,90",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
    tags: ["Destaque", "Fresco"]
  },
  {
    name: "Ramen Tradicional",
    description: "Macarrão em caldo rico com carne suína, ovo cozido e vegetais frescos",
    price: "R$ 32,50",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    tags: ["Mais Pedido"]
  },
  {
    name: "Temaki Atum",
    description: "Cone de nori recheado com atum fresco, arroz e vegetais crocantes",
    price: "R$ 24,90",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop",
    tags: ["Fresco"]
  }
];






// Componente estático de card de prato
function StaticDishCard({ dish, size = "large", index = 0 }: { dish: typeof sampleDishes[0]; size?: "large" | "small"; index?: number }) {
  return (
    <AnimatedStaticDishCard dish={dish} size={size} index={index} />
  );
}



export default function Home() {
  // Use fallback data initially to avoid build issues
  const [moendoRestaurant, setMoendoRestaurant] = useState<Restaurant | null>({
    id: "fallback",
    slug: "cafe-moendo",
    name: "Café Moendo",
    welcome_message: "Bem-vindo ao Café Moendo!",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    menu_categories: ["Cafés", "Lanches"],
    featured_dishes: moendoDishes.slice(0, 3).map(dish => ({
      ...dish,
      id: `fallback-${dish.name.toLowerCase().replace(/\s+/g, '-')}`,
      restaurant_id: "fallback",
      categories: dish.tags,
      category: dish.tags[0] || "Geral",
      ingredients: "Ingredientes frescos selecionados",
      allergens: "Consulte o atendente sobre alérgenos",
      portion: "1 porção"
    })),
    menu_items: moendoDishes.map(dish => ({
      ...dish,
      id: `fallback-${dish.name.toLowerCase().replace(/\s+/g, '-')}`,
      restaurant_id: "fallback",
      categories: dish.tags,
      category: dish.tags[0] || "Geral",
      ingredients: "Ingredientes frescos selecionados",
      allergens: "Consulte o atendente sobre alérgenos",
      portion: "1 porção"
    }))
  } as Restaurant);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Optional: Fetch real data after initial render (disabled for now to avoid build issues)
  /*
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const restaurant = await fetchRestaurantByIdWithData("e1f70b34-20f5-4e08-9b68-d801ca33ee54");
        if (restaurant) {
          setMoendoRestaurant(restaurant);
        }
      } catch (err) {
        setError(err as Error);
        console.error("Erro ao carregar restaurante Moendo:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, []);
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Carregando dados do restaurante...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Ocorreu um erro ao carregar o cardápio.</p>
          <p className="text-gray-600 dark:text-gray-300">Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28 lg:py-32">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Plataforma de cardápio digital focada em experiência e acessibilidade
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-700 dark:text-gray-300">
                O Yoself transforma seu cardápio em uma jornada intuitiva e inclusiva. QR Code sem fricção, leitura acessível, design moderno e navegação por gestos – tudo para seus clientes encontrarem o que desejam em poucos toques.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#features" className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 px-6 py-3 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  Como funciona
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />Acessível por padrão</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />Responsivo</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />Rápido</div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white dark:bg-gray-800 p-4">
                <div className="w-full max-w-sm mx-auto">
                  <StaticDishCard dish={sampleDishes[0]} size="large" index={0} />
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-40 md:w-56 rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5 bg-white dark:bg-gray-800 p-2">
                <div className="w-full">
                  <StaticDishCard dish={sampleDishes[1]} size="small" index={1} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Acessibilidade real</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Contraste adequado, suporte a leitores de tela, fontes ajustáveis e navegação por teclado e gestos. Seu cardápio para todos.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Experiência fluida</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Busca inteligente, categorias por gestos e destaques do chef. Tudo rápido e sem travar, mesmo em redes lentas.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Visual moderno</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Layout elegante com foco no prato, fotos grandes e tipografia clara. Valorize seu menu com design profissional.</p>
          </div>
        </div>
      </section>

      {/* Carousel Dinâmico com dados reais do Moendo */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-8">Destaques que chamam atenção</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">Carousel interativo com pratos especiais do restaurante Moendo</p>
        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white dark:bg-gray-800 p-8">
          {moendoRestaurant && moendoRestaurant.featured_dishes && moendoRestaurant.featured_dishes.length > 0 ? (
            (() => {
              try {
                return <DynamicCarousel restaurant={moendoRestaurant} showMostOrderedTitle={true} />;
              } catch (error) {
                console.error('Erro ao renderizar carousel:', error);
                return (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-300">Carousel temporariamente indisponível.</p>
                  </div>
                );
              }
            })()
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300">Nenhum destaque disponível no momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white text-center">Um cardápio que conquista no primeiro olhar</h2>
        <p className="mt-3 text-center text-gray-600 dark:text-gray-300 mb-12">Veja exemplos de como seu cardápio pode ficar dentro do Yoself.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Cards de Pratos</h3>
            <div className="space-y-4">
              {sampleDishes.slice(0, 2).map((dish, index) => (
                <StaticDishCard key={index} dish={dish} size="small" index={index} />
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Grid Responsivo</h3>
            <div className="grid grid-cols-2 gap-3 w-full">
              {sampleDishes.map((dish, index) => (
                <div key={index} className="w-full min-w-0">
                  <StaticDishCard dish={dish} size="small" index={index} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Modo Jornal</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                Navegação por páginas com gestos
              </div>
              <div className="grid grid-cols-2 gap-2">
                {moendoDishes.map((dish, index) => (
                  <div key={index} className="relative">
                    <ImageWithLoading
                      src={dish.image}
                      alt={dish.name}
                      clickable={false}
                      className="w-full h-20 object-cover rounded-lg"
                      fallbackSrc="/window.svg"
                    >
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg">
                        {dish.name}
                      </div>
                    </ImageWithLoading>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>





      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 p-1">
          <div className="rounded-2xl bg-white dark:bg-gray-900 px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Pronto para elevar seu cardápio?</h3>
              <p className="mt-2 text-gray-700 dark:text-gray-300">Leve a experiência do seu cliente para o próximo nível com o Yoself.</p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
