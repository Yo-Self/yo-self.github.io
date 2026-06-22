export type Complement = {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  ingredients?: string;
  allergens?: string;
  portion?: string;
};

export type ComplementGroup = {
  id?: string;
  title: string;
  description?: string;
  required?: boolean;
  max_selections?: number;
  preface_question?: string | null;
  preface_options?: { id: string; label: string; position: number }[] | null;
  complements: Complement[];
};

export type Dish = {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  tags?: string[];
  ingredients: string;
  allergens: string;
  portion: string;
  category?: string;
  categories?: string[];
  complement_groups?: ComplementGroup[];
};

export type MenuItem = Omit<Dish, 'category'> & { 
  category: string;
  categories: string[];
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  welcome_message: string;
  image: string;
  waiter_call_enabled?: boolean;
  menu_categories: string[];
  featured_dishes: Dish[];
  menu_items: MenuItem[];
  whatsapp_phone?: string;
  whatsapp_enabled?: boolean;
  whatsapp_custom_message?: string;
  online_payment?: boolean;
  table_ordering?: boolean;
  online_ordering_enabled?: boolean;
  pix_payment_enabled?: boolean;
  infinitepay_handle?: string;
  user_id?: string;
  min_order_value?: number;
  stripe_connect_id?: string;
  delivery_enabled?: boolean;
  delivery_max_distance?: number;
  delivery_base_fee?: number;
  delivery_fee_per_km?: number;
  delivery_zones?: any[];
  latitude?: number;
  longitude?: number;
  address?: string;
  open?: boolean;
  is_open_for_orders?: boolean;
  operating_hours?: {
    id: string;
    restaurant_id: string;
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }[];
};