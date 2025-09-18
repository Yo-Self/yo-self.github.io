"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

interface CustomerDataProviderProps {
  children: ReactNode;
}

export function CustomerDataProvider({ children }: CustomerDataProviderProps) {
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    address: '',
    number: '',
    complement: ''
  });

  const updateName = useCallback((name: string) => {
    setCustomerData(prev => ({ ...prev, name }));
  }, []);

  const updateAddress = useCallback((address: string) => {
    const cleanAddress = (address || '').trim();
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
    setCustomerData({
      name: '',
      address: '',
      number: '',
      complement: ''
    });
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
