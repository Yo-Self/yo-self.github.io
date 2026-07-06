/** Exact URLs that return 404/403 and must not be used (gestor default + broken hotlinks). */
export const DEAD_MENU_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center',
] as const;

/** Hosts that block hotlinking from the public cardápio. */
export const BLOCKED_MENU_IMAGE_HOSTS = [
  'static-images.ifood.com.br',
  'static.ifood-static.com.br',
] as const;

/** Verified working generic dish placeholder (Unsplash, 200 OK). */
export const DEFAULT_DISH_IMAGE_URL =
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400';

export function isDeadMenuImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if ((DEAD_MENU_IMAGE_URLS as readonly string[]).includes(url)) return true;
  try {
    const host = new URL(url).hostname;
    return BLOCKED_MENU_IMAGE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
  } catch {
    return false;
  }
}

export function normalizeMenuImageUrl(url: string | null | undefined): string {
  if (!url || isDeadMenuImageUrl(url)) return '';
  return url;
}
