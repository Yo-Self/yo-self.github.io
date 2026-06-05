-- Schema inicial para réplica local do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    slug TEXT NOT NULL UNIQUE,
    is_organization BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Restaurantes
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    cuisine_type TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    waiter_call_enabled BOOLEAN DEFAULT true,
    whatsapp_phone TEXT,
    whatsapp_enabled BOOLEAN DEFAULT true,
    whatsapp_custom_message TEXT,
    min_order_value NUMERIC DEFAULT 0,
    background_light TEXT,
    background_night TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Campos adicionais consultados pelo frontend
    open BOOLEAN DEFAULT true,
    is_open_for_orders BOOLEAN DEFAULT true,
    online_payment BOOLEAN DEFAULT false,
    table_ordering BOOLEAN DEFAULT true,
    online_ordering_enabled BOOLEAN DEFAULT true,
    stripe_connect_id TEXT,
    delivery_enabled BOOLEAN DEFAULT false,
    delivery_max_distance NUMERIC DEFAULT 10.0,
    delivery_base_fee NUMERIC DEFAULT 0.0,
    delivery_fee_per_km NUMERIC DEFAULT 0.0,
    delivery_zones JSONB DEFAULT '[]'::jsonb,
    latitude NUMERIC,
    longitude NUMERIC,
    address TEXT
);

-- Horários do Restaurante
CREATE TABLE IF NOT EXISTS public.restaurant_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TEXT NOT NULL DEFAULT '08:00',
    close_time TEXT NOT NULL DEFAULT '22:00',
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias do Menu
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pratos / Itens do Menu
CREATE TABLE IF NOT EXISTS public.dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0.0,
    image_url TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    is_featured BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}'::text[],
    ingredients TEXT,
    allergens TEXT,
    portion TEXT,
    needs_preparation BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Relacionamento Prato <-> Categoria (para múltiplos mapeamentos)
CREATE TABLE IF NOT EXISTS public.dish_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_dish_category UNIQUE (dish_id, category_id)
);

-- Grupos de Complementos
CREATE TABLE IF NOT EXISTS public.complement_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT false,
    max_selections INTEGER DEFAULT 1,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Complementos
CREATE TABLE IF NOT EXISTS public.complements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.complement_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0.0,
    image_url TEXT,
    ingredients TEXT,
    allergens TEXT,
    portion TEXT,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Relacionamento Prato <-> Grupo de Complementos
CREATE TABLE IF NOT EXISTS public.dish_complement_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    complement_group_id UUID NOT NULL REFERENCES public.complement_groups(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_dish_complement_group UNIQUE (dish_id, complement_group_id)
);

-- Tabela de Chamadas de Garçom
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number INTEGER NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    attended_at TIMESTAMPTZ,
    attended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_name TEXT,
    customer_info JSONB DEFAULT '{}'::jsonb,
    total_price NUMERIC NOT NULL DEFAULT 0.0,
    status TEXT DEFAULT 'pending',
    order_type TEXT DEFAULT 'dine_in',
    delivery_fee NUMERIC DEFAULT 0.0,
    delivery_distance NUMERIC,
    delivery_address TEXT,
    delivery_coords_lat NUMERIC,
    delivery_coords_lng NUMERIC,
    delivery_address_details TEXT,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Itens de Pedido (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time_of_order NUMERIC NOT NULL DEFAULT 0.0,
    selected_complements JSONB DEFAULT '[]'::jsonb,
    sent_to_kitchen BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Log de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET,
    new_values JSONB,
    old_values JSONB,
    operation TEXT NOT NULL,
    record_id TEXT,
    table_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_agent TEXT,
    user_id UUID
);

-- Tabela de Logs de Importação
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categories_count INTEGER,
    complements_count INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    dishes_count INTEGER,
    duration_ms INTEGER,
    error_message TEXT,
    items_processed INTEGER,
    items_total INTEGER,
    metadata JSONB,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    retry_count INTEGER,
    scraped_data JSONB,
    source TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    status TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    url TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Tabela de Menus (Secundária)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- -------------------------------------------------------------
-- Views Necessárias
-- -------------------------------------------------------------

-- View: restaurants_public (Garante leitura pública)
CREATE OR REPLACE VIEW public.restaurants_public AS
SELECT * FROM public.restaurants;

-- View: public_menu_view
CREATE OR REPLACE VIEW public.public_menu_view AS
SELECT 
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    r.slug AS restaurant_slug,
    r.description AS restaurant_description,
    r.image_url AS restaurant_image,
    r.waiter_call_enabled,
    r.whatsapp_phone,
    r.whatsapp_enabled,
    c.id AS category_id,
    c.name AS category_name,
    c.image_url AS category_image,
    c.position AS category_position,
    d.id AS dish_id,
    d.name AS dish_name,
    d.description AS dish_description,
    d.price AS dish_price,
    d.image_url AS dish_image,
    d.is_featured,
    d.ingredients,
    d.allergens,
    d.portion
FROM public.restaurants r
LEFT JOIN public.categories c ON c.restaurant_id = r.id
LEFT JOIN public.dish_categories dc ON dc.category_id = c.id
LEFT JOIN public.dishes d ON d.id = dc.dish_id AND d.is_available = true;

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_complement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para leitura pública (anon acessa para cardápio)
CREATE POLICY "Leitura pública de perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Leitura pública de restaurantes" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Leitura pública de horários" ON public.restaurant_hours FOR SELECT USING (true);
CREATE POLICY "Leitura pública de categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Leitura pública de pratos" ON public.dishes FOR SELECT USING (true);
CREATE POLICY "Leitura pública de categorias de prato" ON public.dish_categories FOR SELECT USING (true);
CREATE POLICY "Leitura pública de grupos de complementos" ON public.complement_groups FOR SELECT USING (true);
CREATE POLICY "Leitura pública de complementos" ON public.complements FOR SELECT USING (true);
CREATE POLICY "Leitura pública de relacionamentos de complementos" ON public.dish_complement_groups FOR SELECT USING (true);
CREATE POLICY "Escrita pública de chamadas de garçom" ON public.waiter_calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura pública de chamadas de garçom" ON public.waiter_calls FOR SELECT USING (true);
CREATE POLICY "Escrita pública de pedidos" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura pública de pedidos" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Escrita pública de itens de pedido" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura pública de itens de pedido" ON public.order_items FOR SELECT USING (true);

-- -------------------------------------------------------------
-- RPC Functions
-- -------------------------------------------------------------

-- Função RPC: create_customer_order
CREATE OR REPLACE FUNCTION public.create_customer_order(
    p_order jsonb,
    p_items jsonb
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order public.orders;
    v_item jsonb;
BEGIN
    -- Inserir pedido principal
    INSERT INTO public.orders (
        restaurant_id,
        table_name,
        customer_info,
        total_price,
        status,
        order_type,
        delivery_fee,
        delivery_distance,
        delivery_address,
        delivery_coords_lat,
        delivery_coords_lng,
        delivery_address_details,
        stripe_payment_intent_id
    ) VALUES (
        (p_order->>'restaurant_id')::uuid,
        p_order->>'table_name',
        COALESCE((p_order->'customer_info'), '{}'::jsonb),
        (p_order->>'total_price')::numeric,
        COALESCE(p_order->>'status', 'pending'),
        COALESCE(p_order->>'order_type', 'dine_in'),
        COALESCE((p_order->>'delivery_fee')::numeric, 0.0),
        (p_order->>'delivery_distance')::numeric,
        p_order->>'delivery_address',
        (p_order->>'delivery_coords_lat')::numeric,
        (p_order->>'delivery_coords_lng')::numeric,
        p_order->>'delivery_address_details',
        p_order->>'stripe_payment_intent_id'
    ) RETURNING * INTO v_order;

    -- Inserir itens do pedido
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            dish_id,
            quantity,
            price_at_time_of_order,
            selected_complements,
            sent_to_kitchen
        ) VALUES (
            v_order.id,
            (v_item->>'dish_id')::uuid,
            COALESCE((v_item->>'quantity')::integer, 1),
            (v_item->>'price_at_time_of_order')::numeric,
            COALESCE((v_item->'selected_complements'), '[]'::jsonb),
            COALESCE((v_item->>'sent_to_kitchen')::boolean, true)
        );
    END LOOP;

    RETURN v_order;
END;
$$;
