// Teste para verificar se waiter_call_enabled está sendo lida corretamente
const { fetchRestaurantsRows } = require('./src/services/restaurants.ts');

async function testWaiterCallEnabled() {
  try {
    console.log('🔍 Testando leitura de waiter_call_enabled...');
    
    const rows = await fetchRestaurantsRows();
    const moendo = rows.find(r => r.id === 'e1f70b34-20f5-4e08-9b68-d801ca33ee54');
    
    if (moendo) {
      console.log('✅ Restaurante Moendo encontrado:');
      console.log('  - waiter_call_enabled:', moendo.waiter_call_enabled);
      console.log('  - tipo:', typeof moendo.waiter_call_enabled);
      console.log('  - é true?', moendo.waiter_call_enabled === true);
    } else {
      console.log('❌ Restaurante Moendo não encontrado');
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testWaiterCallEnabled();
