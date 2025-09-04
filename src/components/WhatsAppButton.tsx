"use client";

import React from "react";
import { Dish, MenuItem } from "./data";
import { useWhatsAppConfig } from "../hooks/useWhatsAppConfig";

interface WhatsAppButtonProps {
  dish: Dish | MenuItem;
  selectedComplements: Map<string, Set<string>>;
  restaurantId?: string;
  className?: string;
}

export default function WhatsAppButton({ dish, selectedComplements, restaurantId = "default", className = "" }: WhatsAppButtonProps) {
  const { config, isLoading } = useWhatsAppConfig(restaurantId);
  
  // Se a funcionalidade não estiver habilitada, não renderizar o botão
  if (!config.enabled) {
    return null;
  }
  
  const generateWhatsAppMessage = () => {
    let message = `🍽️ *${dish.name}*\n\n`;
    
    // Descrição do prato
    if (dish.description) {
      message += `*Descrição:* ${dish.description}\n`;
    }
    
    // Ingredientes
    if (dish.ingredients) {
      message += `*Ingredientes:* ${dish.ingredients}\n`;
    }
    
    // Porção
    if (dish.portion) {
      message += `*Porção:* ${dish.portion}\n`;
    }
    
    // Preço base
    message += `*Preço:* R$ ${dish.price}\n\n`;
    
    // Complementos selecionados
    let hasComplements = false;
    let totalPrice = parseFloat(dish.price.replace(',', '.'));
    
    if (selectedComplements.size > 0) {
      message += `*Complementos Selecionados:*\n`;
      
      selectedComplements.forEach((selections, groupTitle) => {
        if (selections.size > 0) {
          hasComplements = true;
          message += `\n*${groupTitle}:*\n`;
          
          selections.forEach(complementName => {
            const group = dish.complement_groups?.find(g => g.title === groupTitle);
            const complement = group?.complements.find(c => c.name === complementName);
            
            if (complement) {
              // Só exibir o preço se for maior que 0
              const priceText = complement.price !== '0,00' ? ` - +R$ ${complement.price}` : '';
              message += `• ${complementName}${priceText}\n`;
              totalPrice += parseFloat(complement.price.replace(',', '.'));
            }
          });
        }
      });
      
      if (hasComplements) {
        message += `\n*Total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n\n`;
      }
    }
    
    // Alérgenos (importante para pedidos)
    if (dish.allergens && dish.allergens !== 'Nenhum') {
      message += `⚠️ *Alérgenos:* ${dish.allergens}\n\n`;
    }
    
    // Mensagem final
    message += `📱 *Pedido via Cardápio Digital*\n`;
    message += `🕐 ${new Date().toLocaleString('pt-BR')}\n\n`;
    message += config.customMessage || `Olá! Gostaria de fazer este pedido.`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${config.phoneNumber}?text=${message}`;
    
    // Abrir WhatsApp em nova aba
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl ${className}`}
      aria-label="Pedir pelo WhatsApp"
    >
      <svg 
        className="w-5 h-5" 
        fill="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
      </svg>
      Pedir pelo WhatsApp
    </button>
  );
}
