"use client";

import React from "react";
import { Dish, MenuItem } from "./data";
import { useWhatsAppConfig } from "../hooks/useWhatsAppConfig";
import { useParams } from 'next/navigation';

interface OrderButtonProps {
  dish: Dish | MenuItem;
  selectedComplements: Map<string, Set<string>>;
  className?: string;
}

export default function OrderButton({
  dish,
  selectedComplements,
  className = "",
}: OrderButtonProps) {
  const params = useParams();
  const restaurantId = params.slug as string;
  const { config, isLoading } = useWhatsAppConfig(restaurantId);

  if (!config.enabled) {
    return null;
  }

  const calculateTotalPrice = () => {
    let total = parseFloat(dish.price.replace(',', '.'));
    if (selectedComplements.size > 0) {
      selectedComplements.forEach((selections, groupTitle) => {
        if (selections.size > 0) {
          selections.forEach(complementName => {
            const group = dish.complement_groups?.find(g => g.title === groupTitle);
            const complement = group?.complements.find(c => c.name === complementName);
            if (complement) {
              const price = parseFloat(complement.price.replace(',', '.'));
              total += price;
            }
          });
        }
      });
    }
    return total;
  };

  const generateWhatsAppMessage = () => {
    const complementsText: string[] = [];
    if (selectedComplements.size > 0) {
      selectedComplements.forEach((selections, groupTitle) => {
        if (selections.size > 0) {
          selections.forEach(complementName => {
            const group = dish.complement_groups?.find(g => g.title === groupTitle);
            const complement = group?.complements.find(c => c.name === complementName);
            if (complement) {
              complementsText.push(`  - ${complementName}: R$ ${complement.price}`);
            }
          });
        }
      });
    }

    const messageBody = `
*Novo Pedido*

*Restaurante:* ${config.restaurantName}

*Itens do Pedido:*
- *Prato:* ${dish.name}
  - *ID do Prato:* ${dish.id}
  - *Quantidade:* 1
  - *Preço Unitário:* R$ ${dish.price}
  - *Complementos:*
${complementsText.join('\n')}}

*Total do Pedido:* R$ ${calculateTotalPrice().toFixed(2).replace('.', ',')}

*Observações:*
[Observações]

*Data do Pedido:* ${new Date().toLocaleString('pt-BR')}
    `;

    return encodeURIComponent(messageBody.trim());
  };

  const handleOrderViaWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${config.phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleOrderViaWhatsApp}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl ${className}`}
      aria-label="Fazer Pedido via WhatsApp"
    >
      {isLoading ? "Carregando..." : "Fazer Pedido via WhatsApp"}
    </button>
  );
}