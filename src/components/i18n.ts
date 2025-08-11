const translations: Record<string, string> = {
  search: "Buscar...",
  searchCategory: "Busca",
  all: "Todos",
  share: "Compartilhar",
  close: "Fechar",
  ingredients: "Ingredientes",
  allergens: "Alérgenos",
  portion: "Porção",
  price: "Preço",
  // Categorias comuns pré-traduzidas para melhor performance
  "Menu Principal": "Menu Principal",
  "Sobremesas": "Sobremesas",
  "Bebidas": "Bebidas",
  "Carta de Drinks": "Carta de Drinks",
  "Destilados": "Destilados",
  "Carta de Vinhos": "Carta de Vinhos",
  "Menu Executivo": "Menu Executivo",
  "Happy hour": "Happy hour",
  "Sunset Moendo": "Sunset Moendo",
  "Couver artistico": "Couver artístico",
  // Categorias japonesas
  "Sushi": "Sushi",
  "Sashimi": "Sashimi",
  "Temaki": "Temaki",
  "Ramen": "Ramen",
  "Udon": "Udon",
  "Bebidas Japonesas": "Bebidas Japonesas",
  // Categorias chinesas
  "Pratos Principais": "Pratos Principais",
  "Sopas": "Sopas",
  "Entradas": "Entradas",
  "Bebidas Chinesas": "Bebidas Chinesas",
  // Categorias coreanas
  "Bibimbap": "Bibimbap",
  "Kimchi": "Kimchi",
  "Bebidas Coreanas": "Bebidas Coreanas",
};

export function useTranslation() {
  return {
    t: (key: string) => translations[key] || key,
  };
} 