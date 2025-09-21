import { useState, useCallback, useEffect } from 'react';
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
          const parsed = JSON.parse(stored);
          console.log('Coordenadas do cliente carregadas do localStorage:', parsed);
          return parsed;
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
        console.log('Coordenadas do cliente salvas no localStorage:', data);
      } catch (error) {
        console.warn('Erro ao salvar coordenadas do cliente:', error);
      }
    }
  }, []);

  const updateCoordinates = useCallback((coordinates: Coordinates | null, address: string) => {
    console.log('Atualizando coordenadas do cliente:', { coordinates, address });
    const newData = { coordinates, address };
    setCustomerCoordinates(newData);
    saveToStorage(newData);
  }, [saveToStorage]);

  const clearCoordinates = useCallback(() => {
    console.log('Limpando coordenadas do cliente');
    const emptyData = { coordinates: null, address: '' };
    setCustomerCoordinates(emptyData);
    saveToStorage(emptyData);
  }, [saveToStorage]);

  // Debug: Log quando coordenadas mudarem
  useEffect(() => {
    console.log('Estado atual das coordenadas do cliente:', customerCoordinates);
  }, [customerCoordinates]);

  return {
    customerCoordinates,
    updateCoordinates,
    clearCoordinates
  };
}
