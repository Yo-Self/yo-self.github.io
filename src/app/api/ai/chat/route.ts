import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Inicializar o cliente do Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Modelos disponíveis (em ordem de preferência)
const MODELS = [
  'gemini-2.0-flash-exp',  // Mais novo e rápido
  'gemini-1.5-pro',        // Mais completo
  'gemini-pro',            // Fallback estável
] as const;

// Função para tentar diferentes modelos
async function tryModelsSequentially(
  message: string,
  restaurantContext: string,
  chatHistory: any[]
): Promise<{ text: string; model: string }> {
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      console.log(`Tentando modelo: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const chat = model.startChat({
        history: chatHistory?.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }],
        })) || [],
      });

      const result = await chat.sendMessage(`${restaurantContext}\n\nCliente: ${message}`);
      const response = await result.response;
      const text = response.text();

      console.log(`Sucesso com modelo: ${modelName}`);
      return { text, model: modelName };
      
    } catch (error: any) {
      console.error(`Modelo ${modelName} falhou:`, error.message);
      lastError = error;
      
      // Se for o último modelo, propaga o erro
      if (modelName === MODELS[MODELS.length - 1]) {
        throw new Error(
          `Todos os modelos falharam. Último erro: ${error.message}`
        );
      }
      
      // Continua para o próximo modelo
      continue;
    }
  }

  // Se chegou aqui, algo deu muito errado
  throw lastError || new Error('Falha ao processar requisição');
}

export async function POST(request: NextRequest) {
  try {
    const { message, restaurantData, chatHistory } = await request.json();

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'API key não configurada' },
        { status: 500 }
      );
    }

    // Criar contexto baseado nos dados do restaurante
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

    // Tentar diferentes modelos até encontrar um que funcione
    const { text, model: usedModel } = await tryModelsSequentially(
      message,
      restaurantContext,
      chatHistory
    );

    return NextResponse.json({
      message: text,
      model: usedModel,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro na API de chat:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
