import { useEffect, useState } from 'react';

interface UseRestaurantAddressActiveResult {
  addressActive: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useRestaurantAddressActive(restaurantIdOrSlug?: string): UseRestaurantAddressActiveResult {
  const [addressActive, setAddressActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlag = async () => {
      if (!restaurantIdOrSlug || restaurantIdOrSlug === 'default') {
        setAddressActive(true);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase config missing; defaulting addressActive=true');
          setAddressActive(true);
          return;
        }

        // Try by slug first
        let response = await fetch(
          `${supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(restaurantIdOrSlug)}&select=address_active`,
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
            `${supabaseUrl}/rest/v1/restaurants?id=eq.${encodeURIComponent(restaurantIdOrSlug)}&select=address_active`,
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
          throw new Error('Failed to fetch address_active');
        }

        if (data && data.length > 0) {
          const row = data[0];
          setAddressActive(row?.address_active !== false);
        } else {
          // Default to true if restaurant not found
          setAddressActive(true);
        }
      } catch (err) {
        console.error('Error fetching address_active:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fail-open: allow address fields to show
        setAddressActive(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlag();
  }, [restaurantIdOrSlug]);

  return { addressActive, isLoading, error };
}


