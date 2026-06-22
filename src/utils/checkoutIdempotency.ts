import type { CartItem } from '../types/cart';
import { createOrder } from '../services/orderService';
import type { Order, OrderItem } from '../types/order';

const IDEMPOTENCY_PREFIX = 'checkout_idempotency:';
const ORDER_ID_PREFIX = 'checkout_order_id:';

export interface CheckoutFingerprintInput {
  restaurantId: string;
  items: CartItem[];
  customerPhone?: string | null;
  tableId?: string | null;
  orderType?: string | null;
  deliveryCoordsLat?: number | null;
  deliveryCoordsLng?: number | null;
}

function storageKey(prefix: string, restaurantId: string, fingerprint: string): string {
  return `${prefix}${restaurantId}:${fingerprint}`;
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function normalizePhone(phone?: string | null): string {
  return (phone || '').replace(/\D/g, '');
}

function serializeCartItems(items: CartItem[]): string {
  return items
    .map((item) => {
      const complementIds = Array.from(item.selectedComplements.entries())
        .flatMap(([, selections]) => Array.from(selections))
        .sort()
        .join(',');
      const answerIds = Array.from(item.prefaceAnswers?.entries() || [])
        .map(([group, answerId]) => `${group}:${answerId}`)
        .sort()
        .join(',');
      return `${item.dish.id}:${item.quantity}:${complementIds}:${answerIds}`;
    })
    .sort()
    .join('|');
}

export function computeCartFingerprint(input: CheckoutFingerprintInput): string {
  const parts = [
    input.restaurantId,
    serializeCartItems(input.items),
    normalizePhone(input.customerPhone),
    (input.tableId || '').trim(),
    input.orderType || '',
    input.deliveryCoordsLat != null ? String(input.deliveryCoordsLat) : '',
    input.deliveryCoordsLng != null ? String(input.deliveryCoordsLng) : '',
  ];
  return simpleHash(parts.join('::'));
}

function readSession(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore quota errors */
  }
}

function removeSessionKeysWithPrefix(prefix: string): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export function getCheckoutIdempotencyKey(restaurantId: string, fingerprint: string): string {
  const key = storageKey(IDEMPOTENCY_PREFIX, restaurantId, fingerprint);
  const existing = readSession(key);
  if (existing) return existing;

  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  writeSession(key, generated);
  return generated;
}

export function getStoredOrderIdForFingerprint(
  restaurantId: string,
  fingerprint: string,
): string | null {
  return readSession(storageKey(ORDER_ID_PREFIX, restaurantId, fingerprint));
}

export function setStoredOrderIdForFingerprint(
  restaurantId: string,
  fingerprint: string,
  orderId: string,
): void {
  writeSession(storageKey(ORDER_ID_PREFIX, restaurantId, fingerprint), orderId);
}

export function invalidateIdempotencyForFingerprint(
  restaurantId: string,
  fingerprint: string,
): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(storageKey(IDEMPOTENCY_PREFIX, restaurantId, fingerprint));
  sessionStorage.removeItem(storageKey(ORDER_ID_PREFIX, restaurantId, fingerprint));
}

export function invalidateCheckoutIdempotency(restaurantId: string): void {
  removeSessionKeysWithPrefix(`${IDEMPOTENCY_PREFIX}${restaurantId}:`);
  removeSessionKeysWithPrefix(`${ORDER_ID_PREFIX}${restaurantId}:`);
}

export interface CreateOrderWithIdempotencyResult {
  order: Order;
  reusedExisting: boolean;
  idempotencyKey: string;
  fingerprint: string;
}

export async function createOrderWithIdempotency(
  order: Omit<Order, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[],
  fingerprintInput: CheckoutFingerprintInput,
): Promise<CreateOrderWithIdempotencyResult> {
  const fingerprint = computeCartFingerprint(fingerprintInput);
  let idempotencyKey = getCheckoutIdempotencyKey(fingerprintInput.restaurantId, fingerprint);
  const storedOrderId = getStoredOrderIdForFingerprint(fingerprintInput.restaurantId, fingerprint);

  try {
    const result = await createOrder(order, items, { idempotencyKey });
    const reusedExisting = storedOrderId !== null && storedOrderId === result.id;

    if (!storedOrderId) {
      setStoredOrderIdForFingerprint(fingerprintInput.restaurantId, fingerprint, result.id);
    }

    return { order: result, reusedExisting, idempotencyKey, fingerprint };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('já foi finalizado') || message.toLowerCase().includes('duplicate')) {
      invalidateIdempotencyForFingerprint(fingerprintInput.restaurantId, fingerprint);
      idempotencyKey = getCheckoutIdempotencyKey(fingerprintInput.restaurantId, fingerprint);
      const result = await createOrder(order, items, { idempotencyKey });
      setStoredOrderIdForFingerprint(fingerprintInput.restaurantId, fingerprint, result.id);
      return { order: result, reusedExisting: false, idempotencyKey, fingerprint };
    }
    throw error;
  }
}
