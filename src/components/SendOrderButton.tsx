"use client";

import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useCustomerData } from '../hooks/useCustomerData';
import { useRestaurantBySlug } from '../hooks/useRestaurantBySlug';
import { CartUtils } from '../types/cart';
import { createOrderWithIdempotency } from '../utils/checkoutIdempotency';
import { useCheckoutLock } from '../context/CheckoutContext';
import { Order, OrderItem } from '../types/order';
import Analytics from '../lib/analytics';
import { paymentContextFromCart } from '../lib/paymentAnalytics';
import { useActiveOrders } from '../hooks/useActiveOrders';

interface SendOrderButtonProps {
  restaurantId?: string;
  tableNumber: string;
  className?: string;
  onSent?: () => void;
}

export default function SendOrderButton({
  restaurantId = "default",
  tableNumber,
  className = "",
  onSent
}: SendOrderButtonProps) {
  const { items, totalItems, totalPrice, formattedTotalPrice, isEmpty, clearCart } = useCart();
  const { isCheckoutInProgress, withCheckoutLock } = useCheckoutLock();
  const { customerData } = useCustomerData();
  const { addActiveOrderId } = useActiveOrders();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  const [isSending, setIsSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (isEmpty) {
    return null;
  }

  const handleSendOrder = async () => {
    if (isSending || isEmpty || isCheckoutInProgress) return;

    await withCheckoutLock(async () => {
    if (isLoadingRestaurant) {
      alert("Por favor, aguarde as informações do restaurante carregar...");
      return;
    }

    if (!restaurant?.id) {
      alert("Erro: Não foi possível carregar as informações do restaurante.");
      return;
    }

    if (!tableNumber.trim()) {
      alert("Por favor, informe o número da mesa em que você está.");
      return;
    }

    const paymentCtx = paymentContextFromCart({
      restaurant,
      items,
      subtotalValue: totalPrice,
      totalValue: totalPrice,
      paymentMethod: 'send_order_direct',
      tableId: tableNumber,
      customerData,
    });

    Analytics.trackPaymentMethodClicked(paymentCtx);

    setIsSending(true);

    try {
      const isRetirada = tableNumber.trim().toLowerCase() === 'retirada';
      const orderToCreate: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        restaurant_id: restaurant.id,
        table_name: isRetirada ? 'Retirada' : `Mesa ${tableNumber.trim()}`,
        customer_info: {
          name: customerData.name || (isRetirada ? 'Cliente Retirada' : `Cliente Mesa ${tableNumber.trim()}`),
          phone: customerData.whatsapp || '',
          delivery_type: isRetirada ? 'takeout' : 'dine_in',
          address: isRetirada ? 'Retirada' : `Mesa ${tableNumber.trim()}`,
        },
        total_price: Math.round(totalPrice * 100),
        status: 'new', // Novo status para ir direto para a cozinha no Kanban do Gestor
        order_type: isRetirada ? 'pickup' : 'dine_in',
      };

      const itemsToCreate: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[] = items.map(item =>
        CartUtils.mapItemToOrderPayload(item)
      );

      const { order: newOrder, reusedExisting } = await createOrderWithIdempotency(
        orderToCreate,
        itemsToCreate,
        {
          restaurantId: restaurant.id,
          items,
          customerPhone: customerData.whatsapp,
          tableId: tableNumber.trim(),
          orderType: orderToCreate.order_type,
        },
      );

      // Save order id for tracking
      addActiveOrderId(newOrder.id, newOrder.customer_access_token, restaurant.id);

      Analytics.trackPaymentOrderCreated({ ...paymentCtx, orderId: newOrder.id, reusedExisting });
      Analytics.trackPaymentCompleted({ ...paymentCtx, orderId: newOrder.id });

      // Mostrar modal de sucesso
      setShowSuccessModal(true);
    } catch (error) {
      console.error("[SendOrderButton] Falha ao enviar o pedido:", error);
      const errMsg = error instanceof Error ? error.message : '';
      if (errMsg.includes('Muitos pedidos em pouco tempo')) {
        Analytics.trackOrderRateLimited(restaurant?.id || 'unknown', tableNumber);
      }
      Analytics.trackError(error as Error, {
        component: 'SendOrderButton',
        action: 'send_order_direct',
        restaurantId: restaurant?.id || 'unknown',
        itemCount: items.length,
        totalPrice,
      });

      alert("Houve um erro ao enviar o seu pedido para a cozinha. Por favor, tente novamente.");
    } finally {
      setIsSending(false);
    }
    }, 'send_order_direct');
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    clearCart();
    if (onSent) {
      onSent();
    }
  };

  return (
    <>
      <button
        onClick={handleSendOrder}
        disabled={isSending || isEmpty || isLoadingRestaurant || !restaurant || !tableNumber.trim() || isCheckoutInProgress}
        className={`
          w-full flex items-center justify-center gap-2 sm:gap-3 
          px-3 sm:px-6 py-3.5 sm:py-4 
          bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
          text-white font-semibold 
          rounded-xl shadow-lg hover:shadow-xl
          transition-all duration-200 
          transform hover:scale-[1.02] active:scale-[0.98]
          focus:outline-none focus:ring-4 focus:ring-blue-300
          disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50
          relative overflow-hidden
          ${className}
        `}
        aria-label={`Enviar pedido para a cozinha com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}
      >
        {/* Prato / Seta Icon */}
        <svg 
          className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
          />
        </svg>

        {/* Texto do botão */}
        <div className="flex flex-col items-start min-w-0">
          <span className="text-base sm:text-lg font-bold whitespace-nowrap">
            {isLoadingRestaurant ? 'Carregando...' : (isSending ? 'Enviando...' : 'Enviar Pedido')}
          </span>
          <span className="text-xs opacity-90 truncate hidden sm:block">
            {`Cozinha • ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}
          </span>
        </div>

        {/* Loading spinner overlay */}
        {isSending && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-700/50 rounded-xl">
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </button>

      {/* Modal de Sucesso com Visual Premium */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl text-center border border-gray-100 dark:border-gray-800 animate-scale-up">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">
              Pedido Enviado!
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {tableNumber.trim().toLowerCase() === 'retirada' ? (
                <>O seu pedido foi encaminhado diretamente para a nossa cozinha para <strong className="text-blue-600 dark:text-blue-400 font-bold">retirada no local</strong>. Agora é só relaxar e aguardar!</>
              ) : (
                <>O seu pedido foi encaminhado diretamente para a nossa cozinha e a comanda foi aberta na <strong className="text-blue-600 dark:text-blue-400 font-bold">Mesa {tableNumber}</strong>. Agora é só relaxar e aguardar!</>
              )}
            </p>

            <button
              onClick={handleCloseSuccess}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Excelente!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
