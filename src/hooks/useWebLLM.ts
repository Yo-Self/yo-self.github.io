import { useState, useEffect, useCallback } from 'react';
import { initializeWebLLM, isWebLLMSupported, getDeviceInfo } from '../lib/webllm-config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseWebLLMReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isInitialized: boolean;
  isWebLLMAvailable: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  initialize: () => Promise<void>;
  openDishModal: (dish: any) => void;
}

export function useWebLLM(menuData: any, onOpenDishModal?: (dish: any) => void): UseWebLLMReturn {
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isWebLLMAvailable, setIsWebLLMAvailable] = useState(false);

  // Sistema de prompt para o chatbot
  const createSystemPrompt = useCallback(() => {
    const menuItems = menuData?.menu_items || [];
    const featuredDishes = menuData?.featured_dishes || [];
    const allDishes = [...menuItems, ...featuredDishes];
    
    const dishesInfo = allDishes.map(dish => `
      Nome: ${dish.name}
      Descrição: ${dish.description}
      Preço: R$ ${dish.price}
      Categoria: ${dish.category}
      Ingredientes: ${dish.ingredients || 'Não especificado'}
      Alergênicos: ${dish.allergens || 'Nenhum'}
      Porção: ${dish.portion || 'Não especificado'}
    `).join('\n\n');

    return `Você é um assistente especializado no restaurante ${menuData?.name || 'Moendo'}. 
    
    Você tem conhecimento sobre todos os pratos do menu e pode ajudar os clientes com:
    - Informações sobre ingredientes e preparo dos pratos
    - Recomendações baseadas em preferências alimentares
    - Explicações sobre alergênicos
    - Sugestões de combinações
    - Informações sobre preços e porções
    
    Menu do restaurante:
    ${dishesInfo}
    
    Sempre responda de forma amigável e útil, fornecendo informações precisas sobre os pratos. 
    Se não souber algo específico sobre um prato, seja honesto e sugira que o cliente pergunte ao garçom.
    
    Responda sempre em português brasileiro.`;
  }, [menuData]);

  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Verifica se o WebLLM é suportado
      const supported = isWebLLMSupported();
      setIsWebLLMAvailable(supported);
      
      if (supported) {
        // Tenta inicializar o WebLLM
        const chatModule = await initializeWebLLM();
        
        if (chatModule) {
          setChat(chatModule);
          setMessages([{
            role: 'assistant',
            content: `Olá! Sou o assistente do ${menuData?.name || 'Moendo'}. Posso te ajudar com informações sobre nossos pratos, ingredientes, alergênicos e fazer recomendações. O que você gostaria de saber?`
          }]);
        } else {
          // WebLLM falhou, usa fallback
          setMessages([{
            role: 'assistant',
            content: `Olá! Sou o assistente do ${menuData?.name || 'Moendo'}. Estou usando meu modo inteligente para te ajudar com informações sobre nossos pratos, ingredientes, alergênicos e recomendações!`
          }]);
        }
      } else {
        // WebLLM não suportado, usa fallback
        setMessages([{
          role: 'assistant',
          content: `Olá! Sou o assistente do ${menuData?.name || 'Moendo'}. Estou usando meu modo inteligente para te ajudar com informações sobre nossos pratos, ingredientes, alergênicos e recomendações!`
        }]);
      }
      
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Erro ao inicializar chatbot:', error);
      // Fallback para quando houver erro
      setMessages([{
        role: 'assistant',
        content: `Olá! Sou o assistente do ${menuData?.name || 'Moendo'}. Estou aqui para te ajudar com informações sobre nossos pratos, ingredientes, alergênicos e recomendações!`
      }]);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [menuData]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      if (chat) {
        // Usa WebLLM se disponível
        const systemPrompt = createSystemPrompt();
        
        // Prepara o contexto com mensagens anteriores
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const response = await chat.generate([
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: userMessage }
        ]);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback: resposta simples baseada no menu
        const fallbackResponse = generateFallbackResponse(userMessage, menuData);
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: fallbackResponse
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua pergunta. Pode tentar novamente ou perguntar diretamente ao garçom?'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chat, messages, createSystemPrompt, menuData]);

  const clearChat = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: `Olá! Sou o assistente do ${menuData?.name || 'Moendo'}. Como posso te ajudar hoje?`
    }]);
  }, [menuData]);

  // Função de fallback inteligente para quando WebLLM não estiver disponível
  const generateFallbackResponse = (userMessage: string, menuData: any): string => {
    const message = userMessage.toLowerCase();
    const menuItems = menuData?.menu_items || [];
    const featuredDishes = menuData?.featured_dishes || [];
    const allDishes = [...menuItems, ...featuredDishes];

    // Busca por pratos específicos
    const specificDish = allDishes.find(dish => 
      message.includes(dish.name.toLowerCase())
    );
    
    if (specificDish) {
      return `O prato "${specificDish.name}" é ${specificDish.description}. 
Preço: R$ ${specificDish.price}
Categoria: ${specificDish.category}
${specificDish.ingredients ? `Ingredientes: ${specificDish.ingredients}` : ''}
${specificDish.allergens ? `Alergênicos: ${specificDish.allergens}` : ''}
${specificDish.portion ? `Porção: ${specificDish.portion}` : ''}`;
    }

    // Busca por pratos populares/destaque
    if (message.includes('popular') || message.includes('destaque') || message.includes('recomendado')) {
      const featured = allDishes.filter(dish => dish.tags && dish.tags.includes('Destaque'));
      if (featured.length > 0) {
        const dishes = featured.slice(0, 5).map(dish => `• ${dish.name}: R$ ${dish.price}`);
        return `Nossos pratos em destaque:\n${dishes.join('\n')}\n\nEstes são os pratos mais pedidos pelos nossos clientes!`;
      }
    }

    // Busca por categorias
    if (message.includes('categoria') || message.includes('tipo')) {
      const categories = Array.from(new Set(allDishes.map(dish => dish.category)));
      return `Nossas categorias de pratos:\n${categories.map(cat => `• ${cat}`).join('\n')}\n\nQual categoria te interessa mais?`;
    }

    // Busca por ingredientes
    if (message.includes('ingrediente') || message.includes('contém') || message.includes('tem')) {
      const dishesWithIngredients = allDishes.filter(dish => dish.ingredients && dish.ingredients !== 'Não especificado');
      if (dishesWithIngredients.length > 0) {
        const randomDish = dishesWithIngredients[Math.floor(Math.random() * dishesWithIngredients.length)];
        return `O prato "${randomDish.name}" contém: ${randomDish.ingredients}. Que prato específico você gostaria de saber mais sobre?`;
      }
    }

    // Busca por alergênicos
    if (message.includes('alergia') || message.includes('alergênico') || message.includes('glúten') || message.includes('lactose')) {
      const glutenFree = allDishes.filter(dish => dish.allergens && dish.allergens.includes('Sem Gluten'));
      const lactoseFree = allDishes.filter(dish => dish.allergens && dish.allergens.includes('Sem Lactose'));
      const vegan = allDishes.filter(dish => dish.allergens && dish.allergens.includes('Vegano'));
      
      let response = 'Temos opções para diferentes restrições alimentares:\n';
      if (glutenFree.length > 0) {
        response += `\nPratos sem glúten: ${glutenFree.slice(0, 3).map(d => d.name).join(', ')}`;
      }
      if (lactoseFree.length > 0) {
        response += `\nPratos sem lactose: ${lactoseFree.slice(0, 3).map(d => d.name).join(', ')}`;
      }
      if (vegan.length > 0) {
        response += `\nPratos veganos: ${vegan.slice(0, 3).map(d => d.name).join(', ')}`;
      }
      return response;
    }

    // Busca por preços
    if (message.includes('preço') || message.includes('quanto custa') || message.includes('valor') || message.includes('barato')) {
      const affordableDishes = allDishes.filter(dish => {
        const price = parseFloat(dish.price.replace(',', '.'));
        return price < 50;
      });
      
      if (affordableDishes.length > 0) {
        const cheapDishes = affordableDishes.slice(0, 5).map(dish => `• ${dish.name}: R$ ${dish.price}`);
        return `Nossos pratos mais acessíveis:\n${cheapDishes.join('\n')}`;
      }
    }

    // Busca por pratos vegetarianos
    if (message.includes('vegetariano') || message.includes('vegetariana') || message.includes('vegano')) {
      const vegetarianDishes = allDishes.filter(dish => 
        dish.allergens && (dish.allergens.includes('Vegetariano') || dish.allergens.includes('Vegano'))
      );
      
      if (vegetarianDishes.length > 0) {
        const dishes = vegetarianDishes.slice(0, 5).map(dish => `• ${dish.name}: R$ ${dish.price}`);
        return `Nossas opções vegetarianas:\n${dishes.join('\n')}`;
      }
    }

    // Busca por pratos do mar
    if (message.includes('peixe') || message.includes('camarão') || message.includes('frutos do mar') || message.includes('marisco')) {
      const seafoodDishes = allDishes.filter(dish => 
        dish.name.toLowerCase().includes('peixe') || 
        dish.name.toLowerCase().includes('camarão') || 
        dish.name.toLowerCase().includes('polvo') ||
        dish.name.toLowerCase().includes('bacalhau') ||
        dish.name.toLowerCase().includes('moqueca')
      );
      
      if (seafoodDishes.length > 0) {
        const dishes = seafoodDishes.slice(0, 5).map(dish => `• ${dish.name}: R$ ${dish.price}`);
        return `Nossos pratos de frutos do mar:\n${dishes.join('\n')}`;
      }
    }

    // Busca por sobremesas
    if (message.includes('sobremesa') || message.includes('doce') || message.includes('sobremesas')) {
      const desserts = allDishes.filter(dish => dish.category === 'Sobremesas');
      if (desserts.length > 0) {
        const dishes = desserts.map(dish => `• ${dish.name}: R$ ${dish.price}`);
        return `Nossas sobremesas:\n${dishes.join('\n')}`;
      }
    }

    // Resposta padrão com sugestões
    return `Obrigado pela pergunta! Estou aqui para te ajudar com informações sobre nossos pratos. 

Você pode me perguntar sobre:
• Pratos específicos (ex: "Filé ao Poivre")
• Categorias (ex: "Menu Principal", "Sobremesas")
• Restrições alimentares (ex: "sem glúten", "vegetariano")
• Preços (ex: "pratos mais baratos")
• Ingredientes (ex: "o que tem no Filé ao Poivre")

Que prato específico você gostaria de conhecer melhor?`;
  };

  const openDishModal = useCallback((dish: any) => {
    if (onOpenDishModal) {
      onOpenDishModal(dish);
    }
  }, [onOpenDishModal]);

  return {
    messages,
    isLoading,
    isInitialized,
    isWebLLMAvailable,
    sendMessage,
    clearChat,
    initialize,
    openDishModal
  };
} 