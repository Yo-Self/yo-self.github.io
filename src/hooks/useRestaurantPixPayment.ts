import { useEffect, useState } from 'react';

interface UseRestaurantPixPaymentResult {
  pixPaymentEnabled: boolean;
  infinitepayHandle: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches opt-in PIX settings per restaurant.
 * Defaults to disabled — production restaurants are unaffected until explicitly enabled in DB.
 *
 * Dev override (optional, .env.local only):
 *   NEXT_PUBLIC_INFINITEPAY_DEV_ENABLED=true
 *   NEXT_PUBLIC_INFINITEPAY_DEV_HANDLE=jessemonteiro
 */
export function useRestaurantPixPayment(restaurantIdOrSlug?: string): UseRestaurantPixPaymentResult {
  const [pixPaymentEnabled, setPixPaymentEnabled] = useState(false);
  const [infinitepayHandle, setInfinitepayHandle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlag = async () => {
      if (!restaurantIdOrSlug || restaurantIdOrSlug === 'default') {
        setPixPaymentEnabled(false);
        setInfinitepayHandle(null);
        return;
      }

      const devEnabled = process.env.NEXT_PUBLIC_INFINITEPAY_DEV_ENABLED === 'true';
      const devHandle = process.env.NEXT_PUBLIC_INFINITEPAY_DEV_HANDLE?.replace(/^\$/, '').trim();
      if (process.env.NODE_ENV === 'development' && devEnabled && devHandle) {
        setPixPaymentEnabled(true);
        setInfinitepayHandle(devHandle);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          setPixPaymentEnabled(false);
          setInfinitepayHandle(null);
          return;
        }

        const select = 'online_ordering_enabled,pix_payment_enabled,infinitepay_handle';

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

        let data: { online_ordering_enabled?: boolean; pix_payment_enabled?: boolean; infinitepay_handle?: string }[] | null = null;
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
          const handle = row.infinitepay_handle?.replace(/^\$/, '').trim() || null;
          setPixPaymentEnabled(row.online_ordering_enabled !== false && row.pix_payment_enabled === true && !!handle);
          setInfinitepayHandle(handle);
        } else {
          setPixPaymentEnabled(false);
          setInfinitepayHandle(null);
        }
      } catch (err) {
        console.error('Error fetching PIX payment settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPixPaymentEnabled(false);
        setInfinitepayHandle(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlag();
  }, [restaurantIdOrSlug]);

  return { pixPaymentEnabled, infinitepayHandle, isLoading, error };
}
