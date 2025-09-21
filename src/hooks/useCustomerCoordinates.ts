import { useState, useCallback } from 'react';
import { Coordinates } from '../utils/distanceCalculator';

interface CustomerCoordinates {
  coordinates: Coordinates | null;
  address: string;
}

const CUSTOMER_COORDINATES_STORAGE_KEY = 'customer_coordinates';

export function useCustomerCoordinates() {
  const [customerCoordinates, setCustomerCoordinates] = useState<CustomerCoordinates>(() => {
    // Carregar do localStorage no cliente
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CUSTOMER_COORDINATES_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Erro ao carregar coordenadas do cliente:', error);
      }
    }
    return {
      coordinates: null,
      address: ''
    };
  });

  // Salvar no localStorage sempre que mudar
  const saveToStorage = useCallback((data: CustomerCoordinates) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CUSTOMER_COORDINATES_STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.warn('Erro ao salvar coordenadas do cliente:', error);
      }
    }
  }, []);

  const updateCoordinates = useCallback((coordinates: Coordinates | null, address: string) => {
    const newData = { coordinates, address };
    setCustomerCoordinates(newData);
    saveToStorage(newData);
  }, [saveToStorage]);

  const clearCoordinates = useCallback(() => {
    const emptyData = { coordinates: null, address: '' };
    setCustomerCoordinates(emptyData);
    saveToStorage(emptyData);
  }, [saveToStorage]);

  return {
    customerCoordinates,
    updateCoordinates,
    clearCoordinates
  };
}
