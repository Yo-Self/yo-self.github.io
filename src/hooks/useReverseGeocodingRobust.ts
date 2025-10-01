"use client";

import { useState, useCallback } from 'react';
import { GeolocationPosition } from './useGeolocationRobust';

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

export function useReverseGeocodingRobust() {
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
      const geocoder = new window.google.maps.Geocoder();
      
      const results = await new Promise<any[]>((resolve, reject) => {
        geocoder.geocode({ location: { lat: position.latitude, lng: position.longitude } }, (results: any, status: any) => {
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding falhou: ${status}`));
          }
        });
      });

      const streetAddress = results.find(result => result.types.includes('street_address'));

      const otherAddresses = results.filter(result => result.place_id !== streetAddress?.place_id);

      const finalResults = streetAddress ? [streetAddress, ...otherAddresses.slice(0, 4)] : results.slice(0, 5);

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

