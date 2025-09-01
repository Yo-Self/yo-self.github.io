import { createClient, createStaticClient } from '@/lib/supabase/server';
import { supabase as clientSupabase } from '@/lib/supabase/client';
import { Organization, Restaurant, generateSlug } from '@/types/organization';

// Helper function to check if Supabase client is available
function getSupabaseClient() {
  const supabase = createClient();
  if (!supabase) {
    console.warn('Supabase client not available');
    return null;
  }
  return supabase;
}

function getSupabaseStaticClient() {
  const supabase = createStaticClient();
  if (!supabase) {
    console.warn('Supabase static client not available');
    return null;
  }
  return supabase;
}

export class OrganizationService {
  /**
   * Busca uma organização pelo slug
   */
  static async getBySlug(slug: string): Promise<Organization | null> {
    const supabase = createClient();
    
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .eq('is_organization', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Organization;
  }

  /**
   * Busca uma organização pelo slug para geração estática (sem cookies)
   */
  static async getBySlugForStatic(slug: string): Promise<Organization | null> {
    const supabase = createStaticClient();
    
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .eq('is_organization', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Organization;
  }

  /**
   * Busca uma organização com seus restaurantes
   */
  static async getWithRestaurants(slug: string): Promise<{ organization: Organization; restaurants: Restaurant[] } | null> {
    const supabase = createClient();
    
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }
    
    // Buscar a organização
    const { data: organization, error: orgError } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .eq('is_organization', true)
      .single();

    if (orgError || !organization) {
      return null;
    }

    // Buscar os restaurantes da organização
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', organization.id)
      .order('name');

    if (restaurantsError) {
      console.error('Erro ao buscar restaurantes:', restaurantsError);
    }

    return {
      organization: organization as Organization,
      restaurants: (restaurants || []) as Restaurant[]
    };
  }

  /**
   * Busca uma organização com seus restaurantes para geração estática (sem cookies)
   */
  static async getWithRestaurantsForStatic(slug: string): Promise<{ organization: Organization; restaurants: Restaurant[] } | null> {
    // Return null when API calls are disabled
    if (process.env.DISABLE_API_CALLS === 'true') {
      console.log('🧪 Test mode: Organization API calls disabled');
      return null;
    }

    const supabase = createStaticClient();
    
    if (!supabase) {
      console.warn('Supabase static client not available');
      return null;
    }
    
    // Buscar a organização
    const { data: organization, error: orgError } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .eq('is_organization', true)
      .single();

    if (orgError || !organization) {
      return null;
    }

    // Buscar os restaurantes da organização
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', organization.id)
      .order('name');

    if (restaurantsError) {
      console.error('Erro ao buscar restaurantes para geração estática:', restaurantsError);
    }

    return {
      organization: organization as Organization,
      restaurants: (restaurants || []) as Restaurant[]
    };
  }

  /**
   * Lista todas as organizações
   */
  static async list(): Promise<Organization[]> {
    const supabase = createClient();
    
    if (!supabase) {
      console.warn('Supabase client not available');
      return [];
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_organization', true)
      .order('full_name');

    if (error) {
      console.error('Erro ao listar organizações:', error);
      return [];
    }

    return (data || []) as Organization[];
  }

  /**
   * Lista todas as organizações para geração estática (sem cookies)
   */
  static async listForStatic(): Promise<Organization[]> {
    // Return empty array when API calls are disabled
    if (process.env.DISABLE_API_CALLS === 'true') {
      console.log('🧪 Test mode: Organization API calls disabled');
      return [];
    }

    const supabase = createStaticClient();
    
    if (!supabase) {
      console.warn('Supabase static client not available');
      return [];
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_organization', true)
      .order('full_name');

    if (error) {
      console.error('Erro ao listar organizações para geração estática:', error);
      return [];
    }

    return (data || []) as Organization[];
  }

  /**
   * Lista todas as organizações para uso em client components
   */
  static async listForClient(): Promise<Organization[]> {
    if (!clientSupabase) {
      console.warn('Supabase client not available');
      return [];
    }
    
    const { data, error } = await clientSupabase
      .from('profiles')
      .select('*')
      .eq('is_organization', true)
      .order('full_name');

    if (error) {
      console.error('Erro ao listar organizações:', error);
      return [];
    }

    return (data || []) as Organization[];
  }

  /**
   * Busca uma organização pelo slug para uso em client components
   */
  static async getBySlugForClient(slug: string): Promise<Organization | null> {
    if (!clientSupabase) {
      console.warn('Supabase client not available');
      return null;
    }
    
    const { data, error } = await clientSupabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .eq('is_organization', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Organization;
  }

  /**
   * Cria ou atualiza uma organização
   */
  static async upsert(organization: Partial<Organization>): Promise<Organization | null> {
    const supabase = createClient();
    
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }
    
    // Gerar slug se não fornecido
    if (!organization.slug && organization.full_name) {
      organization.slug = generateSlug(organization.full_name);
    }

    // Garantir que é marcado como organização
    organization.is_organization = true;

    const { data, error } = await supabase
      .from('profiles')
      .upsert(organization)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar organização:', error);
      return null;
    }

    return data as Organization;
  }

  /**
   * Verifica se um slug está disponível
   */
  static async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const supabase = createClient();
    
    if (!supabase) {
      console.warn('Supabase client not available');
      return false;
    }
    
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar slug:', error);
      return false;
    }

    return (data || []).length === 0;
  }

  /**
   * Gera um slug único baseado no nome
   */
  static async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    let baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (!(await this.isSlugAvailable(slug, excludeId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
