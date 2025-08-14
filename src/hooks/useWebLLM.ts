import { useState, useCallback } from 'react';

// Função para extrair pratos recomendados da resposta da IA
function extractRecommendedDishes(message: string, restaurantData: any): any[] {
  const menuItems = restaurantData?.menu_items || [];
  const recommendedDishes: any[] = [];
  const addedDishIds = new Set(); // Para evitar duplicatas por ID
  const addedNormalizedNames = new Set(); // Para evitar duplicatas por nome normalizado

  // Verificar se os dados estão sendo passados corretamente
  if (!restaurantData) {
    return [];
  }

  if (!Array.isArray(menuItems) || menuItems.length === 0) {
    return [];
  }

  // Normalizar a mensagem para comparação
  const normalizedMessage = message.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  // Buscar por nomes de pratos na mensagem
  menuItems.forEach((item: any) => {
    // Se já foi adicionado por ID, pular
    if (addedDishIds.has(item.id || item.name)) {
      return;
    }

    // Normalizar o nome do prato para comparação
    const normalizedDishName = item.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim(); // Remove espaços no início e fim
    
    // Se já foi adicionado um prato com nome similar, pular
    if (addedNormalizedNames.has(normalizedDishName)) {
      return;
    }
    
    // Verificar variações comuns do nome
    const variations = [
      normalizedDishName,
      normalizedDishName.replace(/\s+de\s+/g, ' de '), // Normalizar espaços
      normalizedDishName.replace(/\s+De\s+/g, ' de '), // Normalizar "De" para "de"
      normalizedDishName.replace(/\s+DE\s+/g, ' de '), // Normalizar "DE" para "de"
      // Adicionar variações sem "de" para casos como "Caldinho Feijoada"
      normalizedDishName.replace(/\s+de\s+/g, ' '),
      normalizedDishName.replace(/\s+De\s+/g, ' '),
      normalizedDishName.replace(/\s+DE\s+/g, ' '),
    ];
    
    // Verificar se alguma variação aparece na mensagem
    const isMentioned = variations.some(variation => 
      normalizedMessage.includes(variation)
    );
    
    if (isMentioned) {
      recommendedDishes.push(item);
      addedDishIds.add(item.id || item.name); // Marcar como adicionado por ID
      addedNormalizedNames.add(normalizedDishName); // Marcar como adicionado por nome normalizado
    }
  });

  // Retornar apenas os pratos que foram realmente mencionados na mensagem
  return recommendedDishes;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  recommendedDishes?: any[]; // Array de pratos recomendados
  model?: string; // Modelo de IA usado (ex: 'gemma-3-superto')
}

export interface UseWebLLMReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, restaurantData: any) => Promise<void>;
  clearChat: () => void;
}

export function useWebLLM(): UseWebLLMReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, restaurantData: any) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // URL da Edge Function do Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.');
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/ai-chat`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          message,
          restaurantData,
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação com a IA');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }



      // Extrair pratos recomendados da resposta da IA
      const recommendedDishes = extractRecommendedDishes(data.message, restaurantData);

      // Adicionar resposta da IA
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.message,
        timestamp: new Date(data.timestamp),
        recommendedDishes,
        model: data.model, // Incluir informação sobre o modelo usado
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Adicionar mensagem de erro mais específica
      let userFriendlyMessage = 'Desculpe, não consegui processar sua mensagem. Tente novamente.';
      
      if (errorMessage.includes('Configuração do Supabase')) {
        userFriendlyMessage = 'Erro de configuração: As variáveis de ambiente do Supabase não estão configuradas. Verifique o arquivo SETUP_ENVIRONMENT.md';
      } else if (errorMessage.includes('404')) {
        userFriendlyMessage = 'Erro de conexão: A Edge Function não foi encontrada. Verifique se está configurada corretamente.';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userFriendlyMessage = 'Erro de autenticação: Verifique se as credenciais do Supabase estão corretas.';
      } else if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
        userFriendlyMessage = 'O serviço de IA está temporariamente sobrecarregado. Tente novamente em alguns segundos.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        userFriendlyMessage = 'Limite de uso da IA foi excedido. Tente novamente mais tarde.';
      } else if (errorMessage.includes('API key')) {
        userFriendlyMessage = 'Erro de configuração: A chave da API do Google AI não está configurada.';
      }
      
      const errorMessageObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: userFriendlyMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
} 