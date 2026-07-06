-- YOS-29: lockout after repeated failed POS discount PIN attempts.

CREATE TABLE IF NOT EXISTS public.pos_pin_attempts (
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  failed_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (restaurant_id, user_id)
);

ALTER TABLE public.pos_pin_attempts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.pos_pin_attempts IS
  'Failed POS discount PIN attempts per restaurant/user; used by verify_restaurant_discount_pin.';

CREATE OR REPLACE FUNCTION public.verify_restaurant_discount_pin(
  p_restaurant_id uuid,
  p_pin text,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_failed integer;
  v_locked_until timestamptz;
BEGIN
  IF p_restaurant_id IS NULL OR p_pin IS NULL OR length(trim(p_pin)) = 0 THEN
    RETURN false;
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT failed_count, locked_until
    INTO v_failed, v_locked_until
    FROM public.pos_pin_attempts
    WHERE restaurant_id = p_restaurant_id
      AND user_id = p_user_id;

    IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
      RETURN false;
    END IF;
  END IF;

  SELECT pos_discount_pin_hash
  INTO v_hash
  FROM public.restaurants
  WHERE id = p_restaurant_id
    AND pos_discount_pin_enabled = true;

  IF v_hash IS NULL THEN
    RETURN false;
  END IF;

  IF v_hash = crypt(p_pin, v_hash) THEN
    IF p_user_id IS NOT NULL THEN
      DELETE FROM public.pos_pin_attempts
      WHERE restaurant_id = p_restaurant_id
        AND user_id = p_user_id;
    END IF;
    RETURN true;
  END IF;

  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.pos_pin_attempts (restaurant_id, user_id, failed_count, locked_until, updated_at)
    VALUES (
      p_restaurant_id,
      p_user_id,
      1,
      NULL,
      now()
    )
    ON CONFLICT (restaurant_id, user_id) DO UPDATE
    SET
      failed_count = public.pos_pin_attempts.failed_count + 1,
      locked_until = CASE
        WHEN public.pos_pin_attempts.failed_count + 1 >= 5 THEN now() + interval '15 minutes'
        ELSE public.pos_pin_attempts.locked_until
      END,
      updated_at = now();
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_restaurant_discount_pin(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_restaurant_discount_pin(uuid, text, uuid) TO service_role;

-- Drop old 2-arg overload so callers cannot bypass lockout.
DROP FUNCTION IF EXISTS public.verify_restaurant_discount_pin(uuid, text);
