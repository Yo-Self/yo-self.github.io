import type { Restaurant } from '../components/data';

/** Matches create_customer_order RPC: requires open AND is_open_for_orders. */
export function canRestaurantAcceptOrders(restaurant?: Pick<Restaurant, 'open' | 'is_open_for_orders'> | null): boolean {
  if (!restaurant) return false;
  return restaurant.open === true && restaurant.is_open_for_orders === true;
}
