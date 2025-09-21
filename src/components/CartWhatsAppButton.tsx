"use client";

import React from 'react';
import { useCart } from '../hooks/useCart';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';
import { useCustomerData } from '../hooks/useCustomerData';
import { useCustomerCoordinates } from '../hooks/useCustomerCoordinates';
import { useRestaurantCoordinates } from '../hooks/useRestaurantCoordinates';
import { calculateDeliveryDistance } from '../utils/distanceCalculator';
import { CartUtils } from '../types/cart';
import Analytics, { getCurrentRestaurantId } from '../lib/analytics';

interface CartWhatsAppButtonProps {
  restaurantId?: string;
  className?: string;
  customMessage?: string;
  onSent?: () => void; // Callback quando mensagem for enviada
}

export default function CartWhatsAppButton({ 
  restaurantId = "default", 
  className = "",
  customMessage,
  onSent
}: CartWhatsAppButtonProps) {
  const { items, totalItems, totalPrice, formattedTotalPrice, isEmpty } = useCart();
  const { config, isLoading } = useWhatsAppConfig(restaurantId);
  const { customerData, isCustomerDataComplete } = useCustomerData();
  const { customerCoordinates } = useCustomerCoordinates();
  const { coordinates: restaurantCoordinates } = useRestaurantCoordinates(restaurantId);

  // Não renderizar se carrinho estiver vazio
  if (isEmpty) {
    return null;
  }

  // Se WhatsApp estiver indisponível, mostrar mensagem
  if (!config.enabled) {
    return (
      <div className={`
        w-full flex items-center justify-center gap-3 
        px-6 py-4 
        bg-gray-400 
        text-white font-semibold 
        rounded-xl shadow-lg
        cursor-not-allowed
        ${className}
      `}>
        <svg 
          className="w-6 h-6 flex-shrink-0" 
          fill="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>

        <div className="flex flex-col items-start min-w-0">
          <span className="text-lg font-bold">
            WhatsApp Indisponível
          </span>
          <span className="text-sm opacity-90 truncate">
            Entre em contato diretamente com o restaurante
          </span>
        </div>
      </div>
    );
  }

  const generateCartWhatsAppMessage = () => {
    let message = `🛒 *PEDIDO COMPLETO*\n\n`;
    
    // Debug: Log das coordenadas disponíveis
    console.log('🔍 Debug - Coordenadas do restaurante:', restaurantCoordinates);
    console.log('🔍 Debug - Coordenadas do cliente:', customerCoordinates);
    
    // Calcular distância de entrega se coordenadas estiverem disponíveis
    const deliveryDistance = calculateDeliveryDistance(
      restaurantCoordinates,
      customerCoordinates.coordinates
    );
    
    console.log('🔍 Debug - Distância calculada:', deliveryDistance);
    
    // Dados do cliente
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

    // Total geral
    message += `💰 *TOTAL GERAL: R$ ${formattedTotalPrice}*\n\n`;

    // Informações adicionais
    message += `📱 *Pedido via Cardápio Digital*\n`;
    message += `🕐 ${new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}\n\n`;

    // Mensagem personalizada
    const finalMessage = customMessage || config.customMessage || 
      `Olá! Gostaria de fazer este pedido completo. Por favor, confirme a disponibilidade dos itens e me informe sobre o tempo de preparo e entrega.`;
    
    message += finalMessage;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    if (isLoading) return;
    
    const message = generateCartWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${config.phoneNumber}?text=${message}`;
    
    // Track analytics for checkout
    const currentRestaurantId = getCurrentRestaurantId();
    if (currentRestaurantId) {
      Analytics.trackCartCheckout(items, totalPrice, currentRestaurantId, 'whatsapp');
    }
    
    // Abrir WhatsApp em nova aba
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Callback opcional
    if (onSent) {
      onSent();
    }
  };

  const getItemEmoji = (index: number): string => {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return emojis[index - 1] || `${index}️⃣`;
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      disabled={isLoading || isEmpty || !isCustomerDataComplete}
      className={`
        w-full flex items-center justify-center gap-3 
        px-6 py-4 
        ${isCustomerDataComplete 
          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
          : 'bg-gradient-to-r from-gray-400 to-gray-500'
        }
        text-white font-semibold 
        rounded-xl shadow-lg hover:shadow-xl
        transition-all duration-200 
        transform hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-4 focus:ring-green-300
        disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
      aria-label={`Enviar pedido com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'} pelo WhatsApp`}
    >
      {/* Ícone do WhatsApp */}
      <svg 
        className="w-6 h-6 flex-shrink-0" 
        fill="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
      </svg>

      {/* Texto do botão */}
      <div className="flex flex-col items-start min-w-0">
        <span className="text-lg font-bold">
          {isLoading ? 'Carregando...' : 
           !isCustomerDataComplete ? 'Preencha nome e número' : 
           'Enviar Pedido'}
        </span>
        <span className="text-sm opacity-90 truncate">
          {isCustomerDataComplete 
            ? `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} • R$ ${formattedTotalPrice}`
            : 'Preencha nome e número para continuar'
          }
        </span>
      </div>

      {/* Ícone de seta */}
      <svg 
        className="w-5 h-5 flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M14 5l7 7m0 0l-7 7m7-7H3" 
        />
      </svg>

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

  // Se WhatsApp estiver indisponível, mostrar mensagem compacta
  if (!config.enabled) {
    return (
      <div className={`
        w-full flex items-center justify-center gap-2 
        px-4 py-3 
        bg-gray-400 
        text-white font-semibold 
        rounded-lg shadow-lg
        cursor-not-allowed
        ${className}
      `}>
        <svg 
          className="w-5 h-5 flex-shrink-0" 
          fill="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>

        <span className="text-sm font-medium">
          WhatsApp Indisponível
        </span>
      </div>
    );
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