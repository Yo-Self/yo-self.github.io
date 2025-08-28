import type { Restaurant, MenuItem } from '@/components/data';

// Cache simples em memória + localStorage (TTL segundos)
const DEFAULT_TTL_SECONDS = 90;

type CacheEntry<T> = { value: T; expiresAt: number };
const memoryCache = new Map<string, CacheEntry<any>>();

function nowSeconds(): number { return Math.floor(Date.now() / 1000); }

function getCache<T>(key: string): T | null {
  const m = memoryCache.get(key);
  if (m && m.expiresAt > nowSeconds()) return m.value as T;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (parsed.expiresAt > nowSeconds()) {
          memoryCache.set(key, parsed);
          return parsed.value;
        }
      }
    } catch {}
  }
  return null;
}

function setCache<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const entry: CacheEntry<T> = { value, expiresAt: nowSeconds() + ttlSeconds };
  memoryCache.set(key, entry);
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(key, JSON.stringify(entry)); } catch {}
  }
}

function formatPriceBR(price: number | null): string {
  if (price == null || Number.isNaN(price)) return '0,00';
  const fixed = (Math.round(price * 100) / 100).toFixed(2);
  return fixed.replace('.', ',');
}

export type DbRestaurant = {
  id: number | string;
  slug: string | null;
  name: string;
  cuisine_type: string | null;
  image_url: string | null;
  description: string | null;
  waiter_call_enabled?: boolean;
  whatsapp_phone?: string;
  whatsapp_enabled?: boolean;
  whatsapp_custom_message?: string;
  created_at?: string;
  updated_at?: string;
};

export type DbCategory = {
  id: number | string;
  name: string;
  image_url: string | null;
  restaurant_id: number | string;
  position: number | null;
  created_at?: string;
};

export type DbDish = {
  id: number | string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category_id: number | string | null;
  restaurant_id: number | string;
  is_featured: boolean | null;
  is_available: boolean | null;
  created_at?: string;
  updated_at?: string;
  tags?: string[] | null;
  ingredients?: string | null;
  allergens?: string | null;
  portion?: string | null;
};

export type DbDishCategory = {
  id: string;
  dish_id: string;
  category_id: string;
  position: number;
  created_at?: string;
  updated_at?: string;
};

export type DbComplementGroup = {
  id: string;
  title: string;
  description: string | null;
  required: boolean;
  max_selections: number;
  position: number | null;
};

export type DbComplement = {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  ingredients: string | null;
  position: number | null;
};

// Verificar se as variáveis de ambiente estão definidas
function getSupabaseConfig() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in environment variables');
    return null;
  }

  return { SUPABASE_URL, SUPABASE_ANON_KEY };
}

async function sbFetch<T>(pathWithQuery: string, init?: RequestInit): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase configuration not available');
  }
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = config;
  const REST_BASE = `${SUPABASE_URL}/rest/v1`;
  
  const fullUrl = `${REST_BASE}/${pathWithQuery}`;
  
  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(init?.headers || {}),
    },
    // Usar cache padrão para melhor performance
    cache: init?.cache ?? 'default',
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }
  
  const data = await res.json() as T;
  
  return data;
}

async function fetchRestaurantsRows(): Promise<DbRestaurant[]> {
  const cacheKey = 'sb:restaurants';
  
  const cached = getCache<DbRestaurant[]>(cacheKey);
  if (cached) return cached;

  const rows = await sbFetch<DbRestaurant[]>(`restaurants?select=*&order=created_at.asc`);
  
  setCache(cacheKey, rows ?? []);
  return rows ?? [];
}

async function fetchCategoriesRows(restaurantId: number | string): Promise<DbCategory[]> {
  const cacheKey = `sb:categories:${restaurantId}`;
  const cached = getCache<DbCategory[]>(cacheKey);
  if (cached) return cached;
  const rows = await sbFetch<DbCategory[]>(`categories?select=*&restaurant_id=eq.${encodeURIComponent(String(restaurantId))}&order=position.asc`);
  setCache(cacheKey, rows);
  return rows;
}

async function fetchDishesRows(restaurantId: number | string): Promise<DbDish[]> {
  const cacheKey = `sb:dishes:${restaurantId}`;
  const cached = getCache<DbDish[]>(cacheKey);
  if (cached) return cached;
  const rows = await sbFetch<DbDish[]>(`dishes?select=*&restaurant_id=eq.${encodeURIComponent(String(restaurantId))}&is_available=eq.true&order=created_at.asc`);
  setCache(cacheKey, rows);
  return rows;
}

async function fetchDishCategoriesByDishIds(dishIds: string[]): Promise<DbDishCategory[]> {
  if (dishIds.length === 0) return [];
  const inList = dishIds.map(id => encodeURIComponent(id)).join(',');
  const rows = await sbFetch<DbDishCategory[]>(`dish_categories?select=*&dish_id=in.(${inList})&order=position.asc`);
  return rows ?? [];
}

type ComplementGroupsResult = {
  groups: DbComplementGroup[];
  associations: Map<string, string[]>;
};

async function fetchComplementGroupsByDishIds(dishIds: string[]): Promise<ComplementGroupsResult> {
  if (dishIds.length === 0) return { groups: [], associations: new Map() };
  
  try {
    // Primeiro buscar os IDs dos complement groups através da tabela de junção
    const inList = dishIds.map(id => encodeURIComponent(id)).join(',');
    const junctionRows = await sbFetch<{dish_id: string, complement_group_id: string}[]>(`dish_complement_groups?select=dish_id,complement_group_id&dish_id=in.(${inList})`);
    
    if (!junctionRows || junctionRows.length === 0) {
      return { groups: [], associations: new Map() };
    }
    
    // Criar mapa de associações dish_id -> complement_group_ids
    const associations = new Map<string, string[]>();
    for (const row of junctionRows) {
      const dishId = row.dish_id;
      const groupId = row.complement_group_id;
      const existing = associations.get(dishId) || [];
      existing.push(groupId);
      associations.set(dishId, existing);
    }
    
    // Extrair IDs únicos dos grupos
    const groupIds = [...new Set(junctionRows.map(row => row.complement_group_id))];
    const groupInList = groupIds.map(id => encodeURIComponent(id)).join(',');
    
    // Buscar os grupos propriamente ditos
    const groups = await sbFetch<DbComplementGroup[]>(`complement_groups?select=*&id=in.(${groupInList})&order=title.asc`);
    

    
    return { groups: groups ?? [], associations };
  } catch (error) {
    console.error('Erro ao buscar complement groups:', error);
    return { groups: [], associations: new Map() };
  }
}

async function fetchComplementsByGroupIds(groupIds: string[]): Promise<DbComplement[]> {
  if (groupIds.length === 0) return [];
  // Usar cache padrão para geração estática
  const inList = groupIds.map(id => encodeURIComponent(id)).join(',');
  const rows = await sbFetch<DbComplement[]>(`complements?select=*&group_id=in.(${inList})&order=position.asc`);
  return rows ?? [];
}

function composeRestaurantModel(
  r: DbRestaurant,
  categories: DbCategory[],
  dishes: DbDish[],
  dishCategories: DbDishCategory[],
  groups: DbComplementGroup[],
  complements: DbComplement[],
  associations: Map<string, string[]>
): Restaurant {
  const categoryIdToName = new Map<string | number, string>();
  for (const c of categories) categoryIdToName.set(c.id, c.name);

  // Mapear categorias por prato
  const categoriesByDishId = new Map<string, string[]>();
  for (const dc of dishCategories) {
    const categoryName = categoryIdToName.get(dc.category_id) || 'Sem categoria';
    const arr = categoriesByDishId.get(dc.dish_id) || [];
    arr.push(categoryName);
    categoriesByDishId.set(dc.dish_id, arr);
  }

  // Mapear posições por prato para ordenação
  const positionByDishId = new Map<string, number>();
  for (const dc of dishCategories) {
    // Se um prato tem múltiplas categorias, usar a menor posição
    const currentPosition = positionByDishId.get(dc.dish_id);
    if (currentPosition === undefined || dc.position < currentPosition) {
      positionByDishId.set(dc.dish_id, dc.position);
    }
  }

  // Mapear grupos por prato usando as associações
  const groupsByDishId = new Map<string, DbComplementGroup[]>();
  const groupsById = new Map<string, DbComplementGroup>();
  
  // Criar mapa de grupos por ID para acesso rápido
  for (const g of groups) {
    groupsById.set(g.id, g);
  }
  
  // Usar as associações da tabela dish_complement_groups
  for (const [dishId, groupIds] of associations.entries()) {
    const dishGroups: DbComplementGroup[] = [];
    for (const groupId of groupIds) {
      const group = groupsById.get(groupId);
      if (group) {
        dishGroups.push(group);
      }
    }
    if (dishGroups.length > 0) {
      groupsByDishId.set(dishId, dishGroups);
    }
  }

  const complementsByGroupId = new Map<string, DbComplement[]>();
  for (const c of complements) {
    const arr = complementsByGroupId.get(c.group_id) || [];
    arr.push(c);
    complementsByGroupId.set(c.group_id, arr);
  }

  // Tipo temporário para incluir a posição durante a ordenação
  type MenuItemWithPosition = MenuItem & { _position: number };

  const menuItems: MenuItem[] = dishes
    .filter(d => d.name && d.name.trim() !== '') // Filtrar apenas pratos com nome válido
    .map(d => {
      const dishCategories = categoriesByDishId.get(String(d.id)) || [];
      const primaryCategory = dishCategories.length > 0 ? dishCategories[0] : 
        (d.category_id != null ? (categoryIdToName.get(d.category_id) ?? 'Sem categoria') : 'Sem categoria');
      
      const mappedGroups = (groupsByDishId.get(String(d.id)) || []).map(g => ({
        title: g.title,
        description: g.description || '',
        required: g.required,
        max_selections: g.max_selections,
        complements: (complementsByGroupId.get(g.id) || []).map(c => ({
          name: c.name,
          description: c.description || '',
          price: formatPriceBR(c.price),
          image: c.image_url || '',
          ingredients: c.ingredients || '',
        })),
      }));

      return {
        categories: dishCategories.length > 0 ? dishCategories : [primaryCategory],
        category: primaryCategory,
        name: d.name ?? '',
        description: d.description ?? '',
        price: formatPriceBR(d.price),
        image: d.image_url ?? '',
        tags: (d.tags && Array.isArray(d.tags)) ? d.tags : [],
        ingredients: d.ingredients || '',
        allergens: d.allergens || 'Nenhum',
        portion: d.portion || 'Serve 1 pessoa',
        complement_groups: mappedGroups.length > 0 ? mappedGroups : undefined,
        // Adicionar posição para ordenação
        _position: positionByDishId.get(String(d.id)) ?? Number.MAX_SAFE_INTEGER,
      } as MenuItemWithPosition;
    })
    // Ordenar por posição (menor primeiro) e depois por nome para pratos sem posição
    .sort((a, b) => {
      if (a._position !== b._position) {
        return a._position - b._position;
      }
      return a.name.localeCompare(b.name);
    })
    // Remover o campo _position após ordenação
    .map(({ _position, ...item }) => item);

  const featured = dishes
    .filter(d => !!d.is_featured && !!d.is_available && d.name && d.name.trim() !== '')
    .map(d => {
      const dishCategories = categoriesByDishId.get(String(d.id)) || [];
      const primaryCategory = dishCategories.length > 0 ? dishCategories[0] : 
        (d.category_id != null ? (categoryIdToName.get(d.category_id) ?? 'Sem categoria') : 'Sem categoria');
      
      return {
        name: d.name ?? '',
        description: d.description ?? '',
        price: formatPriceBR(d.price),
        image: d.image_url ?? '',
        tags: (d.tags && d.tags.length ? d.tags : ['Destaque']),
        ingredients: d.ingredients || '',
        allergens: d.allergens || 'Nenhum',
        portion: d.portion || 'Serve 1 pessoa',
        categories: dishCategories.length > 0 ? dishCategories : [primaryCategory],
        category: primaryCategory,
        complement_groups: (groupsByDishId.get(String(d.id)) || []).map(g => ({
          title: g.title,
          description: g.description || '',
          required: g.required,
          max_selections: g.max_selections,
          complements: (complementsByGroupId.get(g.id) || []).map(c => ({
            name: c.name,
            description: c.description || '',
            price: formatPriceBR(c.price),
            image: c.image_url || '',
            ingredients: c.ingredients || '',
          })),
        })),
        // Adicionar posição para ordenação
        _position: positionByDishId.get(String(d.id)) ?? Number.MAX_SAFE_INTEGER,
      } as MenuItemWithPosition;
    })
    // Ordenar por posição (menor primeiro) e depois por nome para pratos sem posição
    .sort((a, b) => {
      if (a._position !== b._position) {
        return a._position - b._position;
      }
      return a.name.localeCompare(b.name);
    })
    // Remover o campo _position após ordenação
    .map(({ _position, ...item }) => item)
    .filter(dish => dish.name && dish.name.trim() !== ''); // Filtro adicional para garantir que o nome seja válido







  return {
    id: String(r.id),
    slug: r.slug || String(r.id), // Usar slug se existir, senão usar ID como fallback
    name: r.name,
    welcome_message: r.description || `Bem-vindo ao ${r.name}`,
    image: r.image_url || '',
    waiter_call_enabled: r.waiter_call_enabled === true,
    whatsapp_phone: r.whatsapp_phone,
    whatsapp_enabled: r.whatsapp_enabled !== false, // Padrão true se não especificado
    whatsapp_custom_message: r.whatsapp_custom_message,
    menu_categories: categories.map(c => c.name),
    featured_dishes: featured,
    menu_items: menuItems,
  };
}

export async function fetchFullRestaurants(): Promise<Restaurant[]> {
  try {
    const base = await fetchRestaurantsRows();
    const results: Restaurant[] = [];
    for (const r of base) {
      const [cats, dishes] = await Promise.all([
        fetchCategoriesRows(r.id),
        fetchDishesRows(r.id),
      ]);
      const dishIds = dishes.map(d => String(d.id));
      const [dishCategories, groups, complements] = await Promise.all([
        fetchDishCategoriesByDishIds(dishIds),
        fetchComplementGroupsByDishIds(dishIds),
        (async () => {
          const g = await fetchComplementGroupsByDishIds(dishIds);
          const groupIds = g.groups.map(x => x.id);
          return fetchComplementsByGroupIds(groupIds);
        })()
      ]);
      // Nota: chamamos fetchComplementGroupsByDishIds duas vezes para extrair groupIds; otimizações possíveis
      const realGroups = groups.groups; // groups já carregados
      const realComplements = complements;
      results.push(composeRestaurantModel(r, cats, dishes, dishCategories, realGroups, realComplements, groups.associations));
    }
    return results;
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error);
    return [];
  }
}

// Mais leve: apenas os IDs e slugs (para generateStaticParams)
export async function fetchRestaurantIds(): Promise<string[]> {
  try {
    const rows = await sbFetch<Array<Pick<DbRestaurant, 'id' | 'slug'>>>(`restaurants?select=id,slug&order=created_at.asc`);
    return (rows ?? []).map(r => r.slug || String(r.id));
  } catch (error) {
    console.error('Erro ao buscar IDs dos restaurantes:', error);
    return [];
  }
}

export async function fetchRestaurantByIdWithData(id: string): Promise<Restaurant | null> {
  // Salvaguarda mínima para build/export do Next que pode invocar com o literal "[id]"
  if (id === '[id]') {
    return null;
  }

  try {
    const rows = await sbFetch<DbRestaurant[]>(`restaurants?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    const r = rows && rows[0];

    if (!r) return null;
    const [cats, dishes] = await Promise.all([
      fetchCategoriesRows(r.id),
      fetchDishesRows(r.id),
    ]);
    const dishIds = dishes.map(d => String(d.id));
    const [dishCategories, groups] = await Promise.all([
      fetchDishCategoriesByDishIds(dishIds),
      fetchComplementGroupsByDishIds(dishIds),
    ]);
    const groupIds = groups.groups.map(g => g.id);
    const complements = await fetchComplementsByGroupIds(groupIds);
    const result = composeRestaurantModel(r, cats, dishes, dishCategories, groups.groups, complements, groups.associations);

    return result;
  } catch (error) {
    console.error('Erro ao buscar restaurante por ID:', error);
    return null;
  }
}

export async function fetchRestaurantBySlugWithData(slug: string): Promise<Restaurant | null> {
  // Salvaguarda mínima para build/export do Next que pode invocar com o literal "[slug]"
  if (slug === '[slug]') {
    return null;
  }

  try {
    // Primeiro tenta buscar por slug
    let rows = await sbFetch<DbRestaurant[]>(`restaurants?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    let r = rows && rows[0];

    // Se não encontrou por slug, tenta por ID (para compatibilidade)
    if (!r) {
      rows = await sbFetch<DbRestaurant[]>(`restaurants?select=*&id=eq.${encodeURIComponent(slug)}&limit=1`);
      r = rows && rows[0];
    }

    if (!r) return null;
    
    const [cats, dishes] = await Promise.all([
      fetchCategoriesRows(r.id),
      fetchDishesRows(r.id),
    ]);
    const dishIds = dishes.map(d => String(d.id));
    const [dishCategories, groups] = await Promise.all([
      fetchDishCategoriesByDishIds(dishIds),
      fetchComplementGroupsByDishIds(dishIds),
    ]);
    const groupIds = groups.groups.map(g => g.id);
    const complements = await fetchComplementsByGroupIds(groupIds);
    const result = composeRestaurantModel(r, cats, dishes, dishCategories, groups.groups, complements, groups.associations);

    return result;
  } catch (error) {
    console.error('Erro ao buscar restaurante por slug:', error);
    return null;
  }
}

export async function fetchRestaurantByCuisineWithData(cuisineType: string): Promise<Restaurant | null> {
  const rows = await sbFetch<DbRestaurant[]>(`restaurants?select=*&cuisine_type=eq.${encodeURIComponent(cuisineType)}&limit=1`);
  const r = rows && rows[0];
  if (!r) return null;
  const [cats, dishes] = await Promise.all([
    fetchCategoriesRows(r.id),
    fetchDishesRows(r.id),
  ]);
  const dishIds = dishes.map(d => String(d.id));
  const [dishCategories, groups] = await Promise.all([
    fetchDishCategoriesByDishIds(dishIds),
    fetchComplementGroupsByDishIds(dishIds),
  ]);
  const groupIds = groups.groups.map(g => g.id);
  const complements = await fetchComplementsByGroupIds(groupIds);
  return composeRestaurantModel(r, cats, dishes, dishCategories, groups.groups, complements, groups.associations);
}

// Leve: lista apenas dados básicos dos restaurantes para páginas estáticas (evita fetch dinâmico)
export async function fetchRestaurantsBasic(): Promise<Array<{ id: string; slug: string; name: string; image: string; welcome_message: string }>> {
  const rows = await fetchRestaurantsRows();
  return rows.map(r => ({
    id: String(r.id),
    slug: r.slug || String(r.id),
    name: r.name,
    image: r.image_url || '',
    welcome_message: r.description || `Bem-vindo ao ${r.name}`,
  }));
}


