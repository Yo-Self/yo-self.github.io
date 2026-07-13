"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useActiveOrders } from '@/hooks/useActiveOrders';
import {
  getStatusEmojiWithType,
  getStatusTitle,
  getStatusDescription,
  getProgressValue
} from '@/utils/orderStatusMapper';
import { useModalScroll } from '@/hooks/useModalScroll';
import { invalidateCheckoutIdempotency } from '@/utils/checkoutIdempotency';
import { cancelCustomerOrder, fetchCustomerOrderStatus } from '@/services/orderTrackingService';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { useCustomerData } from '@/hooks/useCustomerData';

const TERMINAL_STATUSES = new Set(['finished', 'cancelled', 'ready']);
const POLL_INTERVALS_MS = [3000, 5000, 10000, 15000];
const BACKOFF_AFTER_MS = 5 * 60 * 1000;
const BACKOFF_POLL_MS = 30_000;
const HIDDEN_TAB_POLL_MS = 60_000;

interface OrderStatusModalProps {
  orderId: string;
  accessToken?: string | null;
  restaurantId?: string | null;
  onClose: () => void;
}

export default function OrderStatusModal({ orderId, accessToken, restaurantId, onClose }: OrderStatusModalProps) {
  const [status, setStatus] = useState<string>("pending");
  const [restaurantName, setRestaurantName] = useState<string>("Carregando...");
  const [deliveryType, setDeliveryType] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  
  const { removeActiveOrderId, getOrderAccessToken } = useActiveOrders();
  const resolvedToken = accessToken ?? getOrderAccessToken(orderId);

  const { config: whatsAppConfig } = useWhatsAppConfig(restaurantId ?? undefined);
  const { customerData } = useCustomerData();

  useModalScroll(true);

  const fetchOrderDetails = useCallback(async (): Promise<string | null> => {
    if (!resolvedToken) {
      setAccessError('Não foi possível verificar este pedido. Token de acesso ausente.');
      setIsLoading(false);
      return null;
    }

    try {
      const data = await fetchCustomerOrderStatus(orderId, resolvedToken);
      if (!data) {
        setAccessError('Pedido não encontrado ou token inválido.');
        return null;
      }

      setAccessError(null);
      setStatus(data.status);
      setRestaurantName(data.restaurant_name);
      setDeliveryType(data.delivery_type);
      return data.status;
    } catch (err) {
      console.error("Error fetching order:", err);
      setAccessError('Erro ao buscar status do pedido.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [orderId, resolvedToken]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    const startedAt = Date.now();

    const scheduleNextPoll = (currentStatus: string | null) => {
      if (cancelled) return;
      if (currentStatus && TERMINAL_STATUSES.has(currentStatus)) return;

      const elapsed = Date.now() - startedAt;
      const baseDelay = POLL_INTERVALS_MS[Math.min(attempt, POLL_INTERVALS_MS.length - 1)];
      const backoffDelay = elapsed >= BACKOFF_AFTER_MS ? BACKOFF_POLL_MS : baseDelay;
      const delay =
        typeof document !== 'undefined' && document.visibilityState === 'hidden'
          ? HIDDEN_TAB_POLL_MS
          : backoffDelay;
      attempt += 1;
      timeoutId = setTimeout(() => {
        void runPoll();
      }, delay);
    };

    const runPoll = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        scheduleNextPoll(status);
        return;
      }
      const currentStatus = await fetchOrderDetails();
      scheduleNextPoll(currentStatus);
    };

    void runPoll();

    const onVisibilityChange = () => {
      if (cancelled) return;
      if (document.visibilityState === 'visible') {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => void runPoll(), 250);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchOrderDetails, status]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleCancel = async () => {
    if (isCancelling || !resolvedToken) return;
    setIsCancelling(true);
    try {
      const cancelled = await cancelCustomerOrder(orderId, resolvedToken);
      if (!cancelled) {
        throw new Error('Cancel not allowed');
      }
      
      removeActiveOrderId(orderId);
      if (restaurantId) {
        invalidateCheckoutIdempotency(restaurantId);
      }
      handleClose();
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Erro ao cancelar o pedido. Tente novamente.");
      setIsCancelling(false);
    }
  };

  const shortOrderCode = orderId.substring(0, 8).toUpperCase();
  const isTerminalDone = status === 'cancelled' || status === 'completed' || status === 'finished';
  const canContactStore = Boolean(whatsAppConfig.enabled && whatsAppConfig.phoneNumber);

  const handleContactStore = () => {
    if (!canContactStore) return;
    const customerName = customerData?.name?.trim();
    const message =
      `Olá! Gostaria de falar sobre o meu pedido #${shortOrderCode}` +
      (customerName ? ` — Cliente: ${customerName}` : '') +
      '.';
    const whatsappUrl = `https://wa.me/${whatsAppConfig.phoneNumber}?text=${encodeURIComponent(message)}`;

    const opened = window.open(whatsappUrl, '_blank');
    if (!opened || opened.closed) {
      // Popup blocked: fall back to same-tab navigation.
      window.location.href = whatsappUrl;
    }
  };

  const handleClearOrder = () => {
    removeActiveOrderId(orderId);
    handleClose();
  };

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
        ) : accessError ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-red-600 dark:text-red-400">{accessError}</p>
            <button
              onClick={handleCloseFinal}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
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

            <div className="flex justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-full animate-pulse-slow"></div>
                <span className="text-6xl relative z-10 animate-bounce-slight">
                  {getStatusEmojiWithType(status, deliveryType)}
                </span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {getStatusTitle(status, deliveryType)}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm px-4">
                {getStatusDescription(status, deliveryType)}
              </p>
            </div>

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

            {canContactStore && (
              <button
                onClick={handleContactStore}
                className="w-full mt-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 font-bold rounded-xl transition-colors border border-green-200 dark:border-green-900/50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="whitespace-nowrap">Falar com a loja</span>
              </button>
            )}

            {isTerminalDone && (
              <button
                onClick={handleClearOrder}
                className="w-full mt-3 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl transition-colors border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="whitespace-nowrap">Limpar Pedido</span>
              </button>
            )}

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
              Status atualizado automaticamente (intervalo adaptativo).
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
