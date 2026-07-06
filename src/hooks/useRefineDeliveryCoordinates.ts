"use client";

import { useEffect, useRef } from 'react';
import { useCustomerData } from './useCustomerData';
import { useCustomerCoordinates } from './useCustomerCoordinates';
import { buildFullDeliveryAddress, geocodeDeliveryAddress } from '../utils/deliveryAddress';

const DEBOUNCE_MS = 500;

/**
 * Re-geocodes delivery coordinates when the customer fills in house number or complement,
 * so route pins reflect the full address instead of only the street from autocomplete.
 */
export function useRefineDeliveryCoordinates(enabled: boolean) {
  const { customerData } = useCustomerData();
  const { customerCoordinates, updateCoordinates } = useCustomerCoordinates();
  const requestIdRef = useRef(0);
  const hasCoordinates = !!customerCoordinates.coordinates;

  useEffect(() => {
    if (!enabled || !hasCoordinates) return;

    const street = customerData.address?.trim() ?? '';
    const number = customerData.number?.trim() ?? '';
    if (!street || !number) return;

    const fullAddress = buildFullDeliveryAddress(
      customerData.address,
      customerData.number,
      customerData.complement
    );
    if (!fullAddress) return;

    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      const coords = await geocodeDeliveryAddress(fullAddress);
      if (requestId !== requestIdRef.current || !coords) return;

      updateCoordinates(coords, street);
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    enabled,
    hasCoordinates,
    customerData.address,
    customerData.number,
    customerData.complement,
    updateCoordinates,
  ]);
}
