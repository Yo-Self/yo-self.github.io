import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, restaurantData, chatHistory } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })

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
    `

    const chat = model.startChat({
      history: chatHistory?.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }],
      })) || [],
    })

    const result = await chat.sendMessage(`${restaurantContext}\n\nCliente: ${message}`)
    const response = await result.response
    const text = response.text()

    return new Response(
      JSON.stringify({
        message: text,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na API de chat:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
