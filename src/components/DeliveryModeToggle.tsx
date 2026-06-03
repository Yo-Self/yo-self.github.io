"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DeliveryScooterIcon, StoreIcon } from './icons/MenuIcons';

interface DeliveryModeToggleProps {
  slug: string;
}

export default function DeliveryModeToggle({ slug }: DeliveryModeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDelivery = pathname?.startsWith('/delivery');

  const handleToggle = (mode: 'delivery' | 'retirada') => {
    if (mode === 'delivery' && !isDelivery) {
      router.push(`/delivery/${slug}`);
    } else if (mode === 'retirada' && isDelivery) {
      router.push(`/restaurant/${slug}`);
    }
  };

  return (
    <div 
      data-tutorial="delivery-toggle"
      className="relative flex items-center bg-gray-100 dark:bg-gray-900 p-0.5 rounded-full shadow-inner select-none shrink-0 border border-gray-200/50 dark:border-gray-800 h-[36px] w-[90px] min-[440px]:w-[220px] transition-all duration-300"
    >
      {/* Sliding indicator */}
      <div 
        className="absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-cyan-500 dark:bg-cyan-600 shadow-md transition-all duration-300 ease-out"
        style={{
          width: 'calc(50% - 2px)',
          transform: isDelivery ? 'translateX(100%)' : 'translateX(0%)'
        }}
      />
      
      {/* Retirada Option */}
      <button
        onClick={() => handleToggle('retirada')}
        className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 outline-none cursor-pointer h-full ${
          !isDelivery 
            ? 'text-white' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <StoreIcon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
        <span className="max-[440px]:hidden">Retirada</span>
      </button>

      {/* Delivery Option */}
      <button
        onClick={() => handleToggle('delivery')}
        className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 outline-none cursor-pointer h-full ${
          isDelivery 
            ? 'text-white' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <DeliveryScooterIcon className="w-4 h-4 shrink-0" />
        <span className="max-[440px]:hidden">Delivery</span>
      </button>
    </div>
  );
}
