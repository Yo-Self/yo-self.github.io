"use client";

import Link from "next/link";
import DynamicCarousel from "../components/DynamicCarousel";
import ImageWithLoading from "@/components/ImageWithLoading";
import AnimatedStaticDishCard from "@/components/AnimatedStaticDishCard";
import { useState, useEffect } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { Restaurant } from "@/components/data";
import { motion } from "framer-motion";

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

const FeatureCard = ({ title, description, icon, delay }: { title: string, description: string, icon: React.ReactNode, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="group relative p-8 rounded-3xl bg-white/60 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl shadow-gray-200/20 dark:shadow-black/20 hover:shadow-2xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/20 transition-all duration-300 overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[2px] mb-6 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
        <div className="h-full w-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default function Home() {
  const { setRestaurantId } = useRestaurant();

  useEffect(() => {
    setRestaurantId("cafe-moendo");
  }, [setRestaurantId]);

  const [moendoRestaurant] = useState<Restaurant | null>({
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Erro ao carregar cardápio.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Premium Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[90vh]">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] max-w-4xl opacity-30 dark:opacity-40 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-[128px] animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 w-full flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-sm font-medium mb-8 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              A nova geração de cardápios digitais
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              A experiência que o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">cliente merece.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              O Yoself transforma o seu cardápio em uma jornada intuitiva e irresistível. Design imersivo, acessibilidade inteligente e navegação por gestos – tudo sem precisar instalar nada.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a href="#demo" className="w-full sm:w-auto px-8 py-4 rounded-full bg-gray-900 dark:!bg-white text-white dark:!text-gray-900 font-semibold hover:scale-105 transition-transform duration-300 shadow-xl shadow-gray-900/20 dark:shadow-white/20">
                Ver demonstração
              </a>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:!bg-gray-900 text-gray-900 dark:!text-white border border-gray-200 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-300">
                Como funciona
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="flex-1 w-full max-w-lg relative perspective-[1000px]"
          >
            <div className="relative rounded-[2.5rem] bg-gray-100 dark:bg-gray-900/50 p-4 border-[8px] border-white dark:border-gray-800 shadow-2xl backdrop-blur-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white dark:bg-gray-800 rounded-b-xl z-20"></div>
              <div className="rounded-2xl overflow-hidden bg-white dark:bg-black shadow-inner relative">
                <StaticDishCard dish={sampleDishes[0]} size="large" index={0} />
              </div>
            </div>
            
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -bottom-10 -left-10 md:-left-16 w-56 p-2 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-2xl z-30"
            >
              <StaticDishCard dish={sampleDishes[1]} size="small" index={1} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-sm font-semibold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase mb-3">Diferenciais</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6">Projetado para converter</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Cada detalhe foi pensado para reduzir o atrito e aumentar o apetite dos seus clientes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              delay={0.1}
              title="Acessibilidade Nativa" 
              description="Contraste dinâmico, suporte a leitores de tela e fontes ajustáveis garantem que o seu cardápio seja perfeito para absolutamente todos os públicos."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>}
            />
            <FeatureCard 
              delay={0.2}
              title="Velocidade Absoluta" 
              description="PWA otimizado que carrega instantaneamente, funciona offline e mantém a fluidez mesmo em redes 3G, não deixando o cliente esperando."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
            />
            <FeatureCard 
              delay={0.3}
              title="Design Premium" 
              description="Fotos deslumbrantes com grids inteligentes que valorizam o seu produto. Um layout moderno que encanta no primeiro olhar."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
            />
          </div>
        </div>
      </section>

      {/* Showcase Interactive */}
      <section id="demo" className="py-24 px-6 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Destaques que dão água na boca</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Um carousel interativo que apresenta seus pratos principais de forma orgânica e sedutora.</p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl overflow-hidden bg-black/40 backdrop-blur-2xl border border-gray-700/50 p-4 md:p-8 shadow-2xl"
          >
            {moendoRestaurant?.featured_dishes ? (
              <DynamicCarousel restaurant={moendoRestaurant} showMostOrderedTitle={true} />
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* UI Gallery */}
      <section className="py-24 px-6 relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Construído para qualquer formato</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">Visualizações ricas para diferentes momentos da experiência de consumo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Cards Detalhados", view: "Exibição padrão focada nos ingredientes", dishes: sampleDishes.slice(0,2) },
            { title: "Grid Rápido", view: "Para escaneabilidade e escolha rápida", dishes: sampleDishes },
            { title: "Modo Jornal", view: "Navegação por gestos imersiva", isJournal: true }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden group"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.view}</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-black/20">
                {item.isJournal ? (
                  <div className="grid grid-cols-2 gap-3">
                    {moendoDishes.slice(0,4).map((dish, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                        <ImageWithLoading
                          src={dish.image}
                          alt={dish.name}
                          clickable={false}
                          className="w-full h-24 object-cover"
                          fallbackSrc="/window.svg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                          <span className="text-white text-[10px] font-medium leading-tight">{dish.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={item.title === "Grid Rápido" ? "grid grid-cols-2 gap-3" : "space-y-4"}>
                    {item.dishes?.map((dish, i) => (
                      <div key={i} className="group-hover:scale-[1.02] transition-transform duration-300">
                        <StaticDishCard dish={dish} size="small" index={i} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Premium CTA */}
      <section className="py-24 px-6 mb-12 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[2.5rem] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
          
          <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Eleve o nível do seu restaurante</h2>
              <p className="text-cyan-100 text-lg max-w-xl">
                Junte-se a dezenas de estabelecimentos que já estão vendendo mais com a experiência Yoself.
              </p>
            </div>
            <div className="flex-shrink-0">
              <a href="https://gestor.yo-self.com" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-white text-blue-700 font-bold rounded-full shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-300">
                Começar agora
              </a>
            </div>
          </div>
        </motion.div>
      </section>
      
      {/* Footer minimalista */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 px-6 text-center text-gray-500 text-sm">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
          <Link href="/suporte" className="hover:text-cyan-600 dark:hover:text-cyan-400">
            Suporte
          </Link>
          <Link href="/privacidade" className="hover:text-cyan-600 dark:hover:text-cyan-400">
            Privacidade
          </Link>
          <a
            href="https://gestor.yo-self.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-600 dark:hover:text-cyan-400"
          >
            Área do restaurante
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} Yoself. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
