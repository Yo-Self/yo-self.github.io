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
};

export function useTranslation() {
  return {
    t: (key: string) => translations[key] || key,
  };
} 