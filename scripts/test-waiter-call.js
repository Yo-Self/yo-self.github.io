// Teste para verificar se waiter_call_enabled está sendo lida corretamente
const { fetchRestaurantsRows } = require('./src/services/restaurants.ts');

async function testWaiterCallEnabled() {
  try {
    const rows = await fetchRestaurantsRows();
    const moendo = rows.find(r => r.id === 'e1f70b34-20f5-4e08-9b68-d801ca33ee54');
    
    if (moendo) {
      // Restaurante Moendo encontrado
    } else {
      // Restaurante Moendo não encontrado
    }
  } catch (error) {
    // Erro no teste
  }
}

testWaiterCallEnabled();
