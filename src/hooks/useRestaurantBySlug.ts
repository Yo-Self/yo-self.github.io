"use client";

import { useState, useEffect } from 'react';
import { Restaurant } from '@/components/data';
import { supabase } from '@/lib/supabase/client';

interface UseRestaurantBySlugResult {
  restaurant: Restaurant | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRestaurantBySlug(slug: string): UseRestaurantBySlugResult {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = async (slug: string) => {
    if (!slug || slug === '[slug]') {
      setRestaurant(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // First try to fetch by slug
      let { data: restaurants, error: queryError } = await supabase
        .from('restaurants')
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
          .from('restaurants')
          .select('*')
          .eq('id', slug)
          .limit(1);

        if (idError) {
          throw idError;
        }

        restaurant = restaurantsById?.[0];
      }

      if (!restaurant) {
        setRestaurant(null);
        setIsLoading(false);
        return;
      }

      // Fetch related data
      const [categoriesResult, dishesResult] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('position'),
        supabase
          .from('dishes')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('is_available', true)
      ]);

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (dishesResult.error) {
        throw dishesResult.error;
      }

      const categories = categoriesResult.data || [];
      const dishes = dishesResult.data || [];

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
            .in('dish_id', chunk);
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
        welcome_message: restaurant.description || `Bem-vindo ao ${restaurant.name}!`,
        image: restaurant.image_url || '',
        waiter_call_enabled: restaurant.waiter_call_enabled || false,
        whatsapp_enabled: restaurant.whatsapp_enabled || false,
        whatsapp_phone: restaurant.whatsapp_phone || '',
        whatsapp_custom_message: restaurant.whatsapp_custom_message || '',
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
            const dishGroups = dishAssociations
              .map(assoc => {
                const group = complementGroups.find(g => g.id === assoc.groupId);
                if (!group) return null;
                
                const groupComplements = complements
                  .filter(comp => comp.group_id === group.id)
                  .map(comp => ({
                    name: comp.name,
                    description: comp.description || '',
                    price: comp.price ? (comp.price / 100).toFixed(2).replace('.', ',') : '0,00',
                    image: comp.image_url || '',
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
              name: dish.name,
              description: dish.description || '',
              price: dish.price ? (dish.price / 100).toFixed(2).replace('.', ',') : '0,00',
              image: dish.image_url || '',
              tags: dish.tags || [],
              ingredients: dish.ingredients || '',
              allergens: dish.allergens || '',
              portion: dish.portion || '',
              categories: dishCats,
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
          const dishGroups = dishAssociations
            .map(assoc => {
              const group = complementGroups.find(g => g.id === assoc.groupId);
              if (!group) return null;
              
              const groupComplements = complements
                .filter(comp => comp.group_id === group.id)
                .map(comp => ({
                  name: comp.name,
                  description: comp.description || '',
                  price: comp.price ? (comp.price / 100).toFixed(2).replace('.', ',') : '0,00',
                  image: comp.image_url || '',
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
            name: dish.name,
            description: dish.description || '',
            price: dish.price ? (dish.price / 100).toFixed(2).replace('.', ',') : '0,00',
            image: dish.image_url || '',
            tags: dish.tags || [],
            ingredients: dish.ingredients || '',
            allergens: dish.allergens || '',
            portion: dish.portion || '',
            category: primaryCategory,
            categories: dishCats,
            complement_groups: dishGroups.length > 0 ? dishGroups : undefined
          };
        })
      };

      setRestaurant(transformedRestaurant);
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurant');
      setRestaurant(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
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

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: restaurantData, error: queryError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (queryError) {
        throw queryError;
      }

      const restaurants = restaurantData || [];
      const transformedRestaurants = restaurants.map(restaurant => ({
        id: String(restaurant.id),
        slug: restaurant.slug || '',
        name: restaurant.name || '',
        welcome_message: restaurant.description || `Bem-vindo ao ${restaurant.name}!`,
        image: restaurant.image_url || '',
        waiter_call_enabled: restaurant.waiter_call_enabled || false,
        whatsapp_enabled: restaurant.whatsapp_enabled || false,
        whatsapp_phone: restaurant.whatsapp_phone || '',
        whatsapp_custom_message: restaurant.whatsapp_custom_message || '',
        menu_categories: [],
        featured_dishes: [],
        menu_items: []
      }));

      setRestaurants(transformedRestaurants);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
      setRestaurants([]);
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