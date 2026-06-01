"use client";

import React, { useState } from 'react';
import { useActiveOrders } from '@/hooks/useActiveOrders';
import OrderStatusModal from './OrderStatusModal';

export default function ActiveOrdersWidget() {
  const { activeOrderIds } = useActiveOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (activeOrderIds.length === 0) {
    return null;
  }

  // Se houver múltiplos pedidos, poderíamos mostrar uma lista, mas para simplificar, 
  // vamos abrir o modal do pedido mais recente e o modal/widget pode ser clicado
  const handleOpenTracking = () => {
    // Abre o último pedido ativo
    setSelectedOrderId(activeOrderIds[activeOrderIds.length - 1]);
  };

  return (
    <>
      <div className="fixed bottom-24 right-4 z-[990] animate-bounce-slight">
        <button
          onClick={handleOpenTracking}
          className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform"
        >
          <div className="relative flex items-center justify-center w-6 h-6">
             <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
             <div className="relative bg-indigo-500 w-3 h-3 rounded-full"></div>
          </div>
          <span className="font-bold text-sm">
            {activeOrderIds.length > 1 ? `Acompanhar (\${activeOrderIds.length})` : 'Acompanhar Pedido'}
          </span>
        </button>
      </div>

      {selectedOrderId && (
        <OrderStatusModal 
          orderId={selectedOrderId} 
          onClose={() => setSelectedOrderId(null)} 
        />
      )}

      <style jsx>{`
        .animate-bounce-slight {
          animation: bounce-slight 3s infinite;
        }
        @keyframes bounce-slight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
