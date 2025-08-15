import { useState, useCallback } from 'react';
import { MenuItem } from '../components/data';

export interface SearchResult {
  type: 'search' | 'llm';
  items?: MenuItem[];
  message?: string;
  recommendedDishes?: any[];
  model?: string;
}

export interface UseIntegratedSearchReturn {
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  search: (query: string, restaurantData: any, allRestaurants?: any[]) => Promise<void>;
  clearResults: () => void;
}

// Função para determinar se a query é uma busca simples ou uma pergunta para LLM
function isSimpleSearch(query: string): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Palavras que indicam uma pergunta ou solicitação complexa
  const questionWords = [
    'qual', 'quais', 'como', 'quando', 'onde', 'por que', 'porque', 'quanto', 'quanta',
    'recomende', 'recomenda', 'sugira', 'sugere', 'melhor', 'pior', 'mais', 'menos',
    'popular', 'famoso', 'tradicional', 'especial', 'diferente', 'novo', 'antigo',
    'barato', 'caro', 'econômico', 'premium', 'vegetariano', 'vegano', 'sem glúten',
    'apimentado', 'doce', 'salgado', 'quente', 'frio', 'grande', 'pequeno',
    'tem', 'contém', 'inclui', 'feito', 'preparado', 'cozido', 'assado', 'frito',
    'grelhado', 'cru', 'fresco', 'congelado', 'orgânico', 'natural', 'artesanal'
  ];
  
  // Verificar se contém palavras de pergunta
  const hasQuestionWords = questionWords.some(word => 
    normalizedQuery.includes(word)
  );
  
  // Verificar se é uma pergunta direta (termina com ?)
  const isDirectQuestion = normalizedQuery.endsWith('?');
  
  // Verificar se tem múltiplas palavras (mais provável ser uma pergunta)
  const wordCount = normalizedQuery.split(/\s+/).length;
  
  // Se tem 3 ou mais palavras, é mais provável ser uma pergunta
  if (wordCount >= 3) {
    return !hasQuestionWords && !isDirectQuestion;
  }
  
  // Se tem 1-2 palavras, é mais provável ser uma busca simples
  if (wordCount <= 2) {
    return !hasQuestionWords && !isDirectQuestion;
  }
  
  return false;
}

// Função para buscar itens no menu
function searchMenuItems(query: string, restaurantData: any, allRestaurants?: any[]): MenuItem[] {
  const normalizedQuery = query.toLowerCase().trim();
  const results: MenuItem[] = [];
  
  // Buscar no restaurante atual
  if (restaurantData?.menu_items) {
    const restaurantResults = restaurantData.menu_items.filter((item: MenuItem) => {
      const nameMatch = item.name.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = item.description.toLowerCase().includes(normalizedQuery);
      const tagsMatch = item.tags && item.tags.some((tag: string) => 
        tag.toLowerCase().includes(normalizedQuery)
      );
      const ingredientsMatch = item.ingredients && 
        item.ingredients.toLowerCase().includes(normalizedQuery);
      
      return nameMatch || descriptionMatch || tagsMatch || ingredientsMatch;
    });
    
    results.push(...restaurantResults);
  }
  
  // Buscar em outros restaurantes se fornecidos
  if (allRestaurants) {
    allRestaurants.forEach(restaurant => {
      if (restaurant.id !== restaurantData?.id && restaurant.menu_items) {
        const otherResults = restaurant.menu_items.filter((item: MenuItem) => {
          const nameMatch = item.name.toLowerCase().includes(normalizedQuery);
          const descriptionMatch = item.description.toLowerCase().includes(normalizedQuery);
          const tagsMatch = item.tags && item.tags.some((tag: string) => 
            tag.toLowerCase().includes(normalizedQuery)
          );
          const ingredientsMatch = item.ingredients && 
            item.ingredients.toLowerCase().includes(normalizedQuery);
          
          return nameMatch || descriptionMatch || tagsMatch || ingredientsMatch;
        });
        
        results.push(...otherResults);
      }
    });
  }
  
  return results;
}

export function useIntegratedSearch(): UseIntegratedSearchReturn {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, restaurantData: any, allRestaurants?: any[]) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const isSearch = isSimpleSearch(query);
      
      if (isSearch) {
        // Busca simples
        const searchResults = searchMenuItems(query, restaurantData, allRestaurants);
        
        setResults({
          type: 'search',
          items: searchResults
        });
      } else {
        // Usar LLM
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Configuração do Supabase não encontrada.');
        }
        
        const functionUrl = `${supabaseUrl}/functions/v1/ai-chat`;
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            message: query,
            restaurantData,
            chatHistory: [],
          }),
        });

        if (!response.ok) {
          throw new Error('Erro na comunicação com a IA');
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }
        
        // Extrair pratos recomendados da resposta
        const recommendedDishes = extractRecommendedDishes(data.message, restaurantData);
        
        setResults({
          type: 'llm',
          message: data.message,
          recommendedDishes,
          model: data.model || 'gemma-3-superto'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}

// Função auxiliar para extrair pratos recomendados (copiada do useWebLLM)
function extractRecommendedDishes(message: string, restaurantData: any): any[] {
  const menuItems = restaurantData?.menu_items || [];
  const recommendedDishes: any[] = [];
  const addedDishIds = new Set();
  const addedNormalizedNames = new Set();

  if (!restaurantData || !Array.isArray(menuItems) || menuItems.length === 0) {
    return [];
  }

  const normalizedMessage = message.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  menuItems.forEach((item: any) => {
    if (addedDishIds.has(item.id || item.name)) {
      return;
    }

    const normalizedDishName = item.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    
    if (addedNormalizedNames.has(normalizedDishName)) {
      return;
    }
    
    const variations = [
      normalizedDishName,
      normalizedDishName.replace(/\s+de\s+/g, ' de '),
      normalizedDishName.replace(/\s+De\s+/g, ' de '),
      normalizedDishName.replace(/\s+DE\s+/g, ' de '),
      normalizedDishName.replace(/\s+de\s+/g, ' '),
      normalizedDishName.replace(/\s+De\s+/g, ' '),
      normalizedDishName.replace(/\s+DE\s+/g, ' '),
    ];
    
    const isMentioned = variations.some(variation => 
      normalizedMessage.includes(variation)
    );
    
    if (isMentioned) {
      recommendedDishes.push(item);
      addedDishIds.add(item.id || item.name);
      addedNormalizedNames.add(normalizedDishName);
    }
  });

  return recommendedDishes;
}
