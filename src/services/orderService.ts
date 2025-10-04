
import { createClient } from '@supabase/supabase-js';
import { Order, OrderItem } from '../types/order';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]): Promise<Order> => {
  // 1. Create the order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        restaurant_id: order.restaurant_id,
        table_name: order.table_name,
        customer_info: order.customer_info,
        total_price: order.total_price,
        status: order.status,
        stripe_payment_intent_id: order.stripe_payment_intent_id,
      },
    ])
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw new Error('Failed to create order.');
  }

  // 2. Add order items
  const orderItems = items.map(item => ({
    order_id: orderData.id,
    dish_id: item.dish_id,
    quantity: item.quantity,
    price_at_time_of_order: item.price_at_time_of_order,
    selected_complements: item.selected_complements,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // If creating items fails, we should probably delete the order
    // to avoid orphaned orders.
    await supabase.from('orders').delete().eq('id', orderData.id);
    throw new Error('Failed to create order items.');
  }

  return orderData;
};
