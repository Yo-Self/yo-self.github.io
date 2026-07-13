-- Migration: add_cash_on_delivery
-- Description:
--   Adds restaurants.cash_on_delivery_enabled toggle, exposes it on the public menu view,
--   whitelists the customer_info.payment_method key in sanitize_customer_info, and extends
--   create_customer_order to allow cash-on-delivery / cash-on-pickup orders to be created
--   directly as confirmed ('new') orders so they appear in the orders and delivery panels.
--
-- NOTE: The view and create_customer_order bodies below are rebased on the *live* database
--   definitions (fetched via pg_get_viewdef / pg_get_functiondef) so this migration only adds
--   the cash-on-delivery behaviour without reverting later security/geocoding changes.

-- 1. New restaurant toggle
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS cash_on_delivery_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.restaurants.cash_on_delivery_enabled IS
  'Controls whether the digital menu offers "Dinheiro na entrega/retirada" (cash on delivery/pickup). Only meaningful when online_payment is enabled.';

-- 2. Recreate the public menu view to expose the new flag.
--    Preserves the live column set (stripe_payments_ready is a computed expression; owner-only
--    fields like stripe_connect_id / infinitepay_handle are intentionally NOT exposed).
CREATE OR REPLACE VIEW public.restaurants_public AS
SELECT
  id,
  name,
  slug,
  address,
  address_active,
  background_light,
  background_night,
  created_at,
  cuisine_type,
  description,
  image_url,
  is_open_for_orders,
  latitude,
  longitude,
  online_payment,
  open,
  table_payment,
  table_ordering,
  updated_at,
  waiter_call_enabled,
  welcome_message,
  whatsapp_custom_message,
  whatsapp_enabled,
  whatsapp_phone,
  has_tables,
  tables_count,
  table_categories,
  min_order_value,
  delivery_enabled,
  delivery_max_distance,
  delivery_base_fee,
  delivery_fee_per_km,
  delivery_zones,
  pix_payment_enabled,
  online_ordering_enabled,
  (stripe_connect_id IS NOT NULL AND COALESCE(online_payment, false)) AS stripe_payments_ready,
  cash_on_delivery_enabled
FROM public.restaurants;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- 3. Whitelist the payment_method key so the cash-on-delivery marker survives sanitization.
--    received_cash / change are already whitelisted.
CREATE OR REPLACE FUNCTION public.sanitize_customer_info(info jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  k text;
  text_keys text[] := ARRAY[
    'name', 'phone', 'observation', 'notes', 'address',
    'delivery_type', 'queue_password', 'delivery_address', 'complement',
    'payment_method'
  ];
BEGIN
  IF info IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  FOREACH k IN ARRAY text_keys
  LOOP
    IF info ? k AND info->>k IS NOT NULL THEN
      result := result || jsonb_build_object(k, public.sanitize_customer_text(info->>k));
    END IF;
  END LOOP;

  IF info ? 'received_cash' THEN
    result := result || jsonb_build_object('received_cash', info->'received_cash');
  END IF;
  IF info ? 'change' THEN
    result := result || jsonb_build_object('change', info->'change');
  END IF;
  IF info ? 'is_takeaway' THEN
    result := result || jsonb_build_object('is_takeaway', info->'is_takeaway');
  END IF;

  RETURN result;
END;
$$;

-- 4. Extend create_customer_order to accept confirmed cash-on-delivery / cash-on-pickup orders.
--    Rebased on the live definition; only the cash-related branches are added.
CREATE OR REPLACE FUNCTION public.create_customer_order(
  p_order jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET statement_timeout = '15s'
AS $$
DECLARE
  v_restaurant_id uuid;
  v_status public.order_status;
  v_order_type text;
  v_order_id uuid;
  v_item jsonb;
  v_comp jsonb;
  v_result jsonb;
  v_dish_id uuid;
  v_dish_price_cents integer;
  v_quantity integer;
  v_item_subtotal integer := 0;
  v_computed_total integer := 0;
  v_delivery_fee integer := 0;
  v_delivery_distance numeric;
  v_comp_id uuid;
  v_comp_cents integer;
  v_comp_name text;
  v_validated_complements jsonb := '[]'::jsonb;
  v_validated_answers jsonb := '[]'::jsonb;
  v_group_counts jsonb := '{}'::jsonb;
  v_group_id uuid;
  v_group_max integer;
  v_group_count integer;
  v_restaurant record;
  v_delivery record;
  v_min_order_cents integer;
  v_customer_lat numeric;
  v_customer_lng numeric;
  v_geocoded_lat numeric;
  v_geocoded_lng numeric;
  v_delivery_address text;
  v_coords_mismatch_km numeric;
  v_sanitized_info jsonb;
  v_table_name text;
  v_address_hash text;
  v_is_cash boolean := false;
BEGIN
  IF p_order IS NULL OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'invalid_payload';
  END IF;

  IF NULLIF(p_order->>'stripe_payment_intent_id', '') IS NOT NULL THEN
    RAISE EXCEPTION 'forbidden_payment_fields';
  END IF;

  v_restaurant_id := (p_order->>'restaurant_id')::uuid;
  v_status := COALESCE((p_order->>'status')::public.order_status, 'pending_payment');
  v_order_type := COALESCE(NULLIF(p_order->>'order_type', ''), 'dine_in');
  v_sanitized_info := public.sanitize_customer_info(COALESCE(p_order->'customer_info', '{}'::jsonb));

  -- Cash-on-delivery / cash-on-pickup marker (delivery and pickup only).
  v_is_cash := (v_sanitized_info->>'payment_method' = 'cash' AND v_order_type IN ('delivery', 'pickup'));

  SELECT r.open, r.is_open_for_orders, r.table_ordering, r.online_payment, r.min_order_value, r.online_ordering_enabled, r.cash_on_delivery_enabled
  INTO v_restaurant FROM public.restaurants r WHERE r.id = v_restaurant_id;

  IF NOT FOUND OR v_restaurant.open IS DISTINCT FROM true OR v_restaurant.is_open_for_orders IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'restaurant_not_accepting_orders';
  END IF;

  IF v_restaurant.online_ordering_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'online_ordering_disabled';
  END IF;

  -- Cash orders can only be created when the restaurant explicitly enabled the feature.
  IF v_is_cash AND v_restaurant.cash_on_delivery_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'cash_on_delivery_disabled';
  END IF;

  IF NOT (
    v_status = 'pending_payment'
    OR (v_status = 'new' AND v_restaurant.table_ordering = true AND v_restaurant.online_payment = false)
    OR (v_status = 'new' AND v_is_cash AND v_restaurant.cash_on_delivery_enabled = true)
  ) THEN
    RAISE EXCEPTION 'invalid_order_status';
  END IF;

  -- Table name + table-order rate limit apply only to the table-ordering ('new') branch,
  -- never to cash delivery/pickup orders (which have no table).
  IF v_status = 'new' AND NOT v_is_cash THEN
    v_table_name := public.sanitize_customer_text(NULLIF(p_order->>'table_name', ''), 100);
    IF v_table_name IS NULL OR btrim(v_table_name) = '' THEN RAISE EXCEPTION 'missing_table_name'; END IF;
    PERFORM public.assert_table_order_rate_limit(v_restaurant_id, v_table_name);
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_dish_id := (v_item->>'dish_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    IF v_dish_id IS NULL OR v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 99 THEN RAISE EXCEPTION 'invalid_item'; END IF;
    SELECT public.price_to_cents(d.price) INTO v_dish_price_cents FROM public.dishes d WHERE d.id = v_dish_id AND d.restaurant_id = v_restaurant_id AND d.is_available = true;
    IF v_dish_price_cents IS NULL THEN RAISE EXCEPTION 'invalid_dish'; END IF;
    v_item_subtotal := v_dish_price_cents; v_validated_complements := '[]'::jsonb; v_group_counts := '{}'::jsonb;
    FOR v_comp IN SELECT value FROM jsonb_array_elements(COALESCE(v_item->'selected_complements', '[]'::jsonb)) LOOP
      BEGIN v_comp_id := (v_comp->>'complement_id')::uuid; EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'invalid_complement'; END;
      IF v_comp_id IS NULL THEN RAISE EXCEPTION 'invalid_complement'; END IF;
      SELECT public.price_to_cents(c.price), c.name, cg.id, cg.max_selections INTO v_comp_cents, v_comp_name, v_group_id, v_group_max
      FROM public.complements c JOIN public.complement_groups cg ON cg.id = c.group_id JOIN public.dish_complement_groups dcg ON dcg.complement_group_id = cg.id
      WHERE c.id = v_comp_id AND dcg.dish_id = v_dish_id AND cg.restaurant_id = v_restaurant_id AND COALESCE(c.is_active, true) = true;
      IF v_comp_cents IS NULL THEN RAISE EXCEPTION 'invalid_complement'; END IF;
      v_group_count := COALESCE((v_group_counts->>v_group_id::text)::integer, 0) + 1;
      v_group_counts := jsonb_set(v_group_counts, ARRAY[v_group_id::text], to_jsonb(v_group_count), true);
      IF v_group_max IS NOT NULL AND v_group_max > 0 AND v_group_count > v_group_max THEN RAISE EXCEPTION 'complement_max_exceeded'; END IF;
      v_item_subtotal := v_item_subtotal + v_comp_cents;
      v_validated_complements := v_validated_complements || jsonb_build_array(jsonb_build_object('complement_id', v_comp_id, 'name', v_comp_name, 'price', v_comp_cents));
    END LOOP;
    PERFORM public.validate_complement_group_preface_answers(v_dish_id, v_restaurant_id, v_group_counts, COALESCE(v_item->'complement_group_answers', '[]'::jsonb));
    v_computed_total := v_computed_total + (v_item_subtotal * v_quantity);
  END LOOP;

  IF v_order_type = 'delivery' THEN
    v_delivery_address := public.sanitize_customer_text(NULLIF(p_order->>'delivery_address', ''), 500);
    IF v_delivery_address IS NULL THEN RAISE EXCEPTION 'missing_delivery_address'; END IF;
    v_customer_lat := NULLIF(p_order->>'delivery_coords_lat', '')::numeric;
    v_customer_lng := NULLIF(p_order->>'delivery_coords_lng', '')::numeric;
    IF v_customer_lat IS NULL OR v_customer_lng IS NULL THEN RAISE EXCEPTION 'missing_coordinates'; END IF;
    v_address_hash := encode(digest(lower(btrim(v_delivery_address)), 'sha256'), 'hex');
    PERFORM public.assert_delivery_order_rate_limit(v_restaurant_id, v_address_hash);
    IF v_customer_lat < -90 OR v_customer_lat > 90 OR v_customer_lng < -180 OR v_customer_lng > 180 THEN RAISE EXCEPTION 'missing_coordinates'; END IF;

    v_geocoded_lat := NULL;
    v_geocoded_lng := NULL;

    BEGIN
      SELECT g.lat, g.lng
      INTO v_geocoded_lat, v_geocoded_lng
      FROM public.geocode_delivery_address(v_delivery_address) AS g;

      IF v_geocoded_lat IS NOT NULL AND v_geocoded_lng IS NOT NULL THEN
        v_coords_mismatch_km := public.haversine_km(v_customer_lat, v_customer_lng, v_geocoded_lat, v_geocoded_lng);
        IF v_coords_mismatch_km IS NULL OR v_coords_mismatch_km > 0.5 THEN
          v_geocoded_lat := v_customer_lat;
          v_geocoded_lng := v_customer_lng;
        END IF;
      ELSE
        v_geocoded_lat := v_customer_lat;
        v_geocoded_lng := v_customer_lng;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_geocoded_lat := v_customer_lat;
        v_geocoded_lng := v_customer_lng;
    END;

    SELECT d.fee_cents, d.distance_km, d.covered, d.reason INTO v_delivery FROM public.compute_delivery_fee_cents(v_restaurant_id, v_geocoded_lat, v_geocoded_lng) AS d;
    IF v_delivery.reason = 'missing_coordinates' THEN RAISE EXCEPTION 'missing_coordinates'; END IF;
    IF v_delivery.covered IS DISTINCT FROM true THEN RAISE EXCEPTION 'delivery_not_covered'; END IF;
    v_delivery_fee := COALESCE(v_delivery.fee_cents, 0); v_delivery_distance := v_delivery.distance_km;
  ELSE
    v_delivery_fee := 0; v_delivery_distance := NULL; v_delivery_address := NULL; v_geocoded_lat := NULL; v_geocoded_lng := NULL; v_customer_lat := NULL; v_customer_lng := NULL;
  END IF;

  v_computed_total := v_computed_total + v_delivery_fee;
  IF v_order_type = 'delivery' AND COALESCE(v_restaurant.min_order_value, 0) > 0 THEN
    v_min_order_cents := public.price_to_cents(v_restaurant.min_order_value);
    IF v_computed_total - v_delivery_fee < v_min_order_cents THEN RAISE EXCEPTION 'min_order_value_not_met'; END IF;
  END IF;

  -- For cash orders that expect change, compute the change server-side from the validated total.
  IF v_is_cash
     AND (v_sanitized_info ? 'received_cash')
     AND (v_sanitized_info->>'received_cash') ~ '^[0-9]+$' THEN
    v_sanitized_info := jsonb_set(
      v_sanitized_info,
      '{change}',
      to_jsonb(GREATEST((v_sanitized_info->>'received_cash')::integer - v_computed_total, 0)),
      true
    );
  END IF;

  INSERT INTO public.orders (restaurant_id, table_name, customer_info, total_price, status, order_type, delivery_fee, delivery_distance, delivery_address, delivery_coords_lat, delivery_coords_lng, delivery_address_details, stripe_payment_intent_id)
  VALUES (
    v_restaurant_id,
    CASE WHEN v_status = 'new' AND NOT v_is_cash THEN v_table_name ELSE public.sanitize_customer_text(NULLIF(p_order->>'table_name', ''), 100) END,
    v_sanitized_info, v_computed_total, v_status, v_order_type, v_delivery_fee, v_delivery_distance, v_delivery_address,
    CASE WHEN v_order_type = 'delivery' THEN v_customer_lat ELSE NULL END,
    CASE WHEN v_order_type = 'delivery' THEN v_customer_lng ELSE NULL END,
    CASE WHEN v_order_type = 'delivery' THEN p_order->'delivery_address_details' ELSE NULL END,
    NULL
  )
  RETURNING id INTO v_order_id;

  IF v_status = 'new' AND NOT v_is_cash THEN PERFORM public.record_table_order_rate_event(v_restaurant_id, v_table_name); END IF;
  IF v_order_type = 'delivery' THEN PERFORM public.record_delivery_order_rate_event(v_restaurant_id, v_address_hash); END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_dish_id := (v_item->>'dish_id')::uuid; v_quantity := (v_item->>'quantity')::integer;
    SELECT public.price_to_cents(d.price) INTO v_dish_price_cents FROM public.dishes d WHERE d.id = v_dish_id AND d.restaurant_id = v_restaurant_id AND d.is_available = true;
    v_validated_complements := '[]'::jsonb; v_group_counts := '{}'::jsonb;
    FOR v_comp IN SELECT value FROM jsonb_array_elements(COALESCE(v_item->'selected_complements', '[]'::jsonb)) LOOP
      v_comp_id := (v_comp->>'complement_id')::uuid;
      SELECT public.price_to_cents(c.price), c.name, cg.id, cg.max_selections INTO v_comp_cents, v_comp_name, v_group_id, v_group_max FROM public.complements c JOIN public.complement_groups cg ON cg.id = c.group_id JOIN public.dish_complement_groups dcg ON dcg.complement_group_id = cg.id WHERE c.id = v_comp_id AND dcg.dish_id = v_dish_id AND cg.restaurant_id = v_restaurant_id AND COALESCE(c.is_active, true) = true;
      v_group_count := COALESCE((v_group_counts->>v_group_id::text)::integer, 0) + 1; v_group_counts := jsonb_set(v_group_counts, ARRAY[v_group_id::text], to_jsonb(v_group_count), true);
      v_validated_complements := v_validated_complements || jsonb_build_array(jsonb_build_object('complement_id', v_comp_id, 'name', v_comp_name, 'price', v_comp_cents));
    END LOOP;
    v_validated_answers := public.validate_complement_group_preface_answers(v_dish_id, v_restaurant_id, v_group_counts, COALESCE(v_item->'complement_group_answers', '[]'::jsonb));
    INSERT INTO public.order_items (order_id, dish_id, quantity, price_at_time_of_order, selected_complements, complement_group_answers, sent_to_kitchen, notes)
    VALUES (v_order_id, v_dish_id, v_quantity, v_dish_price_cents, v_validated_complements, CASE WHEN jsonb_array_length(v_validated_answers) > 0 THEN v_validated_answers ELSE NULL END, COALESCE((v_item->>'sent_to_kitchen')::boolean, true), public.sanitize_customer_text(NULLIF(v_item->>'notes', ''), 500));
  END LOOP;

  SELECT to_jsonb(o) INTO v_result FROM public.orders o WHERE o.id = v_order_id;
  RETURN v_result;
END;
$$;
