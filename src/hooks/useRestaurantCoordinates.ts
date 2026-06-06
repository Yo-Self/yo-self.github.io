import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/config';
import { useState, useEffect } from 'react';
import { Coordinates } from '../utils/distanceCalculator';

interface RestaurantCoordinates {
  coordinates: Coordinates | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useRestaurantCoordinates(restaurantId?: string): RestaurantCoordinates {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRestaurantCoordinates = async () => {
      if (!restaurantId || restaurantId === "default") {
        setCoordinates(null);
        setAddress(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const supabaseUrl = getSupabaseUrl();
        const supabaseKey = getSupabasePublishableKey();
        
        if (!supabaseUrl || !supabaseKey) {
          console.warn('Configuração do Supabase não encontrada');
          setCoordinates(null);
          setAddress(null);
          return;
        }
        
        // Buscar coordenadas do restaurante
        let response = await fetch(`${supabaseUrl}/rest/v1/restaurants_public?slug=eq.${encodeURIComponent(restaurantId)}&select=latitude,longitude,address`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        let data = null;
        
        if (response.ok) {
          data = await response.json();
        }
        
        // Se não encontrar por slug, tentar por ID
        if (!response.ok || !data || data.length === 0) {
          response = await fetch(`${supabaseUrl}/rest/v1/restaurants_public?id=eq.${encodeURIComponent(restaurantId)}&select=latitude,longitude,address`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            data = await response.json();
          }
        }

        if (response.ok && data && data.length > 0) {
          const restaurant = data[0];
          
          if (restaurant.latitude && restaurant.longitude) {
            setCoordinates({
              latitude: parseFloat(restaurant.latitude),
              longitude: parseFloat(restaurant.longitude)
            });
            setAddress(restaurant.address || null);
            console.log('Coordenadas do restaurante carregadas:', {
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
              address: restaurant.address
            });
          } else {
            console.log('Restaurante não possui coordenadas configuradas');
            setCoordinates(null);
            setAddress(restaurant.address || null);
          }
        } else {
          console.log('Restaurante não encontrado ou erro na busca');
          setCoordinates(null);
          setAddress(null);
        }
      } catch (err) {
        console.error('Erro ao carregar coordenadas do restaurante:', err);
        setError('Erro ao carregar dados do restaurante');
        setCoordinates(null);
        setAddress(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurantCoordinates();
  }, [restaurantId]);

  return {
    coordinates,
    address,
    isLoading,
    error
  };
}
