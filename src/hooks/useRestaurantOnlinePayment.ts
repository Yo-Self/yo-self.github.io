import { useEffect, useState } from 'react';

interface UseRestaurantOnlinePaymentResult {
  onlinePayment: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useRestaurantOnlinePayment(restaurantIdOrSlug?: string): UseRestaurantOnlinePaymentResult {
  const [onlinePayment, setOnlinePayment] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlag = async () => {
      if (!restaurantIdOrSlug || restaurantIdOrSlug === 'default') {
        setOnlinePayment(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase config missing; defaulting onlinePayment=false');
          setOnlinePayment(false);
          return;
        }

        // Try by slug first
        let response = await fetch(
          `${supabaseUrl}/rest/v1/restaurants_public?slug=eq.${encodeURIComponent(restaurantIdOrSlug)}&select=online_ordering_enabled,online_payment`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        let data: any = null;
        if (response.ok) {
          data = await response.json();
        }

        if (!response.ok || !data || data.length === 0) {
          response = await fetch(
            `${supabaseUrl}/rest/v1/restaurants_public?id=eq.${encodeURIComponent(restaurantIdOrSlug)}&select=online_ordering_enabled,online_payment`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            data = await response.json();
          }
        }

        if (!response.ok) {
          throw new Error('Failed to fetch online_payment');
        }

        if (data && data.length > 0) {
          const row = data[0];
          setOnlinePayment(row?.online_ordering_enabled !== false && row?.online_payment === true);
        } else {
          // Default to false if restaurant not found
          setOnlinePayment(false);
        }
      } catch (err) {
        console.error('Error fetching online_payment:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fail-safe: default to false
        setOnlinePayment(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlag();
  }, [restaurantIdOrSlug]);

  return { onlinePayment, isLoading, error };
}
