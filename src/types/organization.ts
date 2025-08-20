export interface Organization {
  /** ID único da organização (mesmo ID do usuário) */
  id: string;
  
  /** Email da organização */
  email: string;
  
  /** Nome completo da organização */
  full_name: string;
  
  /** URL do avatar da organização */
  avatar_url?: string;
  
  /** Slug único para identificação amigável */
  slug: string;
  
  /** Indica se é uma organização */
  is_organization: boolean;
  
  /** Data de criação */
  created_at: string;
  
  /** Data de última atualização */
  updated_at: string;
}

export interface OrganizationWithRestaurants extends Organization {
  /** Lista de restaurantes da organização */
  restaurants: Restaurant[];
}

export interface Restaurant {
  /** ID único do restaurante */
  id: string;
  
  /** Slug único para identificação amigável na URL */
  slug: string;
  
  /** Nome do restaurante */
  name: string;
  
  /** Tipo de culinária */
  cuisine_type: string;
  
  /** URL da imagem do restaurante */
  image_url: string;
  
  /** Descrição do restaurante */
  description?: string;
  
  /** ID do usuário/organização proprietária */
  user_id: string;
  
  /** Mensagem de boas-vindas */
  welcome_message?: string;
  
  /** Data de criação */
  created_at: string;
  
  /** Data de última atualização */
  updated_at: string;
  
  /** Configuração do WhatsApp */
  whatsapp_phone?: string;
  whatsapp_enabled?: boolean;
  whatsapp_custom_message?: string;
}

// Função utilitária para gerar slug a partir de um nome
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim
}

// Função utilitária para validar se um objeto é uma organização válida
export function isValidOrganization(obj: any): obj is Organization {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.full_name === 'string' &&
    typeof obj.slug === 'string' &&
    typeof obj.is_organization === 'boolean' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}
