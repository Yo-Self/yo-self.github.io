import { normalizeMenuImageUrl } from '@/constants/menuImages';

const SUPABASE_IMAGE_PATH =
  /^(https?:\/\/[^/]+\.supabase\.co)\/storage\/v1\/(?:object|render\/image)\/public\/images\/([^?]+)/;

// Banco de dados de imagens gratuitas do Unsplash para evitar requisições à produção em desenvolvimento
const UNSPLASH_PLACEHOLDERS: { [key: string]: string } = {
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80',
  hamburguer: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80',
  salada: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80',
  pasta: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80',
  massa: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80',
  risoto: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80',
  risotto: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80',
  dessert: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80',
  sobremesa: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80',
  tiramisu: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80',
  cafe: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80',
  juice: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80',
  suco: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80',
  beer: 'https://images.unsplash.com/photo-1538248464264-b5299479b19e?auto=format&fit=crop&q=80',
  cerveja: 'https://images.unsplash.com/photo-1538248464264-b5299479b19e?auto=format&fit=crop&q=80',
  cocktail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80',
  drink: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80',
  caipirinha: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80',
  wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80',
  vinho: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80',
  steak: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
  picanha: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
  carne: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
  chicken: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80',
  frango: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80',
  peixe: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80',
  salmao: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80',
  torta: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80',
  doce: 'https://images.unsplash.com/photo-1548907601-5e2127a548be?auto=format&fit=crop&q=80',
  couvert: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80'
};

function getPlaceholderByPath(path: string): string {
  const lowercasePath = path.toLowerCase();
  for (const key of Object.keys(UNSPLASH_PLACEHOLDERS)) {
    if (lowercasePath.includes(key)) {
      return UNSPLASH_PLACEHOLDERS[key];
    }
  }
  return UNSPLASH_PLACEHOLDERS.default;
}

/** Supabase Image Transformations require Pro+. Enable with NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM=true */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number = 400
): string {
  if (!url) return '';

  const normalized = normalizeMenuImageUrl(url);
  if (!normalized) return '';
  url = normalized;

  const match = url.match(SUPABASE_IMAGE_PATH);
  if (!match) return url;

  const [, origin, path] = match;

  // Intercepta e otimiza em modo de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const devImageMode = process.env.NEXT_PUBLIC_DEV_IMAGE_MODE || 'production';

    if (devImageMode === 'unsplash-fallback') {
      // Retorna uma imagem bonita e gratuita do Unsplash baseada no nome da imagem no banco
      return `${getPlaceholderByPath(path)}&w=${width}`;
    }

    if (devImageMode === 'local-storage') {
      // Reescreve para o storage do Supabase local
      const localSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (localSupabaseUrl) {
        return `${localSupabaseUrl}/storage/v1/object/public/images/${path}`;
      }
    }
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === 'true') {
    return `${origin}/storage/v1/render/image/public/images/${path}?width=${width}&quality=80&resize=contain`;
  }

  // Free plan: serve direct object URL (no weserv proxy — it still pulls full originals from Supabase)
  return `${origin}/storage/v1/object/public/images/${path}`;
}

export function isSupabaseStorageUrl(url: string): boolean {
  return SUPABASE_IMAGE_PATH.test(url);
}
