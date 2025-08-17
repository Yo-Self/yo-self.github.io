import Link from "next/link";
import { fetchRestaurantByIdWithData } from "@/services/restaurants";
import DynamicCarousel from "../components/DynamicCarousel";
import ImageWithLoading from "@/components/ImageWithLoading";
import { OrganizationService } from "@/services/organizations";
import Image from "next/image";

// Configuração de cache para GitHub Pages
export const revalidate = 3600; // 1 hora

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

// Componente para exibir organizações
async function OrganizationsSection() {
  const organizations = await OrganizationService.listForStatic();
  
  if (!organizations || organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhuma organização encontrada
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Em breve teremos organizações parceiras disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map((organization) => (
        <Link
          key={organization.id}
          href={`/organization/${organization.slug}`}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group"
        >
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              {organization.avatar_url && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={organization.avatar_url}
                    alt={organization.full_name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {organization.full_name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Organização parceira
                </p>
              </div>
            </div>
            <div className="flex items-center text-blue-600 text-sm font-medium">
              Ver restaurantes
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Componente estático de card de prato
function StaticDishCard({ dish, size = "large" }: { dish: typeof sampleDishes[0]; size?: "large" | "small" }) {
  return (
    <div className={`menu-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow flex flex-col items-center overflow-hidden w-full ${size === "small" ? "max-w-full" : ""}`}>
      <div className="relative w-full">
        <ImageWithLoading
          src={dish.image}
          alt={dish.name}
          className={`w-full ${size === "small" ? "h-32" : "h-48"} object-cover rounded-t-lg`}
          fallbackSrc="/window.svg"
        >
          {/* Tag no canto superior direito - apenas para cards pequenos */}
          {size === "small" && dish.tags && dish.tags.length > 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-cyan-600 dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                {dish.tags[0]}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 w-full px-4 py-2">
            <h3 className="text-lg font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] truncate">{dish.name}</h3>
          </div>
        </ImageWithLoading>
      </div>
      <div className="w-full p-4 min-w-0">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{dish.description}</p>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-bold text-cyan-600 dark:text-cyan-300 text-sm truncate">{dish.price}</span>
          {/* Tags na parte inferior - apenas para cards grandes */}
          {size === "large" && (
            <div className="flex gap-1 flex-wrap flex-shrink-0">
              {dish.tags?.map((tag) => (
                <span key={tag} className="bg-cyan-600 dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



export default async function Home() {
  // Buscar dados do restaurante Moendo usando o ID específico
  let moendoRestaurant = null;
  try {
    moendoRestaurant = await fetchRestaurantByIdWithData("e1f70b34-20f5-4e08-9b68-d801ca33ee54");
  } catch (error) {
    console.error("Erro ao carregar restaurante Moendo:", error);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Plataforma de cardápio digital focada em experiência e acessibilidade
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-700 dark:text-gray-300">
                O Yoself transforma seu cardápio em uma jornada intuitiva e inclusiva. QR Code sem fricção, leitura acessível, design moderno e navegação por gestos – tudo para seus clientes encontrarem o que desejam em poucos toques.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/restaurant/" className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-3 text-white font-semibold shadow hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  Ver cardápios
                </Link>
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
                  <StaticDishCard dish={sampleDishes[0]} size="large" />
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-40 md:w-56 rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5 bg-white dark:bg-gray-800 p-2">
                <div className="w-full">
                  <StaticDishCard dish={sampleDishes[1]} size="small" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <DynamicCarousel restaurant={moendoRestaurant} showMostOrderedTitle={true} />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Cards de Pratos</h3>
            <div className="space-y-4">
              {sampleDishes.slice(0, 2).map((dish, index) => (
                <StaticDishCard key={index} dish={dish} size="small" />
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Grid Responsivo</h3>
            <div className="grid grid-cols-2 gap-3 w-full">
              {sampleDishes.map((dish, index) => (
                <div key={index} className="w-full min-w-0">
                  <StaticDishCard dish={dish} size="small" />
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

      {/* Organizações */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-8">Organizações Parceiras</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">Descubra restaurantes incríveis de nossas organizações parceiras</p>
        <OrganizationsSection />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 p-1">
          <div className="rounded-2xl bg-white dark:bg-gray-900 px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Pronto para elevar seu cardápio?</h3>
              <p className="mt-2 text-gray-700 dark:text-gray-300">Leve a experiência do seu cliente para o próximo nível com o Yoself.</p>
            </div>
            <Link href="/restaurant/" className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-3 text-white font-semibold shadow hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-white/60">
              Explorar cardápios
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
