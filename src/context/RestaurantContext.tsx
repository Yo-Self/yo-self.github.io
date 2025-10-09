'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface RestaurantContextType {
  restaurantId: string | undefined;
  setRestaurantId: (id: string | undefined) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [restaurantId, setRestaurantId] = useState<string | undefined>(undefined);

  return (
    <RestaurantContext.Provider value={{ restaurantId, setRestaurantId }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
