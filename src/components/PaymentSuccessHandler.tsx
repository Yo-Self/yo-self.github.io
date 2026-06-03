"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../hooks/useCart';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';
import Analytics from '../lib/analytics';
import { useActiveOrders } from '../hooks/useActiveOrders';
import { waitForCustomerOrderPayment } from '../services/orderTrackingService';

interface PaymentSuccessHandlerProps {
  restaurantId?: string;
}

type VerificationState = 'idle' | 'verifying' | 'confirmed' | 'processing' | 'failed';

/**
 * Detects Stripe return via query params and verifies payment server-side
 * before showing the success modal.
 */
export default function PaymentSuccessHandler({ restaurantId = "default" }: PaymentSuccessHandlerProps) {
  const searchParams = useSearchParams();
  const { items, formattedTotalPrice, totalItems, clearCart } = useCart();
  const { addActiveOrderId, getOrderAccessToken } = useActiveOrders();
  const { config } = useWhatsAppConfig(restaurantId);

  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [verificationState, setVerificationState] = useState<VerificationState>('idle');
  const [isClosing, setIsClosing] = useState(false);
  const handledRef = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const cleanPaymentParamsFromUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('payment_success');
    url.searchParams.delete('payment_cancelled');
    url.searchParams.delete('order_id');
    url.searchParams.delete('order_token');
    url.searchParams.delete('session_id');
    url.searchParams.delete('redirect_status');
    url.searchParams.delete('payment_intent');
    url.searchParams.delete('payment_intent_client_secret');
    window.history.replaceState({}, '', url.toString());
  }, []);

  useEffect(() => {
    if (handledRef.current) return;

    const paymentSuccess = searchParams.get('payment_success');
    const orderIdParam = searchParams.get('order_id');
    const orderTokenParam = searchParams.get('order_token');
    const paymentCancelled = searchParams.get('payment_cancelled');
    const redirectStatus = searchParams.get('redirect_status');

    if (paymentCancelled === 'true') {
      handledRef.current = true;
      cleanPaymentParamsFromUrl();
      return;
    }

    if (paymentSuccess !== 'true' || !orderIdParam) {
      return;
    }

    handledRef.current = true;

    const accessToken =
      orderTokenParam || getOrderAccessToken(orderIdParam);

    setOrderId(orderIdParam);
    setShowModal(true);
    addActiveOrderId(orderIdParam, accessToken || undefined);

    if (redirectStatus === 'succeeded') {
      setVerificationState('confirmed');
      Analytics.trackCartCheckout(itemsRef.current, 0, restaurantId, 'stripe_completed');
      cleanPaymentParamsFromUrl();
      return;
    }

    if (redirectStatus === 'failed') {
      setVerificationState('failed');
      cleanPaymentParamsFromUrl();
      return;
    }

    if (!accessToken) {
      setVerificationState('processing');
      cleanPaymentParamsFromUrl();
      return;
    }

    let isActive = true;
    setVerificationState('verifying');

    (async () => {
      try {
        const result = await waitForCustomerOrderPayment(orderIdParam, accessToken, {
          maxAttempts: 20,
          intervalMs: 2000,
        });

        if (!isActive) return;

        cleanPaymentParamsFromUrl();

        if (!result) {
          setVerificationState('failed');
          return;
        }

        if (result.status === 'cancelled') {
          setVerificationState('failed');
          return;
        }

        if (result.is_paid) {
          setVerificationState('confirmed');
          Analytics.trackCartCheckout(itemsRef.current, 0, restaurantId, 'stripe_completed');
          return;
        }

        setVerificationState('processing');
      } catch (err) {
        console.error('Payment verification failed:', err);
        if (isActive) {
          cleanPaymentParamsFromUrl();
          setVerificationState('processing');
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [searchParams, restaurantId, addActiveOrderId, getOrderAccessToken, cleanPaymentParamsFromUrl]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      if (verificationState === 'confirmed') {
        clearCart();
      }
    }, 300);
  }, [clearCart, verificationState]);

  const handleTrackOrder = useCallback(() => {
    handleClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-order-tracking'));
    }, 400);
  }, [handleClose]);

  const handleContactRestaurant = useCallback(() => {
    if (!config.phoneNumber) return;

    let message = config.customMessage || 'Olá! Gostaria de entrar em contato sobre meu pedido.';
    if (orderId) {
      message += `\n\nPedido: #${orderId.substring(0, 8)}`;
    }

    const whatsappUrl = `https://wa.me/${config.phoneNumber}?text=${encodeURIComponent(message)}`;

    const windowResult = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (!windowResult) {
      const userConfirmed = window.confirm(
        '⚠️ O navegador bloqueou a abertura do WhatsApp.\n\n' +
        'Clique em OK para abrir o WhatsApp agora.'
      );
      if (userConfirmed) {
        window.location.href = whatsappUrl;
      }
    }
  }, [config.phoneNumber, config.customMessage, orderId]);

  if (!showModal) return null;

  const isConfirmed = verificationState === 'confirmed';
  const isVerifying = verificationState === 'verifying';
  const isFailed = verificationState === 'failed';

  return (
    <div
      className={`
        fixed inset-0 z-[999999] flex items-center justify-center p-4
        ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}
      `}
      onClick={handleClose}
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
        <div className={`p-8 text-center ${
          isFailed
            ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
            : isConfirmed
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
              : 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20'
        }`}>
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isFailed
              ? 'bg-red-100 dark:bg-red-900/40'
              : isConfirmed
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-indigo-100 dark:bg-indigo-900/40'
          }`}>
            {isVerifying ? (
              <svg className="animate-spin h-10 w-10 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isFailed ? (
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {isVerifying && 'Confirmando pagamento...'}
            {isFailed && 'Pagamento não confirmado'}
            {isConfirmed && 'Pagamento Confirmado!'}
            {!isVerifying && !isFailed && !isConfirmed && 'Processando pagamento'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isVerifying && 'Aguarde enquanto verificamos com o Stripe.'}
            {isFailed && 'Não foi possível confirmar o pagamento deste pedido.'}
            {isConfirmed && 'Seu pedido foi pago com sucesso.'}
            {!isVerifying && !isFailed && !isConfirmed && 'Seu pagamento está sendo processado. Você pode acompanhar o pedido em instantes.'}
          </p>
        </div>

        {(isConfirmed || verificationState === 'processing') && (
          <div className="p-6 space-y-4">
            {orderId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Pedido</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  #{orderId.substring(0, 8)}
                </span>
              </div>
            )}
            {isConfirmed && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Itens</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span className="text-gray-800 dark:text-gray-200">Total Pago</span>
                  <span className="text-green-600 dark:text-green-400">R$ {formattedTotalPrice}</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-6 pt-0 space-y-3">
          {isConfirmed && config.enabled && config.phoneNumber && (
            <button
              onClick={handleContactRestaurant}
              className="
                w-full flex items-center justify-center gap-3
                px-6 py-4
                bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
                text-white font-semibold
                rounded-xl shadow-lg hover:shadow-xl
                transition-all duration-200
                transform hover:scale-[1.02] active:scale-[0.98]
              "
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="text-lg font-bold">Entrar em contato com o restaurante</span>
            </button>
          )}

          {(isConfirmed || verificationState === 'processing') && (
            <button
              onClick={handleTrackOrder}
              className="
                w-full flex items-center justify-center gap-3
                px-6 py-4
                bg-indigo-500 hover:bg-indigo-600 text-white
                border border-transparent
                rounded-xl shadow-lg
                hover:shadow-xl
                transition-all duration-200
                transform hover:scale-[1.02] active:scale-[0.98]
                font-bold
              "
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Acompanhar o pedido
            </button>
          )}

          {!isConfirmed && verificationState !== 'processing' && (
            <button
              onClick={handleClose}
              className="
                w-full px-6 py-3
                text-gray-700 dark:text-gray-300
                border border-gray-300 dark:border-gray-600
                rounded-xl
                hover:bg-gray-50 dark:hover:bg-gray-800
                transition-colors
                font-medium
              "
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
