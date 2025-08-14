import { createClient, createStaticClient } from '@/lib/supabase/server';
import { Organization, Restaurant, generateSlug } from '@/types/organization';

export class OrganizationService {
  /**
   * Busca uma organização pelo slug
   */
  static async getBySlug(slug: string): Promise<Organization | null> {
    const supabase = createClient();
    
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
   * Lista todas as organizações
   */
  static async list(): Promise<Organization[]> {
    const supabase = createClient();
    
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
    const supabase = createStaticClient();
    
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
   * Cria ou atualiza uma organização
   */
  static async upsert(organization: Partial<Organization>): Promise<Organization | null> {
    const supabase = createClient();
    
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
