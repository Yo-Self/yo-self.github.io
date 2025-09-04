import { useState, useEffect } from 'react';
import { Restaurant } from '@/types/restaurant';

export function useRestaurantData(restaurantId?: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRestaurantData = async () => {
      if (!restaurantId || restaurantId === "default") {
        setRestaurant(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Buscar dados completos do restaurante do banco de dados
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.warn('Configuração do Supabase não encontrada');
          setRestaurant(null);
          return;
        }
        
        // Tentar buscar por slug primeiro (mais comum), depois por ID
        let response = await fetch(`${supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(restaurantId)}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        let data = null;
        
        // Se não encontrar por slug, tentar por ID
        if (!response.ok || (await response.json()).length === 0) {
          response = await fetch(`${supabaseUrl}/rest/v1/restaurants?id=eq.${encodeURIComponent(restaurantId)}&select=*`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          });
        }

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do restaurante');
        }

        data = await response.json();
        
        if (data && data.length > 0) {
          setRestaurant(data[0]);
        } else {
          setRestaurant(null);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do restaurante:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setRestaurant(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurantData();
  }, [restaurantId]);

  return {
    restaurant,
    isLoading,
    error
  };
}
