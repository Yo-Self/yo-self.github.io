import { supabase } from '@/lib/supabase/client';
import { Restaurant, Dish, MenuItem, ComplementGroup } from '@/components/data';
import { getOptimizedImageUrl, resolveMenuItemImageUrl } from '@/utils/imageUrl';
import { parsePrefaceOptions } from '@/types/complementPreface';

export interface PublicMenuPayload {
  restaurant: Record<string, unknown> | null;
  categories: Record<string, unknown>[];
  dishes: Record<string, unknown>[];
  hours: Record<string, unknown>[];
  dish_categories: Record<string, unknown>[];
  dish_complement_groups: Array<{
    dish_id: string;
    complement_group_id: string;
    position: number | null;
  }>;
  complement_groups: Record<string, unknown>[];
  complements: Record<string, unknown>[];
}

export async function fetchPublicMenuRpc(slug: string): Promise<PublicMenuPayload | null> {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  const { data, error } = await supabase.rpc('get_public_menu', { p_slug: slug });

  if (error) {
    throw error;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as Record<string, unknown>;
  return {
    restaurant: (payload.restaurant as Record<string, unknown> | null) ?? null,
    categories: (payload.categories as Record<string, unknown>[]) ?? [],
    dishes: (payload.dishes as Record<string, unknown>[]) ?? [],
    hours: (payload.hours as Record<string, unknown>[]) ?? [],
    dish_categories: (payload.dish_categories as Record<string, unknown>[]) ?? [],
    dish_complement_groups:
      (payload.dish_complement_groups as PublicMenuPayload['dish_complement_groups']) ?? [],
    complement_groups: (payload.complement_groups as Record<string, unknown>[]) ?? [],
    complements: (payload.complements as Record<string, unknown>[]) ?? [],
  };
}

function buildComplementGroups(
  dishId: string,
  complementGroups: Record<string, unknown>[],
  complements: Record<string, unknown>[],
  associations: Map<string, Array<{ groupId: string; position: number | null }>>,
  restaurantLogoUrl: string,
): ComplementGroup[] {
  const dishAssociations = associations.get(String(dishId)) || [];
  const sortedAssociations = [...dishAssociations].sort((a, b) => {
    const posA = a.position !== null && a.position !== undefined ? a.position : 999;
    const posB = b.position !== null && b.position !== undefined ? b.position : 999;
    return posA - posB;
  });

  return sortedAssociations.flatMap((assoc): ComplementGroup[] => {
      const group = complementGroups.find((g) => String(g.id) === assoc.groupId);
      if (!group) return [];

      const groupComplements = complements
        .filter((comp) => String(comp.group_id) === String(group.id))
        .sort((a, b) => {
          const posA = a.position !== null && a.position !== undefined ? Number(a.position) : 999;
          const posB = b.position !== null && b.position !== undefined ? Number(b.position) : 999;
          return posA - posB;
        })
        .map((comp) => ({
          id: String(comp.id),
          name: String(comp.name ?? ''),
          description: String(comp.description ?? ''),
          price: comp.price ? Number(comp.price).toFixed(2).replace('.', ',') : '0,00',
          image: resolveMenuItemImageUrl(comp.image_url as string | null | undefined, restaurantLogoUrl, 200),
          ingredients: String(comp.ingredients ?? ''),
          allergens: String(comp.allergens ?? ''),
          portion: String(comp.portion ?? ''),
        }));

      const parsedPrefaceOptions = parsePrefaceOptions(group.preface_options);

      return [
        {
          id: String(group.id),
          title: String(group.title ?? ''),
          description: String(group.description ?? ''),
          required: Boolean(group.required),
          max_selections: Number(group.max_selections ?? 1),
          preface_question: (group.preface_question as string | null) ?? null,
          preface_options: parsedPrefaceOptions.length > 0 ? parsedPrefaceOptions : null,
          complements: groupComplements,
        },
      ];
    });
}

function mapFeaturedDish(
  dish: Record<string, unknown>,
  categories: Record<string, unknown>[],
  dishCategories: Record<string, unknown>[],
  complementGroups: Record<string, unknown>[],
  complements: Record<string, unknown>[],
  associations: Map<string, Array<{ groupId: string; position: number | null }>>,
  restaurantLogoUrl: string,
): Dish {
  const dishCats = dishCategories
    .filter((dc) => dc.dish_id === dish.id)
    .map((dc) => categories.find((cat) => cat.id === dc.category_id)?.name)
    .filter(Boolean) as string[];

  const dishGroups = buildComplementGroups(
    String(dish.id),
    complementGroups,
    complements,
    associations,
    restaurantLogoUrl,
  );

  return {
    id: String(dish.id),
    name: String(dish.name ?? ''),
    description: String(dish.description ?? ''),
    price: dish.price ? Number(dish.price).toFixed(2).replace('.', ',') : '0,00',
    image: resolveMenuItemImageUrl(dish.image_url as string | null | undefined, restaurantLogoUrl, 400),
    mediaType: dish.media_type === 'video' ? 'video' : 'image',
    videoMp4Url: (dish.video_mp4_url as string | null | undefined) ?? null,
    tags: (dish.tags as string[]) || [],
    ingredients: String(dish.ingredients ?? ''),
    allergens: String(dish.allergens ?? ''),
    portion: String(dish.portion ?? ''),
    categories: dishCats,
    complement_groups: dishGroups.length > 0 ? dishGroups : undefined,
  };
}

function mapMenuItem(
  dish: Record<string, unknown>,
  categories: Record<string, unknown>[],
  dishCategories: Record<string, unknown>[],
  complementGroups: Record<string, unknown>[],
  complements: Record<string, unknown>[],
  associations: Map<string, Array<{ groupId: string; position: number | null }>>,
  restaurantLogoUrl: string,
): MenuItem {
  const featured = mapFeaturedDish(
    dish,
    categories,
    dishCategories,
    complementGroups,
    complements,
    associations,
    restaurantLogoUrl,
  );
  const dishCats = featured.categories ?? [];

  return {
    ...featured,
    category: dishCats[0] || 'Sem categoria',
    categories: dishCats,
  };
}

export function transformPublicMenuPayload(payload: PublicMenuPayload): Restaurant | null {
  const restaurant = payload.restaurant;
  if (!restaurant) return null;

  const categories = payload.categories;
  const dishes = payload.dishes;
  const hours = payload.hours;
  const dishCategories = payload.dish_categories;
  const junctionRows = payload.dish_complement_groups;
  const complementGroups = payload.complement_groups;
  const complements = payload.complements;

  const associations = new Map<string, Array<{ groupId: string; position: number | null }>>();
  for (const row of junctionRows) {
    const dishId = String(row.dish_id);
    const existing = associations.get(dishId) || [];
    existing.push({ groupId: String(row.complement_group_id), position: row.position });
    associations.set(dishId, existing);
  }

  const restaurantLogoUrl = getOptimizedImageUrl(
    restaurant.image_url as string | null | undefined,
    800,
  );

  const featured_dishes = dishes
    .filter((dish) => dish.is_featured)
    .map((dish) =>
      mapFeaturedDish(
        dish,
        categories,
        dishCategories,
        complementGroups,
        complements,
        associations,
        restaurantLogoUrl,
      ),
    );

  const menu_items = dishes.map((dish) =>
    mapMenuItem(
      dish,
      categories,
      dishCategories,
      complementGroups,
      complements,
      associations,
      restaurantLogoUrl,
    ),
  );

  return {
    id: String(restaurant.id),
    slug: String(restaurant.slug ?? ''),
    name: String(restaurant.name ?? ''),
    open: restaurant.open as boolean | undefined,
    is_open_for_orders: (restaurant.is_open_for_orders as boolean | undefined) ?? false,
    operating_hours: hours.map((h) => ({
      id: String(h.id),
      restaurant_id: String(h.restaurant_id),
      day_of_week: Number(h.day_of_week),
      open_time: String(h.open_time),
      close_time: String(h.close_time),
      is_closed: Boolean(h.is_closed),
    })),
    welcome_message: String(restaurant.description || `Bem-vindo ao ${restaurant.name}!`),
    image: restaurantLogoUrl,
    waiter_call_enabled: Boolean(restaurant.waiter_call_enabled),
    whatsapp_enabled: Boolean(restaurant.whatsapp_enabled),
    whatsapp_phone: String(restaurant.whatsapp_phone ?? ''),
    whatsapp_custom_message: String(restaurant.whatsapp_custom_message ?? ''),
    online_payment: Boolean(restaurant.online_payment),
    table_ordering: Boolean(restaurant.table_ordering),
    online_ordering_enabled: restaurant.online_ordering_enabled !== false,
    pix_payment_enabled: Boolean(restaurant.pix_payment_enabled),
    infinitepay_handle: String(restaurant.infinitepay_handle ?? ''),
    stripe_connect_id: restaurant.stripe_connect_id as string | undefined,
    user_id: restaurant.user_id as string | undefined,
    min_order_value:
      restaurant.min_order_value !== undefined && restaurant.min_order_value !== null
        ? Number(restaurant.min_order_value)
        : 0,
    delivery_enabled: Boolean(restaurant.delivery_enabled),
    delivery_max_distance:
      restaurant.delivery_max_distance !== undefined && restaurant.delivery_max_distance !== null
        ? Number(restaurant.delivery_max_distance)
        : 10.0,
    delivery_base_fee:
      restaurant.delivery_base_fee !== undefined && restaurant.delivery_base_fee !== null
        ? Number(restaurant.delivery_base_fee)
        : 0,
    delivery_fee_per_km:
      restaurant.delivery_fee_per_km !== undefined && restaurant.delivery_fee_per_km !== null
        ? Number(restaurant.delivery_fee_per_km)
        : 0,
    delivery_zones: (restaurant.delivery_zones as Restaurant['delivery_zones']) || [],
    latitude: restaurant.latitude !== null ? Number(restaurant.latitude) : undefined,
    longitude: restaurant.longitude !== null ? Number(restaurant.longitude) : undefined,
    address: restaurant.address as string | undefined,
    menu_categories: categories.map((cat) => String(cat.name)),
    featured_dishes,
    menu_items,
  };
}
