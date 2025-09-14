"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Organization, Restaurant } from '@/types/organization';

export interface OrganizationWithRestaurants extends Organization {
  restaurants: Restaurant[];
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
        .from('profiles')
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

      // Buscar os restaurantes da organização
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', organizationData.id)
        .order('name');

      if (restaurantsError) {
        console.error('Error fetching restaurants:', restaurantsError);
        // Não falha se não conseguir buscar restaurantes, apenas define como array vazio
      }

      // Montar o objeto da organização com restaurantes
      const organizationWithRestaurants: OrganizationWithRestaurants = {
        ...organizationData,
        restaurants: restaurantsData || []
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
        .from('profiles')
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