"use client";

import React from 'react';
import { useCart } from '../hooks/useCart';
import { useCustomerData } from '../hooks/useCustomerData';
import { useCustomerCoordinates } from '../hooks/useCustomerCoordinates';
import { useRestaurantBySlug } from '../hooks/useRestaurantBySlug';
import { usePathname } from 'next/navigation';
import { calculateDeliveryFeeAndCoverage } from '../utils/deliveryCalculator';
import { buildFullDeliveryAddress } from '../utils/deliveryAddress';
import { assertDeliveryReadyForCheckout } from '../utils/deliveryCheckoutGuard';
import {
  getCustomerFormValidationError,
  isCustomerFormComplete,
  resolveCustomerFormMode,
} from '../utils/customerFormValidation';
import { CartUtils } from '../types/cart';
import { createOrderWithIdempotency } from '../utils/checkoutIdempotency';
import { useCheckoutLock } from '../context/CheckoutContext';
import { Order, OrderItem } from '../types/order';
import Analytics from '../lib/analytics';
import { useActiveOrders } from '../hooks/useActiveOrders';
import { paymentContextFromCart } from '../lib/paymentAnalytics';
import {
  checkoutActionButtonMinHeightClass,
  checkoutActionButtonPaddingClass,
  checkoutActionContentClass,
  checkoutActionIconClass,
  checkoutActionLabelClass,
  checkoutActionLabelWrapMobileClass,
  checkoutActionSubtitleClass,
  checkoutActionTextColumnClass,
} from './cart/checkoutButtonLayout';

interface CashPaymentButtonProps {
  restaurantId?: string;
  className?: string;
  onSent?: () => void;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
}

export default function CashPaymentButton({
  restaurantId = 'default',
  className = '',
  onSent,
  deliveryMode,
}: CashPaymentButtonProps) {
  const { items, totalItems, totalPrice, formattedTotalPrice, isEmpty, clearCart } = useCart();
  const { isCheckoutInProgress, withCheckoutLock } = useCheckoutLock();
  const { addActiveOrderId } = useActiveOrders();
  const { customerData } = useCustomerData();
  const { customerCoordinates } = useCustomerCoordinates();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  const [showTrocoModal, setShowTrocoModal] = React.useState(false);
  const [needsChange, setNeedsChange] = React.useState<boolean | null>(null);
  const [changeForValue, setChangeForValue] = React.useState('');
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const pathname = usePathname();
  const isDeliveryRoute = pathname?.startsWith('/delivery');
  const isActuallyDelivery = isDeliveryRoute && deliveryMode === 'delivery';
  const isActuallyRetirada = isDeliveryRoute && deliveryMode === 'retirada';

  const customerFormMode = resolveCustomerFormMode({
    isDeliveryRoute,
    deliveryMode,
    tablePayment: false,
  });
  const isCustomerDataValid = isCustomerFormComplete(customerFormMode, customerData, {
    hasCoordinates: !!customerCoordinates?.coordinates,
  });

  const minOrderValue = restaurant?.min_order_value || 0;
  const isMinOrderNotMet = isActuallyDelivery && totalPrice < minOrderValue && restaurant?.open !== false;

  const deliveryCalc = React.useMemo(() => {
    if (!isActuallyDelivery || !restaurant) return { covered: true, fee: 0, reason: undefined };
    return calculateDeliveryFeeAndCoverage(restaurant, customerCoordinates?.coordinates || null);
  }, [isActuallyDelivery, restaurant, customerCoordinates?.coordinates]);

  const deliveryFee = deliveryCalc.fee / 100;
  const deliveryCovered = deliveryCalc.covered;
  const totalPriceWithShipping = totalPrice + (isActuallyDelivery && deliveryCovered ? deliveryFee : 0);
  const isDeliveryOutsideCoverage = isActuallyDelivery && !deliveryCovered && deliveryCalc.reason !== 'missing_coordinates';

  if (isEmpty) {
    return null;
  }

  const buttonLabel = isActuallyRetirada ? 'Dinheiro na retirada' : 'Dinheiro na entrega';

  const openTrocoModal = () => {
    if (isCreatingOrder || isEmpty || isCheckoutInProgress || isLoadingRestaurant || !restaurant) {
      return;
    }
    const formError = getCustomerFormValidationError(customerFormMode, customerData, {
      hasCoordinates: !!customerCoordinates?.coordinates,
    });
    if (formError) {
      alert(formError.message);
      return;
    }
    setNeedsChange(null);
    setChangeForValue('');
    setShowTrocoModal(true);
  };

  const parseChangeForCents = (): number | null => {
    const normalized = changeForValue.replace(/\s/g, '').replace(',', '.');
    const value = parseFloat(normalized);
    if (Number.isNaN(value) || value <= 0) return null;
    return Math.round(value * 100);
  };

  const confirmAndCreateOrder = async () => {
    if (needsChange === null) {
      alert('Informe se você precisa de troco.');
      return;
    }

    let receivedCashCents: number | null = null;
    if (needsChange) {
      receivedCashCents = parseChangeForCents();
      if (receivedCashCents === null) {
        alert('Informe um valor válido para o troco.');
        return;
      }
      const totalCents = Math.round(totalPriceWithShipping * 100);
      if (receivedCashCents < totalCents) {
        alert(`O valor para troco deve ser maior ou igual ao total do pedido (R$ ${totalPriceWithShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`);
        return;
      }
    }

    await withCheckoutLock(async () => {
      if (!restaurant?.id) {
        alert('Erro: Não foi possível carregar as informações do restaurante. Recarregue a página e tente novamente.');
        return;
      }

      const paymentCtx = paymentContextFromCart({
        restaurant,
        items,
        subtotalValue: totalPrice,
        totalValue: totalPriceWithShipping,
        paymentMethod: 'cash_on_delivery',
        deliveryMode,
        isDeliveryRoute,
        deliveryFeeCents: isActuallyDelivery && deliveryCovered ? deliveryCalc.fee : 0,
        deliveryCovered,
        deliveryReason: deliveryCalc.reason,
        tableId: null,
        customerData,
      });

      Analytics.trackPaymentMethodClicked(paymentCtx);
      setIsCreatingOrder(true);

      try {
        assertDeliveryReadyForCheckout({
          isDelivery: isActuallyDelivery,
          coordinates: customerCoordinates?.coordinates,
          deliveryCalc,
        });

        const orderToCreate: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
          restaurant_id: restaurant.id,
          table_name: isActuallyRetirada ? 'Retirada' : undefined,
          customer_info: {
            name: customerData.name,
            phone: customerData.whatsapp,
            delivery_type: isActuallyDelivery ? 'delivery' : (isActuallyRetirada ? 'takeout' : 'dine_in'),
            address: isActuallyDelivery ? customerData.address || null : null,
            payment_method: 'cash',
            ...(receivedCashCents !== null ? { received_cash: receivedCashCents } : {}),
          },
          total_price: Math.round((totalPrice + (isActuallyDelivery && deliveryCovered ? deliveryFee : 0)) * 100),
          status: 'new',
          order_type: isActuallyDelivery ? 'delivery' : (isActuallyRetirada ? 'pickup' : 'dine_in'),
          delivery_fee: isActuallyDelivery && deliveryCovered ? deliveryCalc.fee : 0,
          delivery_distance: isActuallyDelivery && deliveryCovered ? deliveryCalc.distanceKm : null,
          delivery_address: isActuallyDelivery
            ? buildFullDeliveryAddress(customerData.address, customerData.number, customerData.complement)
            : null,
          delivery_coords_lat: isActuallyDelivery && customerCoordinates.coordinates ? customerCoordinates.coordinates.latitude : null,
          delivery_coords_lng: isActuallyDelivery && customerCoordinates.coordinates ? customerCoordinates.coordinates.longitude : null,
          delivery_address_details: isActuallyDelivery ? {
            street: customerData.address,
            number: customerData.number,
            complement: customerData.complement,
          } : null,
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
            tableId: isActuallyRetirada ? 'retirada' : null,
            orderType: orderToCreate.order_type,
            deliveryCoordsLat: orderToCreate.delivery_coords_lat,
            deliveryCoordsLng: orderToCreate.delivery_coords_lng,
          },
        );

        addActiveOrderId(newOrder.id, newOrder.customer_access_token, restaurant.id);

        Analytics.trackPaymentOrderCreated({ ...paymentCtx, orderId: newOrder.id, reusedExisting });
        Analytics.trackPaymentCompleted({ ...paymentCtx, orderId: newOrder.id });

        setShowTrocoModal(false);
        setShowSuccessModal(true);
      } catch (error) {
        console.error('[CashPaymentButton] Falha ao criar o pedido:', error);
        Analytics.trackError(error as Error, {
          component: 'CashPaymentButton',
          action: 'create_cash_order',
          restaurantId: restaurant?.id || 'unknown',
          restaurantSlug: restaurant?.slug || 'unknown',
          itemCount: items.length,
          totalPrice,
        });
        alert('Houve um erro ao criar o seu pedido. Por favor, tente novamente.');
      } finally {
        setIsCreatingOrder(false);
      }
    }, 'cash_on_delivery');
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    clearCart();
    if (onSent) {
      onSent();
    }
  };

  const isDisabled =
    isCreatingOrder ||
    isEmpty ||
    isLoadingRestaurant ||
    !restaurant ||
    isMinOrderNotMet ||
    isDeliveryOutsideCoverage ||
    (isActuallyDelivery && !deliveryCovered) ||
    isCheckoutInProgress ||
    !isCustomerDataValid;

  return (
    <>
      <button
        onClick={openTrocoModal}
        disabled={isDisabled}
        className={`
          relative w-full min-w-0 flex items-center justify-center
          ${checkoutActionButtonMinHeightClass}
          ${checkoutActionButtonPaddingClass}
          bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
          text-white font-semibold
          rounded-xl shadow-lg hover:shadow-xl
          transition-all duration-200
          transform hover:scale-[1.02] active:scale-[0.98]
          focus:outline-none focus:ring-4 focus:ring-green-300
          disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50
          ${className}
        `}
        aria-label={`${buttonLabel} — pedido com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}
      >
        <span className={checkoutActionContentClass}>
          <svg
            className={checkoutActionIconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>

          <span className={checkoutActionTextColumnClass}>
            <span className={`${checkoutActionLabelClass} ${checkoutActionLabelWrapMobileClass}`}>
              {isLoadingRestaurant
                ? 'Carregando...'
                : isCreatingOrder
                  ? 'Criando...'
                  : isDeliveryOutsideCoverage
                    ? 'Sem Cobertura'
                    : (isActuallyDelivery && deliveryCalc.reason === 'waiting_location')
                      ? 'Informe o Endereço'
                      : buttonLabel}
            </span>
            <span className={checkoutActionSubtitleClass}>
              {isDeliveryOutsideCoverage
                ? 'Endereço fora da área de entrega'
                : (isActuallyDelivery && deliveryCalc.reason === 'waiting_location')
                  ? 'Preencha os dados acima'
                  : `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} • R$ ${isActuallyDelivery && deliveryCovered ? totalPriceWithShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : formattedTotalPrice}`}
            </span>
          </span>
        </span>

        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-300 -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%]" />
      </button>

      {/* Modal: precisa de troco? */}
      {showTrocoModal && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
          <div
            className="bg-black bg-opacity-60 absolute inset-0 backdrop-blur-sm"
            onClick={() => !isCreatingOrder && setShowTrocoModal(false)}
          />
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>

            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-1 text-center">
              Precisa de troco?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 text-center">
              Total do pedido:{' '}
              <strong className="text-green-600 dark:text-green-400">
                R$ {totalPriceWithShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </p>

            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setNeedsChange(true)}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${
                  needsChange === true
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Sim, preciso
              </button>
              <button
                type="button"
                onClick={() => {
                  setNeedsChange(false);
                  setChangeForValue('');
                }}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${
                  needsChange === false
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Não preciso
              </button>
            </div>

            {needsChange === true && (
              <div className="mb-4">
                <label htmlFor="cash_change_for" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Troco para quanto? (R$)
                </label>
                <input
                  id="cash_change_for"
                  type="text"
                  inputMode="decimal"
                  value={changeForValue}
                  onChange={e => setChangeForValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="Ex: 50,00"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowTrocoModal(false)}
                disabled={isCreatingOrder}
                className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmAndCreateOrder}
                disabled={isCreatingOrder || needsChange === null}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingOrder ? 'Enviando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sucesso */}
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
              O seu pedido foi enviado para o restaurante com pagamento em{' '}
              <strong className="text-green-600 dark:text-green-400 font-bold">
                {isActuallyRetirada ? 'dinheiro na retirada' : 'dinheiro na entrega'}
              </strong>
              . Agora é só aguardar!
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
