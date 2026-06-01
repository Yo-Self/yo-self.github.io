"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../hooks/useCart';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';
import { CartUtils } from '../types/cart';
import Analytics from '../lib/analytics';
import { useActiveOrders } from '../hooks/useActiveOrders';

interface PaymentSuccessHandlerProps {
  restaurantId?: string;
}

/**
 * Componente que detecta o retorno do Stripe Checkout via query params
 * e exibe um modal de sucesso com opção de enviar pedido via WhatsApp.
 */
export default function PaymentSuccessHandler({ restaurantId = "default" }: PaymentSuccessHandlerProps) {
  const searchParams = useSearchParams();
  const { items, formattedTotalPrice, totalItems, clearCart } = useCart();
  const { addActiveOrderId } = useActiveOrders();
  const { config } = useWhatsAppConfig(restaurantId);

  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  // Detect payment_success query param
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const orderIdParam = searchParams.get('order_id');
    const paymentCancelled = searchParams.get('payment_cancelled');

    if (paymentSuccess === 'true' && orderIdParam) {
      setOrderId(orderIdParam);
      setShowModal(true);

      // Track successful payment
      Analytics.trackCartCheckout(items, 0, restaurantId, 'stripe_completed');

      // Save order id for tracking
      addActiveOrderId(orderIdParam);

      // Clean URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_success');
      url.searchParams.delete('order_id');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    }

    if (paymentCancelled === 'true') {
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_cancelled');
      url.searchParams.delete('order_id');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, items, restaurantId, addActiveOrderId]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      // Clear cart after closing success modal
      clearCart();
    }, 300);
  }, [clearCart]);

  const handleSendWhatsApp = useCallback(() => {
    if (!config.phoneNumber || !orderId) return;

    let message = `✅ *PEDIDO PAGO — CONFIRMAÇÃO*\n\n`;
    message += `*ID do Pedido:* ${orderId}\n`;
    message += `*Pagamento:* ✅ Confirmado via cartão\n\n`;

    message += `📋 *Itens do Pedido:*\n\n`;

    items.forEach((item, index) => {
      const emoji = index < 9 ? `${index + 1}️⃣` : `${index + 1}.`;
      message += `${emoji} *${item.dish.name}* (${item.quantity}x)\n`;

      if (item.selectedComplements.size > 0) {
        item.selectedComplements.forEach((selections) => {
          selections.forEach(complement => {
            message += `   • ${complement}\n`;
          });
        });
      }

      message += `   *Subtotal:* R$ ${CartUtils.formatPrice(item.totalPrice)}\n\n`;
    });

    message += `💰 *TOTAL PAGO: R$ ${formattedTotalPrice}*\n\n`;
    message += `📱 *Pedido via Cardápio Digital*\n`;
    message += `🕐 ${new Date().toLocaleString('pt-BR')}\n\n`;
    message += `O pagamento já foi processado. Por favor, confirme o tempo de preparo.`;

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

    setWhatsAppSent(true);
  }, [config.phoneNumber, orderId, items, formattedTotalPrice]);

  if (!showModal) return null;

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
        {/* Success Header */}
        <div className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          {/* Animated Checkmark */}
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ animation: 'checkmark 0.5s ease-in-out' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Pagamento Confirmado!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Seu pedido foi pago com sucesso
          </p>
        </div>

        {/* Order Summary */}
        <div className="p-6 space-y-4">
          {orderId && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Pedido</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">
                #{orderId.substring(0, 8)}
              </span>
            </div>
          )}
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
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 space-y-3">
          {/* WhatsApp Button - send order to restaurant */}
          {config.enabled && config.phoneNumber && !whatsAppSent && (
            <button
              onClick={handleSendWhatsApp}
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
              <span className="text-lg font-bold">Enviar Pedido ao Restaurante</span>
            </button>
          )}

          {/* WhatsApp sent confirmation */}
          {whatsAppSent && (
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Pedido enviado via WhatsApp!</span>
            </div>
          )}

          {/* Close Button */}
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
            {whatsAppSent ? 'Fechar' : 'Fechar e Enviar Depois'}
          </button>
        </div>
      </div>

      {/* CSS Animation for checkmark */}
      <style jsx>{`
        @keyframes checkmark {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
