"use client";

import { useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { useParams } from 'next/navigation';

export default function CartRestaurantValidator() {
  const { cartRestaurantId, clearCart, items } = useCart();
  const params = useParams();
  const currentSlug = params.slug as string;

  useEffect(() => {
    if (items.length > 0 && cartRestaurantId && cartRestaurantId !== currentSlug) {
      if (window.confirm('Você possui itens de outro restaurante na sua comanda. Deseja limpar a comanda e continuar neste restaurante?')) {
        clearCart();
      }
    }
  }, [cartRestaurantId, currentSlug, clearCart, items.length]);

  return null;
}
