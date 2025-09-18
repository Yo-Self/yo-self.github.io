"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface CustomerData {
  name: string;
  address: string;
  number: string;
  complement: string;
}

interface CustomerDataContextType {
  customerData: CustomerData;
  updateName: (name: string) => void;
  updateAddress: (address: string) => void;
  updateNumber: (number: string) => void;
  updateComplement: (complement: string) => void;
  clearCustomerData: () => void;
  isCustomerDataComplete: boolean;
}

const CustomerDataContext = createContext<CustomerDataContextType | undefined>(undefined);

// Chave para o localStorage
const CUSTOMER_DATA_STORAGE_KEY = 'customer_data';

// Funções para gerenciar localStorage
const saveCustomerDataToStorage = (data: CustomerData) => {
  try {
    localStorage.setItem(CUSTOMER_DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Erro ao salvar dados do cliente no localStorage:', error);
  }
};

const loadCustomerDataFromStorage = (): CustomerData => {
  try {
    const stored = localStorage.getItem(CUSTOMER_DATA_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validar se tem a estrutura correta
      if (parsed && typeof parsed === 'object') {
        return {
          name: parsed.name || '',
          address: parsed.address || '',
          number: parsed.number || '',
          complement: parsed.complement || ''
        };
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar dados do cliente do localStorage:', error);
  }
  
  // Retornar dados padrão se não conseguir carregar
  return {
    name: '',
    address: '',
    number: '',
    complement: ''
  };
};

interface CustomerDataProviderProps {
  children: ReactNode;
}

export function CustomerDataProvider({ children }: CustomerDataProviderProps) {
  // Carregar dados do localStorage na inicialização
  const [customerData, setCustomerData] = useState<CustomerData>(() => {
    // Só carregar do localStorage no cliente
    if (typeof window !== 'undefined') {
      return loadCustomerDataFromStorage();
    }
    return {
      name: '',
      address: '',
      number: '',
      complement: ''
    };
  });

  // Salvar dados no localStorage sempre que customerData mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveCustomerDataToStorage(customerData);
    }
  }, [customerData]);

  const updateName = useCallback((name: string) => {
    setCustomerData(prev => ({ ...prev, name }));
  }, []);

  const updateAddress = useCallback((address: string) => {
    const cleanAddress = address || '';
    setCustomerData(prev => {
      const newData = { ...prev, address: cleanAddress };
      return newData;
    });
  }, []);

  const updateNumber = useCallback((number: string) => {
    setCustomerData(prev => ({ ...prev, number }));
  }, []);

  const updateComplement = useCallback((complement: string) => {
    setCustomerData(prev => ({ ...prev, complement }));
  }, []);

  const clearCustomerData = useCallback(() => {
    const emptyData = {
      name: '',
      address: '',
      number: '',
      complement: ''
    };
    setCustomerData(emptyData);
    
    // Limpar também do localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CUSTOMER_DATA_STORAGE_KEY);
      } catch (error) {
        console.warn('Erro ao limpar dados do cliente do localStorage:', error);
      }
    }
  }, []);

  // Todos os campos são opcionais
  const isCustomerDataComplete = true;

  const value: CustomerDataContextType = {
    customerData,
    updateName,
    updateAddress,
    updateNumber,
    updateComplement,
    clearCustomerData,
    isCustomerDataComplete
  };

  return (
    <CustomerDataContext.Provider value={value}>
      {children}
    </CustomerDataContext.Provider>
  );
}

export function useCustomerData(): CustomerDataContextType {
  const context = useContext(CustomerDataContext);
  if (context === undefined) {
    throw new Error('useCustomerData must be used within a CustomerDataProvider');
  }
  return context;
}
