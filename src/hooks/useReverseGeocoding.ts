"use client";

import { useState, useCallback } from 'react';
import { GeolocationPosition } from './useGeolocation';

export interface AddressResult {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: any[];
}

export interface ReverseGeocodingState {
  addresses: AddressResult[];
  isLoading: boolean;
  error: string | null;
}

export function useReverseGeocoding() {
  const [state, setState] = useState<ReverseGeocodingState>({
    addresses: [],
    isLoading: false,
    error: null
  });

  const getAddressesFromCoordinates = useCallback(async (position: GeolocationPosition) => {
    if (!window.google?.maps?.places) {
      setState(prev => ({
        ...prev,
        error: 'Google Maps não está carregado',
        isLoading: false
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      // Usar Geocoder do Google Maps
      const geocoder = new window.google.maps.Geocoder();
      
      const results = await new Promise<any[]>((resolve, reject) => {
        geocoder.geocode(
          {
            location: {
              lat: position.latitude,
              lng: position.longitude
            },
            componentRestrictions: { country: 'br' }
          },
          (results: any, status: any) => {
            if (status === 'OK' && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding falhou: ${status}`));
            }
          }
        );
      });

      // Filtrar e priorizar endereços com nome de rua
      const filteredResults = results.filter(result => {
        const addressComponents = result.address_components || [];
        
        // Verificar se tem componente de rua (route)
        const hasRoute = addressComponents.some((component: any) => 
          component.types.includes('route')
        );
        
        // Verificar se tem componente de número (street_number)
        const hasStreetNumber = addressComponents.some((component: any) => 
          component.types.includes('street_number')
        );
        
        // Verificar se tem componente de bairro (sublocality ou neighborhood)
        const hasNeighborhood = addressComponents.some((component: any) => 
          component.types.includes('sublocality') || 
          component.types.includes('neighborhood')
        );
        
        // Priorizar endereços com rua e número, ou pelo menos com rua
        return hasRoute && (hasStreetNumber || hasNeighborhood);
      });

      // Se não encontrou endereços específicos, usar os primeiros 3 resultados
      const finalResults = filteredResults.length > 0 ? filteredResults : results.slice(0, 3);

      // Converter resultados para formato compatível
      const addresses: AddressResult[] = finalResults.map(result => ({
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        geometry: {
          location: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng()
          }
        },
        address_components: result.address_components
      }));

      setState({
        addresses,
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      console.error('❌ Erro no reverse geocoding:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao buscar endereços'
      }));
    }
  }, []);

  const clearAddresses = useCallback(() => {
    setState({
      addresses: [],
      isLoading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    getAddressesFromCoordinates,
    clearAddresses
  };
}
