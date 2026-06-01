"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useActiveOrders } from '@/hooks/useActiveOrders';
import {
  getStatusEmojiWithType,
  getStatusTitle,
  getStatusDescription,
  getProgressValue
} from '@/utils/orderStatusMapper';
import { useModalScroll } from '@/hooks/useModalScroll';

interface OrderStatusModalProps {
  orderId: string;
  onClose: () => void;
}

export default function OrderStatusModal({ orderId, onClose }: OrderStatusModalProps) {
  const [status, setStatus] = useState<string>("pending");
  const [restaurantName, setRestaurantName] = useState<string>("Carregando...");
  const [deliveryType, setDeliveryType] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const { removeActiveOrderId } = useActiveOrders();

  useModalScroll(true);

  const fetchOrderDetails = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          status, 
          customer_info, 
          restaurants ( name )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (data) {
        setStatus(data.status);
        if (data.restaurants && typeof data.restaurants === 'object' && 'name' in data.restaurants) {
           setRestaurantName(data.restaurants.name as string);
        } else if (Array.isArray(data.restaurants) && data.restaurants.length > 0) {
           setRestaurantName(data.restaurants[0].name as string);
        }

        const info = data.customer_info as any;
        if (info && info.delivery_type) {
          setDeliveryType(info.delivery_type);
        }
      }
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    fetchOrderDetails();

    const channel = supabase
      .channel(`public:orders:id=eq.${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new && payload.new.status) {
            setStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [orderId]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleCancel = async () => {
    if (isCancelling || !supabase) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
        
      if (error) throw error;
      
      removeActiveOrderId(orderId);
      handleClose();
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Erro ao cancelar o pedido. Tente novamente.");
      setIsCancelling(false);
    }
  };

  // Se finalizou, permitimos o usuário ver, mas se ele fechar a tela, removemos dos ativos
  const handleCloseFinal = () => {
    if (status === 'completed' || status === 'finished' || status === 'cancelled') {
      removeActiveOrderId(orderId);
    }

    if (typeof window !== 'undefined' && !localStorage.getItem('has_seen_tracking_tutorial')) {
      localStorage.setItem('has_seen_tracking_tutorial', 'true');
      window.dispatchEvent(new CustomEvent('show-tracking-tutorial'));
    }

    handleClose();
  };

  return (
    <div 
      className={`
        fixed inset-0 z-[999999] flex items-center justify-center p-4
        ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}
      `}
      onClick={handleCloseFinal}
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div 
        className={`
          bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
          max-w-md w-full overflow-hidden relative
          ${isClosing ? 'modal-exit' : 'modal-container'}
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Acompanhar Pedido
          </h2>
          <button
            onClick={handleCloseFinal}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-gray-800 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="p-10 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-500">Buscando status do seu pedido...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Restaurant Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {restaurantName}
              </span>
            </div>

            {/* Pulsing Emoji */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-full animate-pulse-slow"></div>
                <span className="text-6xl relative z-10 animate-bounce-slight">
                  {getStatusEmojiWithType(status, deliveryType)}
                </span>
              </div>
            </div>

            {/* Status Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {getStatusTitle(status, deliveryType)}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm px-4">
                {getStatusDescription(status, deliveryType)}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Progresso</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Math.round(getProgressValue(status, deliveryType) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 ease-out"
                  style={{ width: `${getProgressValue(status, deliveryType) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Order ID */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl flex justify-between items-center mt-6 border border-gray-100 dark:border-gray-800">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">ID do Pedido</span>
                <p className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                  #{orderId.substring(0, 8).toUpperCase()}
                </p>
              </div>
              {deliveryType === 'delivery' && (
                <div className="space-y-1 text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tipo</span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Delivery</p>
                </div>
              )}
            </div>

            {/* Cancel Button */}
            {status === 'pending_payment' && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full mt-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl transition-colors border border-red-200 dark:border-red-900/50 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cancelar Pedido
                  </>
                )}
              </button>
            )}

            <p className="text-[10px] text-center text-gray-400 mt-4">
              Este status é sincronizado em tempo real.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(1.05); }
        }
        .animate-bounce-slight {
          animation: bounce-slight 2s infinite;
        }
        @keyframes bounce-slight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
