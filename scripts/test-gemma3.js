#!/usr/bin/env node

/**
 * Script de teste para verificar se o Gemma 3 SuperTo está funcionando
 * 
 * Uso:
 * node test-gemma3.js
 * 
 * Certifique-se de configurar as variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const fetch = require('node-fetch');

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Dados de teste
const testRestaurantData = {
  name: 'Restaurante Teste',
  description: 'Culinária brasileira tradicional',
  menu_items: [
    {
      name: 'Feijoada Completa',
      description: 'Feijão preto com carnes, acompanhada de arroz, farofa e couve',
      price: 25.00
    },
    {
      name: 'Picanha na Brasa',
      description: 'Picanha grelhada na brasa, acompanhada de arroz e feijão',
      price: 35.00
    },
    {
      name: 'Moqueca de Peixe',
      description: 'Peixe cozido no leite de coco com dendê e temperos',
      price: 28.00
    }
  ]
};

const testMessages = [
  'Quais são os pratos mais populares?',
  'Me fale sobre a Feijoada Completa',
  'Qual prato você recomenda para quem gosta de peixe?',
  'Quais são os preços dos pratos?'
];

async function testGemma3() {
  const functionUrl = `${SUPABASE_URL}/functions/v1/ai-chat`;
  
  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i];
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message,
          restaurantData: testRestaurantData,
          chatHistory: []
        }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error(`❌ Erro da API: ${data.error}`);
        if (data.details) {
          console.error(`   Detalhes: ${data.details}`);
        }
        continue;
      }

      // Resposta recebida com sucesso

    } catch (error) {
      // Erro de rede
    }
  }
}

// Executar teste
testGemma3().catch(console.error);
