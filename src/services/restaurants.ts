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
  name: string;
  cuisine_type: string | null;
  image_url: string | null;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DbCategory = {
  id: number | string;
  name: string;
  image_url: string | null;
  restaurant_id: number | string;
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

export type DbComplementGroup = {
  id: string;
  dish_id: string;
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

const DEFAULT_SUPABASE_URL = 'https://wulazaggdihidadkhilg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bGF6YWdnZGloaWRhZGtoaWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzkxODQsImV4cCI6MjA3MDA1NTE4NH0.MxXnFZAUoMPCy9LJFTWv_6-X_8AmLr553wrAhoeRrOQ';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const REST_BASE = `${SUPABASE_URL}/rest/v1`;

function isLikelyUuid(value: string): boolean {
  // Basic UUID v4/v1 format check: 8-4-4-4-12 hex with hyphens
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

async function sbFetch<T>(pathWithQuery: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${REST_BASE}/${pathWithQuery}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(init?.headers || {}),
    },
    // Importante: para Next export (estático), evitar no-store
    cache: init?.cache ?? 'force-cache',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
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
  const rows = await sbFetch<DbCategory[]>(`categories?select=*&restaurant_id=eq.${encodeURIComponent(String(restaurantId))}&order=name.asc`);
  setCache(cacheKey, rows);
  return rows;
}

async function fetchDishesRows(restaurantId: number | string): Promise<DbDish[]> {
  const cacheKey = `sb:dishes:${restaurantId}`;
  const cached = getCache<DbDish[]>(cacheKey);
  if (cached) return cached;
  const rows = await sbFetch<DbDish[]>(`dishes?select=*&restaurant_id=eq.${encodeURIComponent(String(restaurantId))}&is_available=eq.true&order=category_id.asc`);
  setCache(cacheKey, rows);
  return rows;
}

async function fetchComplementGroupsByDishIds(dishIds: string[]): Promise<DbComplementGroup[]> {
  if (dishIds.length === 0) return [];
  // Sempre buscar dados frescos para grupos de complementos
  const inList = dishIds.map(id => encodeURIComponent(id)).join(',');
  const rows = await sbFetch<DbComplementGroup[]>(`complement_groups?select=*&dish_id=in.(${inList})&order=position.asc`, { cache: 'no-store' });
  return rows ?? [];
}

async function fetchComplementsByGroupIds(groupIds: string[]): Promise<DbComplement[]> {
  if (groupIds.length === 0) return [];
  // Sempre buscar dados frescos para complementos
  const inList = groupIds.map(id => encodeURIComponent(id)).join(',');
  const rows = await sbFetch<DbComplement[]>(`complements?select=*&group_id=in.(${inList})&order=position.asc`, { cache: 'no-store' });
  return rows ?? [];
}

function composeRestaurantModel(
  r: DbRestaurant,
  categories: DbCategory[],
  dishes: DbDish[],
  groups: DbComplementGroup[],
  complements: DbComplement[]
): Restaurant {
  const categoryIdToName = new Map<string | number, string>();
  for (const c of categories) categoryIdToName.set(c.id, c.name);

  const groupsByDishId = new Map<string, DbComplementGroup[]>();
  for (const g of groups) {
    const arr = groupsByDishId.get(g.dish_id) || [];
    arr.push(g);
    groupsByDishId.set(g.dish_id, arr);
  }

  const complementsByGroupId = new Map<string, DbComplement[]>();
  for (const c of complements) {
    const arr = complementsByGroupId.get(c.group_id) || [];
    arr.push(c);
    complementsByGroupId.set(c.group_id, arr);
  }

  const menuItems: MenuItem[] = dishes.map(d => {
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
      category: (d.category_id != null ? (categoryIdToName.get(d.category_id) ?? 'Sem categoria') : 'Sem categoria'),
      name: d.name ?? '',
      description: d.description ?? '',
      price: formatPriceBR(d.price),
      image: d.image_url ?? '',
      tags: (d.tags && Array.isArray(d.tags)) ? d.tags : [],
      ingredients: d.ingredients || '',
      allergens: d.allergens || 'Nenhum',
      portion: d.portion || 'Serve 1 pessoa',
      complement_groups: mappedGroups.length > 0 ? mappedGroups : undefined,
    };
  });

  const featured = dishes
    .filter(d => !!d.is_featured && !!d.is_available)
    .map(d => ({
      name: d.name ?? '',
      description: d.description ?? '',
      price: formatPriceBR(d.price),
      image: d.image_url ?? '',
      tags: (d.tags && d.tags.length ? d.tags : ['Destaque']),
      ingredients: d.ingredients || '',
      allergens: d.allergens || 'Nenhum',
      portion: d.portion || 'Serve 1 pessoa',
      category: (d.category_id != null ? (categoryIdToName.get(d.category_id) ?? 'Sem categoria') : 'Sem categoria'),
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
    }));

  return {
    id: String(r.id),
    name: r.name,
    welcome_message: r.description || `Bem-vindo ao ${r.name}`,
    image: r.image_url || '',
    menu_categories: categories.map(c => c.name),
    featured_dishes: featured,
    menu_items: menuItems,
  };
}

export async function fetchFullRestaurants(): Promise<Restaurant[]> {
  const base = await fetchRestaurantsRows();
  const results: Restaurant[] = [];
  for (const r of base) {
    const [cats, dishes] = await Promise.all([
      fetchCategoriesRows(r.id),
      fetchDishesRows(r.id),
    ]);
    const dishIds = dishes.map(d => String(d.id));
    const [groups, complements] = await Promise.all([
      fetchComplementGroupsByDishIds(dishIds),
      (async () => {
        const g = await fetchComplementGroupsByDishIds(dishIds);
        const groupIds = g.map(x => x.id);
        return fetchComplementsByGroupIds(groupIds);
      })()
    ]);
    // Nota: chamamos fetchComplementGroupsByDishIds duas vezes para extrair groupIds; otimizações possíveis
    const realGroups = groups; // groups já carregados
    const realComplements = complements;
    results.push(composeRestaurantModel(r, cats, dishes, realGroups, realComplements));
  }
  return results;
}

// Mais leve: apenas os IDs (para generateStaticParams)
export async function fetchRestaurantIds(): Promise<string[]> {
  const rows = await sbFetch<Array<Pick<DbRestaurant, 'id'>>>(`restaurants?select=id&order=created_at.asc`);
  return (rows ?? []).map(r => String(r.id));
}

export async function fetchRestaurantByIdWithData(id: string): Promise<Restaurant | null> {
  // Evita chamadas inválidas durante export/prerender (ex.: "[id]")
  if (!id || id.includes('[') || id.includes(']') || !isLikelyUuid(id)) {
    return null;
  }
  const rows = await sbFetch<DbRestaurant[]>(`restaurants?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  const r = rows && rows[0];
  if (!r) return null;
  const [cats, dishes] = await Promise.all([
    fetchCategoriesRows(r.id),
    fetchDishesRows(r.id),
  ]);
  const dishIds = dishes.map(d => String(d.id));
  const groups = await fetchComplementGroupsByDishIds(dishIds);
  const groupIds = groups.map(g => g.id);
  const complements = await fetchComplementsByGroupIds(groupIds);
  return composeRestaurantModel(r, cats, dishes, groups, complements);
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
  const groups = await fetchComplementGroupsByDishIds(dishIds);
  const groupIds = groups.map(g => g.id);
  const complements = await fetchComplementsByGroupIds(groupIds);
  return composeRestaurantModel(r, cats, dishes, groups, complements);
}

// Leve: lista apenas dados básicos dos restaurantes para páginas estáticas (evita fetch dinâmico)
export async function fetchRestaurantsBasic(): Promise<Array<{ id: string; name: string; image: string; welcome_message: string }>> {
  const rows = await fetchRestaurantsRows();
  return rows.map(r => ({
    id: String(r.id),
    name: r.name,
    image: r.image_url || '',
    welcome_message: r.description || `Bem-vindo ao ${r.name}`,
  }));
}


