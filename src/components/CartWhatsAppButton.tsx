"use client";

import React from 'react';
import { useCart } from '../hooks/useCart';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';
import { useCustomerData } from '../hooks/useCustomerData';
import { useCustomerCoordinates } from '../hooks/useCustomerCoordinates';
import { useRestaurantCoordinates } from '../hooks/useRestaurantCoordinates';
import { useRestaurantBySlug } from '../hooks/useRestaurantBySlug';
import { useRestaurantTablePayment } from '../hooks/useRestaurantTablePayment';
import { usePathname } from 'next/navigation';
import { calculateDeliveryDistance } from '../utils/distanceCalculator';
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

interface CartWhatsAppButtonProps {
  restaurantId?: string;
  className?: string;
  customMessage?: string;
  onSent?: () => void; // Callback quando mensagem for enviada
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
}

export default function CartWhatsAppButton({
  restaurantId = "default",
  className = "",
  customMessage,
  onSent,
  deliveryMode
}: CartWhatsAppButtonProps) {
  const { items, totalItems, totalPrice, formattedTotalPrice, isEmpty, clearCart } = useCart();
  const { isCheckoutInProgress, withCheckoutLock } = useCheckoutLock();
  const { addActiveOrderId } = useActiveOrders();
  const { config, isLoading } = useWhatsAppConfig(restaurantId);
  const { customerData } = useCustomerData();
  const { customerCoordinates } = useCustomerCoordinates();
  const { coordinates: restaurantCoordinates } = useRestaurantCoordinates(restaurantId);
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  const { tablePayment: dbTablePayment } = useRestaurantTablePayment(restaurantId);
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);

  const pathname = usePathname();
  const isDeliveryRoute = pathname?.startsWith('/delivery');
  const isActuallyDelivery = isDeliveryRoute && deliveryMode === 'delivery';
  const isActuallyRetirada = isDeliveryRoute && deliveryMode === 'retirada';
  const tablePayment = isDeliveryRoute ? false : dbTablePayment;
  const customerFormMode = resolveCustomerFormMode({
    isDeliveryRoute,
    deliveryMode,
    tablePayment,
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
  const restaurantIdRef = React.useRef(restaurantId);

  // Monitorar mudanças no restaurantId e cancelar operações em andamento
  React.useEffect(() => {
    if (restaurantIdRef.current !== restaurantId) {
      if (isCreatingOrder) {
        setIsCreatingOrder(false);
      }
      restaurantIdRef.current = restaurantId;
    }
  }, [restaurantId, isCreatingOrder]);


  // Não renderizar se carrinho estiver vazio
  if (isEmpty) {
    return null;
  }

  // Se WhatsApp estiver indisponível, não exibir o componente
  if (!config.enabled) {
    return null;
  }

  const generateCartWhatsAppMessage = (order: Order) => {
    let message = `🛒 *PEDIDO COMPLETO*\n\n*ID do Pedido:* ${order.id}\n\n`;

    const deliveryDistance = isActuallyDelivery ? calculateDeliveryDistance(
      restaurantCoordinates,
      customerCoordinates.coordinates
    ) : null;

    // Dados do cliente
    const hasCustomerData = customerData.name?.trim() || customerData.address?.trim() || customerData.number?.trim() || customerData.complement?.trim() || customerData.whatsapp?.trim();
    
    if (hasCustomerData) {
      if (isActuallyRetirada) {
        message += `👤 *DADOS PARA RETIRADA:*\n`;
      } else if (tablePayment) {
        message += `👤 *DADOS PARA MESA:*\n`;
      } else {
        message += `👤 *DADOS DO CLIENTE:*\n`;
      }
      
      if (customerData.name?.trim()) {
        message += `• *Nome:* ${customerData.name}\n`;
      }
      
      if ((tablePayment || isActuallyRetirada) && customerData.whatsapp?.trim()) {
        message += `• *WhatsApp:* ${customerData.whatsapp}\n`;
      }
      
      if (isActuallyDelivery && customerData.address?.trim()) {
        message += `• *Endereço:* ${customerData.address}`;
        if (customerData.number?.trim()) {
          message += `, ${customerData.number}`;
        }
        if (customerData.complement?.trim()) {
          message += ` - ${customerData.complement}`;
        }
        message += `\n`;
      }
      
      if (isActuallyDelivery && customerData.number?.trim() && !customerData.address?.trim()) {
        message += `• *Número:* ${customerData.number}\n`;
      }
      
      // Adicionar distância de entrega se calculada (apenas para delivery)
      if (isActuallyDelivery && deliveryDistance) {
        message += `• *Distância de Entrega:* ${deliveryDistance.formattedDistance}\n`;
      }
      
      message += `\n`;
    }
    
    message += `📋 *Itens do Pedido:*\n\n`;

    // Iterar sobre cada item do carrinho
    items.forEach((item, index) => {
      const itemNumber = index + 1;
      const emoji = getItemEmoji(itemNumber);
      
      message += `${emoji} *${item.dish.name}* (${item.quantity}x)\n`;
      
      // Descrição do prato (limitada para não ficar muito longo)
      if (item.dish.description) {
        const shortDescription = item.dish.description.length > 80 
          ? item.dish.description.substring(0, 80) + '...' 
          : item.dish.description;
        message += `*Descrição:* ${shortDescription}\n`;
      }

      // Complementos selecionados
      if (item.selectedComplements.size > 0) {
        message += `*Complementos:*\n`;
        
        item.selectedComplements.forEach((selections, groupTitle) => {
          if (selections.size > 0) {
            selections.forEach(complementName => {
              const group = item.dish.complement_groups?.find(g => g.title === groupTitle);
              const complement = group?.complements.find(c => c.name === complementName);
              const price = complement?.price || '0,00';
              message += `• ${complementName} - +R$ ${price}\n`;
            });
          }
        });
      }

      // Subtotal do item
      message += `*Subtotal:* R$ ${CartUtils.formatPrice(item.totalPrice)}\n\n`;
    });

    // Resumo dos Totais
    if (isActuallyDelivery) {
      const subtotalCents = Math.round(totalPrice * 100);
      const deliveryFeeCents = order.delivery_fee || 0;
      message += `📋 *RESUMO DOS VALORES:*\n`;
      message += `• *Subtotal dos Itens:* R$ ${formattedTotalPrice}\n`;
      message += `• *Taxa de Entrega:* ${deliveryFeeCents === 0 ? 'Grátis' : 'R$ ' + (deliveryFeeCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      message += `💰 *TOTAL GERAL: R$ ${(order.total_price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
    } else {
      message += `💰 *TOTAL GERAL: R$ ${formattedTotalPrice}*\n\n`;
    }

    // Informações adicionais
    message += `📱 *Pedido via Cardápio Digital*\n`;
    message += `🕐 ${new Date(order.created_at).toLocaleString('pt-BR')}\n\n`;

    // Mensagem personalizada
    const finalMessage = customMessage || config.customMessage || 
      `Olá! Gostaria de fazer este pedido completo. Por favor, confirme a disponibilidade dos itens e me informe sobre o tempo de preparo e entrega.`;
    
    message += finalMessage;

    return encodeURIComponent(message);
  };

  const handleCreateOrderAndSendWhatsApp = async () => {
    if (isLoading || isCreatingOrder || isEmpty || isCheckoutInProgress) {
      return;
    }

    await withCheckoutLock(async () => {
    // Verificação 2: Aguardar carregamento do restaurante se ainda não carregou
    if (isLoadingRestaurant) {
      alert("Por favor, aguarde. Carregando informações do restaurante...");
      return;
    }

    // Verificação 3: Validar que o restaurante foi carregado corretamente
    if (!restaurant) {

      // Rastrear erro no PostHog
      Analytics.trackError(new Error('Restaurant not found'), {
        component: 'CartWhatsAppButton',
        action: 'validation_failed',
        validationStep: 'restaurant_not_found',
        restaurantId,
        isLoadingRestaurant,
        itemCount: items.length,
        totalPrice
      });
      
      alert("Erro: Não foi possível carregar as informações do restaurante. Por favor, recarregue a página e tente novamente.");
      return;
    }

    // Verificação 4: Validar que temos o ID do restaurante
    if (!restaurant.id) {
      console.error("[CartWhatsAppButton] Restaurante carregado mas sem ID:", restaurant);
      
      // Rastrear erro no PostHog
      Analytics.trackError(new Error('Restaurant loaded without ID'), {
        component: 'CartWhatsAppButton',
        action: 'validation_failed',
        validationStep: 'restaurant_without_id',
        restaurantId,
        restaurantSlug: restaurant.slug,
        itemCount: items.length,
        totalPrice
      });
      
      alert("Erro: Dados do restaurante estão incompletos. Por favor, recarregue a página e tente novamente.");
      return;
    }

    if (!config.enabled) {

      
      // Rastrear erro no PostHog
      Analytics.trackError(new Error('WhatsApp not enabled'), {
        component: 'CartWhatsAppButton',
        action: 'validation_failed',
        validationStep: 'whatsapp_not_enabled',
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        itemCount: items.length,
        totalPrice
      });
      
      alert("WhatsApp não está disponível para este restaurante. Entre em contato diretamente.");
      return;
    }

    if (!config.phoneNumber || config.phoneNumber.trim() === '') {

      
      // Rastrear erro no PostHog
      Analytics.trackError(new Error('WhatsApp phone number not configured'), {
        component: 'CartWhatsAppButton',
        action: 'validation_failed',
        validationStep: 'phone_number_missing',
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        configEnabled: config.enabled,
        itemCount: items.length,
        totalPrice
      });
      
      alert("Número de WhatsApp não configurado para este restaurante. Entre em contato diretamente.");
      return;
    }

    const formError = getCustomerFormValidationError(customerFormMode, customerData, {
      hasCoordinates: !!customerCoordinates?.coordinates,
    });
    if (formError) {
      alert(formError.message);
      return;
    }

    // 🔑 CORREÇÃO CRÍTICA: Abrir janela em branco SINCRONAMENTE antes de qualquer await.
    const whatsappWindow = window.open('', '_blank');

    const paymentCtx = paymentContextFromCart({
      restaurant,
      items,
      subtotalValue: totalPrice,
      totalValue: totalPriceWithShipping,
      paymentMethod: 'whatsapp',
      deliveryMode,
      isDeliveryRoute,
      deliveryFeeCents: isActuallyDelivery && deliveryCovered ? deliveryCalc.fee : 0,
      deliveryCovered,
      deliveryReason: deliveryCalc.reason,
      tableId: typeof window !== 'undefined' ? localStorage.getItem('table_id') : null,
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
        table_name: isActuallyRetirada ? 'Retirada' : (tablePayment ? customerData.address : undefined),
        customer_info: {
          name: customerData.name,
          phone: customerData.whatsapp,
          delivery_type: isActuallyDelivery ? 'delivery' : (isActuallyRetirada ? 'takeout' : 'dine_in'),
          address: isActuallyDelivery ? customerData.address || null : null,
        },
        total_price: Math.round((totalPrice + (isActuallyDelivery && deliveryCovered ? deliveryFee : 0)) * 100),
        status: 'pending_payment',
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
          complement: customerData.complement
        } : null,
      };

      const itemsToCreate: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[] = items.map(item =>
        CartUtils.mapItemToOrderPayload(item)
      );

      const tableId = typeof window !== 'undefined' ? localStorage.getItem('table_id') : null;
      const { order: newOrder, reusedExisting } = await createOrderWithIdempotency(
        orderToCreate,
        itemsToCreate,
        {
          restaurantId: restaurant.id,
          items,
          customerPhone: customerData.whatsapp,
          tableId: isActuallyRetirada ? 'retirada' : (tablePayment ? customerData.address : tableId),
          orderType: orderToCreate.order_type,
          deliveryCoordsLat: orderToCreate.delivery_coords_lat,
          deliveryCoordsLng: orderToCreate.delivery_coords_lng,
        },
      );

      addActiveOrderId(newOrder.id, newOrder.customer_access_token, restaurant.id);

      Analytics.trackPaymentOrderCreated({ ...paymentCtx, orderId: newOrder.id, reusedExisting });

      const message = generateCartWhatsAppMessage(newOrder);
      const whatsappUrl = `https://wa.me/${config.phoneNumber}?text=${message}`;

      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.href = whatsappUrl;

        Analytics.trackCartWhatsAppOpenedSuccessfully(restaurant.id, restaurant.slug || '', items.length, totalPriceWithShipping);
        Analytics.trackPaymentCompleted({
          ...paymentCtx,
          orderId: newOrder.id,
          popupBlocked: false,
          whatsappChannel: 'popup',
        });
        Analytics.trackSurveyOpportunity('post_checkout', restaurant.id, restaurant.slug || '');
      } else {
        Analytics.trackCartWhatsAppPopupBlocked(restaurant.id, restaurant.slug || '', items.length, totalPriceWithShipping);
        Analytics.trackPaymentRedirectStarted({
          ...paymentCtx,
          orderId: newOrder.id,
          popupBlocked: true,
          whatsappChannel: 'same_tab_fallback',
        });
        window.location.href = whatsappUrl;
      }

      if (onSent) {
        onSent();
      }

      clearCart();
    } catch (error) {
      console.error("[CartWhatsAppButton] Falha ao criar o pedido:", error);

      // Fechar a janela em branco se a criação do pedido falhou
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close();
      }
      
      // Rastrear erro no PostHog
      Analytics.trackError(error as Error, {
        component: 'CartWhatsAppButton',
        action: 'create_order_and_send_whatsapp',
        restaurantId: restaurant?.id || 'unknown',
        restaurantSlug: restaurant?.slug || 'unknown',
        itemCount: items.length,
        totalPrice,
        hasRestaurant: !!restaurant,
        hasRestaurantId: !!restaurant?.id,
        configEnabled: config.enabled,
        hasPhoneNumber: !!config.phoneNumber,
        errorType: (error as Error).name,
        errorMessage: (error as Error).message,
        timestamp: new Date().toISOString()
      });
      
      alert("Houve um erro ao criar o seu pedido. Por favor, tente novamente.");
    } finally {
      setIsCreatingOrder(false);
    }
    }, 'whatsapp');
  };

  const getItemEmoji = (index: number): string => {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return emojis[index - 1] || `${index}️⃣`;
  };

  return (
    <button
      onClick={handleCreateOrderAndSendWhatsApp}
      disabled={isLoading || isCreatingOrder || isEmpty || isLoadingRestaurant || !restaurant || isMinOrderNotMet || isDeliveryOutsideCoverage || (isActuallyDelivery && !deliveryCovered) || isCheckoutInProgress || !isCustomerDataValid}
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
      aria-label={`Enviar pedido com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'} pelo WhatsApp`}
    >
      <span className={checkoutActionContentClass}>
        <svg
          className={checkoutActionIconClass}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
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
                    : 'Pedir pelo WhatsApp'}
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

      {/* Efeito de brilho */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-300 -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%]" />
    </button>
  );
}

/**
 * Versão compacta do botão para uso em outras partes da interface
 */
export function CartWhatsAppButtonCompact({
  restaurantId = "default",
  className = "",
  showItemCount = true 
}: {
  restaurantId?: string;
  className?: string;
  showItemCount?: boolean;
}) {
  const { totalItems, formattedTotalPrice, isEmpty } = useCart();
  const { config, isLoading } = useWhatsAppConfig(restaurantId);

  if (isEmpty) {
    return null;
  }

  // Se WhatsApp estiver indisponível, não exibir o componente compact
  if (!config.enabled) {
    return null;
  }

  return (
    <CartWhatsAppButton 
      restaurantId={restaurantId}
      className={`
        !py-3 !px-4 text-base
        ${className}
      `}
    />
  );
}

/**
 * Hook para gerar mensagem do carrinho (útil para outros componentes)
 */
export function useCartWhatsAppMessage(restaurantId: string = "default") {
  const { items, formattedTotalPrice } = useCart();
  const { config } = useWhatsAppConfig(restaurantId);
  const { customerData } = useCustomerData();
  const { customerCoordinates } = useCustomerCoordinates();
  const { coordinates: restaurantCoordinates } = useRestaurantCoordinates(restaurantId);

  const generateMessage = React.useCallback(() => {
    if (items.length === 0) return '';

    let message = `🛒 *PEDIDO COMPLETO*\n\n`;
    
    // Calcular distância de entrega se coordenadas estiverem disponíveis
    const deliveryDistance = calculateDeliveryDistance(
      restaurantCoordinates,
      customerCoordinates.coordinates
    );
    
    // Dados do cliente (com safe check)
    const hasCustomerData = customerData.name?.trim() || customerData.address?.trim() || customerData.number?.trim() || customerData.complement?.trim();
    
    if (hasCustomerData) {
      message += `👤 *DADOS DO CLIENTE:*\n`;
      if (customerData.name?.trim()) {
        message += `• *Nome:* ${customerData.name}\n`;
      }
      if (customerData.address?.trim()) {
        message += `• *Endereço:* ${customerData.address}`;
        if (customerData.number?.trim()) {
          message += `, ${customerData.number}`;
        }
        if (customerData.complement?.trim()) {
          message += ` - ${customerData.complement}`;
        }
        message += `\n`;
      }
      if (customerData.number?.trim() && !customerData.address?.trim()) {
        message += `• *Número:* ${customerData.number}\n`;
      }
      
      // Adicionar distância de entrega se calculada
      if (deliveryDistance) {
        message += `• *Distância de Entrega:* ${deliveryDistance.formattedDistance}\n`;
      }
      
      message += `\n`;
    }
    
    message += `📋 *Itens do Pedido:*\n\n`;

    items.forEach((item, index) => {
      const emoji = index < 9 ? `${index + 1}️⃣` : `${index + 1}.`;
      message += `${emoji} *${item.dish.name}* (${item.quantity}x)\n`;
      
      if (item.selectedComplements.size > 0) {
        message += `*Complementos:*\n`;
        item.selectedComplements.forEach((selections) => {
          selections.forEach(complement => {
            message += `• ${complement}\n`;
          });
        });
      }
      
      message += `*Subtotal:* R$ ${CartUtils.formatPrice(item.totalPrice)}\n\n`;
    });

    message += `💰 *TOTAL: R$ ${formattedTotalPrice}*\n\n`;
    message += `📱 *Pedido via Cardápio Digital*\n`;
    message += `🕐 ${new Date().toLocaleString('pt-BR')}\n\n`;
    message += config.customMessage || 'Olá! Gostaria de fazer este pedido completo.';

    return message;
  }, [items, formattedTotalPrice, config.customMessage, customerData, customerCoordinates.coordinates, restaurantCoordinates]);

  return { generateMessage };
}
