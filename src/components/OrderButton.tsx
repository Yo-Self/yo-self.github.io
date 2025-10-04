"use client";

import React, { useState } from "react";
import { Dish, MenuItem } from "./data";
import { useWhatsAppConfig } from "../hooks/useWhatsAppConfig";
import { createOrder } from '../services/orderService';
import { Order, OrderItem } from '../types/order';

interface OrderButtonProps {
  dish: Dish | MenuItem;
  selectedComplements: Map<string, Set<string>>;
  restaurantId?: string;
  className?: string;
  customerName: string;
  customerPhone: string;
  tableName: string;
}

export default function OrderButton({
  dish,
  selectedComplements,
  restaurantId = "default",
  className = "",
  customerName,
  customerPhone,
  tableName,
}: OrderButtonProps) {
  const { config, isLoading } = useWhatsAppConfig(restaurantId);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

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

  const generateWhatsAppMessage = (order: Order) => {
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

*ID do Pedido:* ${order.id}
*Restaurante:* ${config.restaurantName}
*Mesa:* ${tableName}

*Cliente:*
*Nome:* ${customerName}
*Telefone:* ${customerPhone}

*Itens do Pedido:*
- *Prato:* ${dish.name}
  - *ID do Prato:* ${dish.id}
  - *Quantidade:* 1
  - *Preço Unitário:* R$ ${dish.price}
  - *Complementos:*
${complementsText.join('\n')}

*Total do Pedido:* R$ ${calculateTotalPrice().toFixed(2).replace('.', ',')}

*Observações:*
[Observações]

*Data do Pedido:* ${new Date(order.created_at).toLocaleString('pt-BR')}
    `;

    return encodeURIComponent(messageBody.trim());
  };

  const handleCreateOrder = async () => {
    console.log("handleCreateOrder called");
    if (!customerName || !customerPhone || !tableName) {
      alert("Por favor, preencha seu nome, telefone e mesa.");
      return;
    }

    setIsCreatingOrder(true);

    try {
      const totalPrice = calculateTotalPrice();
      const orderToCreate: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        restaurant_id: restaurantId,
        table_name: tableName,
        customer_info: {
          name: customerName,
          phone: customerPhone,
        },
        total_price: Math.round(totalPrice * 100), // Convert to cents
        status: 'pending_payment',
      };

      const itemsToCreate: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[] = [
        {
          dish_id: dish.id,
          quantity: 1,
          price_at_time_of_order: Math.round(parseFloat(dish.price.replace(',', '.')) * 100),
          selected_complements: Array.from(selectedComplements.entries()).flatMap(([groupTitle, selections]) =>
            Array.from(selections).map(complementName => {
              const group = dish.complement_groups?.find(g => g.title === groupTitle);
              const complement = group?.complements.find(c => c.name === complementName);
              return {
                complement_id: complement?.id || 'unknown',
                name: complementName,
                price: Math.round(parseFloat(complement?.price.replace(',', '.') || '0') * 100),
              };
            })
          ),
        },
      ];

      console.log("Creating order with data:", { orderToCreate, itemsToCreate });
      const newOrder = await createOrder(orderToCreate, itemsToCreate);

      const message = generateWhatsAppMessage(newOrder);
      const whatsappUrl = `https://wa.me/${config.phoneNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Houve um erro ao criar o seu pedido. Por favor, tente novamente.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <button
      onClick={handleCreateOrder}
      disabled={isCreatingOrder || isLoading}
      className={`flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl ${className}`}
      aria-label="Fazer Pedido"
    >
      {isCreatingOrder ? "Criando Pedido..." : "Fazer Pedido"}
    </button>
  );
}