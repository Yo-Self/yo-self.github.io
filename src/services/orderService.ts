
import { supabase as clientSupabase } from '@/lib/supabase/client';
import { Order, OrderItem } from '../types/order';

const getSupabase = () => {
  if (!clientSupabase) {
    throw new Error('Supabase client is not initialized. Check environment variables.');
  }
  return clientSupabase;
};

function mapOrderCreationError(error: { message?: string; details?: string; code?: string }): Error {
  const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();

  if (msg.includes('restaurant_not_accepting_orders')) {
    return new Error('O restaurante não está aceitando pedidos no momento.');
  }
  if (msg.includes('invalid_order_status')) {
    return new Error('Status de pedido inválido para checkout.');
  }
  if (msg.includes('invalid_payload')) {
    return new Error('Não foi possível criar o pedido: carrinho inválido.');
  }
  if (msg.includes('invalid_dish') || msg.includes('invalid_item') || msg.includes('invalid_complement')) {
    return new Error('Um ou mais itens do carrinho não estão mais disponíveis. Atualize o cardápio e tente novamente.');
  }
  if (msg.includes('delivery_not_covered')) {
    return new Error('Endereço fora da área de entrega.');
  }
  if (msg.includes('min_order_value_not_met')) {
    return new Error('O valor mínimo do pedido não foi atingido.');
  }
  if (msg.includes('complement_max_exceeded')) {
    return new Error('Seleção de complementos inválida. Revise seu pedido.');
  }

  return new Error('Não foi possível criar o pedido. Tente novamente.');
}

export const createOrder = async (
  order: Omit<Order, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[],
): Promise<Order> => {
  const supabase = getSupabase();

  if (items.length === 0) {
    throw new Error('Não foi possível criar o pedido: carrinho vazio.');
  }

  const { data, error } = await supabase.rpc('create_customer_order', {
    p_order: {
      restaurant_id: order.restaurant_id,
      table_name: order.table_name ?? null,
      customer_info: order.customer_info ?? {},
      total_price: order.total_price,
      status: order.status,
      order_type: order.order_type || 'dine_in',
      delivery_fee: order.delivery_fee ?? 0,
      delivery_distance: order.delivery_distance ?? null,
      delivery_address: order.delivery_address ?? null,
      delivery_coords_lat: order.delivery_coords_lat ?? null,
      delivery_coords_lng: order.delivery_coords_lng ?? null,
      delivery_address_details: order.delivery_address_details ?? null,
      stripe_payment_intent_id: order.stripe_payment_intent_id ?? null,
    },
    p_items: items.map((item) => ({
      dish_id: item.dish_id,
      quantity: item.quantity,
      price_at_time_of_order: item.price_at_time_of_order,
      selected_complements: item.selected_complements ?? [],
      sent_to_kitchen: item.sent_to_kitchen !== false,
    })),
  });

  if (error) {
    console.error('Error creating order via RPC:', error);
    throw mapOrderCreationError(error);
  }

  if (!data || typeof data !== 'object' || !('id' in data)) {
    throw new Error('Não foi possível criar o pedido. Resposta inválida do servidor.');
  }

  return data as Order;
};
