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
      // URL da Edge Function do Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/ai-chat`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
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

      // Adicionar resposta da IA
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.message,
        timestamp: new Date(data.timestamp),
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