import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { sendMessageWithTracking, generateTraceId, type PostHogLLMOptions } from '@/lib/posthog-gemini-server';
import { getPostHogServer } from '@/lib/posthog';

// Inicializar o cliente do Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Modelos disponíveis (em ordem de preferência)
// Atualizado para usar modelos estáveis e suportados
const MODELS = [
  'gemini-3.5-flash',          // Modelo mais novo, extremamente inteligente e rápido
  'gemini-2.5-flash',          // Modelo estável de alta performance
  'gemini-2.5-flash-lite',     // Modelo rápido e econômico
  'gemini-flash-latest',       // Modelo de fallback estável (Gemini 1.5 Flash)
];

// Interface para itens do menu
interface MenuItem {
  name: string;
  description: string;
  price: string;
  ingredients: string;
  [key: string]: any;
}

// Função de busca de fallback quando a IA falha
function searchFallback(message: string, restaurantData: any): string {
  if (!restaurantData || !restaurantData.menu_items) {
    return "Desculpe, não consigo acessar o cardápio no momento.";
  }

  const query = message.toLowerCase();
  // Remove pontuação e caracteres especiais, mantendo apenas letras, números e espaços
  const cleanQuery = query.replace(/[^\w\s\u00C0-\u00FF]/g, ' ');
  const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 3); // Ignora palavras curtas
  
  if (keywords.length === 0) {
    return "Poderia repetir com mais detalhes o que você procura?";
  }

  const matches = restaurantData.menu_items.filter((item: MenuItem) => {
    const textToSearch = `${item.name} ${item.description} ${item.ingredients || ''}`.toLowerCase();
    // Verifica se alguma palavra-chave está presente
    return keywords.some(keyword => textToSearch.includes(keyword));
  });

  if (matches.length > 0) {
    // Limitar a 3 sugestões
    const suggestions = matches.slice(0, 3).map((item: MenuItem) => 
      `*${item.name}* - ${item.description} (R$ ${item.price})`
    ).join('\n\n');

    return `A IA está temporariamente indisponível, mas encontrei estes pratos relacionados ao que você pediu:\n\n${suggestions}\n\nPosso ajudar com algo mais específico?`;
  }

  return "A IA está indisponível no momento e não encontrei pratos exatos com esses termos. Tente buscar por ingredientes como 'camarão', 'carne' ou 'doce'.";
}

// Função para tentar diferentes modelos (agora com tracking do PostHog)
async function tryModelsSequentially(
  message: string,
  restaurantContext: string,
  chatHistory: any[],
  trackingOptions: PostHogLLMOptions,
  restaurantData?: any // Adicionado para fallback
): Promise<{ text: string; model: string }> {
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      console.log(`Tentando modelo: ${modelName}`);
      
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig,
      });

      const chat = model.startChat({
        history: chatHistory?.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }],
        })) || [],
      });

      // Usar wrapper do PostHog para capturar evento $ai_generation
      const fullMessage = `${restaurantContext}\n\nCliente: ${message}`;
      const { text } = await sendMessageWithTracking(
        chat,
        fullMessage,
        modelName,
        generationConfig,
        trackingOptions
      );

      console.log(`Sucesso com modelo: ${modelName}`);
      return { text, model: modelName };
      
    } catch (error: any) {
      console.error(`Modelo ${modelName} falhou:`, error.message);
      lastError = error;
      
      // Continua para o próximo modelo se houver
      continue;
    }
  }

  // Se todos os modelos falharem, usar fallback de busca
  console.log("Todos os modelos falharam, ativando fallback de busca local");
  const fallbackText = searchFallback(message, restaurantData);
  return { text: fallbackText, model: 'local-search-fallback' };
}

export async function POST(request: NextRequest) {
  let distinctId = 'anonymous';
  try {
    const body = await request.json();
    const { message, restaurantData, chatHistory, distinct_id, trace_id, restaurant_id } = body;
    if (distinct_id) {
      distinctId = distinct_id;
    }

    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const resolvedRestaurantId = restaurant_id || restaurantData?.id;
    if (!resolvedRestaurantId || typeof resolvedRestaurantId !== 'string') {
      return NextResponse.json({ error: 'restaurant_id is required' }, { status: 403 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      const fallbackText = searchFallback(message, restaurantData);
      return NextResponse.json({
        message: fallbackText,
        model: 'local-search-no-key',
        timestamp: new Date().toISOString(),
        trace_id: trace_id || generateTraceId(),
      });
    }

    const restaurantContext = `
      Você é um assistente especializado em gastronomia para o restaurante "${restaurantData?.name || 'Restaurante'}".
      
      Informações do restaurante:
      - Nome: ${restaurantData?.name || 'N/A'}
      - Descrição: ${restaurantData?.description || 'N/A'}
      
      Cardápio disponível:
      ${restaurantData?.menu_items?.map((item: any) => 
        `- ${item.name}: ${item.description} (R$ ${item.price})`
      ).join('\n') || 'Nenhum item disponível'}
      
      Instruções:
      1. Responda de forma amigável e útil sobre os pratos do restaurante
      2. Ajude os clientes a escolherem pratos baseado em suas preferências
      3. Forneça informações sobre ingredientes, sabores e combinações
      4. Seja específico sobre preços e disponibilidade
      5. Responda em português brasileiro
      6. Mantenha as respostas concisas mas informativas
    `;

    // Opções de tracking do PostHog
    const trackingOptions: PostHogLLMOptions = {
      distinct_id: distinctId,
      trace_id: trace_id || generateTraceId(),
      properties: {
        restaurant_name: restaurantData?.name,
        restaurant_slug: restaurantData?.slug,
        message_length: message.length,
        history_length: chatHistory?.length || 0,
        source: 'api_route',
      },
    };

    // Tentar diferentes modelos até encontrar um que funcione (com tracking)
    // Passamos restaurantData para o fallback
    const { text, model: usedModel } = await tryModelsSequentially(
      message,
      restaurantContext,
      chatHistory,
      trackingOptions,
      restaurantData
    );

    return NextResponse.json({
      message: text,
      model: usedModel,
      timestamp: new Date().toISOString(),
      trace_id: trackingOptions.trace_id,
    });

  } catch (error) {
    console.error('Erro na API de chat:', error);
    
    // Capturar erro no PostHog Server-side
    const posthog = getPostHogServer();
    if (posthog) {
      posthog.captureException(error as Error, distinctId, {
        error_boundary: 'api_route',
        source: 'next_api_chat',
      });
      await posthog.flush();
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

