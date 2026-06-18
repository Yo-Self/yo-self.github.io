"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useModalScroll } from '../hooks/useModalScroll';
import { useRestaurant } from '../context/RestaurantContext';
import { useCurrentRestaurant } from '../hooks/useCurrentRestaurant';
import { CartItem, CartUtils } from '../types/cart';
import ImageWithLoading from './ImageWithLoading';
import CartWhatsAppButton from './CartWhatsAppButton';
import StripeCheckoutButton from './StripeCheckoutButton';
import StripeExpressCheckoutButton from './StripeExpressCheckoutButton';
import InfinitePayPixButton from './InfinitePayPixButton';
import SendOrderButton from './SendOrderButton';
import { getTableId } from './TableParamHandler';
import CartIcon from './CartIcon';
import CustomerDataForm from './CustomerDataForm';
import TablePaymentForm from './TablePaymentForm';
import { useRestaurantAddressActive } from '../hooks/useRestaurantAddressActive';
import { useRestaurantTablePayment } from '../hooks/useRestaurantTablePayment';
import { useRestaurantOnlinePayment } from '../hooks/useRestaurantOnlinePayment';
import { useRestaurantPixPayment } from '../hooks/useRestaurantPixPayment';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';
import { usePathname } from 'next/navigation';
import { useRestaurantBySlug } from '../hooks/useRestaurantBySlug';
import { formatOperatingHours } from '../utils/hoursFormatter';
import { useActiveOrders } from '../hooks/useActiveOrders';
import OrderStatusModal from './OrderStatusModal';
import { useCustomerCoordinates } from '../hooks/useCustomerCoordinates';
import { calculateDeliveryFeeAndCoverage } from '../utils/deliveryCalculator';
import { canRestaurantAcceptOrders } from '../utils/restaurantOrders';
import { checkoutActionButtonCellClass } from './cart/checkoutButtonLayout';
import Analytics from '../lib/analytics';
import { paymentContextFromCart } from '../lib/paymentAnalytics';

import { useGeolocationSafariIOSFinal } from '../hooks/useGeolocationSafariIOSFinal';
import { StoreIcon, DeliveryScooterIcon } from './icons/MenuIcons';

interface CartModalProps {
  restaurantId?: string;
}

export default function CartModal({ restaurantId: propRestaurantId }: CartModalProps) {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    formattedTotalPrice,
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart,
    isEmpty,
    incrementQuantity,
    decrementQuantity
  } = useCart();
  const { getCurrentPosition, permissionStatus, isLoading: isGeolocationLoading, error: geolocationError, isSupported, isBlocked, isSafariIOS, checkPermissionStatus, position } = useGeolocationSafariIOSFinal();

  // Usar o restaurantId passado como prop ou detectar automaticamente
  const detectedRestaurantId = useCurrentRestaurant();
  const { restaurantId: contextRestaurantId } = useRestaurant();
  const restaurantId = propRestaurantId || detectedRestaurantId || contextRestaurantId;
  const { addressActive: dbAddressActive } = useRestaurantAddressActive(restaurantId);
  const { tablePayment: dbTablePayment } = useRestaurantTablePayment(restaurantId);
  const { onlinePayment } = useRestaurantOnlinePayment(restaurantId);
  const { pixPaymentEnabled } = useRestaurantPixPayment(restaurantId);
  const { config: whatsAppConfig } = useWhatsAppConfig(restaurantId);
  const { restaurant } = useRestaurantBySlug(restaurantId || "");
  /** WhatsApp + PIX share one row (50/50); either alone spans full width. */
  const messengerCheckoutPairActive =
    pixPaymentEnabled && whatsAppConfig.enabled;
  const { activeOrderIds, getOrderAccessToken } = useActiveOrders(restaurant?.id);

  const pathname = usePathname();
  const isDeliveryRoute = pathname?.startsWith('/delivery');
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'retirada'>('delivery');
  const tablePayment = isDeliveryRoute ? false : dbTablePayment;
  const addressActive = isDeliveryRoute && deliveryMode === 'delivery';

  const minOrderValue = restaurant?.min_order_value || 0;
  const isAcceptingOrders = canRestaurantAcceptOrders(restaurant);
  const isMinOrderNotMet = isDeliveryRoute && deliveryMode === 'delivery' && totalPrice < minOrderValue && isAcceptingOrders;

  const { customerCoordinates } = useCustomerCoordinates();

  const deliveryCalc = React.useMemo(() => {
    if (!isDeliveryRoute || deliveryMode !== 'delivery' || !restaurant) return { covered: true, fee: 0, reason: undefined };
    return calculateDeliveryFeeAndCoverage(restaurant, customerCoordinates?.coordinates || null);
  }, [isDeliveryRoute, deliveryMode, restaurant, customerCoordinates?.coordinates]);

  const deliveryFee = deliveryCalc.fee / 100; // converter centavos para reais
  const deliveryCovered = deliveryCalc.covered;
  const isDeliveryOutsideCoverage = isDeliveryRoute && deliveryMode === 'delivery' && !deliveryCovered && deliveryCalc.reason !== 'missing_coordinates';
  const deliveryReason = deliveryCalc.reason;
  const deliveryZoneName = deliveryCalc.zoneName;

  const totalPriceWithShipping = totalPrice + (isDeliveryRoute && deliveryMode === 'delivery' && deliveryCovered ? deliveryFee : 0);



  const [isClosing, setIsClosing] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [permissionUpdate, setPermissionUpdate] = useState(0);
  const [tableNumber, setTableNumber] = useState('');
  const [walletPayVisible, setWalletPayVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [showDeliveryModeTooltip, setShowDeliveryModeTooltip] = useState(false);

  const dismissDeliveryModeTooltip = React.useCallback(() => {
    setShowDeliveryModeTooltip(false);
  }, []);

  useEffect(() => {
    if (!isCartOpen) {
      setWalletPayVisible(false);
    }
  }, [isCartOpen]);

  const paymentOptionsViewedRef = useRef(false);
  const prevWalletPayVisibleRef = useRef(false);
  const lastTrackedMethodsRef = useRef('');

  useEffect(() => {
    if (!isCartOpen || isEmpty || !isAcceptingOrders || isMinOrderNotMet || !restaurant?.id) {
      paymentOptionsViewedRef.current = false;
      prevWalletPayVisibleRef.current = false;
      lastTrackedMethodsRef.current = '';
      return;
    }

    const methods: string[] = [];
    if (isDeliveryRoute || restaurant?.table_ordering) {
      methods.push('whatsapp');
    }
    if (pixPaymentEnabled) methods.push('infinitepay_pix');
    if (onlinePayment || tablePayment) {
      methods.push('stripe_card');
      if (walletPayVisible) methods.push('stripe_express');
    }
    if (!methods.length) return;

    const methodsKey = methods.slice().sort().join(',');
    const walletJustBecameVisible = walletPayVisible && !prevWalletPayVisibleRef.current;
    prevWalletPayVisibleRef.current = walletPayVisible;

    const shouldTrack =
      !paymentOptionsViewedRef.current ||
      (walletJustBecameVisible && !lastTrackedMethodsRef.current.includes('stripe_express'));

    if (!shouldTrack || methodsKey === lastTrackedMethodsRef.current) {
      return;
    }

    paymentOptionsViewedRef.current = true;
    lastTrackedMethodsRef.current = methodsKey;

    Analytics.trackPaymentOptionsViewed({
      ...paymentContextFromCart({
        restaurant,
        items,
        subtotalValue: totalPrice,
        totalValue: totalPriceWithShipping,
        paymentMethod: 'whatsapp',
        deliveryMode: isDeliveryRoute ? deliveryMode : undefined,
        isDeliveryRoute,
        deliveryFeeCents:
          isDeliveryRoute && deliveryMode === 'delivery' && deliveryCovered
            ? deliveryCalc.fee
            : 0,
        deliveryCovered,
        deliveryReason: deliveryCalc.reason,
        tableId: tableNumber || getTableId(),
        customerData: undefined,
      }),
      availableCheckoutMethods: methods,
    });
  }, [
    isCartOpen,
    isEmpty,
    isAcceptingOrders,
    isMinOrderNotMet,
    restaurant,
    items,
    totalPrice,
    totalPriceWithShipping,
    isDeliveryRoute,
    deliveryMode,
    pixPaymentEnabled,
    onlinePayment,
    tablePayment,
    walletPayVisible,
    deliveryCalc.fee,
    deliveryCovered,
    deliveryReason,
    tableNumber,
  ]);

  useEffect(() => {
    if (isCartOpen) {
      setDeliveryMode('delivery'); // Sempre reseta para delivery ao abrir
      const tid = getTableId();
      if (tid) {
        setTableNumber(tid);
      }

      if (isDeliveryRoute) {
        setShowDeliveryModeTooltip(true);
        const timer = setTimeout(() => {
          setShowDeliveryModeTooltip(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowDeliveryModeTooltip(false);
    }
  }, [isCartOpen, isDeliveryRoute]);

  // Controlar scroll do body quando modal estiver aberto
  useModalScroll(isCartOpen);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      closeCart();
      setIsClosing(false);
    }, 300);
  }, [closeCart]);

  // Fechar modal com Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isCartOpen, handleClose]);

  // Controles de quantidade agora vêm do hook useCart

  // Confirmação para limpar carrinho
  const handleClearCart = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearCart = () => {
    clearCart();
    setShowClearConfirmation(false);
  };

  const displayedTotal = isDeliveryRoute && deliveryMode === 'delivery' && deliveryCovered
    ? totalPriceWithShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : formattedTotalPrice;

  const getDeliveryOrLocationText = () => {
    if (isDeliveryRoute) {
      if (deliveryMode === 'delivery') {
        if (deliveryReason === 'missing_coordinates' || deliveryReason === 'waiting_location') {
          return 'Selecione seu endereço no mapa';
        }
        if (!deliveryCovered) {
          return 'Entrega indisponível';
        }
        return deliveryFee === 0 
          ? 'Entrega grátis' 
          : `Taxa de entrega: R$ ${deliveryFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else {
        return 'Retirada no local';
      }
    } else {
      if (tableNumber === 'retirada') {
        return 'Retirada no local';
      }
      if (tableNumber) {
        return `Consumo na Mesa ${tableNumber}`;
      }
      return 'Consumo no local';
    }
  };

  if (!isCartOpen) return null;

  return (
    <div 
      ref={modalRef}
      className={`
        fixed inset-0 z-[999999] flex items-center justify-center p-4
        ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}
      `}
      onClick={handleClose}
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflow: 'hidden',
        touchAction: 'none'
      }}
    >
      <div 
        className={`
          bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
          max-w-2xl w-full max-h-[90vh] overflow-hidden relative z-[999999]
          ${isClosing ? 'modal-exit' : 'modal-container'}
        `} 
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 gap-4 overflow-visible">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shrink-0">
              <CartIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">
                Comanda
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'} selecionado{totalItems !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Alternador Delivery/Retirada */}
            {isDeliveryRoute && (
              <div className="relative">
                <div 
                  className="relative flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-full shadow-inner select-none shrink-0 border border-gray-200/50 dark:border-gray-800 h-[36px] w-[90px] min-[440px]:w-[220px] transition-all duration-300"
                >
                  {/* Sliding indicator */}
                  <div 
                    className="absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-cyan-500 dark:bg-cyan-600 shadow-md transition-all duration-300 ease-out"
                    style={{
                      width: 'calc(50% - 2px)',
                      transform: deliveryMode === 'delivery' ? 'translateX(100%)' : 'translateX(0%)'
                    }}
                  />
                  
                  {/* Retirada Option */}
                  <button
                    onClick={() => {
                      setDeliveryMode('retirada');
                      dismissDeliveryModeTooltip();
                    }}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 outline-none cursor-pointer h-full ${
                      deliveryMode === 'retirada' 
                        ? 'text-white font-extrabold' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <StoreIcon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    <span className="max-[440px]:hidden">Retirada</span>
                  </button>

                  {/* Delivery Option */}
                  <button
                    onClick={() => {
                      setDeliveryMode('delivery');
                      dismissDeliveryModeTooltip();
                    }}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 outline-none cursor-pointer h-full ${
                      deliveryMode === 'delivery' 
                        ? 'text-white font-extrabold' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <DeliveryScooterIcon className="w-4 h-4 shrink-0" />
                    <span className="max-[440px]:hidden">Delivery</span>
                  </button>
                </div>

                {/* Tooltip: exibido por 3s ao abrir a comanda (rota delivery) */}
                {showDeliveryModeTooltip && (
                  <div
                    role="tooltip"
                    className="absolute top-full right-0 mt-2.5 w-52 max-w-[min(13rem,calc(100vw-2rem))] bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 text-white text-[11px] min-[400px]:text-xs font-medium p-2.5 rounded-xl shadow-xl z-[999] animate-fadein pointer-events-none text-center"
                  >
                    <div
                      className="absolute -top-[7px] right-6 h-0 w-0 border-x-[7px] border-x-transparent border-b-[7px] border-b-cyan-500 dark:border-b-cyan-600"
                      aria-hidden
                    />
                    <p className="relative z-10 leading-snug">
                      Este botão alterna entre <strong className="font-bold">Delivery</strong> e <strong className="font-bold">Retirada</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0"
              aria-label="Fechar comanda"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
          {isEmpty ? (
            // Carrinho vazio
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <CartIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Sua comanda está vazia
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Adicione alguns pratos deliciosos à sua comanda para continuar
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Continuar Escolhendo
              </button>
            </div>
          ) : (
            <>
              {/* Header da Lista de Itens com Limpar Tudo */}
              <div className="px-6 pt-4 pb-2 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Itens Selecionados
                </span>
                <button
                  onClick={handleClearCart}
                  className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  aria-label="Limpar comanda"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpar Tudo
                </button>
              </div>

              {/* Lista de itens */}
              <div 
                className="flex-1 overflow-y-auto p-6 space-y-4"
                style={{
                  touchAction: 'pan-y',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {activeOrderIds.length > 0 && (
                  <div 
                    onClick={() => setSelectedOrderId(activeOrderIds[activeOrderIds.length - 1])}
                    className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-800/50 rounded-full">
                        <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-50"></div>
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-200">Acompanhar Pedido</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400">Ver status em tempo real</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}

                {items.map((item) => (
                  <CartItemComponent
                    key={item.id}
                    item={item}
                    onIncrement={() => incrementQuantity(item.id)}
                    onDecrement={() => decrementQuantity(item.id)}
                    onRemove={() => removeItem(item.id)}
                    fallbackImage={restaurant?.image}
                  />
                ))}
                          {/* Formulário: delivery, retirada (rota /delivery) ou pagamento na mesa */}
                {(isDeliveryRoute || tablePayment) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {tablePayment ? (
                      <TablePaymentForm />
                    ) : (
                      <CustomerDataForm 
                        permissionStatus={permissionStatus}
                        getCurrentPosition={getCurrentPosition}
                        isGeolocationLoading={isGeolocationLoading}
                        geolocationError={geolocationError}
                        isSupported={isSupported}
                        isBlocked={isBlocked}
                        isSafariIOS={isSafariIOS}
                        position={position}
                        addressActive={addressActive}
                        isPickup={isDeliveryRoute && deliveryMode === 'retirada'}
                      />
                    )}
                  </div>
                )}

                {/* Bloco de Finalização e Pagamento dentro do Scroll */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  
                  {/* Seletor de Mesa */}
                  {!isDeliveryRoute && (restaurant?.table_ordering || tablePayment) && (
                    <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/35 p-3 rounded-xl border border-gray-250/50 dark:border-gray-700 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-850 dark:text-gray-200">Mesa de Consumo</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Selecione o número da sua mesa</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <label htmlFor="scroll-table-select" className="text-xs font-bold text-gray-650 dark:text-gray-450 uppercase whitespace-nowrap">
                          Mesa:
                        </label>
                        <select 
                          id="scroll-table-select"
                          value={tableNumber}
                          onChange={(e) => {
                            const value = e.target.value;
                            setTableNumber(value);
                            localStorage.setItem('table_id', value);
                          }}
                          className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-0 font-bold cursor-pointer"
                        >
                          <option value="retirada">Retirada</option>
                          <option value="">--</option>
                          {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num.toString()}>{num}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Banner de Endereço sem Cobertura */}
                  {isDeliveryOutsideCoverage && (
                    <div className="w-full p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl flex flex-col gap-1.5 animate-fade-in shadow-sm">
                      <span className="text-red-650 dark:text-red-400 font-bold flex items-center gap-1.5 text-sm">
                        ⚠️ Endereço sem Cobertura
                      </span>
                      <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                        {deliveryReason === 'distance_exceeded' && `Sinto muito! Este restaurante entrega até no máximo ${restaurant?.delivery_max_distance || 10} km de distância. Seu endereço está a ${(deliveryCalc.distanceKm || 0).toFixed(1)} km.`}
                        {deliveryReason === 'exclusion_zone' && `O restaurante não realiza entregas na região selecionada (${deliveryZoneName || 'Zona de Exclusão'}).`}
                        {deliveryReason === 'delivery_disabled' && 'O restaurante não está aceitando pedidos para entrega no momento.'}
                      </p>
                    </div>
                  )}

                  {/* Alerta se restaurantId estiver inválido */}
                  {(!restaurantId || restaurantId === 'default') && (
                    <div className="w-full p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ Aguardando identificação do restaurante. Se o problema persistir, recarregue a página.
                      </p>
                    </div>
                  )}

                  {/* Banner de Pedido Mínimo Não Atingido */}
                  {isMinOrderNotMet && (
                    <div className="w-full p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col gap-1.5 animate-fade-in shadow-sm">
                      <span className="text-amber-850 dark:text-amber-300 font-bold flex items-center gap-1.5 text-sm">
                        ⚠️ Pedido Mínimo Não Atingido
                      </span>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        O valor mínimo para pedidos de delivery é de <strong className="font-mono">R$ {minOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. 
                        Falta <strong className="font-mono">R$ {(minOrderValue - totalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> para você poder finalizar o pedido.
                      </p>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  {!isAcceptingOrders ? (
                    <div className="w-full p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl text-center shadow-sm">
                      <p className="text-red-700 dark:text-red-400 font-bold mb-1 flex items-center justify-center gap-1.5">
                        {restaurant?.open === false ? 'Estabelecimento Fechado' : 'Pedidos pausados'}
                      </p>
                      <p className="text-xs text-gray-655 dark:text-gray-405 leading-relaxed mb-3">
                        {restaurant?.open === false
                          ? 'Não é possível finalizar ou enviar novos pedidos enquanto o restaurante estiver fechado.'
                          : 'Este restaurante não está aceitando novos pedidos no momento. Ative os pedidos no painel do gestor para testar o checkout.'}
                      </p>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 pt-2.5 border-t border-red-200/50 dark:border-red-900/30 text-center max-w-sm mx-auto">
                        <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">Horário de Funcionamento (Hoje):</p>
                        <p className="font-medium text-gray-600 dark:text-gray-450">
                          {(() => {
                            const formattedHours = formatOperatingHours(restaurant?.operating_hours);
                            const todayDayOfWeek = new Date().getDay();
                            return formattedHours.length === 7 ? formattedHours[todayDayOfWeek] : formattedHours[0];
                          })()}
                        </p>
                      </div>
                    </div>
                  ) : isDeliveryRoute ? (
                    !isMinOrderNotMet && (
                      <div className="grid w-full grid-cols-2 auto-rows-fr gap-2 sm:gap-3">
                        {whatsAppConfig.enabled && (
                          <div className={`${checkoutActionButtonCellClass}${messengerCheckoutPairActive ? '' : ' col-span-2'}`}>
                            <CartWhatsAppButton
                              restaurantId={restaurantId}
                              deliveryMode={deliveryMode}
                              className="w-full"
                            />
                          </div>
                        )}
                        {pixPaymentEnabled && (
                          <div className={`${checkoutActionButtonCellClass}${messengerCheckoutPairActive ? '' : ' col-span-2'}`}>
                            <InfinitePayPixButton
                              restaurantId={restaurantId}
                              deliveryMode={deliveryMode}
                              className="w-full"
                            />
                          </div>
                        )}
                        {onlinePayment && (
                          <>
                            <div className={`${checkoutActionButtonCellClass}${walletPayVisible ? '' : ' col-span-2'}`}>
                              <StripeCheckoutButton
                                restaurantId={restaurantId}
                                deliveryMode={deliveryMode}
                                className="w-full"
                              />
                            </div>
                            <div className={walletPayVisible ? checkoutActionButtonCellClass : 'hidden'}>
                              <StripeExpressCheckoutButton
                                restaurantId={restaurantId}
                                deliveryMode={deliveryMode}
                                className="w-full"
                                onWalletAvailabilityChange={setWalletPayVisible}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    // Fluxo Presencial / Na Mesa
                    (!restaurant?.table_ordering && !tablePayment) ? null : (
                      <div className="flex gap-2 sm:gap-3">
                        {(pixPaymentEnabled || onlinePayment || tablePayment) && (
                          <div className="flex-1 flex flex-col gap-2 min-w-0">
                            {pixPaymentEnabled && (
                              <div className={checkoutActionButtonCellClass}>
                                <InfinitePayPixButton
                                  restaurantId={restaurantId}
                                  className="w-full"
                                />
                              </div>
                            )}
                            {(onlinePayment || tablePayment) && (
                              <div className="flex flex-row gap-2 items-stretch w-full min-w-0">
                                <div className={walletPayVisible ? checkoutActionButtonCellClass : 'w-full min-w-0 flex'}>
                                  <StripeCheckoutButton
                                    restaurantId={restaurantId}
                                    className="w-full"
                                  />
                                </div>
                                <div className={checkoutActionButtonCellClass}>
                                  <StripeExpressCheckoutButton
                                    restaurantId={restaurantId}
                                    className="w-full"
                                    onWalletAvailabilityChange={setWalletPayVisible}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {restaurant?.table_ordering && !onlinePayment && (
                          <div className="flex-1">
                            <SendOrderButton 
                              restaurantId={restaurantId} 
                              tableNumber={tableNumber}
                              onSent={handleClose}
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Footer Compacto e Fixo */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-md">
                <div className="flex items-center justify-between gap-4">
                  {/* Lado Esquerdo: Quantidade e Localização/Entrega */}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {getDeliveryOrLocationText()}
                    </span>
                  </div>

                  {/* Lado Direito: Total do Pedido */}
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                      Total
                    </span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      R$ {displayedTotal}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

            {/* Modal de confirmação para limpar carrinho */}
      {showClearConfirmation && (
        <div className="absolute inset-0 flex items-center justify-center z-[9999999]">
          <div 
            className="bg-black bg-opacity-50 absolute inset-0"
            onClick={() => setShowClearConfirmation(false)}
          />
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm mx-4 relative z-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Limpar Comanda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja remover todos os itens da comanda? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearCart}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrderId && (
        <OrderStatusModal 
          orderId={selectedOrderId}
          accessToken={getOrderAccessToken(selectedOrderId)}
          onClose={() => setSelectedOrderId(null)} 
        />
      )}
    </div>
  );
}

// Componente para cada item do carrinho
function CartItemComponent({ 
  item, 
  onIncrement, 
  onDecrement, 
  onRemove,
  fallbackImage
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  fallbackImage?: string;
}) {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Imagem do produto */}
      <div className="flex-shrink-0">
        <ImageWithLoading
          src={item.dish.image}
          alt={item.dish.name}
          className="w-20 h-20 object-cover rounded-lg"
          fallbackSrc={fallbackImage || "/window.svg"}
        />
      </div>

      {/* Informações do produto */}
      <div className="flex-1 min-w-0 pr-2">
        {/* Título em largura total */}
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 leading-snug break-words">
          {item.dish.name}
        </h4>
        
        {/* Complementos selecionados */}
        {item.selectedComplements.size > 0 && (
          <div className="mt-2 space-y-1">
            {Array.from(item.selectedComplements.entries()).map(([groupTitle, selections]) => {
              if (selections.size === 0) return null;
              
              return (
                <div key={groupTitle} className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{groupTitle}:</span>
                  <div className="ml-2 text-gray-500 dark:text-gray-500">
                    {Array.from(selections).map((complement, index) => {
                      const group = item.dish.complement_groups?.find(g => g.title === groupTitle);
                      const complementData = group?.complements.find(c => c.name === complement);
                      const price = complementData?.price !== '0,00' ? ` (+R$ ${complementData?.price})` : '';
                      
                      return (
                        <span key={complement}>
                          {index > 0 && ', '}
                          {complement}{price}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quantidade + preço unitário e, à direita, preço total */}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            x {item.quantity}
            {item.quantity > 1 && (
              <span className="ml-2 text-gray-500">• R$ {CartUtils.formatPrice(item.unitPrice)}</span>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            R$ {CartUtils.formatPrice(item.totalPrice)}
          </div>
        </div>
        
        {/* Barra inferior: excluir esquerda, controles direita */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={onRemove}
            className="px-2 py-1 text-red-600 hover:text-red-700 transition-colors"
            aria-label="Remover item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onDecrement}
              className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
              aria-label="Diminuir quantidade"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-7 text-center font-medium text-gray-800 dark:text-gray-200">
              {item.quantity}
            </span>
            <button
              onClick={onIncrement}
              className="w-7 h-7 flex items-center justify-center bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-full transition-colors"
              aria-label="Aumentar quantidade"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Espaço reservado ao lado direito removido para não esmagar o título */}
    </div>
  );
}
