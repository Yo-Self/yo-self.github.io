
import { supabase as clientSupabase } from '@/lib/supabase/client';
import { Order, OrderItem } from '../types/order';

const getSupabase = () => {
  if (!clientSupabase) {
    throw new Error('Supabase client is not initialized. Check environment variables.');
  }
  return clientSupabase;
};

export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]): Promise<Order> => {
  const supabase = getSupabase();
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
        order_type: order.order_type || 'dine_in',
        delivery_fee: order.delivery_fee,
        delivery_distance: order.delivery_distance,
        delivery_address: order.delivery_address,
        delivery_coords_lat: order.delivery_coords_lat,
        delivery_coords_lng: order.delivery_coords_lng,
        delivery_address_details: order.delivery_address_details,
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
    sent_to_kitchen: item.sent_to_kitchen !== false,
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
