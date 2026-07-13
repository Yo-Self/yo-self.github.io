import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/config';
import { useEffect, useState } from 'react';

interface UseRestaurantPixPaymentResult {
  pixPaymentEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches opt-in PIX settings per restaurant.
 * Defaults to disabled — production restaurants are unaffected until explicitly enabled in DB.
 *
 * Dev override (optional, .env.local only):
 *   NEXT_PUBLIC_INFINITEPAY_DEV_ENABLED=true
 */
export function useRestaurantPixPayment(restaurantIdOrSlug?: string): UseRestaurantPixPaymentResult {
  const [pixPaymentEnabled, setPixPaymentEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlag = async () => {
      if (!restaurantIdOrSlug || restaurantIdOrSlug === 'default') {
        setPixPaymentEnabled(false);
        return;
      }

      if (
        process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_INFINITEPAY_DEV_ENABLED === 'true'
      ) {
        setPixPaymentEnabled(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const supabaseUrl = getSupabaseUrl();
        const supabaseKey = getSupabasePublishableKey();

        if (!supabaseUrl || !supabaseKey) {
          setPixPaymentEnabled(false);
          return;
        }

        const select = 'online_ordering_enabled,pix_payment_enabled';

        let response = await fetch(
          `${supabaseUrl}/rest/v1/restaurants_public?slug=eq.${encodeURIComponent(restaurantIdOrSlug)}&select=${select}`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        let data: { online_ordering_enabled?: boolean; pix_payment_enabled?: boolean }[] | null = null;
        if (response.ok) {
          data = await response.json();
        }

        if (!response.ok || !data || data.length === 0) {
          response = await fetch(
            `${supabaseUrl}/rest/v1/restaurants_public?id=eq.${encodeURIComponent(restaurantIdOrSlug)}&select=${select}`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (response.ok) {
            data = await response.json();
          }
        }

        if (!response.ok) {
          throw new Error('Failed to fetch PIX payment settings');
        }

        if (data && data.length > 0) {
          const row = data[0];
          setPixPaymentEnabled(
            row.online_ordering_enabled !== false && row.pix_payment_enabled === true,
          );
        } else {
          setPixPaymentEnabled(false);
        }
      } catch (err) {
        console.error('Error fetching PIX payment settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPixPaymentEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlag();
  }, [restaurantIdOrSlug]);

  return { pixPaymentEnabled, isLoading, error };
}
