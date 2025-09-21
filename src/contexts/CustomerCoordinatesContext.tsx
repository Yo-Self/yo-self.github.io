"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Coordinates } from '../utils/distanceCalculator';

export interface CustomerCoordinates {
  coordinates: Coordinates | null;
  address: string;
}

interface CustomerCoordinatesContextType {
  customerCoordinates: CustomerCoordinates;
  updateCoordinates: (coordinates: Coordinates | null, address: string) => void;
  clearCoordinates: () => void;
}

const CustomerCoordinatesContext = createContext<CustomerCoordinatesContextType | undefined>(undefined);

const CUSTOMER_COORDINATES_STORAGE_KEY = 'customer_coordinates';

// Função para carregar dados do localStorage
function loadCustomerCoordinatesFromStorage(): CustomerCoordinates {
  if (typeof window === 'undefined') {
    return { coordinates: null, address: '' };
  }
  
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
  
  return { coordinates: null, address: '' };
}

// Função para salvar dados no localStorage
function saveCustomerCoordinatesToStorage(data: CustomerCoordinates) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(CUSTOMER_COORDINATES_STORAGE_KEY, JSON.stringify(data));
    console.log('Coordenadas do cliente salvas no localStorage:', data);
  } catch (error) {
    console.warn('Erro ao salvar coordenadas do cliente:', error);
  }
}

interface CustomerCoordinatesProviderProps {
  children: ReactNode;
}

export function CustomerCoordinatesProvider({ children }: CustomerCoordinatesProviderProps) {
  // Carregar dados do localStorage na inicialização
  const [customerCoordinates, setCustomerCoordinates] = useState<CustomerCoordinates>(() => {
    return loadCustomerCoordinatesFromStorage();
  });

  // Salvar dados no localStorage sempre que customerCoordinates mudar
  useEffect(() => {
    saveCustomerCoordinatesToStorage(customerCoordinates);
  }, [customerCoordinates]);

  const updateCoordinates = useCallback((coordinates: Coordinates | null, address: string) => {
    console.log('🔄 Atualizando coordenadas do cliente:', { coordinates, address });
    const newData = { coordinates, address };
    setCustomerCoordinates(newData);
    console.log('✅ Coordenadas atualizadas e salvas:', newData);
  }, []);

  const clearCoordinates = useCallback(() => {
    console.log('Limpando coordenadas do cliente');
    const emptyData = { coordinates: null, address: '' };
    setCustomerCoordinates(emptyData);
  }, []);

  // Debug: Log quando coordenadas mudarem
  useEffect(() => {
    console.log('Estado atual das coordenadas do cliente:', customerCoordinates);
  }, [customerCoordinates]);

  const value: CustomerCoordinatesContextType = {
    customerCoordinates,
    updateCoordinates,
    clearCoordinates
  };

  return (
    <CustomerCoordinatesContext.Provider value={value}>
      {children}
    </CustomerCoordinatesContext.Provider>
  );
}

// Hook para usar o contexto
export function useCustomerCoordinates(): CustomerCoordinatesContextType {
  const context = useContext(CustomerCoordinatesContext);
  if (context === undefined) {
    throw new Error('useCustomerCoordinates deve ser usado dentro de um CustomerCoordinatesProvider');
  }
  return context;
}
