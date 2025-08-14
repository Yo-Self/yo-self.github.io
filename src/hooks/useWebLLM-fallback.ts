import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
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
      // Simular resposta da IA (para desenvolvimento/teste)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const menuItems = restaurantData?.menu_items || [];
      const restaurantName = restaurantData?.name || 'Restaurante';
      
      // Resposta simulada baseada no contexto
      let response = '';
      
      if (message.toLowerCase().includes('pratos') || message.toLowerCase().includes('cardápio')) {
        response = `Aqui estão alguns dos nossos pratos principais:\n\n${menuItems.slice(0, 5).map((item: any) => 
          `• ${item.name} - R$ ${item.price}\n  ${item.description}`
        ).join('\n\n')}\n\nPosso te ajudar a escolher algo específico!`;
      } else if (message.toLowerCase().includes('preço') || message.toLowerCase().includes('quanto')) {
        response = `Os preços variam conforme o prato. Posso te mostrar o cardápio completo ou você pode me perguntar sobre um prato específico!`;
      } else if (message.toLowerCase().includes('recomenda')) {
        const popularItems = menuItems.slice(0, 3);
        response = `Baseado no nosso cardápio, recomendo:\n\n${popularItems.map((item: any) => 
          `• ${item.name} - R$ ${item.price}\n  ${item.description}`
        ).join('\n\n')}\n\nEsses são alguns dos nossos pratos mais populares!`;
      } else {
        response = `Olá! Sou o assistente do ${restaurantName}. Posso te ajudar com informações sobre nossos pratos, preços e recomendações. O que você gostaria de saber?`;
      }

      // Adicionar resposta da IA
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Adicionar mensagem de erro
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
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
