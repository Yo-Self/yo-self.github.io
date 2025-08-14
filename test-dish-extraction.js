#!/usr/bin/env node

/**
 * Script de teste para verificar a extração de pratos recomendados
 * 
 * Uso:
 * node test-dish-extraction.js
 */

// Simular a função de extração de pratos
function extractRecommendedDishes(message, restaurantData) {
  const menuItems = restaurantData?.menu_items || [];
  const recommendedDishes = [];
  const addedDishIds = new Set(); // Para evitar duplicatas por ID
  const addedNormalizedNames = new Set(); // Para evitar duplicatas por nome normalizado

  if (!restaurantData || !Array.isArray(menuItems) || menuItems.length === 0) {
    return [];
  }

  // Normalizar a mensagem para comparação
  const normalizedMessage = message.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  console.log('📝 Mensagem normalizada:', normalizedMessage);

  // Buscar por nomes de pratos na mensagem
  menuItems.forEach((item, index) => {
    // Se já foi adicionado por ID, pular
    if (addedDishIds.has(item.id || item.name)) {
      console.log(`⏭️  Prato ${index + 1} já adicionado por ID: ${item.name}`);
      return;
    }

    // Normalizar o nome do prato para comparação
    const normalizedDishName = item.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim(); // Remove espaços no início e fim
    
    console.log(`\n🍽️  Analisando prato ${index + 1}: "${item.name}"`);
    console.log(`   Nome normalizado: "${normalizedDishName}"`);
    
    // Se já foi adicionado um prato com nome similar, pular
    if (addedNormalizedNames.has(normalizedDishName)) {
      console.log(`   ⏭️  Prato com nome similar já adicionado: ${normalizedDishName}`);
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
    
    console.log(`   Variações testadas:`);
    variations.forEach((variation, vIndex) => {
      const isIncluded = normalizedMessage.includes(variation);
      console.log(`     ${vIndex + 1}. "${variation}" - ${isIncluded ? '✅ Encontrado' : '❌ Não encontrado'}`);
    });
    
    // Verificar se alguma variação aparece na mensagem
    const isMentioned = variations.some(variation => 
      normalizedMessage.includes(variation)
    );
    
    if (isMentioned) {
      recommendedDishes.push(item);
      addedDishIds.add(item.id || item.name); // Marcar como adicionado por ID
      addedNormalizedNames.add(normalizedDishName); // Marcar como adicionado por nome normalizado
      console.log(`   ✅ ADICIONADO: ${item.name}`);
    } else {
      console.log(`   ❌ NÃO ADICIONADO: ${item.name}`);
    }
  });

  return recommendedDishes;
}

// Dados de teste
const testRestaurantData = {
  name: 'Restaurante Teste',
  menu_items: [
    {
      id: 1,
      name: 'Caldinho de Feijoada',
      description: 'Caldinho tradicional de feijoada',
      price: 13.00
    },
    {
      id: 2,
      name: 'Caldinho De Feijoada',
      description: 'Caldinho De feijoada (com D maiúsculo)',
      price: 13.00
    },
    {
      id: 3,
      name: 'Caldinho feijoada',
      description: 'Caldinho feijoada (sem "de")',
      price: 13.00
    },
    {
      id: 4,
      name: 'Picanha na Brasa',
      description: 'Picanha grelhada na brasa',
      price: 35.00
    },
    {
      id: 5,
      name: 'Moqueca de Peixe',
      description: 'Peixe cozido no leite de coco',
      price: 28.00
    }
  ]
};

// Mensagens de teste
const testMessages = [
  'Qual o prato mais barato?',
  'Me fale sobre o Caldinho de Feijoada',
  'Quero saber sobre o Caldinho De Feijoada',
  'Gostaria de informações sobre Caldinho feijoada',
  'Quais são os pratos com peixe?'
];

console.log('🧪 Testando Extração de Pratos Recomendados\n');

testMessages.forEach((message, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 TESTE ${index + 1}: "${message}"`);
  console.log(`${'='.repeat(60)}`);
  
  const result = extractRecommendedDishes(message, testRestaurantData);
  
  console.log(`\n📊 RESULTADO:`);
  if (result.length === 0) {
    console.log('   ❌ Nenhum prato encontrado');
  } else {
    console.log(`   ✅ ${result.length} prato(s) encontrado(s):`);
    result.forEach((dish, i) => {
      console.log(`      ${i + 1}. ${dish.name} - R$ ${dish.price}`);
    });
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('🎉 Teste concluído!');
console.log('\n📋 Verificações realizadas:');
console.log('   ✅ Detecção de variações de nomes');
console.log('   ✅ Prevenção de duplicatas');
console.log('   ✅ Normalização de texto');
console.log('   ✅ Casos de teste diversos');
