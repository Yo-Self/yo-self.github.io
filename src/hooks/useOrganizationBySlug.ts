"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Organization, Restaurant } from '@/types/organization';

export interface OrganizationWithRestaurants extends Organization {
  restaurants: Restaurant[];
}

/** Map RPC/public restaurant rows to the org listing shape (no payment secrets). */
function mapPublicOrgRestaurant(row: Record<string, unknown>): Restaurant {
  return {
    id: String(row.id ?? ''),
    slug: String(row.slug ?? ''),
    name: String(row.name ?? ''),
    cuisine_type: String(row.cuisine_type ?? ''),
    image_url: String(row.image_url ?? ''),
    description: row.description != null ? String(row.description) : undefined,
    welcome_message: row.welcome_message != null ? String(row.welcome_message) : undefined,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    whatsapp_phone: row.whatsapp_phone != null ? String(row.whatsapp_phone) : undefined,
    whatsapp_enabled: row.whatsapp_enabled as boolean | undefined,
    whatsapp_custom_message:
      row.whatsapp_custom_message != null ? String(row.whatsapp_custom_message) : undefined,
  };
}

export function useOrganizationBySlug(slug: string) {
  const [organization, setOrganization] = useState<OrganizationWithRestaurants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = async (slug: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Buscar a organização
      const { data: organizationData, error: orgError } = await supabase
        .from('profiles_public')
        .select('*')
        .eq('slug', slug)
        .eq('is_organization', true)
        .single();

      if (orgError) {
        // Se o erro for PGRST116 (0 rows), significa que a organização não foi encontrada
        if (orgError.code === 'PGRST116') {
          setOrganization(null);
          return;
        }
        throw orgError;
      }

      if (!organizationData) {
        setOrganization(null);
        return;
      }

      // Public org restaurants via SECURITY DEFINER RPC (no base-table user_id reads)
      const { data: restaurantsRaw, error: restaurantsError } = await supabase.rpc(
        'get_organization_restaurants',
        { p_org_slug: slug },
      );

      if (restaurantsError) {
        console.error('Error fetching restaurants:', restaurantsError);
      }

      const restaurantsList = Array.isArray(restaurantsRaw)
        ? restaurantsRaw.map((row) => mapPublicOrgRestaurant(row as Record<string, unknown>))
        : [];

      const organizationWithRestaurants: OrganizationWithRestaurants = {
        ...organizationData,
        restaurants: restaurantsList,
      };

      setOrganization(organizationWithRestaurants);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organization');
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchOrganization(slug);
  };

  useEffect(() => {
    fetchOrganization(slug);
  }, [slug]);

  return {
    organization,
    isLoading,
    error,
    refetch
  };
}

export function useOrganizationList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: organizationsData, error: queryError } = await supabase
        .from('profiles_public')
        .select('*')
        .eq('is_organization', true)
        .order('full_name');

      if (queryError) {
        throw queryError;
      }

      const organizations = organizationsData || [];
      setOrganizations(organizations);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return {
    organizations,
    isLoading,
    error,
    refetch: fetchOrganizations
  };
}
