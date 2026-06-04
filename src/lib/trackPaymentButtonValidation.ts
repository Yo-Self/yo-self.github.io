import Analytics from './analytics';
import { paymentContextFromCart, type PaymentMethod } from './paymentAnalytics';
import type { CartItem } from '../types/cart';

export function trackPaymentFormValidationFailed(params: {
  restaurant: { id: string; slug?: string; min_order_value?: number };
  items: CartItem[];
  totalPrice: number;
  paymentMethod: PaymentMethod;
  validationField: string;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
  isDeliveryRoute?: boolean;
  customerData?: { name?: string; whatsapp?: string; address?: string };
}): void {
  Analytics.trackPaymentValidationFailed({
    ...paymentContextFromCart({
      restaurant: params.restaurant,
      items: params.items,
      subtotalValue: params.totalPrice,
      totalValue: params.totalPrice,
      paymentMethod: params.paymentMethod,
      deliveryMode: params.deliveryMode,
      isDeliveryRoute: params.isDeliveryRoute,
      customerData: params.customerData,
    }),
    validationField: params.validationField,
  });
}
