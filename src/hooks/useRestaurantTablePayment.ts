import { useEffect, useState } from 'react';

interface UseRestaurantTablePaymentResult {
  tablePayment: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useRestaurantTablePayment(restaurantIdOrSlug?: string): UseRestaurantTablePaymentResult {
  const [tablePayment, setTablePayment] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlag = async () => {
      if (!restaurantIdOrSlug || restaurantIdOrSlug === 'default') {
        setTablePayment(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase config missing; defaulting tablePayment=false');
          setTablePayment(false);
          return;
        }

        // Try by slug first
        let response = await fetch(
          `${supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(restaurantIdOrSlug)}&select=table_payment`,
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
            `${supabaseUrl}/rest/v1/restaurants?id=eq.${encodeURIComponent(restaurantIdOrSlug)}&select=table_payment`,
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
          throw new Error('Failed to fetch table_payment');
        }

        if (data && data.length > 0) {
          const row = data[0];
          setTablePayment(row?.table_payment === true);
        } else {
          // Default to false if restaurant not found
          setTablePayment(false);
        }
      } catch (err) {
        console.error('Error fetching table_payment:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fail-closed: don't show table payment form
        setTablePayment(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlag();
  }, [restaurantIdOrSlug]);

  return { tablePayment, isLoading, error };
}
