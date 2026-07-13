import type { CartItem } from '../types/cart';

/** Canonical payment methods for PostHog breakdowns and funnels. */
export type PaymentMethod =
  | 'whatsapp'
  | 'infinitepay_pix'
  | 'stripe_card'
  | 'stripe_express'
  | 'send_order_direct'
  | 'cash_on_delivery';

export type PaymentProvider = 'whatsapp' | 'infinitepay' | 'stripe' | 'internal';

export type PaymentFunnelStep =
  | 'options_viewed'
  | 'method_clicked'
  | 'validation_failed'
  | 'order_created'
  | 'checkout_session_created'
  | 'redirect_started'
  | 'return_received'
  | 'verification_started'
  | 'verification_confirmed'
  | 'verification_failed'
  | 'verification_processing'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'wallet_available'
  | 'wallet_unavailable'
  | 'success_modal_closed'
  | 'track_order_clicked'
  | 'contact_restaurant_clicked';

export interface PaymentAnalyticsBase {
  restaurantId: string;
  restaurantSlug?: string;
  items?: CartItem[];
  subtotalValue?: number;
  totalValue: number;
  totalValueCents?: number;
  deliveryFeeCents?: number;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
  orderType?: 'delivery' | 'pickup' | 'dine_in';
  isDeliveryRoute?: boolean;
  tableId?: string | null;
  orderId?: string;
  paymentMethod: PaymentMethod;
  funnelStep: PaymentFunnelStep;
  durationMs?: number;
  redirectStatus?: string | null;
  captureMethod?: string | null;
  paymentProviderParam?: string | null;
  transactionNsu?: string | null;
  sessionId?: string | null;
  walletApplePay?: boolean;
  walletGooglePay?: boolean;
  errorMessage?: string;
  validationField?: string;
  availablePaymentMethods?: string[];
  minOrderValue?: number;
  minOrderMet?: boolean;
  /** Methods shown in the cart footer (for options_viewed). */
  availableCheckoutMethods?: string[];
  hasCustomerName?: boolean;
  hasCustomerPhone?: boolean;
  hasCustomerAddress?: boolean;
  deliveryCovered?: boolean;
  deliveryReason?: string;
  popupBlocked?: boolean;
  whatsappChannel?: 'popup' | 'same_tab_fallback';
  reusedExisting?: boolean;
}

const PAYMENT_ATTEMPT_STARTED_KEY = 'yoself_payment_attempt_started_at';
const PAYMENT_ATTEMPT_METHOD_KEY = 'yoself_payment_attempt_method';

export function paymentMethodToProvider(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case 'whatsapp':
      return 'whatsapp';
    case 'infinitepay_pix':
      return 'infinitepay';
    case 'stripe_card':
    case 'stripe_express':
      return 'stripe';
    default:
      return 'internal';
  }
}

export function markPaymentAttemptStart(method: PaymentMethod): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PAYMENT_ATTEMPT_STARTED_KEY, String(Date.now()));
    sessionStorage.setItem(PAYMENT_ATTEMPT_METHOD_KEY, method);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getPaymentAttemptDurationMs(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = sessionStorage.getItem(PAYMENT_ATTEMPT_STARTED_KEY);
    if (!raw) return undefined;
    const started = Number(raw);
    if (!Number.isFinite(started)) return undefined;
    return Math.max(0, Date.now() - started);
  } catch {
    return undefined;
  }
}

export function clearPaymentAttemptMark(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PAYMENT_ATTEMPT_STARTED_KEY);
    sessionStorage.removeItem(PAYMENT_ATTEMPT_METHOD_KEY);
  } catch {
    /* ignore */
  }
}

function cartMetrics(items: CartItem[] | undefined) {
  if (!items?.length) {
    return {
      item_count: 0,
      unique_dishes: 0,
      line_items: 0,
      dish_names: [] as string[],
      dish_ids: [] as string[],
      categories: [] as string[],
    };
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const categories = [...new Set(items.map((i) => i.dish.category).filter(Boolean))];

  return {
    item_count: itemCount,
    unique_dishes: items.length,
    line_items: items.length,
    dish_names: items.map((i) => i.dish.name),
    dish_ids: items.map((i) => i.dish.id),
    categories,
  };
}

/** Normalized properties for every payment funnel event (dashboard-friendly). */
export function buildPaymentEventProperties(base: PaymentAnalyticsBase): Record<string, unknown> {
  const metrics = cartMetrics(base.items);
  const subtotal = base.subtotalValue ?? base.totalValue;
  const totalCents =
    base.totalValueCents ?? Math.round((base.totalValue || 0) * 100);
  const deliveryFeeCents = base.deliveryFeeCents ?? 0;

  return {
    funnel_step: base.funnelStep,
    payment_method: base.paymentMethod,
    payment_provider: paymentMethodToProvider(base.paymentMethod),
    restaurant_id: base.restaurantId,
    restaurant_slug: base.restaurantSlug,
    order_id: base.orderId,
    order_type: base.orderType,
    delivery_mode: base.deliveryMode,
    is_delivery_route: base.isDeliveryRoute ?? false,
    table_id: base.tableId ?? null,
    subtotal_value: subtotal,
    total_value: base.totalValue,
    total_value_cents: totalCents,
    delivery_fee_cents: deliveryFeeCents,
    has_delivery_fee: deliveryFeeCents > 0,
    currency: 'BRL',
    ...metrics,
    duration_ms: base.durationMs,
    redirect_status: base.redirectStatus ?? null,
    capture_method: base.captureMethod ?? null,
    payment_provider_param: base.paymentProviderParam ?? null,
    transaction_nsu: base.transactionNsu ?? null,
    stripe_session_id: base.sessionId ?? null,
    wallet_apple_pay: base.walletApplePay ?? null,
    wallet_google_pay: base.walletGooglePay ?? null,
    error_message: base.errorMessage,
    validation_field: base.validationField,
    available_payment_methods: base.availablePaymentMethods,
    available_checkout_methods: base.availableCheckoutMethods,
    min_order_value: base.minOrderValue,
    min_order_met: base.minOrderMet,
    has_customer_name: base.hasCustomerName,
    has_customer_phone: base.hasCustomerPhone,
    has_customer_address: base.hasCustomerAddress,
    delivery_covered: base.deliveryCovered,
    delivery_reason: base.deliveryReason,
    popup_blocked: base.popupBlocked,
    whatsapp_channel: base.whatsappChannel ?? null,
    reused_existing: base.reusedExisting ?? null,
  };
}

/** PostHog event name per funnel step (stable for dashboards). */
/** Shared cart/restaurant context for payment events. */
export function paymentContextFromCart(params: {
  restaurant: { id: string; slug?: string; min_order_value?: number };
  items: CartItem[];
  subtotalValue: number;
  totalValue: number;
  paymentMethod: PaymentMethod;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
  isDeliveryRoute?: boolean;
  deliveryFeeCents?: number;
  deliveryCovered?: boolean;
  deliveryReason?: string;
  tableId?: string | null;
  customerData?: { name?: string; whatsapp?: string; address?: string };
}): Omit<PaymentAnalyticsBase, 'funnelStep' | 'orderId'> {
  const isDelivery = params.isDeliveryRoute && params.deliveryMode === 'delivery';
  const isRetirada = params.isDeliveryRoute && params.deliveryMode === 'retirada';
  const orderType = isDelivery ? 'delivery' : isRetirada ? 'pickup' : 'dine_in';

  return {
    restaurantId: params.restaurant.id,
    restaurantSlug: params.restaurant.slug,
    items: params.items,
    subtotalValue: params.subtotalValue,
    totalValue: params.totalValue,
    totalValueCents: Math.round(params.totalValue * 100),
    deliveryFeeCents: params.deliveryFeeCents ?? 0,
    deliveryMode: params.deliveryMode,
    orderType,
    isDeliveryRoute: params.isDeliveryRoute,
    tableId: params.tableId ?? null,
    paymentMethod: params.paymentMethod,
    minOrderValue: params.restaurant.min_order_value,
    minOrderMet:
      !isDelivery ||
      params.subtotalValue >= (params.restaurant.min_order_value || 0),
    hasCustomerName: !!params.customerData?.name?.trim(),
    hasCustomerPhone: !!params.customerData?.whatsapp?.trim(),
    hasCustomerAddress: !!params.customerData?.address?.trim(),
    deliveryCovered: params.deliveryCovered,
    deliveryReason: params.deliveryReason,
  };
}

export const PAYMENT_FUNNEL_EVENT_NAMES: Record<PaymentFunnelStep, string> = {
  options_viewed: 'payment_checkout_options_viewed',
  method_clicked: 'payment_method_clicked',
  validation_failed: 'payment_validation_failed',
  order_created: 'payment_order_created',
  checkout_session_created: 'payment_checkout_session_created',
  redirect_started: 'payment_redirect_started',
  return_received: 'payment_return_received',
  verification_started: 'payment_verification_started',
  verification_confirmed: 'payment_verification_confirmed',
  verification_failed: 'payment_verification_failed',
  verification_processing: 'payment_verification_processing',
  completed: 'payment_completed',
  cancelled: 'payment_cancelled',
  failed: 'payment_failed',
  wallet_available: 'payment_wallet_available',
  wallet_unavailable: 'payment_wallet_unavailable',
  success_modal_closed: 'payment_success_modal_closed',
  track_order_clicked: 'payment_track_order_clicked',
  contact_restaurant_clicked: 'payment_contact_restaurant_clicked',
};
