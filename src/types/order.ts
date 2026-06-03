
export type OrderStatus = 'pending_payment' | 'new' | 'in_preparation' | 'ready' | 'finished' | 'cancelled';

export interface Order {
  id: string;
  restaurant_id: string;
  table_name?: string;
  customer_info?: { name?: string; phone?: string; [key: string]: any };
  total_price: number;
  status: OrderStatus;
  customer_access_token?: string;
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
  created_at: string;
  updated_at: string;
  
  // Novos campos de delivery
  order_type?: 'dine_in' | 'delivery' | 'pickup' | null;
  delivery_fee?: number | null;
  delivery_distance?: number | null;
  delivery_address?: string | null;
  delivery_coords_lat?: number | null;
  delivery_coords_lng?: number | null;
  delivery_address_details?: any;
}

export interface OrderItem {
  id: string;
  order_id: string;
  dish_id: string;
  quantity: number;
  price_at_time_of_order: number;
  selected_complements?: { complement_id: string; name: string; price: number }[];
  sent_to_kitchen?: boolean;
  created_at: string;
}
