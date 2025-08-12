import Link from "next/link";

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
function StaticDishCard({ dish, size = "large" }: { dish: typeof sampleDishes[0]; size?: "large" | "small" }) {
  return (
    <div className={`menu-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow flex flex-col items-center ${size === "small" ? "max-w-xs" : ""}`}>
      <div className="relative w-full">
        <img
          src={dish.image}
          alt={dish.name}
          className={`w-full ${size === "small" ? "h-32" : "h-48"} object-cover rounded-t-lg`}
        />
        <div className="absolute bottom-0 left-0 w-full px-4 py-2">
          <h3 className="text-lg font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">{dish.name}</h3>
        </div>
      </div>
      <div className="w-full p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{dish.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-cyan-600 dark:text-cyan-300">{dish.price}</span>
          <div className="flex gap-1">
            {dish.tags?.map((tag) => (
              <span key={tag} className="bg-cyan-600 dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-950">
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

      {/* Carousel Demo - Versão Estática */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-8">Destaques que chamam atenção</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">Carousel interativo para destacar os pratos especiais do chef</p>
        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white dark:bg-gray-800 p-8">
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-2xl">
              {/* Card principal centralizado */}
              <div className="w-full max-w-md mx-auto">
                <div className="relative">
                  <img
                    src={sampleDishes[0].image}
                    alt={sampleDishes[0].name}
                    className="w-full h-64 md:h-80 object-cover rounded-2xl"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="bg-cyan-600 text-white text-xs font-bold rounded-full px-2 py-1">
                      mais pedido
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full text-white text-center font-semibold text-lg py-2 px-2 bg-gradient-to-t from-black/50 to-transparent rounded-b-2xl">
                    {sampleDishes[0].name}
                  </div>
                </div>
              </div>
              
              {/* Indicadores de navegação */}
              <div className="flex justify-center mt-6 space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
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
            <div className="grid grid-cols-2 gap-3">
              {sampleDishes.map((dish, index) => (
                <StaticDishCard key={index} dish={dish} size="small" />
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Modo Jornal</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                Navegação por páginas com gestos
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sampleDishes.slice(0, 4).map((dish, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={dish.image} 
                      alt={dish.name}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg">
                      {dish.name}
                    </div>
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
            <Link href="/restaurant/" className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-3 text-white font-semibold shadow hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-white/60">
              Explorar cardápios
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
