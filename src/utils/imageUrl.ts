const SUPABASE_IMAGE_PATH =
  /^(https?:\/\/[^/]+\.supabase\.co)\/storage\/v1\/(?:object|render\/image)\/public\/images\/([^?]+)/;

/** Supabase Image Transformations require Pro+. Enable with NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM=true */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number = 400
): string {
  if (!url) return '';

  const match = url.match(SUPABASE_IMAGE_PATH);
  if (!match) return url;

  if (process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === 'true') {
    const [, origin, path] = match;
    return `${origin}/storage/v1/render/image/public/images/${path}?width=${width}&quality=80&resize=contain`;
  }

  // Free plan: serve direct object URL (no weserv proxy — it still pulls full originals from Supabase)
  const [, origin, path] = match;
  return `${origin}/storage/v1/object/public/images/${path}`;
}

export function isSupabaseStorageUrl(url: string): boolean {
  return SUPABASE_IMAGE_PATH.test(url);
}
