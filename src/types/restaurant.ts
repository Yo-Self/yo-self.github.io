// Tipos para estrutura de dados de restaurantes
// Baseado na estrutura do JSON do restaurante Moendo

export interface Restaurant {
  /** ID único do restaurante */
  id: string;
  
  /** Slug único para identificação amigável na URL */
  slug: string;
  
  /** Nome do restaurante */
  name: string;
  
  /** Mensagem de boas-vindas do restaurante */
  welcome_message: string;
  
  /** URL da imagem principal do restaurante */
  image: string;
  
  /** Lista de categorias do menu */
  menu_categories: string[];
  
  /** Pratos em destaque (featured) */
  featured_dishes: MenuItem[];
  
  /** Todos os itens do menu */
  menu_items: MenuItem[];
  
  /** Configuração do WhatsApp */
  whatsapp_phone?: string;
  whatsapp_enabled?: boolean;
  whatsapp_custom_message?: string;
}

export interface MenuItem {
  /** Categorias do item no menu (múltiplas categorias suportadas) */
  categories: string[];
  
  /** Categoria principal do item (mantida para compatibilidade) */
  category: string;
  
  /** Nome do prato/bebida */
  name: string;
  
  /** Descrição detalhada do item */
  description: string;
  
  /** Preço em formato brasileiro (ex: "35,00") */
  price: string;
  
  /** URL da imagem do item */
  image: string;
  
  /** Tags especiais (ex: "Destaque", "Vegano", etc.) */
  tags: string[];
  
  /** Lista de ingredientes */
  ingredients: string;
  
  /** Informações sobre alérgenos */
  allergens: string;
  
  /** Informação sobre porção/serve quantas pessoas */
  portion: string;
  
  /** Grupos de complementos opcionais */
  complement_groups?: ComplementGroup[];
}

export interface ComplementGroup {
  /** Título do grupo de complementos */
  title: string;
  
  /** Descrição do grupo */
  description: string;
  
  /** Se é obrigatório escolher pelo menos um item */
  required: boolean;
  
  /** Número máximo de itens que podem ser selecionados */
  max_selections: number;
  
  /** Lista de complementos disponíveis */
  complements: Complement[];
}

export interface Complement {
  /** Nome do complemento */
  name: string;
  
  /** Descrição do complemento */
  description: string;
  
  /** Preço adicional em formato brasileiro */
  price: string;
  
  /** URL da imagem do complemento */
  image: string;
  
  /** Lista de ingredientes do complemento */
  ingredients: string;
}

// Tipos auxiliares para validação e uso

export type AllergenType = 
  | "Contém Lactose"
  | "Contém glúten"
  | "Sem Lactose"
  | "Sem Gluten"
  | "Vegano"
  | "Vegetariano"
  | "Apimentado"
  | "Levemente Apimentado"
  | "Nenhum";

export type TagType = 
  | "Destaque"
  | "Vegano"
  | "Vegetariano"
  | "Sem Glúten"
  | "Sem Lactose";

export type CategoryType = 
  | "Menu Principal"
  | "Sobremesas"
  | "Bebidas"
  | "Carta de Drinks"
  | "Destilados"
  | "Carta de Vinhos"
  | "Menu Executivo"
  | "Happy hour"
  | "Sunset Moendo"
  | "Couver artistico";

// Função utilitária para validar se um objeto é um restaurante válido
export function isValidRestaurant(obj: any): obj is Restaurant {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.welcome_message === 'string' &&
    typeof obj.image === 'string' &&
    Array.isArray(obj.menu_categories) &&
    Array.isArray(obj.featured_dishes) &&
    Array.isArray(obj.menu_items) &&
    obj.menu_categories.every((cat: any) => typeof cat === 'string') &&
    obj.featured_dishes.every((item: any) => isValidMenuItem(item)) &&
    obj.menu_items.every((item: any) => isValidMenuItem(item))
  );
}

// Função utilitária para validar se um objeto é um item de menu válido
export function isValidMenuItem(obj: any): obj is MenuItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Array.isArray(obj.categories) &&
    typeof obj.category === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.price === 'string' &&
    typeof obj.image === 'string' &&
    Array.isArray(obj.tags) &&
    typeof obj.ingredients === 'string' &&
    typeof obj.allergens === 'string' &&
    typeof obj.portion === 'string' &&
    obj.tags.every((tag: any) => typeof tag === 'string') &&
    (obj.complement_groups === undefined || 
     (Array.isArray(obj.complement_groups) && 
      obj.complement_groups.every((group: any) => isValidComplementGroup(group))))
  );
}

// Função utilitária para validar se um objeto é um grupo de complementos válido
export function isValidComplementGroup(obj: any): obj is ComplementGroup {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.required === 'boolean' &&
    typeof obj.max_selections === 'number' &&
    Array.isArray(obj.complements) &&
    obj.complements.every((complement: any) => isValidComplement(complement))
  );
}

// Função utilitária para validar se um objeto é um complemento válido
export function isValidComplement(obj: any): obj is Complement {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.price === 'string' &&
    typeof obj.image === 'string' &&
    typeof obj.ingredients === 'string'
  );
}

// Exemplo de uso e documentação
export const RESTAURANT_SCHEMA_EXAMPLE = {
  id: "moendo",
  slug: "moendo",
  name: "Moendo",
  welcome_message: "Bem-vindo ao Moendo - Experiência gastronômica única com pratos sofisticados e sabores inovadores",
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  menu_categories: [
    "Menu Principal",
    "Sobremesas",
    "Bebidas",
    "Carta de Drinks",
    "Destilados",
    "Carta de Vinhos",
    "Menu Executivo",
    "Happy hour",
    "Sunset Moendo",
    "Couver artistico"
  ],
  featured_dishes: [
    {
      name: "Torta De Chocolate",
      description: "Torta de chocolate meio amargo com ganache e creme ingles",
      price: "35,00",
      image: "https://static.tagme.com.br/pubimg/thumbs/MenuItem/d13b11d0-fcba-11ee-9b68-179017335969.jpg?ims=filters:quality(70):format(webp)",
      tags: ["Destaque"],
      ingredients: "Torta de chocolate meio amargo com ganache e creme ingles",
      allergens: "Contém Lactose, Contém glúten",
      portion: "Serve 1 pessoa",
      categories: ["Sobremesas", "Destaque"],
      category: "Sobremesas"
    }
  ],
  menu_items: [
    {
      categories: ["Menu Principal", "Hambúrgueres"],
      category: "Menu Principal",
      name: "Mc Fish Moendo",
      description: "Delicioso hambúrguer de peixe com pão brioche, rúcula, picles e molho tártaro! (2 und.)",
      price: "42,00",
      image: "https://static.tagme.com.br/pubimg/thumbs/MenuItem/c6f0d5b0-9798-11ef-927a-9df237a94fc7.jpg?ims=filters:quality(70):format(webp)",
      tags: ["Destaque"],
      ingredients: "Delicioso hambúrguer de peixe com pão brioche, rúcula, picles e molho tártaro! (2 und.)",
      allergens: "Contém Lactose, Contém glúten",
      portion: "Serve 1 pessoa",
      complement_groups: [
        {
          title: "Escolha o Pão",
          description: "Selecione o tipo de pão para seu hambúrguer",
          required: true,
          max_selections: 1,
          complements: [
            {
              name: "Pão Brioche",
              description: "Pão brioche tradicional",
              price: "0,00",
              image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
              ingredients: "Farinha, ovos, manteiga, açúcar, sal"
            }
          ]
        }
      ]
    }
  ]
} as Restaurant;

