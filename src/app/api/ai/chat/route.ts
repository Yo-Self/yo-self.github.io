import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Inicializar o cliente do Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Modelo Gemini Flash (gratuito e disponível)
const MODEL_NAME = 'gemini-1.5-flash';

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

    // Configurar o modelo
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Preparar histórico de conversa
    const chat = model.startChat({
      history: chatHistory?.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }],
      })) || [],
    });

    // Enviar mensagem
    const result = await chat.sendMessage(`${restaurantContext}\n\nCliente: ${message}`);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      message: text,
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
