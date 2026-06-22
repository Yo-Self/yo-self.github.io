"use client";

import { useState, useEffect } from 'react';
import { Restaurant } from '@/components/data';
import { supabase } from '@/lib/supabase/client';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/config';
import { getOptimizedImageUrl } from '@/utils/imageUrl';
import { Analytics } from '@/lib/analytics';

interface UseRestaurantBySlugResult {
  restaurant: Restaurant | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const RESTAURANT_CACHE_TTL_MS =
  process.env.NODE_ENV === 'development' ? 30_000 : 5 * 60_000;
const SESSION_CACHE_PREFIX = 'yo-self:restaurant:v1:';
const slugCache = new Map<string, { restaurant: Restaurant; fetchedAt: number }>();
const inflightFetches = new Map<string, Promise<Restaurant | null>>();

function readSessionRestaurantCache(
  slug: string
): { restaurant: Restaurant; fetchedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { restaurant: Restaurant; fetchedAt: number };
    if (Date.now() - parsed.fetchedAt > RESTAURANT_CACHE_TTL_MS) {
      sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${slug}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionRestaurantCache(slug: string, restaurant: Restaurant) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      `${SESSION_CACHE_PREFIX}${slug}`,
      JSON.stringify({ restaurant, fetchedAt: Date.now() })
    );
  } catch {
    // sessionStorage quota exceeded — memory cache still works
  }
}

function clearSessionRestaurantCache(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${slug}`);
  } catch {
    // ignore
  }
}

type RestaurantOrderStatus = Pick<Restaurant, 'open' | 'is_open_for_orders'>;

/** Open/closed status must not be cached — it changes during the day. */
function withoutVolatileRestaurantFields(restaurant: Restaurant): Restaurant {
  const { open: _open, is_open_for_orders: _isOpen, ...rest } = restaurant;
  return rest as Restaurant;
}

function mergeRestaurantOrderStatus(
  restaurant: Restaurant,
  status: RestaurantOrderStatus | null
): Restaurant {
  if (!status) return restaurant;
  return {
    ...restaurant,
    open: status.open,
    is_open_for_orders: status.is_open_for_orders,
  };
}

async function fetchRestaurantOrderStatus(slug: string): Promise<RestaurantOrderStatus | null> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();
  if (!supabaseUrl || !supabaseKey) return null;

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };

  const fetchStatus = async (filter: string) => {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/restaurants_public?${filter}&select=open,is_open_for_orders&limit=1`,
      { headers, cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] ?? null;
  };

  try {
    let row = await fetchStatus(`slug=eq.${encodeURIComponent(slug)}`);
    if (!row) {
      row = await fetchStatus(`id=eq.${encodeURIComponent(slug)}`);
    }
    if (!row) return null;
    return {
      open: row.open,
      is_open_for_orders: row.is_open_for_orders ?? false,
    };
  } catch (err) {
    console.error('Error fetching restaurant order status:', err);
    return null;
  }
}

function storeRestaurantCache(slug: string, restaurant: Restaurant) {
  const cacheable = withoutVolatileRestaurantFields(restaurant);
  const cacheEntry = { restaurant: cacheable, fetchedAt: Date.now() };
  slugCache.set(slug, cacheEntry);
  writeSessionRestaurantCache(slug, cacheable);
}

const MOCK_RESTAURANT: Restaurant = {
  id: '1',
  slug: 'auri-monteiro',
  name: 'Auri Monteiro',
  welcome_message: 'Bem-vindo ao Auri Monteiro!',
  image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
  waiter_call_enabled: true,
  whatsapp_enabled: true,
  whatsapp_phone: '5511999999999',
  whatsapp_custom_message: 'Olá, gostaria de fazer um pedido!',
  online_payment: true,
  table_ordering: true,
  min_order_value: 0,
  menu_categories: ['Tortas', 'Doces', 'Bebidas'],
  featured_dishes: [
    {
      id: 'f1',
      name: 'Torta de Morango',
      description: 'Deliciosa torta com morangos frescos e creme especial.',
      price: '15,00',
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3',
      tags: ['Destaque'],
      ingredients: 'Morango, leite condensado, massa de torta',
      allergens: 'Contém glúten, Contém lactose',
      portion: 'Serve 1 pessoa',
      categories: ['Tortas'],
      complement_groups: [
        {
          title: 'Cobertura Extra',
          description: 'Selecione uma cobertura para sua torta',
          required: true,
          max_selections: 1,
          complements: [
            {
              id: 'c1',
              name: 'Chantilly',
              description: 'Chantilly fresco e cremoso',
              price: '2,00',
              image: '',
              ingredients: 'Creme de leite, açúcar',
              allergens: 'Contém lactose',
              portion: 'Serve 1 pessoa'
            },
            {
              id: 'c2',
              name: 'Creme de Chocolate',
              description: 'Creme suave de chocolate belga',
              price: '3,00',
              image: '',
              ingredients: 'Chocolate, leite condensado',
              allergens: 'Contém lactose',
              portion: 'Serve 1 pessoa'
            }
          ]
        },
        {
          title: 'Adicionais Opcionais',
          description: 'Selecione adicionais para sua torta',
          required: false,
          max_selections: 2,
          complements: [
            {
              id: 'c3',
              name: 'Granulado',
              description: 'Granulado de chocolate belga',
              price: '1,00',
              image: '',
              ingredients: 'Açúcar, cacau',
              allergens: 'Contém glúten',
              portion: 'Serve 1 pessoa'
            }
          ]
        }
      ]
    },
    {
      id: 'f2',
      name: 'Torta de Limão',
      description: 'Torta clássica de limão com merengue italiano.',
      price: '12,00',
      image: 'https://images.unsplash.com/photo-1519869325930-281384150729',
      tags: ['Destaque'],
      ingredients: 'Limão, leite condensado, merengue',
      allergens: 'Contém glúten, Contém lactose',
      portion: 'Serve 1 pessoa',
      categories: ['Tortas'],
      complement_groups: []
    }
  ],
  menu_items: [
    {
      id: 'f1',
      name: 'Torta de Morango',
      description: 'Deliciosa torta com morangos frescos e creme especial.',
      price: '15,00',
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3',
      tags: ['Destaque'],
      ingredients: 'Morango, leite condensado, massa de torta',
      allergens: 'Contém glúten, Contém lactose',
      portion: 'Serve 1 pessoa',
      category: 'Tortas',
      categories: ['Tortas'],
      complement_groups: [
        {
          title: 'Cobertura Extra',
          description: 'Selecione uma cobertura para sua torta',
          required: true,
          max_selections: 1,
          complements: [
            {
              id: 'c1',
              name: 'Chantilly',
              description: 'Chantilly fresco e cremoso',
              price: '2,00',
              image: '',
              ingredients: 'Creme de leite, açúcar',
              allergens: 'Contém lactose',
              portion: 'Serve 1 pessoa'
            },
            {
              id: 'c2',
              name: 'Creme de Chocolate',
              description: 'Creme suave de chocolate belga',
              price: '3,00',
              image: '',
              ingredients: 'Chocolate, leite condensado',
              allergens: 'Contém lactose',
              portion: 'Serve 1 pessoa'
            }
          ]
        },
        {
          title: 'Adicionais Opcionais',
          description: 'Selecione adicionais para sua torta',
          required: false,
          max_selections: 2,
          complements: [
            {
              id: 'c3',
              name: 'Granulado',
              description: 'Granulado de chocolate belga',
              price: '1,00',
              image: '',
              ingredients: 'Açúcar, cacau',
              allergens: 'Contém glúten',
              portion: 'Serve 1 pessoa'
            }
          ]
        }
      ]
    },
    {
      id: 'f2',
      name: 'Torta de Limão',
      description: 'Torta clássica de limão com merengue italiano.',
      price: '12,00',
      image: 'https://images.unsplash.com/photo-1519869325930-281384150729',
      tags: ['Destaque'],
      ingredients: 'Limão, leite condensado, merengue',
      allergens: 'Contém glúten, Contém lactose',
      portion: 'Serve 1 pessoa',
      category: 'Tortas',
      categories: ['Tortas'],
      complement_groups: []
    },
    {
      id: 'm3',
      name: 'Brigadeiro Gourmet',
      description: 'Brigadeiro tradicional feito com chocolate belga e confeito belga.',
      price: '5,00',
      image: 'https://images.unsplash.com/photo-1548907601-5e2127a548be',
      tags: [],
      ingredients: 'Chocolate belga, leite condensado, manteiga',
      allergens: 'Contém lactose',
      portion: 'Serve 1 pessoa',
      category: 'Doces',
      categories: ['Doces'],
      complement_groups: []
    },
    {
      id: 'm4',
      name: 'Quindim',
      description: 'Doce tradicional brasileiro com coco ralado fresco e gema de ovo.',
      price: '8,00',
      image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814',
      tags: [],
      ingredients: 'Coco ralado, gemas, açúcar',
      allergens: 'Não contém glúten',
      portion: 'Serve 1 pessoa',
      category: 'Doces',
      categories: ['Doces'],
      complement_groups: []
    },
    {
      id: 'm5',
      name: 'Suco de Laranja',
      description: 'Suco natural de laranja fresco espremido na hora.',
      price: '7,00',
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423',
      tags: [],
      ingredients: 'Laranja fresca',
      allergens: 'Nenhum',
      portion: 'Serve 1 pessoa',
      category: 'Bebidas',
      categories: ['Bebidas'],
      complement_groups: []
    },
    {
      id: 'm6',
      name: 'Croassaint Simples',
      description: 'Croassaint folhado clássico amanteigado com recheio opcional.',
      price: '10,00',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
      tags: [],
      ingredients: 'Trigo, manteiga, ovos',
      allergens: 'Contém glúten, Contém lactose',
      portion: 'Serve 1 pessoa',
      category: 'Tortas',
      categories: ['Tortas'],
      complement_groups: [
        {
          title: 'Recheio Obrigatório',
          description: 'Selecione um recheio obrigatório',
          required: true,
          max_selections: 1,
          complements: [
            {
              id: 'c4',
              name: 'Chocolate',
              description: 'Recheio de chocolate cremoso',
              price: '3,00',
              image: '',
              ingredients: 'Chocolate, leite condensado',
              allergens: 'Contém lactose',
              portion: 'Serve 1 pessoa'
            },
            {
              id: 'c5',
              name: 'Presunto e Queijo',
              description: 'Presunto e queijo derretido',
              price: '4,00',
              image: '',
              ingredients: 'Presunto, queijo',
              allergens: 'Contém lactose',
              portion: 'Serve 1 pessoa'
            }
          ]
        }
      ]
    }
  ]
};

export function useRestaurantBySlug(slug: string): UseRestaurantBySlugResult {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = async (slug: string) => {
    if (!slug || slug === '[slug]' || slug === 'default') {
      setRestaurant(null);
      setIsLoading(false);
      return;
    }

    const loadStartedAt = Date.now();
    let loadedFromCache = false;

    setIsLoading(true);
    setError(null);

    const memoryCached = slugCache.get(slug);
    if (memoryCached && Date.now() - memoryCached.fetchedAt < RESTAURANT_CACHE_TTL_MS) {
      setRestaurant(memoryCached.restaurant);
      setIsLoading(false);
      loadedFromCache = true;
      Analytics.trackMenuLoadCompleted(slug, {
        dish_count: memoryCached.restaurant.menu_items?.length ?? 0,
        duration_ms: Date.now() - loadStartedAt,
        from_cache: true,
      });
      const status = await fetchRestaurantOrderStatus(slug);
      if (status) {
        setRestaurant(mergeRestaurantOrderStatus(memoryCached.restaurant, status));
      }
      return;
    }

    const sessionCached = readSessionRestaurantCache(slug);
    if (sessionCached) {
      slugCache.set(slug, sessionCached);
      setRestaurant(sessionCached.restaurant);
      setIsLoading(false);
      loadedFromCache = true;
      Analytics.trackMenuLoadCompleted(slug, {
        dish_count: sessionCached.restaurant.menu_items?.length ?? 0,
        duration_ms: Date.now() - loadStartedAt,
        from_cache: true,
      });
      const status = await fetchRestaurantOrderStatus(slug);
      if (status) {
        setRestaurant(mergeRestaurantOrderStatus(sessionCached.restaurant, status));
      }
      return;
    }

    const inflight = inflightFetches.get(slug);
    if (inflight) {
      const result = await inflight;
      const withStatus = result
        ? mergeRestaurantOrderStatus(result, await fetchRestaurantOrderStatus(slug))
        : null;
      setRestaurant(withStatus);
      setIsLoading(false);
      if (withStatus) {
        Analytics.trackMenuLoadCompleted(slug, {
          dish_count: withStatus.menu_items?.length ?? 0,
          duration_ms: Date.now() - loadStartedAt,
          from_cache: true,
        });
      } else {
        Analytics.trackMenuLoadFailed(slug, {
          error_message: 'restaurant_not_found',
          duration_ms: Date.now() - loadStartedAt,
        });
      }
      return;
    }

    // If Supabase client is not configured
    if (!supabase) {
      console.error('Supabase client is not configured');
      setRestaurant(null);
      setIsLoading(false);
      return;
    }

    const fetchPromise = (async (): Promise<Restaurant | null> => {
    try {
      // First try to fetch by slug
      let { data: restaurants, error: queryError } = await supabase
        .from('restaurants_public')
        .select('*')
        .eq('slug', slug)
        .limit(1);

      if (queryError) {
        throw queryError;
      }

      let restaurant = restaurants?.[0];

      // If not found by slug, try by ID (for compatibility)
      if (!restaurant) {
        const { data: restaurantsById, error: idError } = await supabase
          .from('restaurants_public')
          .select('*')
          .eq('id', slug)
          .limit(1);

        if (idError) {
          throw idError;
        }

        restaurant = restaurantsById?.[0];
      }

      if (!restaurant) {
        return null;
      }

      // Fetch related data
      const [categoriesResult, dishesResult, hoursResult] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('position'),
        supabase
          .from('dishes_public')
          .select('*')
          .eq('restaurant_id', restaurant.id),
        supabase
          .from('restaurant_hours')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('day_of_week')
      ]);

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (dishesResult.error) {
        throw dishesResult.error;
      }

      if (hoursResult.error) {
        throw hoursResult.error;
      }

      const categories = categoriesResult.data || [];
      const dishes = dishesResult.data || [];
      const hours = hoursResult.data || [];

      // Get dish IDs for fetching complements
      const dishIds = dishes.map(d => String(d.id));

      // Helper function to chunk arrays to avoid URL length limits
      const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
      };

      // Fetch dish categories and complement groups in chunks to avoid URL length limits
      let dishCategories: any[] = [];
      let complementGroups: any[] = [];
      let junctionRows: any[] = [];

      if (dishIds.length > 0) {
        // Split dish IDs into chunks of 20 to avoid URL length issues
        const dishIdChunks = chunkArray(dishIds, 20);
        
        // Fetch dish categories in chunks
        const dishCategoryPromises = dishIdChunks.map(chunk => {
          if (!supabase) throw new Error('Supabase client not available');
          return supabase
            .from('dish_categories')
            .select('*')
            .in('dish_id', chunk);
        });

        // Fetch complement groups through junction table
        const junctionPromises = dishIdChunks.map(chunk => {
          if (!supabase) throw new Error('Supabase client not available');
          return supabase
            .from('dish_complement_groups')
            .select('dish_id,complement_group_id,position')
            .in('dish_id', chunk)
            .order('position', { ascending: true, nullsFirst: true });
        });

        const [dishCategoryResults, junctionResults] = await Promise.all([
          Promise.all(dishCategoryPromises),
          Promise.all(junctionPromises)
        ]);

        // Check for errors and combine results
        for (const result of dishCategoryResults) {
          if (result.error) {
            throw result.error;
          }
          dishCategories.push(...(result.data || []));
        }

        // Combine junction table results
        for (const result of junctionResults) {
          if (result.error) {
            throw result.error;
          }
          junctionRows.push(...(result.data || []));
        }

        // Now fetch the actual complement groups
        if (junctionRows.length > 0) {
          const groupIds = [...new Set(junctionRows.map(row => row.complement_group_id))];
          const groupIdChunks = chunkArray(groupIds, 20);
          
          const complementGroupPromises = groupIdChunks.map(chunk => {
            if (!supabase) throw new Error('Supabase client not available');
            return supabase
              .from('complement_groups')
              .select('*')
              .in('id', chunk);
          });

          const complementGroupResults = await Promise.all(complementGroupPromises);

          for (const result of complementGroupResults) {
            if (result.error) {
              throw result.error;
            }
            complementGroups.push(...(result.data || []));
          }
        }
      }

      // Fetch complements for the groups
      const groupIds = complementGroups.map(g => g.id);
      let complements: any[] = [];

      if (groupIds.length > 0) {
        // Split group IDs into chunks to avoid URL length issues
        const groupIdChunks = chunkArray(groupIds, 20);
        
        const complementPromises = groupIdChunks.map(chunk => {
          if (!supabase) throw new Error('Supabase client not available');
          return supabase
            .from('complements')
            .select('*')
            .in('group_id', chunk)
            .eq('is_active', true)
            .order('position');
        });

        const complementResults = await Promise.all(complementPromises);

        // Check for errors and combine results
        for (const result of complementResults) {
          if (result.error) {
            throw result.error;
          }
          complements.push(...(result.data || []));
        }
      }

      // Create associations map from junction table data
      const associations = new Map<string, Array<{groupId: string, position: number | null}>>();
      if (junctionRows) {
        for (const row of junctionRows) {
          const dishId = row.dish_id;
          const groupId = row.complement_group_id;
          const position = row.position;
          const existing = associations.get(dishId) || [];
          existing.push({ groupId, position });
          associations.set(dishId, existing);
        }
      }

      // Transform the data to match the Restaurant interface
      const transformedRestaurant: Restaurant = {
        id: String(restaurant.id),
        slug: restaurant.slug || '',
        name: restaurant.name || '',
        open: restaurant.open,
        is_open_for_orders: restaurant.is_open_for_orders ?? false,
        operating_hours: hours.map(h => ({
          id: String(h.id),
          restaurant_id: String(h.restaurant_id),
          day_of_week: Number(h.day_of_week),
          open_time: String(h.open_time),
          close_time: String(h.close_time),
          is_closed: Boolean(h.is_closed)
        })),
        welcome_message: restaurant.description || `Bem-vindo ao ${restaurant.name}!`,
        image: getOptimizedImageUrl(restaurant.image_url, 800),
        waiter_call_enabled: restaurant.waiter_call_enabled || false,
        whatsapp_enabled: restaurant.whatsapp_enabled || false,
        whatsapp_phone: restaurant.whatsapp_phone || '',
        whatsapp_custom_message: restaurant.whatsapp_custom_message || '',
        online_payment: restaurant.online_payment || false,
        table_ordering: restaurant.table_ordering || false,
        online_ordering_enabled: restaurant.online_ordering_enabled !== false,
        pix_payment_enabled: restaurant.pix_payment_enabled || false,
        infinitepay_handle: restaurant.infinitepay_handle || '',
        stripe_connect_id: restaurant.stripe_connect_id || undefined,
        user_id: restaurant.user_id || undefined,
        min_order_value: restaurant.min_order_value !== undefined && restaurant.min_order_value !== null ? Number(restaurant.min_order_value) : 0,
        delivery_enabled: restaurant.delivery_enabled || false,
        delivery_max_distance: restaurant.delivery_max_distance !== undefined && restaurant.delivery_max_distance !== null ? Number(restaurant.delivery_max_distance) : 10.0,
        delivery_base_fee: restaurant.delivery_base_fee !== undefined && restaurant.delivery_base_fee !== null ? Number(restaurant.delivery_base_fee) : 0,
        delivery_fee_per_km: restaurant.delivery_fee_per_km !== undefined && restaurant.delivery_fee_per_km !== null ? Number(restaurant.delivery_fee_per_km) : 0,
        delivery_zones: restaurant.delivery_zones || [],
        latitude: restaurant.latitude !== null ? Number(restaurant.latitude) : undefined,
        longitude: restaurant.longitude !== null ? Number(restaurant.longitude) : undefined,
        address: restaurant.address || undefined,
        menu_categories: categories.map(cat => cat.name),
        featured_dishes: dishes
          .filter(dish => dish.is_featured)
          .map(dish => {
            // Get categories for this dish
            const dishCats = dishCategories
              .filter(dc => dc.dish_id === dish.id)
              .map(dc => categories.find(cat => cat.id === dc.category_id)?.name)
              .filter(Boolean) as string[];

            // Get complement groups for this dish
            const dishAssociations = associations.get(String(dish.id)) || [];
            // Sort complement groups by position ascending
            const sortedAssociations = [...dishAssociations].sort((a, b) => {
              const posA = a.position !== null && a.position !== undefined ? a.position : 999;
              const posB = b.position !== null && b.position !== undefined ? b.position : 999;
              return posA - posB;
            });
            const dishGroups = sortedAssociations
              .map(assoc => {
                const group = complementGroups.find(g => g.id === assoc.groupId);
                if (!group) return null;
                
                const groupComplements = complements
                  .filter(comp => comp.group_id === group.id)
                  .sort((a, b) => {
                    const posA = a.position !== null && a.position !== undefined ? a.position : 999;
                    const posB = b.position !== null && b.position !== undefined ? b.position : 999;
                    return posA - posB;
                  })
                  .map(comp => ({
                    id: String(comp.id),
                    name: comp.name,
                    description: comp.description || '',
                    price: comp.price ? comp.price.toFixed(2).replace('.', ',') : '0,00',
                    image: getOptimizedImageUrl(comp.image_url, 200),
                    ingredients: comp.ingredients || '',
                    allergens: comp.allergens || '',
                    portion: comp.portion || ''
                  }));

                return {
                  title: group.title,
                  description: group.description || '',
                  required: group.required || false,
                  max_selections: group.max_selections || 1,
                  complements: groupComplements
                };
              })
              .filter((group): group is NonNullable<typeof group> => group !== null); // Filter out null values

            return {
              id: String(dish.id),
              name: dish.name,
              description: dish.description || '',
              price: dish.price ? dish.price.toFixed(2).replace('.', ',') : '0,00',
              image: getOptimizedImageUrl(dish.image_url, 400),
              tags: dish.tags || [],
              ingredients: dish.ingredients || '',
              allergens: dish.allergens || '',
              portion: dish.portion || '',
              categories: dishCats,
              needs_preparation: dish.needs_preparation !== false,
              complement_groups: dishGroups.length > 0 ? dishGroups : undefined
            };
          }),
        menu_items: dishes.map(dish => {
          // Get categories for this dish
          const dishCats = dishCategories
            .filter(dc => dc.dish_id === dish.id)
            .map(dc => categories.find(cat => cat.id === dc.category_id)?.name)
            .filter(Boolean) as string[];

          const primaryCategory = dishCats[0] || 'Sem categoria';

          // Get complement groups for this dish
          const dishAssociations = associations.get(String(dish.id)) || [];
          // Sort complement groups by position ascending
          const sortedAssociations = [...dishAssociations].sort((a, b) => {
            const posA = a.position !== null && a.position !== undefined ? a.position : 999;
            const posB = b.position !== null && b.position !== undefined ? b.position : 999;
            return posA - posB;
          });
          const dishGroups = sortedAssociations
            .map(assoc => {
              const group = complementGroups.find(g => g.id === assoc.groupId);
              if (!group) return null;
              
              const groupComplements = complements
                .filter(comp => comp.group_id === group.id)
                .sort((a, b) => {
                  const posA = a.position !== null && a.position !== undefined ? a.position : 999;
                  const posB = b.position !== null && b.position !== undefined ? b.position : 999;
                  return posA - posB;
                })
                .map(comp => ({
                  id: String(comp.id),
                  name: comp.name,
                  description: comp.description || '',
                  price: comp.price ? comp.price.toFixed(2).replace('.', ',') : '0,00',
                  image: getOptimizedImageUrl(comp.image_url, 200),
                  ingredients: comp.ingredients || '',
                  allergens: comp.allergens || '',
                  portion: comp.portion || ''
                }));

              return {
                title: group.title,
                description: group.description || '',
                required: group.required || false,
                max_selections: group.max_selections || 1,
                complements: groupComplements
              };
            })
            .filter((group): group is NonNullable<typeof group> => group !== null); // Filter out null values

          return {
            id: String(dish.id),
            name: dish.name,
            description: dish.description || '',
            price: dish.price ? dish.price.toFixed(2).replace('.', ',') : '0,00',
            image: getOptimizedImageUrl(dish.image_url, 400),
            tags: dish.tags || [],
            ingredients: dish.ingredients || '',
            allergens: dish.allergens || '',
            portion: dish.portion || '',
            category: primaryCategory,
            categories: dishCats,
            needs_preparation: dish.needs_preparation !== false,
            complement_groups: dishGroups.length > 0 ? dishGroups : undefined
          };
        })
      };

      storeRestaurantCache(slug, transformedRestaurant);
      return mergeRestaurantOrderStatus(
        transformedRestaurant,
        await fetchRestaurantOrderStatus(slug)
      );
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      return null;
    }
    })();

    inflightFetches.set(slug, fetchPromise);
    try {
      const result = await fetchPromise;
      setRestaurant(result);
      setError(null);
      if (result) {
        Analytics.trackMenuLoadCompleted(slug, {
          dish_count: result.menu_items?.length ?? 0,
          duration_ms: Date.now() - loadStartedAt,
          from_cache: loadedFromCache,
        });
      } else {
        Analytics.trackMenuLoadFailed(slug, {
          error_message: 'restaurant_not_found',
          duration_ms: Date.now() - loadStartedAt,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setRestaurant(null);
      Analytics.trackMenuLoadFailed(slug, {
        error_message: message,
        duration_ms: Date.now() - loadStartedAt,
      });
    } finally {
      inflightFetches.delete(slug);
      setIsLoading(false);
    }
  };

  const refetch = () => {
    slugCache.delete(slug);
    clearSessionRestaurantCache(slug);
    fetchRestaurant(slug);
  };

  useEffect(() => {
    fetchRestaurant(slug);
  }, [slug]);

  return {
    restaurant,
    isLoading,
    error,
    refetch
  };
}

export function useRestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    setError(null);

    if (!supabase) {
      console.error('Supabase client is not configured');
      setRestaurants([]);
      setIsLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: restaurantData, error: queryError } = await supabase
        .from('restaurants_public')
        .select('*')
        .order('name');

      if (queryError) {
        throw queryError;
      }

      const restaurants = restaurantData || [];
      if (restaurants.length === 0) {
        setRestaurants([]);
        setIsLoading(false);
        return;
      }
      const transformedRestaurants = restaurants.map(restaurant => ({
        id: String(restaurant.id),
        slug: restaurant.slug || '',
        name: restaurant.name || '',
        open: restaurant.open,
        welcome_message: restaurant.description || `Bem-vindo ao ${restaurant.name}!`,
        image: getOptimizedImageUrl(restaurant.image_url, 400),
        waiter_call_enabled: restaurant.waiter_call_enabled || false,
        whatsapp_enabled: restaurant.whatsapp_enabled || false,
        whatsapp_phone: restaurant.whatsapp_phone || '',
        whatsapp_custom_message: restaurant.whatsapp_custom_message || '',
        online_payment: restaurant.online_payment || false,
        table_ordering: restaurant.table_ordering || false,
        online_ordering_enabled: restaurant.online_ordering_enabled !== false,
        pix_payment_enabled: restaurant.pix_payment_enabled || false,
        infinitepay_handle: restaurant.infinitepay_handle || '',
        stripe_connect_id: restaurant.stripe_connect_id || undefined,
        user_id: restaurant.user_id || undefined,
        min_order_value: restaurant.min_order_value !== undefined && restaurant.min_order_value !== null ? Number(restaurant.min_order_value) : 0,
        menu_categories: [],
        featured_dishes: [],
        menu_items: []
      }));

      setRestaurants(transformedRestaurants);
    } catch (err) {
      console.error('Error fetching restaurants list:', err);
      setRestaurants([]);
      setError(err instanceof Error ? err.message : 'Erro ao carregar restaurantes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  return {
    restaurants,
    isLoading,
    error,
    refetch: fetchRestaurants
  };
}