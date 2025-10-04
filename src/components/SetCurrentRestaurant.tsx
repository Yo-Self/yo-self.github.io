"use client";

import { useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { useParams } from 'next/navigation';

export default function SetCurrentRestaurant() {
  const { setCurrentRestaurant } = useCart();
  const params = useParams();
  const currentSlug = params.slug as string;

  useEffect(() => {
    if (currentSlug) {
      setCurrentRestaurant(currentSlug);
    }
  }, [currentSlug, setCurrentRestaurant]);

  return null;
}
