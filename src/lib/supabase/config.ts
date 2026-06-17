/** Client-safe Supabase config (publishable key only). */
function assertHttpsInProduction(url: string): string {
  if (!url || process.env.NODE_ENV !== 'production') {
    return url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Supabase URL must use HTTPS in production.');
  }

  return url;
}

export function getSupabaseUrl(): string {
  return assertHttpsInProduction(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
}

/** Prefer new publishable key; fall back to legacy anon JWT during migration. */
export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
}
